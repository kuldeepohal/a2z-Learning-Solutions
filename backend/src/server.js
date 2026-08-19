import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const app = Fastify({ logger: true });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') || true });
await app.register(jwt, { secret: process.env.JWT_SECRET });
await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

const query = (text, params) => pool.query(text, params);
const auth = async (req, reply) => {
  try { await req.jwtVerify(); } catch { return reply.code(401).send({ error: 'Unauthorized' }); }
};

app.get('/health', async () => ({ status: 'ok', service: 'a2z-learning-api' }));

app.post('/api/auth/register', async (req, reply) => {
  const { name, email, password, grade = 6 } = req.body || {};
  if (!name || !email || !password || password.length < 8) return reply.code(400).send({ error: 'Name, email and password (8+ chars) are required' });
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await query('INSERT INTO students(name,email,password_hash,grade) VALUES($1,$2,$3,$4) RETURNING id,name,email,grade', [name,email.toLowerCase(),passwordHash,grade]);
    const student = rows[0];
    return { student, token: app.jwt.sign({ sub: student.id, role: 'student' }, { expiresIn: '7d' }) };
  } catch (e) {
    if (e.code === '23505') return reply.code(409).send({ error: 'Email already registered' });
    throw e;
  }
});

app.post('/api/auth/login', async (req, reply) => {
  const { email, password } = req.body || {};
  const { rows } = await query('SELECT * FROM students WHERE email=$1', [String(email || '').toLowerCase()]);
  const student = rows[0];
  if (!student || !(await bcrypt.compare(password || '', student.password_hash))) return reply.code(401).send({ error: 'Invalid credentials' });
  return { student: { id:student.id,name:student.name,email:student.email,grade:student.grade }, token: app.jwt.sign({ sub: student.id, role: 'student' }, { expiresIn:'7d' }) };
});

app.get('/api/me', { preHandler: auth }, async req => {
  const { rows } = await query('SELECT id,name,email,grade,created_at FROM students WHERE id=$1', [req.user.sub]);
  return rows[0] || null;
});

app.get('/api/chapters', async (req) => {
  const grade = Number(req.query.grade || 6);
  const { rows } = await query('SELECT id,grade,subject,chapter_no,title,slug,published FROM chapters WHERE grade=$1 AND published=true ORDER BY chapter_no', [grade]);
  return rows;
});

app.get('/api/chapters/:id', async req => {
  const { rows } = await query('SELECT * FROM chapters WHERE id=$1 AND published=true', [req.params.id]);
  return rows[0] || null;
});

app.post('/api/progress', { preHandler: auth }, async (req, reply) => {
  const { chapterId, status = 'started', score = null, timeSpentSeconds = 0 } = req.body || {};
  if (!chapterId) return reply.code(400).send({ error: 'chapterId required' });
  const { rows } = await query(`INSERT INTO progress(student_id,chapter_id,status,best_score,time_spent_seconds,last_activity_at)
    VALUES($1,$2,$3,$4,$5,NOW())
    ON CONFLICT(student_id,chapter_id) DO UPDATE SET status=EXCLUDED.status,best_score=GREATEST(COALESCE(progress.best_score,0),COALESCE(EXCLUDED.best_score,0)),time_spent_seconds=progress.time_spent_seconds+EXCLUDED.time_spent_seconds,last_activity_at=NOW()
    RETURNING *`, [req.user.sub,chapterId,status,score,timeSpentSeconds]);
  return rows[0];
});

app.get('/api/dashboard', { preHandler: auth }, async req => {
  const { rows } = await query(`SELECT c.id,c.chapter_no,c.title,c.subject,COALESCE(p.status,'not_started') status,COALESCE(p.best_score,0) best_score,COALESCE(p.time_spent_seconds,0) time_spent_seconds
    FROM chapters c LEFT JOIN progress p ON p.chapter_id=c.id AND p.student_id=$1 WHERE c.published=true ORDER BY c.grade,c.chapter_no`, [req.user.sub]);
  const completed = rows.filter(x => x.status === 'completed').length;
  const attempted = rows.filter(x => Number(x.best_score) > 0).length;
  const averageScore = rows.length ? Math.round(rows.reduce((s,x)=>s+Number(x.best_score),0)/rows.length) : 0;
  return { chapters: rows, stats: { total: rows.length, completed, attempted, averageScore } };
});

app.post('/api/assessments/submit', { preHandler: auth }, async (req, reply) => {
  const { chapterId, answers = [], score, total, timeSpentSeconds = 0 } = req.body || {};
  if (!chapterId || !Array.isArray(answers) || typeof score !== 'number' || !total) return reply.code(400).send({ error:'Invalid assessment payload' });
  const percentage = Math.round((score / total) * 100);
  const { rows } = await query('INSERT INTO assessment_attempts(student_id,chapter_id,score,total,percentage,answers,time_spent_seconds) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,percentage,created_at', [req.user.sub,chapterId,score,total,percentage,JSON.stringify(answers),timeSpentSeconds]);
  await query(`INSERT INTO progress(student_id,chapter_id,status,best_score,time_spent_seconds,last_activity_at) VALUES($1,$2,$3,$4,$5,NOW()) ON CONFLICT(student_id,chapter_id) DO UPDATE SET status=CASE WHEN EXCLUDED.best_score>=60 THEN 'completed' ELSE progress.status END,best_score=GREATEST(COALESCE(progress.best_score,0),EXCLUDED.best_score),time_spent_seconds=progress.time_spent_seconds+EXCLUDED.time_spent_seconds,last_activity_at=NOW()`, [req.user.sub,chapterId,percentage>=60?'completed':'attempted',percentage,timeSpentSeconds]);
  return { attempt: rows[0], passed: percentage >= 60 };
});

app.get('/api/analytics/overview', { preHandler: auth }, async req => {
  const { rows } = await query(`SELECT COUNT(*) attempts,COALESCE(AVG(percentage),0)::numeric(5,2) average_score,COALESCE(SUM(time_spent_seconds),0) time_spent_seconds,COUNT(DISTINCT chapter_id) chapters_attempted FROM assessment_attempts WHERE student_id=$1`, [req.user.sub]);
  return rows[0];
});

app.get('/api/analytics/chapter/:id', { preHandler: auth }, async req => {
  const { rows } = await query('SELECT id,score,total,percentage,time_spent_seconds,created_at FROM assessment_attempts WHERE student_id=$1 AND chapter_id=$2 ORDER BY created_at DESC', [req.user.sub,req.params.id]);
  return rows;
});

app.get('/api/admin/revenue', { preHandler: auth }, async req => {
  if (req.user.role !== 'admin') return reply.code(403).send({ error:'Admin only' });
  const { rows } = await query(`SELECT COUNT(*) transactions,COALESCE(SUM(amount),0) revenue,COUNT(DISTINCT email) customers FROM payments WHERE status='SUCCESS'`);
  return rows[0];
});

const port = Number(process.env.PORT || 4000);
app.listen({ port, host:'0.0.0.0' });
