const express = require('express');
const app = express();
const port = 3000;

// Консольное логирование всех запросов (метод + URL + время) 
app.use((req, res, next) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

// 1. Текстовый эндпоинт (корневой) 
app.get('/', (req, res) => {
  res.send('Добро пожаловать в API студентов!');
});

// 2. JSON эндпоинт 1: коллекция студентов 
app.get('/api/students', (req, res) => {
  res.json([
    { id: 1, name: 'Иван Иванов', group: 'IBIT-31', year: 2 },
    { id: 2, name: 'Пётр Петров', group: 'IBIT-31', year: 2 },
    { id: 3, name: 'Анна Сидорова', group: 'IBIT-32', year: 2 },
    { id: 4, name: 'Мария Кузнецова', group: 'IBIT-32', year: 3 },
    { id: 5, name: 'Алексей Смирнов', group: 'IBIT-31', year: 1 }
  ]);
});

// 3. JSON эндпоинт 2: коллекция курсов 
app.get('/api/courses', (req, res) => {
  res.json([
    { id: 1, title: 'Backend Development', teacher: 'Орлов О.О.', hours: 72 },
    { id: 2, title: 'Базы данных', teacher: 'Зайцева Е.В.', hours: 60 },
    { id: 3, title: 'Web-разработка', teacher: 'Козлов Д.С.', hours: 48 },
    { id: 4, title: 'REST API Design', teacher: 'Орлов О.О.', hours: 36 }
  ]);
});

// 4. JSON эндпоинт с параметром: /api/students/:id 
app.get('/api/students/:id', (req, res) => {
  const studentId = req.params.id;
  res.json({
    requestedId: studentId,
    status: 'success',
    message: `Запрошена информация о студенте с ID = ${studentId}`
  });
});

// 5. Обработка 404 (Not Found)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});