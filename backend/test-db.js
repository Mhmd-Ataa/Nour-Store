import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const { Client } = pg;
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();

  const result = await client.query('SELECT NOW()');

  console.log('✅ Database connected!');
  console.log(result.rows[0]);

  await client.end();
} catch (error) {
  console.error('❌ Database connection failed');
  console.error(error.message);
}