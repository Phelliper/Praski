import mysql from "mysql2/promise"; //usamos esse import teacher pq o mysql2 é o driver Node.js que fala com o MySQL. Sem ele, o Next.js não consegue conectar no banco

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});