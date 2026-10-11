# Лабораторная работа №2. HTTP-методы и CRUD-операции

**Студент:** Гуртуев Идар Алиевич

**Группа:** ПИЖ-б-о-25-1

**Вариант:** 7

**Технология:** Node.js + Express

**Уровень:** Продвинутый

**Репозиторий:** https://github.com/idarr1/Backend-development

---

## 1. Цель работы

Освоить обработку различных HTTP-методов (GET, POST, PUT, PATCH, DELETE) в Express. Научиться реализовывать CRUD-операции над коллекцией объектов, хранящейся в памяти сервера, а также возвращать корректные HTTP-коды ответов (200, 201, 204, 400, 404).

---

## 2. Теоретическое обоснование

**CRUD** - акроним, обозначающий четыре базовые операции над данными:

| Операция | Расшифровка | HTTP-метод | SQL-аналог |
|----------|-------------|------------|------------|
| Create | Создание | POST | INSERT |
| Read | Чтение | GET | SELECT |
| Update | Обновление | PUT / PATCH | UPDATE |
| Delete | Удаление | DELETE | DELETE |

**Хранение данных в памяти** - данные хранятся в массиве JavaScript,
без использования базы данных. Преимущества: простота, не нужна установка
БД, быстрый доступ. Недостатки: данные теряются при перезапуске сервера,
не подходит для production.

**Коды состояния HTTP:**

| Код | Название | Когда используется |
|-----|----------|-------------------|
| 200 | OK | Успешный GET, PUT, DELETE |
| 201 | Created | Успешный POST (ресурс создан) |
| 204 | No Content | Успешный DELETE (нет тела ответа) |
| 400 | Bad Request | Ошибка в данных запроса |
| 404 | Not Found | Ресурс не найден |
| 500 | Internal Server Error | Ошибка на сервере |

---

## 3. Выполнение практического примера

### 3.1. Создание проекта

```bash
mkdir lab2_crud
cd lab2_crud
npm init -y
npm install express
npm install --save-dev nodemon
```

### 3.2. Настройка `package.json`

```json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js"
}
```

### 3.3. Запуск сервера

```bash
npm run dev
```

---

## 4. Выполнение индивидуального задания

**Вариант 7, продвинутый уровень. Сущность: Города (cities).**

Поля: `id`, `name`, `population`, `country`, `area`.  
Поиск по: `name`.  
Статистика: общее население.  
Связи: по стране.

### 4.1. Реализованные эндпоинты

| № | Метод | URL | Назначение |
|---|-------|-----|------------|
| 1 | GET | `/cities` | Список городов (поиск, сортировка, пагинация) |
| 2 | GET | `/cities/stats` | Статистика |
| 3 | GET | `/cities/:id` | Один город |
| 4 | GET | `/cities/:id/related` | Города той же страны |
| 5 | POST | `/cities` | Создание |
| 6 | POST | `/cities/bulk` | Массовое создание |
| 7 | PUT | `/cities/:id` | Полное обновление |
| 8 | PATCH | `/cities/:id` | Частичное обновление |
| 9 | DELETE | `/cities/:id` | Удалить один |
| 10 | DELETE | `/cities` | Удалить все |

### 4.2. Код сервера (`app.js`)

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// MIDDLEWARE
app.use(express.json());

// Логирование в консоль + в файл access.log
const logFile = path.join(__dirname, 'access.log');
app.use((req, res, next) => {
    const time = new Date().toISOString();
    const logLine = `[${time}] ${req.method} ${req.url}\n`;
    console.log(logLine.trim());
    fs.appendFile(logFile, logLine, (err) => {
        if (err) console.error('Ошибка записи в лог:', err);
    });
    next();
});

