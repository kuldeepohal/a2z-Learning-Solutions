require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const connectDB = require('./backend/db');
const User = require('./backend/models/User');
const Content = require('./backend/models/Content');
const { protect } = require('./backend/middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Connect to database
connectDB();

let Razorpay = null;
try {
  Razorpay = require('razorpay');
} catch (e) {
  console.warn('Razorpay SDK not installed yet. Run npm install razorpay');
}

const app = express();
const hasRazorpayConfig = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const isRazorpayLive = String(process.env.RAZORPAY_MODE || 'test').toLowerCase() === 'live';
const razorpay = hasRazorpayConfig && Razorpay ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
}) : null;

const smtpConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const smtpTransport = smtpConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

// Try loading compression middleware for Gzip/Brotli
try {
  const compression = require('compression');
  app.use(compression());
} catch (e) {
  console.log('Compression middleware optional: not installed');
}

app.use('/api/razorpay-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Serve static site files with 1-day browser cache header for high performance
app.use(express.static(path.join(__dirname), {
  maxAge: '1d',
  etag: true
}));

// Intelligent subject-aware tutor response fallback for demo mode
function generateSubjectAnswer(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('algebra') || p.includes('equation') || p.includes('factor') || p.includes('fraction')) {
    return "📘 **Maths Quick Help:**\n\n1. Identify the given values and the unknown.\n2. Choose the correct rule or formula.\n3. Solve step by step and check units or signs.\n\n*Exam Tip:* Write every step clearly so you can earn method marks.";
  } else if (p.includes('english') || p.includes('grammar') || p.includes('essay') || p.includes('comprehension')) {
    return "📝 **English Quick Help:**\n\n- **Grammar:** focus on subject-verb agreement, tenses, and prepositions.\n- **Writing:** use a clear structure with introduction, body, and conclusion.\n- **Comprehension:** read the passage twice before answering.\n\n*Exam Tip:* Keep answers short, precise, and well-spelled.";
  } else if (p.includes('sst') || p.includes('social studies') || p.includes('history') || p.includes('geography') || p.includes('civics')) {
    return "🌍 **Social Studies Quick Help:**\n\n- **History:** remember dates, causes, events, and outcomes.\n- **Geography:** revise maps, climate, resources, and key terms.\n- **Civics:** link rights, duties, and institutions with daily life.\n\n*Exam Tip:* Use headings and point-wise answers for full marks.";
  } else if (p.includes('newton') || p.includes('motion') || p.includes('force')) {
    return "💡 **Newton's Laws of Motion Summary:**\n\n1. **First Law (Inertia):** An object remains at rest or in uniform motion unless acted upon by an external net force.\n2. **Second Law ($F = ma$):** Force equals mass times acceleration.\n3. **Third Law:** For every action, there is an equal and opposite reaction.\n\n*Exam Tip:* Practice drawing free-body diagrams for Class 9 & 10 physics numericals!";
  } else if (p.includes('ohm') || p.includes('electric') || p.includes('voltage') || p.includes('current')) {
    return "⚡ **Ohm's Law ($V = IR$):**\n\nAt constant temperature, the current ($I$) flowing through a conductor is directly proportional to the potential difference ($V$) across its ends.\n\n- **Formula:** $V = I \\times R$\n- **Unit of Resistance ($R$):** Ohm ($\\Omega$)\n\n*Graph Tip:* The V-I graph is always a straight line passing through the origin!";
  } else if (p.includes('photosynthesis') || p.includes('plant') || p.includes('chlorophyll')) {
    return "🌱 **Photosynthesis Reaction:**\n\n$$6CO_2 + 6H_2O \\xrightarrow[chlorophyll]{sunlight} C_6H_{12}O_6 + 6O_2$$\n\n**3 Key Steps to Remember for Class 10 Board Exam:**\n1. Absorption of light energy by chlorophyll.\n2. Conversion of light energy to chemical energy and splitting of water molecules.\n3. Reduction of Carbon Dioxide to Carbohydrates.";
  } else if (p.includes('acid') || p.includes('base') || p.includes('ph') || p.includes('salt')) {
    return "🧪 **Acids, Bases & pH Scale:**\n\n- **Acids:** Turn blue litmus paper red ($pH < 7$), release $H^+$ ions in aqueous solution.\n- **Bases:** Turn red litmus paper blue ($pH > 7$), release $OH^-$ ions.\n- **Neutral:** $pH = 7$ (e.g. Pure Water).\n\n*Important Salts:* Baking Soda ($NaHCO_3$), Washing Soda ($Na_2CO_3 \\cdot 10H_2O$), Plaster of Paris ($CaSO_4 \\cdot \\frac{1}{2}H_2O$).";
  } else {
    return `🔬 **A2Z AI Tutor Response:**\n\nGreat question regarding: *"${prompt}"*\n\nHere is the key CBSE NCERT concept breakdown:\n• Focus on core definitions and SI units.\n• Practice drawing neat, labeled diagrams for science topics.\n• Maintain formula and definition revision flashcards before your final board exams.\n\n*Need a deeper chapter breakdown? Check out our Class 6 to 10 Notes!*`;
  }
}

