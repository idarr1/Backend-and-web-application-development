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
    const ip = req.ip || req.socket.remoteAddress;
    const logLine = `[${time}] ${req.method} ${req.url} — ${ip}\n`;
    console.log(logLine.trim());
    fs.appendFile(logFile, logLine, (err) => {
        if (err) console.error('Ошибка записи в лог:', err);
    });
    next();
});

// ХРАНИЛИЩЕ ДАННЫХ
let students = [
    { id: 1, name: 'Иван Иванов', group: 'ПИЖ-1', course: 3, avg_grade: 4.5 },
    { id: 2, name: 'Пётр Петров', group: 'ПИЖ-1', course: 3, avg_grade: 4.2 },
    { id: 3, name: 'Анна Сидорова', group: 'ПИЖ-2', course: 3, avg_grade: 4.8 },
    { id: 4, name: 'Мария Кузнецова', group: 'ПИЖ-2', course: 2, avg_grade: 4.9 },
    { id: 5, name: 'Алексей Смирнов', group: 'ПИЖ-1', course: 2, avg_grade: 3.8 },
    { id: 6, name: 'Ольга Морозова', group: 'ПИЖ-3', course: 3, avg_grade: 4.6 },
    { id: 7, name: 'Дмитрий Волков', group: 'ПИЖ-3', course: 2, avg_grade: 4.0 }
];

let courses = [
    { id: 1, title: 'Backend Development', teacher: 'Орлов О.О.', hours: 72 },
    { id: 2, title: 'Базы данных', teacher: 'Зайцева Е.В.', hours: 60 },
    { id: 3, title: 'Web-разработка', teacher: 'Козлов Д.С.', hours: 48 },
    { id: 4, title: 'REST API Design', teacher: 'Орлов О.О.', hours: 36 },
    { id: 5, title: 'Алгоритмы и структуры данных', teacher: 'Петров А.С.', hours: 90 }
];

// Оценки студентов: ключ - ID студента, значение - массив оценок
let grades = {
    1: [5, 4, 5, 4, 5],
    2: [4, 4, 5, 3, 5],
    3: [5, 5, 5, 4, 5],
    4: [5, 5, 4, 5, 5],
    5: [4, 3, 4, 4, 3],
    6: [5, 4, 5, 5, 4],
    7: [4, 4, 3, 5, 4]
};

// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ
function parseId(raw) {
    const id = parseInt(raw);
    return isNaN(id) || id < 1 ? null : id;
}

// GET /students — все студенты
app.get('/students', (req, res) => {
    let result = [...students];

    // Поиск по имени
    if (req.query.search) {
        const search = req.query.search.toLowerCase();
        result = result.filter(s => s.name.toLowerCase().includes(search));
    }

    // Фильтр по группе
    if (req.query.group) {
        const group = req.query.group.toLowerCase();
        result = result.filter(s => s.group.toLowerCase() === group);
    }

    // Фильтр по курсу
    if (req.query.course) {
        const course = parseInt(req.query.course);
        if (!isNaN(course)) {
            result = result.filter(s => s.course === course);
        }
    }

    // Сортировка
    const sort = req.query.sort;
    const order = req.query.order === 'desc' ? -1 : 1;
    const allowedSort = ['id', 'name', 'group', 'course', 'avg_grade'];

    if (sort) {
        if (!allowedSort.includes(sort)) {
            return res.status(400).json({
                error: `Поле сортировки должно быть одним из: ${allowedSort.join(', ')}`
            });
        }
        result.sort((a, b) => {
            if (a[sort] < b[sort]) return -1 * order;
            if (a[sort] > b[sort]) return 1 * order;
            return 0;
        });
    }

    // Пагинация
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || result.length;

    if (page < 1) return res.status(400).json({ error: 'page должен быть >= 1' });
    if (limit < 1 || limit > 100) {
        return res.status(400).json({ error: 'limit должен быть от 1 до 100' });
    }

    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    res.json({
        total: result.length,
        page,
        limit,
        totalPages: Math.ceil(result.length / limit),
        count: paginated.length,
        students: paginated
    });
});

