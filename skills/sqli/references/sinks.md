# SQL Query Sinks by Language

## JavaScript / TypeScript
| Sink | Safe? | Notes |
|------|-------|-------|
| `pg.query(sql, params)` | SAFE | Parameterized |
| `pg.query(sql)` | UNSAFE | If sql has interpolation |
| `mysql2.query(sql, params)` | SAFE | Parameterized |
| `mysql2.query(sql)` | UNSAFE | If sql has interpolation |
| `sqlite3.run(sql, params)` | SAFE | Parameterized |
| `sequelize.query(sql)` | UNSAFE | Raw query |
| `knex.raw(sql)` | UNSAFE | Raw query |
| `knex.raw(sql, bindings)` | SAFE | With bindings |
| `prisma.$queryRaw` | SAFE | Tagged template (parameterized) |
| `prisma.$queryRawUnsafe(sql)` | UNSAFE | String query |
| `typeorm.query(sql)` | UNSAFE | Raw query |

## Python
| Sink | Safe? | Notes |
|------|-------|-------|
| `cursor.execute(sql, params)` | SAFE | Parameterized |
| `cursor.execute(sql)` | UNSAFE | If sql has interpolation |
| `cursor.execute(f"...")` | UNSAFE | f-string in SQL |
| `Model.objects.raw(sql)` | UNSAFE | Django raw |
| `Model.objects.extra(where=[sql])` | UNSAFE | Django extra |
| `text(sql)` | CHECK | SQLAlchemy text() |
| `session.execute(text(sql), params)` | SAFE | With params |

## Go
| Sink | Safe? | Notes |
|------|-------|-------|
| `db.Query(sql, args...)` | SAFE | Parameterized |
| `db.Query(sql)` | UNSAFE | If sql is built dynamically |
| `db.Exec(sql, args...)` | SAFE | Parameterized |
| `gorm.Raw(sql, vals...)` | SAFE | With values |
| `gorm.Raw(sql)` | UNSAFE | Dynamic sql |

## PHP
| Sink | Safe? | Notes |
|------|-------|-------|
| `PDO::prepare(sql)` + `execute(params)` | SAFE | Prepared statement |
| `PDO::query(sql)` | UNSAFE | Direct query |
| `mysqli_query($conn, $sql)` | UNSAFE | Direct query |
| `mysql_query($sql)` | UNSAFE | Deprecated + direct |
