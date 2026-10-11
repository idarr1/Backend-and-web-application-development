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

// ВАЛИДАЦИЯ
function validateCity(body, isFullUpdate = true) {
    const errors = [];

    if (isFullUpdate || body.name !== undefined) {
        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            errors.push('Поле "name" обязательно и должно быть непустой строкой');
        }
    }

    if (isFullUpdate || body.population !== undefined) {
        if (body.population === undefined || typeof body.population !== 'number' || body.population < 0) {
            errors.push('Поле "population" обязательно и должно быть положительным числом');
        }
    }

    if (isFullUpdate || body.country !== undefined) {
        if (!body.country || typeof body.country !== 'string' || body.country.trim() === '') {
            errors.push('Поле "country" обязательно и должно быть непустой строкой');
        }
    }

    if (body.area !== undefined && (typeof body.area !== 'number' || body.area < 0)) {
        errors.push('Поле "area" должно быть положительным числом');
    }

    return errors;
}

// GET /cities — список с поиском, сортировкой, пагинацией
app.get('/cities', (req, res) => {
    let result = [...cities];

    if (req.query.search) {
        const search = req.query.search.toLowerCase();
        result = result.filter(c => c.name.toLowerCase().includes(search));
    }

    if (req.query.sort) {
        const field = req.query.sort;
        const order = req.query.order === 'desc' ? -1 : 1;
        if (['id', 'name', 'population', 'country', 'area'].includes(field)) {
            result.sort((a, b) => {
                if (a[field] < b[field]) return -1 * order;
                if (a[field] > b[field]) return 1 * order;
                return 0;
            });
        }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || result.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginated = result.slice(startIndex, endIndex);

    res.json({
        total: result.length,
        page: page,
        limit: limit,
        count: paginated.length,
        cities: paginated
    });
});

// GET /cities/stats — статистика
app.get('/cities/stats', (req, res) => {
    const totalCities = cities.length;
    const totalPopulation = cities.reduce((sum, c) => sum + c.population, 0);
    const avgPopulation = totalCities > 0 ? Math.round(totalPopulation / totalCities) : 0;

    const byCountry = {};
    cities.forEach(c => {
        if (!byCountry[c.country]) {
            byCountry[c.country] = { count: 0, population: 0 };
        }
        byCountry[c.country].count++;
        byCountry[c.country].population += c.population;
    });

    res.json({
        totalCities,
        totalPopulation,
        avgPopulation,
        byCountry
    });
});

// GET /cities/:id — один элемент
app.get('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const city = cities.find(c => c.id === id);

    if (!city) {
        return res.status(404).json({ error: 'Город не найден' });
    }

    res.json(city);
});

// GET /cities/:id/related — связанные (по стране)
app.get('/cities/:id/related', (req, res) => {
    const id = parseInt(req.params.id);
    const city = cities.find(c => c.id === id);

    if (!city) {
        return res.status(404).json({ error: 'Город не найден' });
    }

    const related = cities.filter(c => c.country === city.country && c.id !== city.id);

    res.json({
        source: city,
        country: city.country,
        count: related.length,
        related: related
    });
});

// POST /cities — создание
app.post('/cities', (req, res) => {
    const errors = validateCity(req.body, true);

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const newCity = {
        id: nextId++,
        name: req.body.name,
        population: req.body.population,
        country: req.body.country,
        area: req.body.area || 0
    };

    cities.push(newCity);
    res.status(201).json(newCity);
});

// POST /cities/bulk — массовое создание
app.post('/cities/bulk', (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Ожидается массив объектов' });
    }

    if (req.body.length === 0) {
        return res.status(400).json({ error: 'Массив не может быть пустым' });
    }

    const created = [];
    const errors = [];

    req.body.forEach((item, index) => {
        const itemErrors = validateCity(item, true);
        if (itemErrors.length > 0) {
            errors.push({ index, errors: itemErrors });
        } else {
            const newCity = {
                id: nextId++,
                name: item.name,
                population: item.population,
                country: item.country,
                area: item.area || 0
            };
            cities.push(newCity);
            created.push(newCity);
        }
    });

    if (errors.length > 0 && created.length === 0) {
        return res.status(400).json({ errors });
    }

    res.status(201).json({
        created: created.length,
        items: created,
        errors: errors.length > 0 ? errors : undefined
    });
});

// PUT /cities/:id — полное обновление
app.put('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cities.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Город не найден' });
    }

    const errors = validateCity(req.body, true);

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    cities[index] = {
        id: id,
        name: req.body.name,
        population: req.body.population,
        country: req.body.country,
        area: req.body.area || 0
    };

    res.json(cities[index]);
});

// PATCH /cities/:id — частичное обновление
app.patch('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const city = cities.find(c => c.id === id);

    if (!city) {
        return res.status(404).json({ error: 'Город не найден' });
    }

    const errors = validateCity(req.body, false);

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    if (req.body.name !== undefined) city.name = req.body.name;
    if (req.body.population !== undefined) city.population = req.body.population;
    if (req.body.country !== undefined) city.country = req.body.country;
    if (req.body.area !== undefined) city.area = req.body.area;

    res.json(city);
});

// DELETE /cities/:id — удалить один
app.delete('/cities/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cities.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Город не найден' });
    }

    cities.splice(index, 1);
    res.status(204).send();
});

// DELETE /cities — удалить ВСЕ
app.delete('/cities', (req, res) => {
    const count = cities.length;
    cities = [];
    nextId = 1;
    res.json({
        message: 'Все города удалены',
        deleted: count
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК 500
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    fs.appendFile(logFile, `[ERROR] ${err.message}\n`, () => {});
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// ЗАПУСК
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});