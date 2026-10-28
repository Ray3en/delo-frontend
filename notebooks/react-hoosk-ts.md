# TypeScript в React: типы, интерфейсы и типизация хуков

## Аннотация

Эта тетрадка показывает, как применять TypeScript в React без лишнего усложнения. Мы типизируем props, `children`, события, состояние, reducer, ref, Context, собственные хуки, формы и ответы API. Отдельное внимание уделено выбору между `type` и `interface`, моделированию состояний интерфейса и практикам, которые помогают TypeScript находить реальные ошибки.

## Результаты обучения

После занятия студент сможет:

- объяснить разницу между выводом и явным указанием типа;
- выбрать `type` или `interface` для конкретной задачи;
- типизировать props и возвращаемое JSX-значение компонента;
- правильно указывать типы для основных React-хуков;
- типизировать DOM-события и формы;
- моделировать загрузку данных через discriminated union;
- безопасно преобразовывать ответ API в модель приложения;
- создавать generic-компоненты и собственные типизированные хуки;
- избегать `any`, необязательных полей «на всякий случай» и опасных утверждений `as`.

---

## 1. Зачем TypeScript нужен React-приложению

React-компоненты постоянно обмениваются данными. Родитель передаёт props, обработчик получает событие, сервер возвращает JSON, а хук хранит состояние. Без типов ошибка часто обнаруживается только после запуска приложения.

```tsx
function UserCard({ user }) {
  return <h2>{user.fullName.toUpperCase()}</h2>;
}
```

Из кода неясно:

- существует ли `user` всегда;
- называется ли поле `fullName` или `name`;
- может ли имя быть `null`;
- какие ещё данные нужны компоненту.

Добавим тип:

```tsx
type User = {
  id: string;
  fullName: string;
};

type UserCardProps = {
  user: User;
};

function UserCard({ user }: UserCardProps) {
  return <h2>{user.fullName.toUpperCase()}</h2>;
}
```

Теперь контракт компонента виден в коде, редактор предлагает свойства, а опечатка обнаруживается до запуска.

TypeScript не заменяет проверки данных во время выполнения. Тип описывает ожидания программы, но ответ сервера или содержимое `localStorage` всё равно нужно проверять.

---

## 2. Файлы `.ts` и `.tsx`

- `.ts` — TypeScript без JSX: типы, схемы, API-функции, утилиты.
- `.tsx` — TypeScript с JSX: React-компоненты и хуки, возвращающие JSX.

```text
src/
├── App.tsx
├── components/
│   └── TaskItem.tsx
├── hooks/
│   └── useTasks.ts
├── api/
│   └── tasksApi.ts
└── types/
    └── task.ts
```

Не обязательно выносить каждый тип в отдельный файл. Тип, который используется только одним компонентом, удобно хранить рядом с этим компонентом. Общие доменные модели можно вынести в `types` или в модуль конкретной feature.

---

## 3. Вывод типа и явная аннотация

TypeScript часто сам выводит правильный тип.

```tsx
const title = 'Task Tracker'; // string
const count = 0;              // number
const isOpen = false;         // boolean
```

Не дублируйте очевидное:

```tsx
// Избыточно
const title: string = 'Task Tracker';

// Достаточно
const title = 'Task Tracker';
```

Явный тип особенно полезен на границе модуля или компонента:

```tsx
type Task = {
  id: string;
  title: string;
  done: boolean;
};

function getCompleted(tasks: Task[]): Task[] {
  return tasks.filter(task => task.done);
}
```

Практическое правило:

- локальное очевидное значение — доверьтесь выводу;
- props, API, Context, reducer и экспортируемая функция — опишите контракт явно;
- пустой массив, `null` и сложное объединение — часто требуют явного типа.

---

## 4. `type` или `interface`

Оба инструмента умеют описывать форму объекта.

```ts
type Task = {
  id: string;
  title: string;
};
```

```ts
interface Task {
  id: string;
  title: string;
}
```

### Когда удобен `interface`

Используйте `interface`, когда описываете объектный публичный контракт, который предполагается расширять.