// ХРАНИЛИЩЕ ДАННЫХ
let cities = [
    { id: 1, name: 'Москва', population: 12500000, country: 'Россия', area: 2561 },
    { id: 2, name: 'Санкт-Петербург', population: 5600000, country: 'Россия', area: 1439 },
    { id: 3, name: 'Казань', population: 1250000, country: 'Россия', area: 425 },
    { id: 4, name: 'Новосибирск', population: 1620000, country: 'Россия', area: 505 },
    { id: 5, name: 'Берлин', population: 3700000, country: 'Германия', area: 891 },
    { id: 6, name: 'Мюнхен', population: 1500000, country: 'Германия', area: 310 },
    { id: 7, name: 'Токио', population: 13960000, country: 'Япония', area: 2191 }
];

let nextId = 8;

// ... остальной код (валидация, GET, POST, PUT, PATCH, DELETE)
```

> Полный код `app.js` приведён в самом файле проекта.

### 4.3. Проверка эндпоинтов

#### 4.3.1. GET все города

**Рисунок 1 - GET /cities**

![GET all cities](screenshots2/01-get-all-cities.png)

#### 4.3.2. GET один город

**Рисунок 2 - GET /cities/1**

![GET city by ID](screenshots2/02-get-city-by-id.png)

#### 4.3.3. GET статистика

**Рисунок 3 - GET /cities/stats**

![Stats](screenshots2/03-get-stats.png)

#### 4.3.4. GET связанные города

**Рисунок 4 - GET /cities/1/related**

![Related](screenshots2/04-get-related.png)

#### 4.3.5. POST создание

**Рисунок 5 - POST /cities (201 Created)**

![Create](screenshots2/05-post-create.png)

#### 4.3.6. POST массовое создание

**Рисунок 6 - POST /cities/bulk (201 Created)**

![Bulk](screenshots2/06-post-bulk.png)

#### 4.3.7. PUT полное обновление

**Рисунок 7 - PUT /cities/1 (200 OK)**

![Update](screenshots2/07-put-update.png)

#### 4.3.8. PATCH частичное обновление

**Рисунок 8 - PATCH /cities/1 (200 OK)**

![Patch](screenshots2/08-patch.png)

#### 4.3.9. DELETE один город

**Рисунок 9 - DELETE /cities/3 (204 No Content)**

![Delete one](screenshots2/09-delete-one.png)

#### 4.3.10. DELETE все города

**Рисунок 10 - DELETE /cities (200 OK)**

![Delete all](screenshots2/10-delete-all.png)

#### 4.3.11. Ошибка 404

**Рисунок 11 - GET /cities/999 (404 Not Found)**

![404](screenshots2/11-404.png)

#### 4.3.12. Ошибка 400

**Рисунок 12 - POST /cities с невалидными данными (400 Bad Request)**

![400](screenshots2/12-400.png)

#### 4.3.13. Логирование в файл

Все запросы записываются в файл `access.log`.

**Рисунок 13 - Содержимое access.log**

![access.log](screenshots2/14-access-log.png)

---

## 5. Итоговая структура проекта

```text
lab2_crud/
├── node_modules/
├── screenshots2/
│   ├── 01-get-all-cities.png
│   ├── 02-get-city-by-id.png
│   ├── ... (все 14 скринов)
├── access.log
├── app.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## 6. Ответы на контрольные вопросы

### 1. Что такое CRUD? Расшифруйте каждую букву.

CRUD - акроним четырёх базовых операций над данными:
**C**reate (создание), **R**ead (чтение), **U**pdate (обновление),
**D**elete (удаление).

### 2. Какие HTTP-методы соответствуют операциям CRUD?

- Create → **POST**
- Read → **GET**
- Update → **PUT** / **PATCH**
- Delete → **DELETE**

### 3. Что такое идемпотентность HTTP-методов? Какие методы идемпотентны?

**Идемпотентность** - свойство метода давать одинаковый результат при
повторном вызове. Идемпотентны: **GET, PUT, DELETE**.
**POST** - не идемпотентен: два одинаковых запроса создадут два ресурса.

### 4. Какой код ответа возвращается при успешном создании ресурса (POST)?

**201 Created**.

### 5. Какой код ответа возвращается при успешном удалении ресурса?

**204 No Content** (если без тела ответа) или **200 OK** (если с телом).

