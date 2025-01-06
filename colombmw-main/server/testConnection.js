   // server/testConnection.js
   const pool = require('./config/db');

   async function testConnection() {
       try {
           const res = await pool.query('SELECT NOW()');
           console.log('Conexión exitosa a la base de datos:', res.rows[0]);
       } catch (err) {
           console.error('Error de conexión a la base de datos:', err);
       } finally {
           pool.end();
       }
   }

   testConnection();