```ts
interface Entity {
  id: string;
}

interface Task extends Entity {
  title: string;
  done: boolean;
}
```

Интерфейсы поддерживают declaration merging: объявления с одинаковым именем объединяются. Это полезно при расширении типов библиотек, но в прикладном коде случайное объединение иногда мешает.

### Когда удобен `type`

`type` умеет описывать не только объект, но и union, tuple, примитивный alias и результат преобразования.

```ts
type TaskStatus = 'todo' | 'inProgress' | 'done';

type Coordinates = [x: number, y: number];

type TaskId = string;

type Task = {
  id: TaskId;
  title: string;
  status: TaskStatus;
};
```

Union нельзя объявить через `interface`:

```ts
type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; tasks: Task[] }
  | { status: 'error'; message: string };
```

### Рекомендация для курса

Используйте:

- `type` по умолчанию для props, union, callback, tuple и моделей состояния;
- `interface` для расширяемых объектных контрактов и публичного API библиотеки;
- один стиль последовательно внутри feature.

Не стоит спорить о выборе там, где оба варианта одинаково понятны. Качество модели важнее ключевого слова.

---

## 5. Типизация props

### Обязательные props

```tsx
type TaskItemProps = {
  id: string;
  title: string;
  done: boolean;
};

function TaskItem({ id, title, done }: TaskItemProps) {
  return (
    <li data-task-id={id}>
      {done ? <s>{title}</s> : title}
    </li>
  );
}
```

### Необязательный prop

Знак `?` означает, что значение может отсутствовать.

```tsx
type AvatarProps = {
  name: string;
  imageUrl?: string;
};

function Avatar({ name, imageUrl }: AvatarProps) {
  if (!imageUrl) {
    return <span aria-label={name}>{name[0]}</span>;
  }

  return <img src={imageUrl} alt={name} />;
}
```

Не делайте prop необязательным только для того, чтобы убрать ошибку TypeScript. Сначала решите, способен ли компонент корректно работать без этого значения.

### Значение по умолчанию

```tsx
type ButtonProps = {
  label: string;
  kind?: 'primary' | 'secondary';
};

function Button({ label, kind = 'primary' }: ButtonProps) {
  return <button className={`button button--${kind}`}>{label}</button>;
}
```

### Callback-props

```tsx
type TaskItemProps = {
  id: string;
  title: string;
  onRemove: (id: string) => void;
  onToggle: (id: string, done: boolean) => void;
};

function TaskItem({ id, title, onRemove, onToggle }: TaskItemProps) {
  return (
    <li>
      <label>
        <input
          type="checkbox"
          onChange={event => onToggle(id, event.target.checked)}
        />
        {title}
      </label>
      <button onClick={() => onRemove(id)}>Удалить</button>
    </li>
  );
}
```

Для функции без возвращаемого значения используйте `void`, а не `undefined`.

---

## 6. `children` и другие React-типы

### `ReactNode`

`ReactNode` описывает всё, что React умеет вывести: JSX, строку, число, `null`, массив элементов и другие допустимые значения.

```tsx
import type { ReactNode } from 'react';

type CardProps = {
  title: string;
  children: ReactNode;
};

function Card({ title, children }: CardProps) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
```

### `ReactElement`

`ReactElement` уже, чем `ReactNode`: это один React-элемент.

```tsx
import type { ReactElement } from 'react';

type LayoutProps = {
  sidebar: ReactElement;
  children: ReactNode;
};
```

### Возвращаемый тип компонента

Обычно TypeScript сам выводит тип результата, и аннотация не нужна.

```tsx
function Greeting({ name }: { name: string }) {
  return <h1>Привет, {name}!</h1>;
}
```

Если явный контракт полезен:

```tsx
function Greeting({ name }: { name: string }): React.JSX.Element {
  return <h1>Привет, {name}!</h1>;
}
```

Компонент, который может ничего не вывести:

```tsx
function ErrorMessage({ message }: { message: string | null }) {
  if (message === null) return null;
  return <p role="alert">{message}</p>;
}
```

### Почему не обязательно использовать `React.FC`

Запись ниже допустима:

