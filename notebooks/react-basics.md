# Основы React

## 1. Структура базового React-проекта

Один из вариантов структуры небольшого проекта:

```text
src/
├── assets/
│   └── logo.png
├── components/
│   ├── Header.jsx
│   └── UserCard.jsx
├── styles/
│   └── global.css
├── App.jsx
└── main.jsx
```

- `main.jsx` — точка входа, в которой React подключается к HTML-странице.
- `App.jsx` — главный компонент приложения.
- `components` — отдельные компоненты.
- `assets` — изображения, шрифты и другие ресурсы.
- `styles` — файлы со стилями.

Компонент React — это JavaScript-функция, которая возвращает JSX.

```jsx
function Greeting() {
  return <h1>Привет!</h1>;
}
```

Имена компонентов пишутся с заглавной буквы в стиле `PascalCase`: `Header`, `UserCard`, `ProductList`.

## 2. Импорты и экспорты

Чтобы использовать компонент в другом файле, его нужно экспортировать, а затем импортировать.

### Экспорт по умолчанию

```jsx
function Header() {
  return <header>Шапка сайта</header>;
}

export default Header;
```

При импорте имя можно выбрать самостоятельно, но лучше сохранять исходное имя компонента:

```jsx
import Header from './components/Header.jsx';
```

В одном файле может быть только один `default`-экспорт.

### Именованный экспорт

```jsx
export function Header() {
  return <header>Шапка сайта</header>;
}

export function Footer() {
  return <footer>Подвал сайта</footer>;
}
```

Именованные сущности импортируются в фигурных скобках под теми же именами:

```jsx
import { Header, Footer } from './components/Layout.jsx';
```

Переименовать именованный импорт можно через `as`:

```jsx
import { Header as PageHeader } from './components/Layout.jsx';
```

Правила импортов:

- сначала обычно указывают импорты из библиотек;
- затем импортируют компоненты и функции проекта;
- после них подключают стили и ресурсы;
- относительный путь начинается с `./` или `../`;
- путь должен вести к существующему файлу;
- регистр букв в имени файла и пути должен совпадать.

```jsx
import React from 'react';
import Header from './components/Header.jsx';
import logo from './assets/logo.png';
import './styles/global.css';
```

В современных сборщиках импорт `React` нужен не всегда, но компоненты, функции, стили и ресурсы всё равно необходимо импортировать.

## 3. Подключение стилей

### Обычный CSS-файл

```css
/* UserCard.css */
.user-card {
  padding: 16px;
  border: 1px solid #cccccc;
}
```

```jsx
import './UserCard.css';

function UserCard() {
  return <div className="user-card">Карточка пользователя</div>;
}
```

В JSX вместо HTML-атрибута `class` используется `className`.

### CSS Modules

CSS Modules позволяют сделать имена классов локальными для компонента.

```css
/* Button.module.css */
.button {
  color: white;
  background-color: royalblue;
}
```

```jsx
import styles from './Button.module.css';

function Button() {
  return <button className={styles.button}>Открыть</button>;
}
```

### Условный `className`

```jsx
function Message({ isImportant }) {
  const className = isImportant ? 'message message--important' : 'message';

  return <p className={className}>Текст сообщения</p>;
}
```

## 4. Главный компонент `App`

`App` обычно является верхним компонентом приложения. Он собирает другие компоненты в одну структуру.

```jsx
import Header from './components/Header.jsx';
import UserCard from './components/UserCard.jsx';

function App() {
  return (
    <main>
      <Header />
      <UserCard />
    </main>
  );
}

export default App;
```

Компонент используется как собственный JSX-тег: `<Header />`.

## 5. Монтирование приложения в `div#root`

В HTML находится контейнер, в который React выводит приложение:

```html
<div id="root"></div>
```

В файле `main.jsx` контейнер находится по идентификатору `root`, после чего в него монтируется компонент `App`:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- `document.getElementById('root')` находит `<div id="root">`.
- `createRoot(...)` создаёт React-корень.
- `render(<App />)` отображает главный компонент.
- `StrictMode` помогает обнаруживать потенциальные проблемы во время разработки.

## 6. Основы JSX

JSX — это синтаксис, который позволяет описывать интерфейс внутри JavaScript.

```jsx
function Profile() {
  return (
    <section>
      <h2>Анна</h2>
      <p>Frontend-разработчик</p>
    </section>
  );
}
```

Основные правила JSX:

- компонент должен вернуть один общий корневой элемент;
- все теги должны быть закрыты;
- компоненты называются с заглавной буквы;
- JavaScript-выражения записываются внутри `{}`;
- многострочный JSX обычно заключают в круглые скобки.

Самозакрывающиеся теги:

```jsx
<img src="/avatar.png" alt="Аватар" />
<input type="text" />
<UserCard />
```

## 7. Отличия JSX от HTML

Некоторые HTML-атрибуты в JSX называются иначе:

