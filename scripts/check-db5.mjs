import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://neondb_owner:npg_SW7rHDlyV4JM@ep-lucky-sky-atjg2geh-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
await client.connect();

const userId = '5bd398cb-346a-41f2-9308-c0ff24e7186d';

const r = await client.query('SELECT DISTINCT s.id, s.type, s.name FROM sessions s INNER JOIN session_members sm ON s.id = sm."sessionId" WHERE sm."userId" = ', [userId]);
console.log('sessions:', r.rows.length, JSON.stringify(r.rows));

await client.end();
