# React Hooks: состояние, эффекты и переиспользование логики

## Аннотация

Мини-лекция подробно разбирает основные хуки React на практических задачах. Для каждого хука сначала формулируется проблема, затем объясняется принцип работы и показывается решение на TypeScript. Особое внимание уделено `useEffect`: запуску при монтировании, обновлении зависимостей, очистке предыдущего эффекта и размонтированию компонента.

## Результаты обучения

После лекции студент сможет:

- объяснить, зачем React нужны хуки и почему важен порядок их вызова;
- хранить локальное состояние через `useState`;
- использовать все режимы `useEffect` и писать cleanup;
- выбирать между `useEffect` и `useLayoutEffect`;
- работать с DOM и техническими значениями через `useRef`;
- передавать общие данные через `useContext`;
- применять `useMemo` и `useCallback` только при реальной необходимости;
- управлять связанным состоянием через `useReducer`;
- создавать доступные идентификаторы через `useId`;
- откладывать несрочные обновления интерфейса;
- выносить повторяемое поведение в собственные хуки.

---

## 1. Что такое хук

Хук — функция React, которая подключает компонент к состоянию, контексту, эффектам и другим возможностям React. Названия хуков начинаются с `use`.

Компонент вызывается заново при каждом рендере. Обычные локальные переменные тоже создаются заново, поэтому React не может хранить в них состояние между рендерами.

```tsx
function Counter() {
  let count = 0;

  function increment() {
    count += 1;
    console.log(count);
  }

  return <button onClick={increment}>{count}</button>;
}

export default Counter;
```

Переменная изменяется, но React не знает, что интерфейс нужно обновить. После следующего рендера `count` снова станет равен нулю. Для такого значения нужен `useState`.

---

## 2. Правила хуков

React связывает состояние с порядком вызовов хуков. Поэтому хуки вызывают:

- только на верхнем уровне компонента или собственного хука;
- в одинаковом порядке на каждом рендере;
- только из React-компонентов и собственных хуков.

Неправильно:

```tsx
if (isOpen) {
  useEffect(() => {
    console.log('Открыто');
  }, []);
}
```

При разных рендерах условие может дать разный результат. Тогда порядок хуков изменится.

Правильно:

```tsx
useEffect(() => {
  if (!isOpen) return;
  console.log('Открыто');
}, [isOpen]);
```

Хук вызывается всегда, а условие находится внутри него.

---

## 3. `useState`: локальное состояние

`useState` хранит значение между рендерами и возвращает текущее значение и setter, который планирует обновление.

```tsx
const [count, setCount] = useState(0);
```

Вызов setter не меняет переменную текущего рендера. Он сообщает React, что нужен новый рендер с новым значением.

### Проблема 1: значение должно отображаться в интерфейсе

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  function increment() {
    setCount(previousCount => previousCount + 1);
  }

  return <button onClick={increment}>Кликов: {count}</button>;
}

export default Counter;
```

Функциональная форма получает актуальное значение из очереди обновлений. Она нужна, когда новое состояние зависит от предыдущего.

```tsx
setCount(value => value + 1);
setCount(value => value + 1);
setCount(value => value + 1);
```

После обработки очереди значение увеличится на три.

### Проблема 2: нужно обновить массив без мутации

React сравнивает ссылки. Если изменить существующий массив через `push`, ссылка останется прежней.

```tsx
type Task = {
  id: number;
  title: string;
};

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  function addTask() {
    const task: Task = {
      id: Date.now(),
      title: `Задача ${tasks.length + 1}`,
    };

    setTasks(currentTasks => [...currentTasks, task]);
  }

  return (
    <section>
      <button onClick={addTask}>Добавить</button>
      {tasks.map(task => <p key={task.id}>{task.title}</p>)}
    </section>
  );
}