```tsx
const Greeting: React.FC<{ name: string }> = ({ name }) => {
  return <h1>Привет, {name}!</h1>;
};
```

Но обычная функция проще, лучше читается и не требует дополнительной обёртки типа:

```tsx
type GreetingProps = { name: string };

function Greeting({ name }: GreetingProps) {
  return <h1>Привет, {name}!</h1>;
}
```

---

## 7. Типизация `useState`

### Тип выводится из начального значения

```tsx
const [count, setCount] = useState(0);       // number
const [query, setQuery] = useState('');      // string
const [isOpen, setIsOpen] = useState(false); // boolean
```

Здесь generic указывать не нужно.

### Union с `null`

Если начальное значение `null`, TypeScript без подсказки решит, что состояние всегда равно `null`.

```tsx
type User = {
  id: string;
  name: string;
};

const [user, setUser] = useState<User | null>(null);
```

Теперь разрешены оба состояния:

```tsx
setUser({ id: 'u1', name: 'Анна' });
setUser(null);
```

### Пустой массив

Тип пустого массива невозможно надёжно вывести из данных, поэтому элемент массива указывают явно.

```tsx
type Task = {
  id: string;
  title: string;
  done: boolean;
};

const [tasks, setTasks] = useState<Task[]>([]);
```

### Ограниченный набор значений

```tsx
type Filter = 'all' | 'active' | 'done';

const [filter, setFilter] = useState<Filter>('all');
```

Теперь `setFilter('deleted')` станет ошибкой.

### Объект состояния

```tsx
type FormState = {
  title: string;
  priority: 'low' | 'normal' | 'high';
};

const [form, setForm] = useState<FormState>({
  title: '',
  priority: 'normal',
});

setForm(previous => ({
  ...previous,
  title: 'Повторить TypeScript',
}));
```

### Ленивая инициализация

```tsx
const [tasks, setTasks] = useState<Task[]>(() => {
  const saved = localStorage.getItem('tasks');
  return saved ? parseTasks(saved) : [];
});
```

Функция вызывается для создания начального состояния. Она не должна иметь побочных эффектов.

---

## 8. Типизация `useReducer`

Лучше всего reducer типизируется через discriminated union.

```tsx
type Task = {
  id: string;
  title: string;
  done: boolean;
};

type TasksState = {
  tasks: Task[];
  filter: 'all' | 'active' | 'done';
};

type TasksAction =
  | { type: 'task/added'; task: Task }
  | { type: 'task/toggled'; id: string }
  | { type: 'filter/changed'; filter: TasksState['filter'] }
  | { type: 'tasks/cleared' };

function tasksReducer(
  state: TasksState,
  action: TasksAction,
): TasksState {
  switch (action.type) {
    case 'task/added':
      return { ...state, tasks: [...state.tasks, action.task] };

    case 'task/toggled':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.id
            ? { ...task, done: !task.done }
            : task,
        ),
      };

    case 'filter/changed':
      return { ...state, filter: action.filter };

    case 'tasks/cleared':
      return { ...state, tasks: [] };

    default:
      return assertNever(action);
  }
}

function assertNever(value: never): never {
  throw new Error(`Неизвестное действие: ${JSON.stringify(value)}`);
}
```

Поле `type` с литеральным значением помогает TypeScript сузить union. В каждой ветке доступны только подходящие поля действия.

```tsx
const [state, dispatch] = useReducer(tasksReducer, {
  tasks: [],
  filter: 'all',
});

dispatch({
  type: 'filter/changed',
  filter: 'active',
});
```

---

## 9. Типизация `useEffect`

`useEffect` не принимает generic. TypeScript проверяет callback и зависимости автоматически.

```tsx
useEffect(() => {
  document.title = `Задач: ${tasks.length}`;
}, [tasks.length]);
```

Callback эффекта может вернуть только:

- ничего;
- функцию cleanup.

```tsx
useEffect(() => {
  const timerId = window.setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => window.clearInterval(timerId);
}, []);
```

### Почему callback эффекта не делают `async`

`async`-функция всегда возвращает `Promise`, а React ожидает cleanup-функцию или `undefined`.

