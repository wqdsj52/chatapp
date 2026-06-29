import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://neondb_owner:npg_SW7rHDlyV4JM@ep-lucky-sky-atjg2geh-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
await client.connect();

const userId = '5bd398cb-346a-41f2-9308-c0ff24e7186d';

// Get alice sessions
const aliceSessions = await client.query('SELECT s.id, s.type, s.name FROM sessions s INNER JOIN session_members sm ON s.id = sm."sessionId" WHERE sm."userId" = ', [userId]);
console.log('Alice sessions:', aliceSessions.rows.length);

for (const s of aliceSessions.rows) {
  const members = await client.query('SELECT u.id, u.nickname FROM users u INNER JOIN session_members sm ON u.id = sm."userId" WHERE sm."sessionId" = ', [s.id]);
  console.log('Session', s.id, 'type:', s.type, 'members:', members.rows.map(m => m.nickname));
}

await client.end();
