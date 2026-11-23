import sqlite3
import os
import sys

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

db_path = 'lab4.db'

if os.path.exists(db_path):
    os.remove(db_path)

# ПОДКЛЮЧЕНИЕ
conn = sqlite3.connect(db_path)
conn.execute("PRAGMA foreign_keys = ON;")
cursor = conn.cursor()

# МИГРАЦИЯ
print("--- 1. Выполнение миграции (init_db.sql) ---")
if os.path.exists('init_db.sql'):
    with open('init_db.sql', 'r', encoding='utf-8') as f:
        cursor.executescript(f.read())
    conn.commit()
    print("Таблицы и индексы созданы.")
else:
    print("Ошибка: файл init_db.sql не найден!")

cursor.execute("DELETE FROM cities")
cursor.execute("DELETE FROM countries")
conn.commit()

# ВСТАВКА (Транзакция)
print("\n--- 2. Вставка данных (Транзакция): ---")
try:
    cursor.execute("BEGIN;")

    countries = [
        (1, 'Россия'), 
        (2, 'Германия'), 
        (3, 'Япония'), 
        (4, 'Казахстан')
    ]
    cursor.executemany("INSERT INTO countries (id, name) VALUES (?, ?)", countries)
    
    cities = [
        ('Москва', 13000000, 2561, 1),
        ('Санкт-Петербург', 5600000, 1439, 1),
        ('Новосибирск', 1600000, 505, 1),
        ('Берлин', 3700000, 891, 2),
        ('Токио', 13960000, 2191, 3),
        ('Алматы', 2000000, 682, 4)
    ]
    cursor.executemany("INSERT INTO cities (name, population, area, country_id) VALUES (?, ?, ?, ?)", cities)
    
    conn.commit()
    print("   Данные успешно вставлены (COMMIT).")
except Exception as e:
    conn.rollback()
    print(f"   Ошибка! ROLLBACK. Причина: {e}")

# БАЗОВЫЙ УРОВЕНЬ
print("\n--- БАЗОВЫЙ УРОВЕНЬ ---")

print("\n- SELECT * : Все города -")
cursor.execute("SELECT * FROM cities")
for row in cursor.fetchall(): print(row)

print("\n- SELECT WHERE: Население > 2 млн -")
cursor.execute("SELECT * FROM cities WHERE population > 2000000")
for row in cursor.fetchall(): print(row)

print("\n- UPDATE: Обновление населения Москвы -")
cursor.execute("UPDATE cities SET population = 14000000 WHERE id = 1")
conn.commit()
cursor.execute("SELECT * FROM cities WHERE id = 1")
print("После обновления:", cursor.fetchone())

print("\n- DELETE: Удаление Алматы (id=6) -")
cursor.execute("DELETE FROM cities WHERE id = 6")
conn.commit()
print("Алматы удален.")

# СРЕДНИЙ УРОВЕНЬ
print("\n--- СРЕДНИЙ УРОВЕНЬ ---")

print("\n- ORDER BY: Сортировка по населению (убывание) -")
cursor.execute("SELECT name, population FROM cities ORDER BY population DESC")
for row in cursor.fetchall(): print(row)

print("\n- LIMIT 2 OFFSET 1: Вторая страница (2 записи) -")
cursor.execute("SELECT name FROM cities LIMIT 2 OFFSET 1")
for row in cursor.fetchall(): print(row)

print("\n- LIKE: Поиск 'бург' -")
cursor.execute("SELECT name FROM cities WHERE name LIKE '%бург%'")
for row in cursor.fetchall(): print(row)

print("\n- BETWEEN: Население от 1.5 до 5 млн -")
cursor.execute("SELECT name, population FROM cities WHERE population BETWEEN 1500000 AND 5000000")
for row in cursor.fetchall(): print(row)

print("\n- IN: Города в России или Японии -")
cursor.execute("SELECT name FROM cities WHERE country_id IN (1, 3)")
for row in cursor.fetchall(): print(row)

print("\n- Агрегация: COUNT, SUM, AVG, MAX, MIN -")
cursor.execute("SELECT COUNT(*), SUM(population), AVG(population), MAX(population), MIN(population) FROM cities")
print("COUNT, SUM, AVG, MAX, MIN:", cursor.fetchone())

print("\n- GROUP BY: Количество городов по странам -")
cursor.execute("SELECT country_id, COUNT(*) FROM cities GROUP BY country_id")
for row in cursor.fetchall(): print(row)

# ПРОДВИНУТЫЙ УРОВЕНЬ
print("\n--- ПРОДВИНУТЫЙ УРОВЕНЬ ---")

print("\n- INNER JOIN: Город - Страна -")
cursor.execute("""
SELECT cities.name, countries.name 
FROM cities 
INNER JOIN countries ON cities.country_id = countries.id
""")
for row in cursor.fetchall(): print(row)

cursor.execute("INSERT INTO countries (name) VALUES ('Франция')")
conn.commit()
print("\n- LEFT JOIN: Все страны (включая Францию без городов) -")
cursor.execute("""
SELECT countries.name, cities.name 
FROM countries 
LEFT JOIN cities ON countries.id = cities.country_id
""")
for row in cursor.fetchall(): print(row)

print("\n- GROUP BY + HAVING: Страны с населением городов > 5 млн -")
cursor.execute("""
SELECT countries.name, SUM(cities.population) as total
FROM countries
JOIN cities ON countries.id = cities.country_id
GROUP BY countries.name
HAVING total > 5000000
""")
for row in cursor.fetchall(): print(row)

print("\n- Подзапрос: Города с населением выше среднего -")
cursor.execute("SELECT name, population FROM cities WHERE population > (SELECT AVG(population) FROM cities)")
for row in cursor.fetchall(): print(row)

conn.close()