```tsx
// Неправильно
useEffect(async () => {
  const response = await fetch('/api/tasks');
}, []);
```

Объявите асинхронную функцию внутри:

```tsx
useEffect(() => {
  const controller = new AbortController();

  async function loadTasks() {
    const response = await fetch('/api/tasks', {
      signal: controller.signal,
    });
    const data: unknown = await response.json();
    setTasks(parseTasks(data));
  }

  void loadTasks();

  return () => controller.abort();
}, []);
```

### Тип таймера

В браузерном React-приложении удобно использовать `window.setTimeout`:

```tsx
const timerRef = useRef<number | null>(null);

useEffect(() => {
  timerRef.current = window.setTimeout(() => {
    console.log('Готово');
  }, 500);

  return () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
  };
}, []);
```

---

## 10. Типизация `useRef`

### DOM-ссылка

```tsx
const inputRef = useRef<HTMLInputElement>(null);

function focusInput() {
  inputRef.current?.focus();
}

return <input ref={inputRef} />;
```

Популярные DOM-типы:

```ts
HTMLInputElement
HTMLButtonElement
HTMLFormElement
HTMLDivElement
HTMLTextAreaElement
HTMLSelectElement
HTMLUListElement
```

### Изменяемое техническое значение

```tsx
const renderCountRef = useRef(0);
renderCountRef.current += 1;
```

```tsx
const previousQueryRef = useRef<string | null>(null);
```

Значение, которое должно отобразиться на странице, храните в state, а не в ref.

---

## 11. Типизация событий

TypeScript часто выводит тип события в инлайн-обработчике:

```tsx
<input onChange={event => setQuery(event.target.value)} />
```

Для отдельной функции тип указывают явно.

### Изменение input

```tsx
function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
  setQuery(event.target.value);
}
```

### Отправка формы

```tsx
function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  console.log('submit');
}
```

### Клик кнопки

```tsx
function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
  console.log(event.currentTarget.name);
}
```

### Клавиатура

```tsx
function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter') {
    console.log('Enter');
  }
}
```

### `target` и `currentTarget`

- `event.target` — фактический элемент, с которого началось событие;
- `event.currentTarget` — элемент, на котором установлен обработчик.

Тип `currentTarget` обычно точнее и безопаснее.

---

## 12. Типизация формы

### Контролируемая форма

```tsx
type TaskFormValues = {
  title: string;
  priority: 'low' | 'normal' | 'high';
};

function TaskForm() {
  const [values, setValues] = useState<TaskFormValues>({
    title: '',
    priority: 'normal',
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log(values);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.title}
        onChange={event => {
          setValues(previous => ({
            ...previous,
            title: event.target.value,
          }));
        }}
      />

      <select
        value={values.priority}
        onChange={event => {
          const priority = event.target.value as TaskFormValues['priority'];
          setValues(previous => ({ ...previous, priority }));
        }}
      >
        <option value="low">Низкий</option>
        <option value="normal">Обычный</option>
        <option value="high">Высокий</option>
      </select>

      <button type="submit">Добавить</button>
    </form>
  );
}
```

Утверждение `as` здесь допустимо только потому, что варианты `<option>` контролирует наше приложение. Если значение приходит извне, его нужно проверить.

### FormData

```tsx
function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const title = formData.get('title');

  if (typeof title !== 'string' || title.trim() === '') {
    return;
  }

  addTask(title.trim());
}
```

`FormData.get` возвращает `FormDataEntryValue | null`, поэтому перед использованием нужна проверка.

---

## 13. Типизация `useContext`

Если Context нельзя использовать без Provider, удобно хранить `null` и проверять его в собственном хуке.

```tsx
type AuthContextValue = {
  user: User | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (value === null) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }

  return value;
}
```

Компонент получает уже ненулевое значение:

```tsx
function Profile() {
  const { user, signOut } = useAuth();
  return <button onClick={signOut}>{user?.name ?? 'Гость'}</button>;
}
```

Не подставляйте фиктивный объект только ради того, чтобы избежать `null`: ошибка отсутствующего Provider должна быть явной.

---

