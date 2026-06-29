import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://neondb_owner:npg_SW7rHDlyV4JM@ep-lucky-sky-atjg2geh-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });
await client.connect();

const sm = await client.query('SELECT * FROM session_members');
console.log('=== ALL session_members ===');
for (const r of sm.rows) console.log(r.sessionId, r.userId);

const sessions = await client.query('SELECT id, type, name FROM sessions');
console.log('=== ALL sessions ===');
for (const s of sessions.rows) console.log(s.id, s.type, s.name);

const users = await client.query('SELECT id, nickname, account FROM users');
console.log('=== ALL users ===');
for (const u of users.rows) console.log(u.id, u.nickname, u.account);

await client.end();
