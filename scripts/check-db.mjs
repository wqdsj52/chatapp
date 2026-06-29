import pg from 'pg';
const client = new pg.Client('postgresql://neondb_owner:npg_SW7rHDlyV4JM@ep-lucky-sky-atjg2geh-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require');
await client.connect();
const sm = await client.query('SELECT * FROM session_members');
console.log('session_members rows:', sm.rows.length);
console.log(JSON.stringify(sm.rows, null, 2));
const users = await client.query('SELECT id, nickname, account FROM users');
console.log('users:', JSON.stringify(users.rows, null, 2));
await client.end();