## 14. `useMemo` и `useCallback`

Обычно типы выводятся автоматически.

```tsx
const visibleTasks = useMemo(() => {
  return tasks.filter(task => task.title.includes(query));
}, [tasks, query]);
```

```tsx
const handleRemove = useCallback((id: string) => {
  setTasks(items => items.filter(item => item.id !== id));
}, []);
```

Если callback имеет общий контракт, его можно назвать:

```tsx
type RemoveTask = (id: string) => void;

const handleRemove = useCallback<RemoveTask>((id) => {
  setTasks(items => items.filter(item => item.id !== id));
}, []);
```

Не добавляйте generic без причины. Вывод типов обычно даёт более простой код.

---

## 15. Типизация собственного хука

### Хук, возвращающий объект

```tsx
type ToggleResult = {
  value: boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
};

function useToggle(initialValue = false): ToggleResult {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    enable: () => setValue(true),
    disable: () => setValue(false),
    toggle: () => setValue(current => !current),
  };
}
```

Объект удобен, когда возвращаемых значений много и порядок не должен иметь значения.

### Хук, возвращающий tuple

Без явной tuple-типизации TypeScript может расширить результат до массива объединений.

```tsx
function useCounter(initialValue = 0): [number, () => void, () => void] {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount(value => value + 1);
  const reset = () => setCount(initialValue);

  return [count, increment, reset];
}
```

Или используйте `as const`:

```tsx
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(current => !current);

  return [value, toggle] as const;
}
```

### Generic-хук

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved === null
      ? initialValue
      : (JSON.parse(saved) as T);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

Этот пример показывает механику generic, но `JSON.parse(...) as T` не проверяет реальные данные. В production-коде передайте функцию валидации или схему.

---

## 16. Generic-компоненты

Компонент списка может работать с разными моделями данных.

```tsx
type ListProps<T> = {
  items: T[];
  getKey: (item: T) => React.Key;
  renderItem: (item: T) => React.ReactNode;
};

function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={getKey(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

Использование:

```tsx
<List
  items={tasks}
  getKey={task => task.id}
  renderItem={task => <span>{task.title}</span>}
/>
```

TypeScript выводит `T` из `items`. Обычно писать `<List<Task>>` вручную не требуется.

---

## 17. Типизация API и `unknown`

Аннотация не проверяет данные во время выполнения:

```tsx
// Опасно: мы просто приказали TypeScript поверить
const tasks = await response.json() as Task[];
```

Безопаснее считать внешние данные `unknown` и проверить структуру.

```tsx
type Task = {
  id: number;
  title: string;
  completed: boolean;
};

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;

  const task = value as Record<string, unknown>;

  return (
    typeof task.id === 'number' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean'
  );
}

function parseTasks(value: unknown): Task[] {
  if (!Array.isArray(value) || !value.every(isTask)) {
    throw new Error('API вернул некорректный список задач');
  }

  return value;
}

async function fetchTasks(signal?: AbortSignal): Promise<Task[]> {
  const response = await fetch('/api/tasks', { signal });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data: unknown = await response.json();
  return parseTasks(data);
}
```

В большом проекте для runtime-валидации часто используют библиотеку схем. Главное правило остаётся тем же: данные на внешней границе ещё не заслужили доверия.

---

## 18. Состояния запроса через discriminated union

Несколько независимых переменных допускают невозможные комбинации:

```tsx
const [isLoading, setIsLoading] = useState(false);
const [tasks, setTasks] = useState<Task[]>([]);
const [error, setError] = useState<string | null>(null);
```

Например, `isLoading === true` и `error !== null` могут случайно существовать одновременно. Union описывает только допустимые состояния.

```tsx
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