### 6. Что такое middleware в Express? Для чего используется `express.json()`?

**Middleware** - функция, выполняемая между получением запроса и отправкой
ответа. `express.json()` - встроенный middleware, который парсит тело
запроса в формате JSON и помещает результат в `req.body`. Без него
`req.body` в POST/PUT/PATCH будет пустым.

### 7. Как получить параметры из тела POST-запроса в Express?

Через `req.body`, но только если подключён middleware `express.json()`.

### 8. Как получить параметр из URL (например, ID)?

Через `req.params.id`, если маршрут объявлен как `/cities/:id`.

### 9. Как найти элемент в массиве по ID?

`array.find(item => item.id === id)` - вернёт первый подходящий элемент
или `undefined`.

### 10. Какой код ответа возвращается, если ресурс не найден?

**404 Not Found**.

### 11. Как отправить JSON-ответ в Express?

Методом `res.json(data)` - Express автоматически установит заголовок
`Content-Type: application/json` и сериализует объект.

### 12. Как вернуть статус-код 201 в Express?

`res.status(201).json(data)`.

### 13. Что произойдёт с данными в памяти при перезапуске сервера?

Данные **потеряются**, так как хранятся в оперативной памяти. Массив
`cities` вернётся к начальному состоянию, заданному в коде.

### 14. Как добавить новый элемент в массив?

`array.push(newItem)`.

### 15. Как удалить элемент из массива?

`array.splice(index, 1)` - удаляет 1 элемент по указанному индексу.
Индекс предварительно находят через `array.findIndex(item => item.id === id)`.

### 16. Как реализовать частичное обновление (PATCH)?

PATCH принимает только те поля, которые нужно обновить, и заменяет
их в объекте. Остальные поля остаются нетронутыми. В отличие от PUT,
где объект заменяется полностью.

### 17. Как реализовать массовое удаление элементов?

Через отдельный маршрут `DELETE /cities` без параметра `:id` -
обнуляем массив (`cities = []`).

### 18. Как реализовать массовое создание элементов?

Через `POST /cities/bulk` - принимаем массив объектов в теле, проходим
по нему циклом, создаём каждый город с новым ID, добавляем в массив.

### 19. Как реализовать глобальный обработчик ошибок?

Middleware с 4 аргументами: `app.use((err, req, res, next) => {...})`.
Express автоматически вызывает его при ошибках в маршрутах.

### 20. Как логировать запросы в файл?

Через встроенный модуль `fs`: `fs.appendFile(logFile, line, callback)` -
дописывает строку в конец файла.

---

## 7. Вывод

В ходе лабораторной работы были освоены HTTP-методы и их применение для реализации CRUD-операций в Express. Реализован REST-подобный API для управления коллекцией городов с хранением данных в памяти сервера.

Реализованы все базовые операции CRUD (GET, POST, PUT, DELETE),
дополнительно - PATCH (частичное обновление), массовые операции
(`POST /cities/bulk`, `DELETE /cities`), статистика (`/cities/stats`),
связанные элементы (`/cities/:id/related`).

Настроена валидация входных данных с возвратом кода **400 Bad Request**, обработка **404 Not Found** для ненайденных ресурсов, корректное использование кодов **201 Created** и **204 No Content**. 
Реализовано логирование всех запросов в файл `access.log` и глобальный обработчик ошибок **500 Internal Server Error**.

В результате получены практические навыки построения REST API, работы с HTTP-методами, кодами состояний и middleware в Express.

---

## 8. Список использованных источников

1. Express - Routing: https://expressjs.com/en/guide/routing.html
2. Express - Request и Response: https://expressjs.com/en/4x/api.html
3. HTTP-методы (MDN): https://developer.mozilla.org/ru/docs/Web/HTTP/Methods
4. Коды состояния HTTP (MDN): https://developer.mozilla.org/ru/docs/Web/HTTP/Status
5. REST API Tutorial: https://restfulapi.net/
6. Postman Learning Center: https://learning.postman.com/