export default TaskList;
```

Spread создаёт новый массив. Для удаления используют `filter`, для изменения элемента — `map`.

---

## 4. `useEffect`: синхронизация с внешней системой

`useEffect` нужен, когда компонент синхронизируется с тем, чем React напрямую не управляет: таймером, браузерным API, подпиской, сетевым соединением или сторонним виджетом.

```tsx
useEffect(() => {
  // setup

  return () => {
    // cleanup
  };
}, [dependencies]);
```

### Порядок работы эффекта

1. React вызывает компонент и получает JSX.
2. React применяет изменения к DOM.
3. Браузер показывает результат.
4. React запускает `useEffect`.

При изменении зависимости React сначала вызывает cleanup прошлого эффекта, а затем запускает новый setup.

### Все режимы `useEffect`

| Запись | Монтирование | Обычное обновление | Изменение зависимости | Размонтирование |
| --- | --- | --- | --- | --- |
| `useEffect(setup)` | setup | cleanup и setup после каждого commit | cleanup и setup | cleanup |
| `useEffect(setup, [])` | setup | ничего | зависимостей нет | cleanup |
| `useEffect(setup, [value])` | setup | ничего, если `value` прежнее | cleanup старого значения и setup нового | cleanup |

### После каждого рендера

```tsx
useEffect(() => {
  console.log('Компонент отобразился');
});
```

Эффект запускается после каждого commit. Такой режим нужен редко. Если внутри без условия вызывается setter, можно создать бесконечный цикл.

### Монтирование и размонтирование

```tsx
useEffect(() => {
  console.log('Компонент подключён');

  return () => {
    console.log('Компонент отключён');
  };
}, []);
```

Пустой массив означает, что setup не зависит от значений компонента. Cleanup выполняется при размонтировании.

В Strict Mode React может в режиме разработки выполнить дополнительный цикл setup → cleanup → setup. Так React проверяет, действительно ли очистка полностью отменяет подключение.

### Обновление зависимости

```tsx
useEffect(() => {
  const connection = connectToRoom(roomId);
  connection.open();

  return () => connection.close();
}, [roomId]);
```

При изменении `roomId` React сначала отключится от старой комнаты, затем подключится к новой. Cleanup нужен не только при удалении компонента.

### Проблема 1: таймер продолжает работать после удаления компонента

```tsx
import { useEffect, useState } from 'react';

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setSeconds(value => value + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  return <p>Прошло секунд: {seconds}</p>;
}

export default Timer;
```

Cleanup останавливает интервал при размонтировании.

### Проблема 2: устаревший запрос может перезаписать новые данные

```tsx
import { useEffect, useState } from 'react';

type Product = { id: number; title: string };

function ProductDetails({ productId }: { productId: number }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadProduct() {
      try {
        setProduct(null);
        setError('');

        const response = await fetch(
          `https://dummyjson.com/products/${productId}`,
          { signal: controller.signal },
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setProduct((await response.json()) as Product);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name !== 'AbortError') {
          setError(requestError.message);
        }
      }
    }

    loadProduct();
    return () => controller.abort();
  }, [productId]);

  if (error) return <p>Ошибка: {error}</p>;
  if (!product) return <p>Загрузка...</p>;
  return <h2>{product.title}</h2>;
}

export default ProductDetails;
```

Cleanup отменяет запрос предыдущего `productId`. Старый ответ больше не перезапишет актуальные данные.

### Почему callback эффекта не делают `async`

Асинхронная функция возвращает `Promise`, а React ожидает `undefined` или cleanup-функцию.

```tsx
useEffect(() => {
  async function loadData() {
    const data = await fetchData();
    setData(data);
  }

  loadData();
}, []);
```

### Когда эффект не нужен

Если значение можно вычислить во время рендера, эффект не нужен.

```tsx
const fullName = `${firstName} ${lastName}`;
```

Эффект нужен для синхронизации с внешней системой, а не для обычного вычисления JSX.

---

## 5. `useLayoutEffect`: измерение до показа кадра

`useLayoutEffect` запускается синхронно после изменения DOM и до того, как браузер покажет кадр.

```text
render → DOM → useLayoutEffect → показ кадра → useEffect
```

Он блокирует отображение. По умолчанию выбирайте `useEffect`, а `useLayoutEffect` используйте, когда пользователь не должен увидеть промежуточное положение элемента.

### Проблема 1: tooltip сначала появляется не там

```tsx
import { useLayoutEffect, useRef, useState } from 'react';