```jsx
function FormField() {
  return (
    <div className="field">
      <label htmlFor="email">Электронная почта</label>
      <input id="email" type="email" />
    </div>
  );
}
```

- `class` заменяется на `className`;
- `for` у `<label>` заменяется на `htmlFor`;
- составные DOM-свойства часто пишутся в `camelCase`, например `tabIndex`;
- обработчики событий пишутся в `camelCase`: `onClick`, `onSubmit`, `onChange`.

## 8. JavaScript-выражения внутри JSX

Фигурные скобки позволяют вставлять значение JavaScript-выражения.

```jsx
function Product() {
  const name = 'Клавиатура';
  const price = 5000;

  return (
    <article>
      <h2>{name}</h2>
      <p>Цена: {price} ₽</p>
      <p>Со скидкой: {price * 0.9} ₽</p>
    </article>
  );
}
```

В `{}` можно использовать переменные, вызовы функций и другие выражения. Инструкции вроде `if` непосредственно внутрь `{}` не записываются.

## 9. Фрагменты

Если лишний HTML-контейнер не нужен, несколько элементов можно объединить фрагментом:

```jsx
function Contacts() {
  return (
    <>
      <h2>Контакты</h2>
      <p>mail@example.com</p>
    </>
  );
}
```

Краткая запись `<>...</>` не добавляет отдельный элемент в DOM.

## 10. Атрибуты и inline-стили

Строковые значения атрибутов можно передавать в кавычках:

```jsx
<img src="/logo.png" alt="Логотип" />
```

JavaScript-значения передаются в фигурных скобках:

```jsx
const imageUrl = '/logo.png';

function Logo() {
  return <img src={imageUrl} alt="Логотип" />;
}
```

Атрибут `style` принимает JavaScript-объект:

```jsx
function Warning() {
  return <p style={{ color: 'red' }}>Внимание!</p>;
}
```

Внешние фигурные скобки вставляют JavaScript в JSX, а внутренние создают объект стилей.

```jsx
function Notice() {
  const textStyle = {
    color: 'royalblue',
    fontSize: '20px',
    backgroundColor: '#f2f5ff',
  };

  return <p style={textStyle}>Новое сообщение</p>;
}
```

Названия CSS-свойств в объекте пишутся в `camelCase`: `fontSize`, `backgroundColor`, `marginTop`.

## 11. Условное отображение элементов

### Обычный `if`

```jsx
function AccessMessage({ isAllowed }) {
  if (isAllowed) {
    return <p>Доступ разрешён</p>;
  }

  return <p>Доступ запрещён</p>;
}
```

### Тернарный оператор

```jsx
function Status({ isOnline }) {
  return <p>{isOnline ? 'В сети' : 'Не в сети'}</p>;
}
```

### Логический оператор `&&`

Если элемент нужно показать только при выполнении условия:

```jsx
function Notification({ hasMessage }) {
  return (
    <div>
      <h2>Личный кабинет</h2>
      {hasMessage && <p>У вас новое сообщение</p>}
    </div>
  );
}
```

Если `hasMessage` равно `false`, абзац не отображается.

### Переменная с JSX

```jsx
function Delivery({ isAvailable }) {
  let message;

  if (isAvailable) {
    message = <p>Доставка доступна</p>;
  } else {
    message = <p>Доставка недоступна</p>;
  }

  return <section>{message}</section>;
}
```

## 12. Передача данных через props

Props — это данные, которые родительский компонент передаёт дочернему компоненту.

```jsx
function UserCard(props) {
  return (
    <article>
      <h2>{props.name}</h2>
      <p>Профессия: {props.job}</p>
    </article>
  );
}

function Users() {
  return (
    <div>
      <UserCard name="Анна" job="Разработчик" />
      <UserCard name="Иван" job="Дизайнер" />
    </div>
  );
}
```

Строку можно передать в кавычках, а остальные JavaScript-значения — внутри `{}`:

```jsx
<UserCard name="Анна" age={25} isOnline={true} />
```

Props доступны только для чтения. Компонент не должен изменять полученные props.

### Деструктуризация props

```jsx
function UserCard({ name, job }) {
  return (
    <article>
      <h2>{name}</h2>
      <p>Профессия: {job}</p>
    </article>
  );
}
```

### Значение по умолчанию

```jsx
function Badge({ text = 'Без названия' }) {
  return <span>{text}</span>;
}
```

Значение по умолчанию используется, если соответствующий prop не был передан или равен `undefined`.

## 13. `children` и композиция компонентов

`children` содержит JSX, переданный между открывающим и закрывающим тегами компонента.

```jsx
function Card({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Profile() {
  return (
    <Card title="Профиль">
      <p>Имя: Анна</p>
      <button>Написать</button>
    </Card>
  );
}
```

Композиция — это создание сложного интерфейса из небольших компонентов.