const [request, setRequest] = useState<RequestState<Task[]>>({
  status: 'idle',
});
```

Рендер:

```tsx
switch (request.status) {
  case 'idle':
    return <button onClick={load}>Загрузить</button>;

  case 'loading':
    return <p>Загрузка…</p>;

  case 'error':
    return <p role="alert">{request.message}</p>;

  case 'success':
    return <TaskList tasks={request.data} />;
}
```

После проверки `status` TypeScript точно знает, какие поля доступны.

---

## 19. Полезные utility types

### `Pick`

```ts
type TaskPreview = Pick<Task, 'id' | 'title'>;
```

### `Omit`

```ts
type NewTask = Omit<Task, 'id'>;
```

### `Partial`

```ts
type TaskPatch = Partial<Pick<Task, 'title' | 'done'>>;
```

### `Required`

```ts
type CompleteSettings = Required<Settings>;
```

### `Readonly`

```ts
type ReadonlyTask = Readonly<Task>;
```

### `Record`

```ts
type TasksById = Record<string, Task>;
```

Utility types полезны, когда новая модель действительно является преобразованием существующей. Не создавайте цепочку из пяти преобразований, которую сложнее понять, чем обычный объектный тип.

---

## 20. `satisfies`, `as const` и литеральные типы

### `satisfies`

Оператор проверяет значение по контракту, но сохраняет более точные выведенные типы.

```ts
type FilterConfig = Record<
  'all' | 'active' | 'done',
  { label: string }
>;

const filters = {
  all: { label: 'Все' },
  active: { label: 'Активные' },
  done: { label: 'Готовые' },
} satisfies FilterConfig;
```

### `as const`

```ts
const statuses = ['todo', 'inProgress', 'done'] as const;
type TaskStatus = typeof statuses[number];
```

Получаем union `'todo' | 'inProgress' | 'done'` из массива, который можно использовать и во время выполнения.

---

## 21. Лучшие практики

### 1. Типизируйте границы, а не каждую локальную переменную

Props, API, Context, reducer и экспортируемые функции заслуживают явных контрактов. Очевидные локальные значения лучше оставить выводу типов.

### 2. Предпочитайте точные union вместо общего `string`

```ts
// Слишком широко
type Status = string;

// Точно
type Status = 'idle' | 'loading' | 'success' | 'error';
```

### 3. Моделируйте допустимые состояния

Discriminated union не позволяет создать состояние «успех без данных» или «ошибка без сообщения».

### 4. Не используйте `any`

`any` выключает проверку типов и распространяется по коду. Для неизвестных данных используйте `unknown`, затем сузьте тип проверкой.

```ts
function printValue(value: unknown) {
  if (typeof value === 'string') {
    console.log(value.toUpperCase());
  }
}
```

### 5. Не злоупотребляйте `as`

Утверждение типа не преобразует и не проверяет значение.

```ts
const task = serverData as Task; // TypeScript поверил, сервер — нет
```

Используйте type guard, parser или схему.

### 6. Не используйте `!` без доказательства

```tsx
document.getElementById('root')!
```

Non-null assertion допустим, когда окружение гарантирует элемент. В обычной логике лучше обработать `null`.

```tsx
const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('Не найден #root');
}

createRoot(rootElement).render(<App />);
```

### 7. Не дублируйте доменные модели

Если `Task` уже существует, выводите связанные типы через `Pick`, `Omit` или индексированный доступ.

```ts
type TaskStatus = Task['status'];
```

### 8. Props должны описывать минимальный контракт

Если компоненту нужны только `title` и `done`, не передавайте весь объект пользователя, проекта и ответа API.

### 9. Разделяйте API-модель и UI-модель

Сервер может использовать `snake_case`, nullable-поля и служебные значения. Преобразуйте ответ на границе.

```ts
type ApiTask = {
  task_id: number;
  task_title: string | null;
};

type Task = {
  id: string;
  title: string;
};

function toTask(apiTask: ApiTask): Task {
  return {
    id: String(apiTask.task_id),
    title: apiTask.task_title ?? 'Без названия',
  };
}
```

### 10. Проверяйте код в strict-режиме

В `tsconfig.json` должна быть включена строгая проверка:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Строгий режим требует немного больше работы в начале, но не позволяет `null`, неявному `any` и другим проблемам тихо попадать в приложение.

---

## 22. Частые ошибки

### Пустой массив превратился в `never[]`

```tsx
const [tasks, setTasks] = useState([]);
```

Исправление:

```tsx
const [tasks, setTasks] = useState<Task[]>([]);
```

### Состояние с `null` не принимает объект

```tsx
const [user, setUser] = useState(null);
```

Исправление:

```tsx
const [user, setUser] = useState<User | null>(null);
```

### Использован тип `Object`

`Object` почти никогда не описывает полезный контракт.

```ts
// Плохо
type Props = { data: Object };

