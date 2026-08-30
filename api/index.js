const crypto = require('crypto');
const nodemailer = require('nodemailer');

let Razorpay;
try {
  Razorpay = require('razorpay');
} catch (_) {
  Razorpay = null;
}

const DEFAULTS = {
  OPENAI_API_KEY: 'default_openai_key',
  GEMINI_API_KEY: 'default_gemini_key',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  RAZORPAY_KEY_ID: 'rzp_test_default_key',
  RAZORPAY_KEY_SECRET: 'default_razorpay_secret',
  RAZORPAY_WEBHOOK_SECRET: 'default_webhook_secret'
};

const env = (name) => process.env[name] || DEFAULTS[name] || '';
const isConfigured = (value, fallback) => Boolean(value && value !== fallback && !value.includes('your_'));

const razorpayKeyId = env('RAZORPAY_KEY_ID');
const razorpaySecret = env('RAZORPAY_KEY_SECRET');
const razorpay = Razorpay && isConfigured(razorpayKeyId, DEFAULTS.RAZORPAY_KEY_ID) && isConfigured(razorpaySecret, DEFAULTS.RAZORPAY_KEY_SECRET)
  ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpaySecret })
  : null;

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const smtpTransport = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null;

function generateSubjectAnswer(prompt) {
  const p = String(prompt || '').toLowerCase();
  if (/algebra|equation|factor|fraction/.test(p)) {
    return '📘 **Maths Quick Help:**\n\n1. Identify the known values and unknown.\n2. Choose the correct rule or formula.\n3. Solve step by step and check the result.\n\n*Exam Tip:* Show every step clearly.';
  }
  if (/english|grammar|essay|comprehension/.test(p)) {
    return '📝 **English Quick Help:**\n\n- Grammar: revise tenses, subject-verb agreement and prepositions.\n- Writing: use introduction, body and conclusion.\n- Comprehension: read the passage carefully before answering.\n\n*Exam Tip:* Keep answers precise and well-spelled.';
  }
  if (/sst|social studies|history|geography|civics/.test(p)) {
    return '🌍 **Social Studies Quick Help:**\n\n- History: revise causes, events, dates and outcomes.\n- Geography: focus on maps, climate and resources.\n- Civics: connect rights, duties and institutions with examples.\n\n*Exam Tip:* Use headings and point-wise answers.';
  }
  if (/newton|motion|force/.test(p)) {
    return "💡 **Newton's Laws:**\n\n1. First Law: an object maintains its state unless a net external force acts.\n2. Second Law: **F = ma**.\n3. Third Law: every action has an equal and opposite reaction.\n\n*Exam Tip:* Draw free-body diagrams for numericals.";
  }
  if (/ohm|electric|voltage|current/.test(p)) {
    return "⚡ **Ohm's Law:**\n\nAt constant temperature, current is directly proportional to potential difference.\n\n**V = IR**\n\nResistance is measured in ohms (Ω).";
  }
  if (/photosynthesis|plant|chlorophyll/.test(p)) {
    return '🌱 **Photosynthesis:**\n\nPlants use light energy and chlorophyll to convert carbon dioxide and water into glucose and oxygen.\n\n**6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂**';
  }
  if (/acid|base|ph|salt/.test(p)) {
    return '🧪 **Acids, Bases & pH:**\n\n- Acids generally have pH < 7.\n- Neutral solutions have pH = 7.\n- Bases generally have pH > 7.\n\nRemember common salts such as baking soda, washing soda and plaster of Paris.';
  }
  return `🔬 **A2Z AI Tutor:**\n\nFor “${String(prompt).slice(0, 180)}”, start with the core definition, identify the relevant formula or concept, solve in small steps, and check the final answer.\n\n*Need a deeper explanation? Explore the Class 6–10 study resources.*`;
}

async function askOpenAI(prompt, model) {
  const key = env('OPENAI_API_KEY');
  if (!isConfigured(key, DEFAULTS.OPENAI_API_KEY)) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert CBSE/NCERT tutor for Classes 6–10. Give clear, concise, exam-focused answers for Science, Mathematics, SST and English. Use headings, steps, formulas and examples where helpful.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1000
    })
  });

  if (!response.ok) throw new Error(`OpenAI request failed (${response.status})`);
  const data = await response.json();
  return { answer: data.choices?.[0]?.message?.content || 'Unable to generate an answer.', model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini', usage: data.usage };
}