// AI Doubt Solver API endpoint - OpenAI GPT
app.post('/api/ask-ai', async (req, res) => {
  try {
    const { prompt, model = 'gpt-3.5-turbo' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to local subject-aware response
      const answer = generateSubjectAnswer(prompt);
      return res.json({ answer, model: 'A2Z Tutor Engine v2 (Local)' });
    }

    try {
      const systemPrompt = `You are an expert CBSE tutor specializing in Class 6-10 NCERT curriculum. 
Your role is to provide clear, concise, and exam-focused answers across Science, Mathematics, SST, and English.
- Format answers with proper headings and bullet points where applicable.
- Include relevant formulas, diagram descriptions, writing tips, and exam tips.
- Keep explanations CBSE/NCERT aligned.
- For complex topics, break down into simple steps.
- Always mention the chapter/unit when relevant.`;

      const payload = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      };

      const apiResp = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const answer = apiResp.data.choices[0]?.message?.content || 'Unable to generate answer';
      return res.json({ 
        answer, 
        model: model,
        usage: apiResp.data.usage 
      });
    } catch (apiErr) {
      console.error('OpenAI API Error:', apiErr.response?.data || apiErr.message);
      // Fallback to local AI Science response
      const answer = generateSubjectAnswer(prompt);
      return res.json({ 
        answer, 
        model: 'A2Z Science AI Engine v2 (Fallback)',
        warning: 'OpenAI API unavailable, using local AI response'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy Gemini endpoint (kept for backward compatibility)
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // If API key is configured, call official Gemini endpoint
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_URL) {
      try {
        const payload = {
          contents: [{ parts: [{ text: `You are an expert CBSE tutor for Class 6 to 10. Answer concisely and stay subject-aware: ${prompt}` }] }]
        };
        const apiResp = await axios.post(process.env.GEMINI_API_URL, payload, {
          headers: {
            'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });
        return res.json(apiResp.data);
      } catch (apiErr) {
        console.warn('Gemini API call failed, switching to local AI Science response generator');
      }
    }

    // Smart subject-aware fallback
    const answer = generateSubjectAnswer(prompt);
    res.json({ answer, model: 'A2Z Tutor Engine v2' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Order endpoint
app.post('/api/create-order', async (req, res) => {
  try {
    const { planId, amount, grade } = req.body;
    const orderAmount = Number(amount) || 499;
    const normalizedAmount = Math.round(orderAmount * 100);

    if (!razorpay) {
      const orderId = 'order_' + Math.random().toString(36).substring(2, 10);
      return res.json({
        orderId,
        amount: normalizedAmount,
        currency: 'INR',
        key: 'rzp_test_mockKey123',
        planId: planId || 'pro_pass',
        mockMode: true
      });
    }

    const order = await razorpay.orders.create({
      amount: normalizedAmount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId: planId || 'pro_pass',
        grade: String(grade || '10')
      }
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      planId: planId || 'pro_pass'
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create Razorpay order' });
  }
});

// Payment verification endpoint
app.post('/api/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      email,
      grade,
      plan,
      amount
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.json({ success: true, message: 'Mock payment verification approved for local testing' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid Razorpay payment signature' });
    }

    const txnData = {
      name,
      email,
      grade,
      plan,
      amount
    };

    const entry = await saveSubscription(txnData);
    return res.json({ success: true, txnId: entry.id, plan: entry.plan, amount: entry.amount });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

app.post('/api/razorpay-webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    if (!webhookSecret) {
      return res.status(400).json({ error: 'Webhook secret is not configured' });
    }

    if (!body || !signature) {
      return res.status(400).json({ error: 'Missing webhook payload or signature' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid Razorpay webhook signature' });
    }

    const payload = JSON.parse(body.toString('utf8'));
    if (payload.event !== 'payment.captured') {
      return res.json({ received: true, status: payload.event || 'ignored' });
    }

    const payment = payload.payload && payload.payload.payment ? payload.payload.payment : null;
    if (!payment) {
      return res.status(400).json({ error: 'No payment payload present' });
    }

    const notes = payment.notes || {};
    const name = notes.customerName || 'A2Z Student';
    const email = notes.customerEmail || 'customer@example.com';
    const grade = notes.grade || '10';
    const plan = notes.plan || 'Class Pro Pass';
    const amount = Number(payment.entity?.amount || payment.amount || 49900) / 100;

    await saveSubscription({
      name,
      email,
      grade,
      plan,
      amount
    });

    res.json({ received: true, status: 'payment.captured' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
});

// Subscription endpoint
const subsFile = path.join(__dirname, 'subscriptions.json');

async function sendPaymentReceipt({ name, email, plan, amount, txnId }) {
  if (!smtpTransport || !email) return;

  const subject = `Payment Receipt for ${plan} — A2Z Learning Solutions`;
  const text = [
    `Hello ${name},`,
    '',
    `Your payment for ${plan} was successful.`,
    `Transaction ID: ${txnId}`,
    `Amount Paid: ₹${Number(amount).toFixed(2)}`,
    '',
    'Thank you for choosing A2Z Learning Solutions.',
    'You now have access to your selected course materials and support.'
  ].join('\n');

  await smtpTransport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text
  });
}

async function saveSubscription({ name, email, grade, plan, amount }) {
  const txnId = 'TXN_' + Date.now().toString(36).toUpperCase();
  const entry = {
    id: txnId,
    name,
    email,
    grade,
    plan: plan || 'Class Pro Pass',
    amount: Number(amount) || 499,
    status: 'SUCCESS',
    createdAt: new Date().toISOString()
  };

  let subs = [];
  try {
    if (fs.existsSync(subsFile)) subs = JSON.parse(fs.readFileSync(subsFile, 'utf8') || '[]');
  } catch (e) {
    subs = [];
  }

  subs.push(entry);
  fs.writeFileSync(subsFile, JSON.stringify(subs, null, 2), 'utf8');

  try {
    await sendPaymentReceipt({
      name: entry.name,
      email: entry.email,
      plan: entry.plan,
      amount: entry.amount,
      txnId: entry.id
    });
  } catch (mailErr) {
    console.warn('Payment receipt email failed to send:', mailErr.message);
  }

  return entry;
}

app.post('/subscribe', async (req, res) => {
  try {
    const { name, email, grade, plan, amount } = req.body;
    if (!name || !email || !grade) return res.status(400).json({ error: 'Missing required fields' });

    const entry = await saveSubscription({ name, email, grade, plan, amount });
    res.json({ success: true, txnId: entry.id, plan: entry.plan, amount: entry.amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// USER & AUTHENTICATION ENDPOINTS (Phase 1)
// -------------------------------------------------------------

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(500).json({ error: 'Database connection not established. Please configure MONGO_URI in Vercel settings.' });
    }
    const { name, email, password, grade } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({ name, email, password, grade });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(500).json({ error: 'Database connection not established. Please configure MONGO_URI in Vercel settings.' });
    }
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile endpoint
app.get('/api/user/profile', protect, async (req, res) => {
  if (require('mongoose').connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database connection not established.' });
  }
  const user = await User.findById(req.user._id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// -------------------------------------------------------------
// CMS CONTENT ENDPOINTS (Phase 1)
// -------------------------------------------------------------
app.get('/api/content/blogs', async (req, res) => {
  try {
    const blogs = await Content.find({ type: 'blog' }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/content/videos', async (req, res) => {
  try {
    const videos = await Content.find({ type: 'video' }).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// TEST SERIES PORTAL ENDPOINTS (Day 10)
// -------------------------------------------------------------
app.post('/api/tests/submit', async (req, res) => {
  try {
    const { testId, answers } = req.body;
    if (!testId || !answers) {
      return res.status(400).json({ error: 'Missing testId or answers' });
    }

    const testFile = path.join(__dirname, 'backend', 'mock_tests.json');
    if (!fs.existsSync(testFile)) {
      return res.status(404).json({ error: 'Tests database not found' });
    }

    const testDb = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    const testData = testDb[testId];
    if (!testData) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const correctAnswers = testData.answers;
    let score = 0;
    const total = Object.keys(correctAnswers).length;
    const feedback = {};

    for (let q in correctAnswers) {
      if (answers[q] === correctAnswers[q]) {
        score++;
        feedback[q] = { correct: true, answer: correctAnswers[q] };
      } else {
        feedback[q] = { correct: false, answer: correctAnswers[q] };
      }
    }

    res.json({
      success: true,
      score,
      total,
      feedback,
      message: score === total ? 'Perfect score! Outstanding!' : (score >= total / 2 ? 'Good job! Review the ones you missed.' : 'Keep practicing. You will get there!')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 A2Z Learning Solutions Server running on http://localhost:${PORT}`);
    console.log(`Razorpay: ${hasRazorpayConfig ? (isRazorpayLive ? 'LIVE' : 'TEST') : 'NOT CONFIGURED'}`);
    console.log(`Email receipts: ${smtpConfigured ? 'ENABLED' : 'DISABLED'}`);
  });
}

module.exports = app;