function Tooltip() {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const rectangle = tooltipRef.current?.getBoundingClientRect();
    setHeight(rectangle?.height ?? 0);
  }, []);

  return (
    <div ref={tooltipRef} style={{ transform: `translateY(-${height}px)` }}>
      Подсказка
    </div>
  );
}

export default Tooltip;
```

React измеряет элемент и повторно рендерит его до показа кадра.

### Проблема 2: нужно сразу восстановить прокрутку

```tsx
import { useLayoutEffect } from 'react';

function Article({ savedScrollY }: { savedScrollY: number }) {
  useLayoutEffect(() => {
    window.scrollTo(0, savedScrollY);
  }, [savedScrollY]);

  return <article>Содержимое статьи</article>;
}

export default Article;
```

В обычном эффекте пользователь мог бы заметить прыжок после первого кадра.

---

## 6. `useRef`: значение без нового рендера

`useRef` возвращает стабильный объект с полем `current`. Изменение `current` не запускает рендер.

### Проблема 1: нужно обратиться к DOM-элементу

```tsx
import { useRef } from 'react';

function Search() {
  const inputRef = useRef<HTMLInputElement>(null);

  function focusSearch() {
    inputRef.current?.focus();
  }

  return (
    <section>
      <input ref={inputRef} placeholder="Поиск" />
      <button onClick={focusSearch}>Поставить фокус</button>
    </section>
  );
}

export default Search;
```

React записывает DOM-узел в `inputRef.current` после монтирования.

### Проблема 2: нужно хранить техническое значение

```tsx
import { useEffect, useRef } from 'react';

function PreviousPrice({ price }: { price: number }) {
  const previousPriceRef = useRef(price);

  useEffect(() => {
    previousPriceRef.current = price;
  }, [price]);

  return <p>Было: {previousPriceRef.current}, стало: {price}</p>;
}

export default PreviousPrice;
```

Если значение должно сразу изменить JSX, используйте состояние, а не ref.

---

## 7. `useContext`: данные для поддерева

Context решает проблему prop drilling: передачи одного значения через компоненты, которым оно не нужно.

### Проблема 1: тема передаётся через несколько уровней

```tsx
import { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextValue = {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeButton() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeProvider не подключён');

  const { theme, setTheme } = context;
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Тема: {theme}
    </button>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ThemeButton />
    </ThemeContext.Provider>
  );
}

export default App;
```

Компонент получает ближайшее значение Provider над ним в дереве.

### Проблема 2: нескольким страницам нужен текущий пользователь

```tsx
type User = { id: number; name: string };
const UserContext = createContext<User | null>(null);

function ProfileName() {
  const user = useContext(UserContext);
  return <strong>{user ? user.name : 'Гость'}</strong>;
}
```

Context подходит для темы, локали, авторизации и настроек. Независимые данные лучше разделять по разным контекстам.

---

## 8. `useMemo`: кеш результата вычисления

`useMemo` сохраняет результат функции между рендерами, пока зависимости не изменились.

```tsx
const value = useMemo(() => calculate(a, b), [a, b]);
```

Это оптимизация производительности, а не способ исправить логику.

### Проблема 1: тяжёлая фильтрация повторяется при любом рендере

```tsx
import { useMemo, useState } from 'react';

type Product = { id: number; title: string };

function ProductList({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(false);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter(product =>
      product.title.toLowerCase().includes(normalizedQuery),
    );
  }, [products, query]);

  return (
    <section data-theme={dark ? 'dark' : 'light'}>
      <input value={query} onChange={event => setQuery(event.target.value)} />
      <button onClick={() => setDark(value => !value)}>Тема</button>
      {visibleProducts.map(product => <p key={product.id}>{product.title}</p>)}
    </section>
  );
}

export default ProductList;
```

Переключение темы больше не запускает фильтрацию.

### Проблема 2: дочерний компонент получает новый объект

```tsx
const chartOptions = useMemo(() => ({
  color: theme === 'dark' ? '#ffffff' : '#111111',
  showLegend: true,
}), [theme]);

