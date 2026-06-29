import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://neondb_owner:npg_SW7rHDlyV4JM@ep-lucky-sky-atjg2geh-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
await client.connect();

const r1 = await client.query('SELECT * FROM session_members LIMIT 5');
console.log('session_members:', JSON.stringify(r1.rows));

const r2 = await client.query('SELECT id, nickname, account FROM users LIMIT 5');
console.log('users:', JSON.stringify(r2.rows));

await client.end();
