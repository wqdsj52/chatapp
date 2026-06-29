import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://neondb_owner:npg_SW7rHDlyV4JM@ep-lucky-sky-atjg2geh-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
await client.connect();
const userId = '5bd398cb-346a-41f2-9308-c0ff24e7186d';
const q = 'SELECT s.id, s.type, s.name FROM sessions s INNER JOIN session_members sm ON s.id = sm."sessionId" WHERE sm."userId" = ';
console.log('query:', q);
const r = await client.query(q, [userId]);
console.log('result:', r.rows.length);
for (const row of r.rows) { console.log(JSON.stringify(row)); }
await client.end();