return <MemoizedChart options={chartOptions} />;
```

Стабильная ссылка полезна, если дочерний компонент действительно оптимизирован и сравнивает props.

---

## 9. `useCallback`: стабильная ссылка на функцию

`useCallback` сохраняет ссылку на функцию, пока зависимости не изменились. Он не ускоряет выполнение функции.

### Проблема 1: `memo` не помогает из-за нового callback

```tsx
import { memo, useCallback, useState } from 'react';

type Task = { id: number; title: string };

const TaskRow = memo(function TaskRow({ task, onDelete }: {
  task: Task;
  onDelete: (id: number) => void;
}) {
  return <button onClick={() => onDelete(task.id)}>{task.title}</button>;
});

function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const deleteTask = useCallback((id: number) => {
    setTasks(currentTasks => currentTasks.filter(task => task.id !== id));
  }, []);

  return tasks.map(task => (
    <TaskRow key={task.id} task={task} onDelete={deleteTask} />
  ));
}

export default TaskList;
```

Неизменившиеся строки получают ту же ссылку `onDelete`.

### Проблема 2: функция является зависимостью эффекта

```tsx
const createOptions = useCallback(() => ({
  roomId,
  serverUrl,
}), [roomId, serverUrl]);

useEffect(() => {
  const connection = connect(createOptions());
  return () => connection.close();
}, [createOptions]);
```

Сначала проверьте, нельзя ли создать объект прямо внутри эффекта. `useCallback` нужен, когда функция действительно передаётся наружу или используется в нескольких местах.

---

## 10. `useReducer`: связанные переходы состояния

`useReducer` удобен, когда состояние состоит из нескольких связанных значений или обновляется через набор понятных действий.

```tsx
type CartState = { count: number; total: number };
type CartAction =
  | { type: 'add'; price: number }
  | { type: 'clear' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add':
      return { count: state.count + 1, total: state.total + action.price };
    case 'clear':
      return { count: 0, total: 0 };
  }
}
```

```tsx
import { useReducer } from 'react';

function Cart() {
  const [cart, dispatch] = useReducer(cartReducer, { count: 0, total: 0 });

  return (
    <section>
      <p>Товаров: {cart.count}</p>
      <p>Сумма: {cart.total} ₽</p>
      <button onClick={() => dispatch({ type: 'add', price: 500 })}>
        Добавить товар
      </button>
      <button onClick={() => dispatch({ type: 'clear' })}>Очистить</button>
    </section>
  );
}

export default Cart;
```

Reducer описывает все допустимые переходы в одном месте.

---

## 11. `useId`: доступные идентификаторы

`useId` создаёт стабильный идентификатор для связи `label`, `input`, подсказок и сообщений об ошибке.

```tsx
import { useId } from 'react';

function PasswordField() {
  const inputId = useId();
  const hintId = useId();

  return (
    <div>
      <label htmlFor={inputId}>Пароль</label>
      <input id={inputId} aria-describedby={hintId} type="password" />
      <p id={hintId}>Минимум восемь символов</p>
    </div>
  );
}

export default PasswordField;
```

Не используйте `useId` для ключей списка. `key` должен приходить из данных.

---

## 12. `useTransition`: несрочное обновление

`useTransition` помечает обновление как несрочное. Ввод текста остаётся отзывчивым, пока React готовит тяжёлую часть интерфейса.

```tsx
import { useState, useTransition } from 'react';

function SearchPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setInput(value);
    startTransition(() => setQuery(value));
  }

  return (
    <section>
      <input value={input} onChange={handleChange} />
      {isPending && <p>Обновляем результаты...</p>}
      <LargeProductList query={query} />
    </section>
  );
}

export default SearchPage;
```

Transition не заменяет debounce и не уменьшает объём вычислений.

---

## 13. `useDeferredValue`: отложенное значение

`useDeferredValue` возвращает отложенную версию значения. Поле сразу показывает новый текст, а тяжёлый список временно использует прежний запрос.

```tsx
import { useDeferredValue, useState } from 'react';

function ProductSearch() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <section>
      <input value={query} onChange={event => setQuery(event.target.value)} />
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <LargeProductList query={deferredQuery} />
      </div>
    </section>
  );
}

