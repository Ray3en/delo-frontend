(() => {
  const source = document.body.dataset.source;
  const content = document.querySelector('#content');
  const toc = document.querySelector('#toc-list');
  const mobileToc = document.querySelector('#mobile-toc');
  const skipTitles = new Set(['аннотация', 'что будет изучено', 'результаты обучения']);

  const slugify = (text, index) => text.toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-|-$/g, '') || `section-${index + 1}`;

  function prepare(markdown) {
    const lines = markdown.replace(/^\uFEFF/, '').split('\n');
    const result = [];
    let seen = false;
    let skipping = false;
    let inFence = false;

    for (const line of lines) {
      if (/^\s*```/.test(line)) {
        if (seen && !skipping) result.push(line);
        inFence = !inFence;
        continue;
      }
      if (!inFence && /^#\s+/.test(line)) continue;
      const h2 = !inFence && line.match(/^##\s+(.+)/);
      if (h2) {
        seen = true;
        skipping = skipTitles.has(h2[1].replace(/[`*_]/g, '').trim().toLowerCase());
        if (!skipping) result.push(line);
        continue;
      }
      if (seen && !skipping) result.push(line);
    }
    return result.join('\n');
  }

  function buildSections(html) {
    const staging = document.createElement('div');
    staging.innerHTML = html;
    const sections = [];
    let current = null;
    [...staging.childNodes].forEach(node => {
      if (node.nodeType === 1 && node.tagName === 'H2') {
        current = document.createElement('section');
        current.append(node);
        sections.push(current);
      } else if (current) current.append(node);
    });
    content.replaceChildren(...sections);
  }

  function addNavigation() {
    const headings = [...content.querySelectorAll('h2')];
    const used = new Set();
    headings.forEach((heading, index) => {
      let id = slugify(heading.textContent, index);
      while (used.has(id)) id += '-section';
      used.add(id);
      heading.id = id;
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.textContent = heading.textContent;
      const item = document.createElement('li');
      item.append(link);
      toc.append(item);
      const option = document.createElement('option');
      option.value = id;
      option.textContent = heading.textContent;
      mobileToc.append(option);
    });
    mobileToc.addEventListener('change', () => {
      document.getElementById(mobileToc.value)?.scrollIntoView({ behavior: 'smooth' });
    });
    const links = [...toc.querySelectorAll('a')];
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      links.forEach(link => link.classList.toggle('active', link.hash === `#${visible.target.id}`));
      mobileToc.value = visible.target.id;
    }, { rootMargin: '-10% 0px -75% 0px' });
    headings.forEach(heading => observer.observe(heading));
  }

  function addCodeTools() {
    content.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      const languageClass = [...code.classList].find(name => name.startsWith('language-'));
      const wrap = document.createElement('div');
      const lang = document.createElement('span');
      const button = document.createElement('button');
      wrap.className = 'code-wrap';
      lang.className = 'code-lang';
      lang.textContent = languageClass?.replace('language-', '') || 'code';
      button.className = 'copy';
      button.type = 'button';
      button.textContent = 'Копировать';
      pre.replaceWith(wrap);
      wrap.append(pre, lang, button);
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code.textContent);
          button.textContent = 'Скопировано';
          button.classList.add('done');
        } catch {
          const range = document.createRange();
          range.selectNodeContents(code);
          const selection = getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          button.textContent = 'Выделено';
        }
        setTimeout(() => {
          button.textContent = 'Копировать';
          button.classList.remove('done');
        }, 1800);
      });
    });
  }

  fetch(source)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(markdown => {
      marked.setOptions({ gfm: true, breaks: false });
      buildSections(marked.parse(prepare(markdown)));
      content.querySelectorAll('pre code').forEach(block => window.hljs?.highlightElement(block));
      addCodeTools();
      addNavigation();
    })
    .catch(error => {
      content.innerHTML = `<p class="error">Не удалось загрузить лекцию. ${error.message}</p>`;
    });
})();