function bodyOf(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch (_) { return {}; }
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function createOrder(body) {
  const amount = Math.round((Number(body.amount) || (body.planId === 'pro_pass' ? 499 : 499)) * 100);
  if (!razorpay) {
    return { orderId: `order_mock_${Date.now().toString(36)}`, amount, currency: 'INR', key: DEFAULTS.RAZORPAY_KEY_ID, planId: body.planId || 'pro_pass', mockMode: true };
  }
  const order = await razorpay.orders.create({ amount, currency: 'INR', receipt: `receipt_${Date.now()}`, notes: { planId: body.planId || 'pro_pass', grade: String(body.grade || '10') } });
  return { orderId: order.id, amount: order.amount, currency: order.currency, key: razorpayKeyId, planId: body.planId || 'pro_pass', mockMode: false };
}

async function verifyPayment(body) {
  if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    throw new Error('Missing payment verification details');
  }
  if (!razorpay) return { success: true, mockMode: true, message: 'Mock payment verification approved. Configure Razorpay keys in Vercel for live payments.' };
  const expected = crypto.createHmac('sha256', razorpaySecret).update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`).digest('hex');
  if (expected !== body.razorpay_signature) throw new Error('Invalid Razorpay payment signature');
  return { success: true, mockMode: false, message: 'Payment verified successfully' };
}

async function sendReceipt(body) {
  if (!smtpTransport || !body.email) return false;
  await smtpTransport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: body.email,
    subject: `Payment Receipt — A2Z Learning Solutions`,
    text: `Hello ${body.name || 'Student'},\n\nYour payment for ${body.plan || 'Class Pro Pass'} was successful.\nAmount: ₹${Number(body.amount || 499).toFixed(2)}\n\nThank you for choosing A2Z Learning Solutions.`
  });
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Razorpay-Signature');
  if (req.method === 'OPTIONS') return res.end();

  const url = new URL(req.url || '/', 'http://localhost');
  const route = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const body = bodyOf(req);

  try {
    if (req.method === 'GET' && (route === '' || route === 'health')) {
      return send(res, 200, { status: 'ok', service: 'A2Z Learning Solutions API', runtime: 'Vercel Functions', timestamp: new Date().toISOString() });
    }

    if (req.method === 'GET' && route === 'content/blogs') {
      const blogs = [
        {
          _id: "blog1",
          title: "How to Prepare for Board Exams Effectively",
          description: "Discover scientifically proven study techniques, time management strategies, and the best revision methods to ace your Class 10 and 12 board exams.",
          thumbnail: "🎓",
          tags: ["Study Tips"],
          url: "/blog/how-to-study.html",
          createdAt: new Date().toISOString()
        },
        {
          _id: "blog2",
          title: "Time Management for Students",
          description: "Learn how to balance your schoolwork, competitive exam prep, and personal life using time-blocking and the Pomodoro technique.",
          thumbnail: "⏱️",
          tags: ["Productivity"],
          url: "/blog/time-management.html",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      return send(res, 200, blogs);
    }

    if (req.method === 'GET' && route === 'content/videos') {
      const videos = [
        {
          _id: "vid1",
          title: "Newton's Laws of Motion - Full Chapter Animation",
          grade: "9",
          tags: ["Physics"],
          url: "https://www.youtube.com/embed/kKKM8Y-u7ds?autoplay=1",
          youtubeId: "kKKM8Y-u7ds",
          duration: "12:45"
        },
        {
          _id: "vid2",
          title: "Chemical Reactions and Equations Class 10",
          grade: "10",
          tags: ["Chemistry"],
          url: "https://www.youtube.com/embed/2_N1v1gU6_A?autoplay=1",
          youtubeId: "2_N1v1gU6_A",
          duration: "25:30"
        },
        {
          _id: "vid3",
          title: "Cell: The Unit of Life - Class 11 Biology",
          grade: "11",
          tags: ["Biology"],
          url: "https://www.youtube.com/embed/5aC7hU0x8cI?autoplay=1",
          youtubeId: "5aC7hU0x8cI",
          duration: "18:10"
        }
      ];
      return send(res, 200, videos);
    }

    if (req.method === 'POST' && route === 'ask-ai') {
      if (!body.prompt) return send(res, 400, { error: 'Prompt is required' });
      try {
        const result = await askOpenAI(body.prompt, body.model);
        if (result) return send(res, 200, result);
      } catch (error) {
        console.warn('OpenAI unavailable:', error.message);
      }
      return send(res, 200, { answer: generateSubjectAnswer(body.prompt), model: 'A2Z Tutor Engine v3 (Fallback)' });
    }

    if (req.method === 'POST' && route === 'gemini') {
      if (!body.prompt) return send(res, 400, { error: 'Prompt is required' });
      const key = env('GEMINI_API_KEY');
      if (isConfigured(key, DEFAULTS.GEMINI_API_KEY)) {
        try {
          const apiUrl = `${env('GEMINI_API_URL')}?key=${encodeURIComponent(key)}`;
          const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: `You are an expert CBSE tutor for Class 6 to 10. Answer concisely and subject-aware: ${body.prompt}` }] }] }) });
          if (response.ok) return send(res, 200, await response.json());
        } catch (error) { console.warn('Gemini unavailable:', error.message); }
      }
      return send(res, 200, { answer: generateSubjectAnswer(body.prompt), model: 'A2Z Tutor Engine v3 (Fallback)' });
    }

    if (req.method === 'POST' && (route === 'create-order' || route === 'payments/create-order')) {
      return send(res, 200, await createOrder(body));
    }

    if (req.method === 'POST' && (route === 'verify-payment' || route === 'payments/verify')) {
      const result = await verifyPayment(body);
      if (result.success && body.email) {
        try { await sendReceipt(body); } catch (error) { console.warn('Receipt email failed:', error.message); }
      }
      return send(res, 200, result);
    }

    if (req.method === 'POST' && route === 'subscribe') {
      if (!body.name || !body.email || !body.grade) return send(res, 400, { error: 'Missing required fields' });
      const txnId = `TXN_${Date.now().toString(36).toUpperCase()}`;
      try { await sendReceipt({ ...body, txnId }); } catch (error) { console.warn('Receipt email failed:', error.message); }
      return send(res, 200, { success: true, txnId, plan: body.plan || 'Class Pro Pass', amount: Number(body.amount) || 499 });
    }

    if (req.method === 'POST' && route === 'razorpay-webhook') {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers['x-razorpay-signature'];
      if (!webhookSecret || !signature) return send(res, 400, { error: 'Webhook secret or signature is missing' });
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      const expected = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');
      if (expected !== signature) return send(res, 400, { error: 'Invalid Razorpay webhook signature' });
      return send(res, 200, { received: true });
    }

    return send(res, 404, { error: 'API route not found', route });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: error.message || 'Internal server error' });
  }
};