export default ProductSearch;
```

`useTransition` подходит там, где код управляет setter. `useDeferredValue` используется, когда компонент уже получил значение.

---

## 14. Собственные хуки

Собственный хук — функция, которая использует другие хуки и начинается с `use`. Он переиспользует поведение, но каждый вызвавший компонент получает собственный экземпляр состояния.

### 14.1. `useDocumentTitle`

Назначение: синхронизировать заголовок вкладки и вернуть прежнее значение после размонтирования.

```tsx
import { useEffect } from 'react';

function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

export default useDocumentTitle;
```

Вызов:

```tsx
function ProductPage({ title }: { title: string }) {
  useDocumentTitle(`${title} · Каталог`);
  return <h1>{title}</h1>;
}
```

### 14.2. `useLocalStorage`

Назначение: хранить состояние и автоматически сохранять его в `localStorage`.

```tsx
import { useEffect, useState } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) as T : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

export default useLocalStorage;
```

Вызов:

```tsx
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
```

### 14.3. `useDebouncedValue`

Назначение: обновлять значение после паузы, например перед сетевым поиском.

```tsx
import { useEffect, useState } from 'react';

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebouncedValue;
```

Вызов:

```tsx
const [query, setQuery] = useState('');
const debouncedQuery = useDebouncedValue(query, 400);

useEffect(() => {
  if (!debouncedQuery) return;
  searchProducts(debouncedQuery);
}, [debouncedQuery]);
```

Cleanup отменяет предыдущий таймер. Поиск запускается после паузы.

### 14.4. `useOnlineStatus`

Назначение: подписаться на события `online` и `offline` и вернуть состояние сети.

```tsx
import { useEffect, useState } from 'react';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function updateStatus() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return isOnline;
}

export default useOnlineStatus;
```

Вызов:

```tsx
function SaveButton() {
  const isOnline = useOnlineStatus();

  return (
    <button disabled={!isOnline}>
      {isOnline ? 'Сохранить' : 'Нет подключения'}
    </button>
  );
}

export default SaveButton;
```

Подписка и cleanup находятся внутри хука, а компонент работает с готовым значением.

---

## 15. Как выбрать хук

| Задача | Инструмент |
| --- | --- |
| Значение влияет на JSX | `useState` |
| Несколько связанных переходов | `useReducer` |
| Синхронизация с внешней системой | `useEffect` |
| Измерение DOM до показа кадра | `useLayoutEffect` |
| DOM-узел или значение без рендера | `useRef` |
| Общие данные для поддерева | `useContext` |
| Дорогое вычисление | `useMemo` |
| Стабильная ссылка на callback | `useCallback` |
| Доступный уникальный ID | `useId` |
| Несрочное управляемое обновление | `useTransition` |
| Отложенная версия значения | `useDeferredValue` |
| Повторяемая логика | собственный хук |

Выбирайте самый простой инструмент, который решает конкретную проблему. Мемоизация и эффекты не должны добавляться автоматически.

---

## 16. Частые ошибки

- Хук вызывается по условию. Условие нужно перенести внутрь хука.
- Состояние мутируется напрямую. Создавайте новый объект или массив.
- Эффект используется для вычисления JSX. Вычисляйте значение во время рендера.
- Пропущена зависимость. Указывайте реактивные значения, прочитанные хуком.
- Нет cleanup. Таймер, подписка, соединение и запрос должны отменяться.
- `useMemo` и `useCallback` добавлены без измеримой причины.
- `useRef` используется вместо state, хотя изменение должно обновить JSX.

---

## 17. Краткая памятка

- Хуки вызываются только на верхнем уровне React-функций.
- Состояние относится к конкретному рендеру.
- Setter планирует новый рендер.
- Cleanup выполняется перед новым setup и при unmount.
- `useLayoutEffect` нужен для работы с layout до показа кадра.
- Изменение `ref.current` не обновляет интерфейс.
- Context уменьшает prop drilling, но не заменяет всё состояние приложения.
- `useMemo` кеширует значение, `useCallback` кеширует функцию.
- Собственный хук переиспользует логику, но не общее состояние.

---

## Документация

- [Built-in React Hooks](https://react.dev/reference/react/hooks)
- [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