// Хорошо
type Props = { data: Task };
```

### Использована обёртка `String`

```ts
// Плохо
type Props = { title: String };

// Хорошо
type Props = { title: string };
```

Используйте примитивы `string`, `number`, `boolean`.

### Все поля сделаны необязательными

```ts
type User = {
  id?: string;
  name?: string;
};
```

Это заставляет проверять `undefined` во всём приложении. Обязательные по смыслу данные должны оставаться обязательными.

### Ответ API сразу объявлен надёжным

```tsx
const data: Task[] = await response.json();
```

Аннотация не выполняет runtime-проверку. Используйте `unknown` и parser.

---

## 23. Практика: типизированный Task Tracker

Создайте приложение со следующими требованиями.

### Модель

```ts
type TaskStatus = 'todo' | 'inProgress' | 'done';

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
};
```

### Компоненты

1. `TaskForm` принимает `onAdd: (title: string) => void`.
2. `TaskList` принимает `tasks: Task[]` и `onStatusChange`.
3. `TaskItem` принимает одну задачу и callbacks.
4. `TaskFilter` работает только со значениями `TaskStatus | 'all'`.
5. `TaskStats` получает массив задач и вычисляет статистику без отдельного state.

### Хуки

1. `useState<Task[]>([])` хранит задачи.
2. `useState<TaskFilter>('all')` хранит фильтр.
3. `useMemo` фильтрует задачи только после появления измеримой причины для оптимизации.
4. `useEffect` сохраняет задачи в `localStorage`.
5. `useRef<HTMLInputElement>(null)` возвращает фокус после добавления.
6. Собственный `useLocalStorage<Task[]>` выносит работу с хранилищем.

### Дополнительное задание

Замените несколько `useState` на `useReducer`. Создайте union действий и добавьте `assertNever` для проверки полноты `switch`.

---

## 24. Вопросы для самопроверки

1. Когда TypeScript сам выводит тип и аннотация не нужна?
2. Для каких конструкций подходит только `type`, но не `interface`?
3. Почему `useState(null)` часто требует generic?
4. Как типизировать пустой массив задач в состоянии?
5. Какой тип подходит для произвольного `children`?
6. Почему callback `useEffect` нельзя делать `async`?
7. Чем `React.ChangeEvent<HTMLInputElement>` отличается от `React.FormEvent<HTMLFormElement>`?
8. Почему `unknown` безопаснее `any`?
9. Что даёт discriminated union состоянию сетевого запроса?
10. Почему `as Task` не проверяет ответ сервера?
11. Когда объект лучше вернуть из собственного хука, а когда tuple?
12. Для чего нужен generic-компонент?
13. Чем `satisfies` отличается от утверждения `as`?
14. Почему не каждое поле модели следует делать необязательным?
15. Какие типы стоит описывать явно на границах приложения?

---

## Краткая памятка

```tsx
// Props
type Props = { title: string; onSave: (value: string) => void };

// useState: простой тип выводится
const [count, setCount] = useState(0);

// useState: null
const [user, setUser] = useState<User | null>(null);

// useState: массив
const [tasks, setTasks] = useState<Task[]>([]);

// useState: union
const [status, setStatus] = useState<'idle' | 'loading'>('idle');

// DOM ref
const inputRef = useRef<HTMLInputElement>(null);

// Технический ref
const timerRef = useRef<number | null>(null);

// input event
function onChange(event: React.ChangeEvent<HTMLInputElement>) {}

// form event
function onSubmit(event: React.FormEvent<HTMLFormElement>) {}

// click event
function onClick(event: React.MouseEvent<HTMLButtonElement>) {}

// children
type WithChildren = { children: React.ReactNode };

// Собственный tuple-хук
return [value, setValue] as const;
```