```jsx
function Page() {
  return (
    <Layout>
      <Header />
      <MainContent />
      <Footer />
    </Layout>
  );
}
```

## 14. Обработчики событий

В JSX обработчику передаётся функция, а не результат её вызова.

```jsx
function ActionButton() {
  function handleClick() {
    console.log('Кнопка нажата');
  }

  return <button onClick={handleClick}>Нажать</button>;
}
```

Неправильно вызывать функцию во время отрисовки:

```jsx
<button onClick={handleClick()}>Нажать</button>
```

Если нужно передать аргумент, используется стрелочная функция:

```jsx
function ProductButton({ productName }) {
  function showProduct(name) {
    console.log(name);
  }

  return (
    <button onClick={() => showProduct(productName)}>
      Показать товар
    </button>
  );
}
```

Пример отправки формы:

```jsx
function SearchForm() {
  function handleSubmit(event) {
    event.preventDefault();
    console.log('Форма отправлена');
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Найти</button>
    </form>
  );
}
```

## 15. Импорт изображений

Изображение из папки `src` можно импортировать как модуль:

```jsx
import avatar from './assets/avatar.png';

function Avatar() {
  return <img src={avatar} alt="Аватар пользователя" />;
}
```

Файлы из общедоступной папки `public` обычно указываются через путь:

```jsx
function Logo() {
  return <img src="/logo.png" alt="Логотип" />;
}
```

У изображения должен быть осмысленный атрибут `alt`. Для декоративного изображения используют пустое значение `alt=""`.

## 16. Вывод массива с помощью `map`

Метод `map` создаёт новый массив. В JSX его используют, чтобы преобразовать данные в элементы интерфейса.

### Массив элементов `div`

```jsx
function Cities() {
  const cities = ['Москва', 'Казань', 'Самара'];

  return (
    <div>
      {cities.map((city) => (
        <div key={city}>{city}</div>
      ))}
    </div>
  );
}
```

### Массив компонентов

```jsx
function UserCard({ name, job }) {
  return (
    <article>
      <h2>{name}</h2>
      <p>{job}</p>
    </article>
  );
}

function UserList() {
  const users = [
    { id: 1, name: 'Анна', job: 'Разработчик' },
    { id: 2, name: 'Иван', job: 'Дизайнер' },
    { id: 3, name: 'Ольга', job: 'Тестировщик' },
  ];

  return (
    <section>
      {users.map((user) => (
        <UserCard
          key={user.id}
          name={user.name}
          job={user.job}
        />
      ))}
    </section>
  );
}
```

## 17. Правило `key` для списков

Каждому элементу, который создаётся через `map`, нужен prop `key`.

```jsx
{users.map((user) => (
  <UserCard key={user.id} name={user.name} />
))}
```

`key` помогает React различать элементы списка. Хороший ключ:

- уникален среди соседних элементов;
- стабилен и не меняется при повторном отображении;
- связан с самими данными, например `user.id`.

Если порядок списка может изменяться, индекс массива лучше не использовать как `key`.

`key` служит React и не передаётся компоненту как обычный prop. Если идентификатор нужен внутри компонента, его передают отдельно:

```jsx
<UserCard key={user.id} userId={user.id} name={user.name} />
```

## 18. Чистые компоненты

Компонент называют чистым, если при одинаковых props он возвращает одинаковый JSX и не изменяет внешние данные во время отрисовки.

```jsx
function Price({ value }) {
  return <p>Цена: {value} ₽</p>;
}
```

Не следует изменять props или исходный массив внутри компонента:

```jsx
function UserList({ users }) {
  const sortedUsers = [...users].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div>
      {sortedUsers.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

Копия `[...users]` позволяет отсортировать данные, не изменяя исходный массив.

## 19. Частые ошибки

### Компонент назван с маленькой буквы

```jsx
function userCard() {
  return <div>Пользователь</div>;
}
```

Правильно:

```jsx
function UserCard() {
  return <div>Пользователь</div>;
}
```

### Несколько корневых элементов без обёртки

Неправильно:

```jsx
return (
  <h2>Заголовок</h2>
  <p>Текст</p>
);
```

Правильно:

```jsx
return (
  <>
    <h2>Заголовок</h2>
    <p>Текст</p>
  </>
);
```

### Использование `class` вместо `className`

```jsx
<div className="card">Карточка</div>
```

### Незакрытый тег

```jsx
<img src="/logo.png" alt="Логотип" />
```

### Вызов обработчика вместо передачи функции

```jsx
<button onClick={handleClick}>Нажать</button>
```

### Отсутствие `key` в списке

```jsx
{items.map((item) => (
  <div key={item.id}>{item.title}</div>
))}
```

### Неверный импорт

```jsx
// Компонент экспортирован по умолчанию
import Header from './Header.jsx';

// Компонент экспортирован именованно
import { Header } from './Header.jsx';
```

Тип импорта должен соответствовать типу экспорта.