// GET /students/stats — статистика
app.get('/students/stats', (req, res) => {
    const total = students.length;
    const avgGrade = total > 0
        ? +(students.reduce((sum, s) => sum + s.avg_grade, 0) / total).toFixed(2)
        : 0;
    const maxGrade = total > 0 ? Math.max(...students.map(s => s.avg_grade)) : 0;
    const minGrade = total > 0 ? Math.min(...students.map(s => s.avg_grade)) : 0;

    // Статистика по группам
    const byGroup = {};
    students.forEach(s => {
        if (!byGroup[s.group]) {
            byGroup[s.group] = { count: 0, totalAvg: 0, students: [] };
        }
        byGroup[s.group].count++;
        byGroup[s.group].totalAvg += s.avg_grade;
        byGroup[s.group].students.push(s.name);
    });

    // Средний балл по каждой группе
    Object.keys(byGroup).forEach(g => {
        byGroup[g].avgGrade = +(byGroup[g].totalAvg / byGroup[g].count).toFixed(2);
        delete byGroup[g].totalAvg;
    });

    res.json({
        totalStudents: total,
        avgGrade,
        maxGrade,
        minGrade,
        byGroup
    });
});

// GET /students/:id — один студент
app.get('/students/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: 'ID должен быть положительным числом' });
    }

    const student = students.find(s => s.id === id);
    if (!student) {
        return res.status(404).json({ error: 'Студент не найден' });
    }

    res.json(student);
});

// GET /students/:id/grades — оценки студента (вложенный ресурс)
app.get('/students/:id/grades', (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: 'ID должен быть положительным числом' });
    }

    const student = students.find(s => s.id === id);
    if (!student) {
        return res.status(404).json({ error: 'Студент не найден' });
    }

    const studentGrades = grades[id] || [];
    const avg = studentGrades.length > 0
        ? +(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length).toFixed(2)
        : 0;

    res.json({
        studentId: id,
        name: student.name,
        grades: studentGrades,
        average: avg,
        count: studentGrades.length
    });
});

// GET /students/:id/related — студенты той же группы
app.get('/students/:id/related', (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: 'ID должен быть положительным числом' });
    }

    const student = students.find(s => s.id === id);
    if (!student) {
        return res.status(404).json({ error: 'Студент не найден' });
    }

    const related = students.filter(s => s.group === student.group && s.id !== student.id);

    res.json({
        source: student,
        group: student.group,
        count: related.length,
        related
    });
});

// GET /groups/:group/students — студенты группы (категория)
app.get('/groups/:group/students', (req, res) => {
    const group = req.params.group;
    const filtered = students.filter(
        s => s.group.toLowerCase() === group.toLowerCase()
    );

    if (filtered.length === 0) {
        return res.status(404).json({ error: `В группе "${group}" студентов не найдено` });
    }

    res.json({
        group,
        count: filtered.length,
        students: filtered
    });
});

// GET /groups/:group/students/:studentId — множественные параметры
app.get('/groups/:group/students/:studentId', (req, res) => {
    const { group, studentId } = req.params;
    const id = parseId(studentId);

    if (id === null) {
        return res.status(400).json({ error: 'ID студента должен быть положительным числом' });
    }

    const student = students.find(
        s => s.id === id && s.group.toLowerCase() === group.toLowerCase()
    );

    if (!student) {
        return res.status(404).json({
            error: `Студент с ID=${studentId} не найден в группе "${group}"`
        });
    }

    res.json({
        group,
        student
    });
});

// КУРСЫ

// GET /courses — все курсы
app.get('/courses', (req, res) => {
    res.json({
        count: courses.length,
        courses
    });
});

// GET /courses/:id — один курс
app.get('/courses/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) {
        return res.status(400).json({ error: 'ID должен быть положительным числом' });
    }

    const course = courses.find(c => c.id === id);
    if (!course) {
        return res.status(404).json({ error: 'Курс не найден' });
    }

    res.json(course);
});

// WILDCARD и ОБРАБОТКА ОШИБОК

// Wildcard 404
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок 500
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    fs.appendFile(logFile, `[ERROR] ${err.message}\n`, () => {});
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// ЗАПУСК
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});