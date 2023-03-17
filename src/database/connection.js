const mysql = require('mysql2');
require('dotenv').config()

const connection = mysql.createConnection({
    host: process.env.HOST,
    database: process.env.DATABASE_NAME,
    user: process.env.USERNAME_DB,
    password: process.env.SQL_PASSWORD,
    port: process.env.PORT
})

module.exports = connection;