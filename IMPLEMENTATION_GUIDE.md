# 🚀 Science Study Hub - Step-by-Step Implementation Guide

**For Developer:** Kuldeep Ohal  
**Generated:** 2026-08-14  
**Status:** Ready for Implementation

---

## 🔴 PHASE 1: SECURITY FIX (DO THIS FIRST - DAY 1)

### Issue: API Keys Exposed

**Current Problem:**
```
❌ .env file contains secrets
❌ .gitignore only has 3 items (missing .env)
❌ process.env visible in production logs
❌ API keys in git history (POTENTIAL)
```

### Action 1.1: Check Git History for Leaks
```bash
# Check if .env was ever committed
git log --all --full-history -- ".env" | head -20

# Search for API keys in history
git log -p | grep -i "RAZORPAY_KEY_SECRET\|OPENAI_API_KEY\|SMTP_PASS" | head -10

# If found, you must:
# 1. Use BFG Repo-Cleaner to remove from history
# 2. Immediately rotate all keys
# 3. Notify users if data was public
```

### Action 1.2: Fix .gitignore (IMMEDIATE)
**File:** `.gitignore`

Replace current content with:
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables (NEVER commit)
.env
.env.local
.env.*.local
.env.development
.env.test
.env.production

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Build
dist/
build/
.wrangler/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Secrets manager backups
*.backup
*.bak
```

**Commit this immediately:**
```bash
git add .gitignore
git commit -m "security: update .gitignore to exclude .env files"
git push
```

### Action 1.3: Rotate All API Keys (DO NOW)
```
1. RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET
   - Go to: https://dashboard.razorpay.com/app/settings/api-keys
   - Regenerate both keys
   - Update .env with new values
   
2. OPENAI_API_KEY
   - Go to: https://platform.openai.com/account/api-keys
   - Delete old key (if exposed)
   - Create new API key
   - Update .env with new value
   
3. SMTP_USER & SMTP_PASS
   - If using Gmail:
     - Create new App Password: https://myaccount.google.com/apppasswords
     - Delete old password
     - Update .env with new credentials
   - If using other provider: Check their dashboard

4. After rotation, verify nothing was committed:
   git log --all -p | grep -i "razorpay_key"  # Should show nothing
```

### Action 1.4: Validate .env Configuration
**File:** `.env` (should already exist)

```bash
# Add this validation function to server.js top

const requiredEnvVars = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'OPENAI_API_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please add them to .env file');
  process.exit(1);
}

console.log('✅ All required environment variables configured');
```

**What your .env should look like:**
```
# Razorpay (https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxx
RAZORPAY_MODE=test

# OpenAI (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Email (Gmail or your SMTP provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# Application
NODE_ENV=development
PORT=3000
```

---

## 🟠 PHASE 2: DATABASE & AUTHENTICATION (DAYS 2-4)

### Issue: No User System, Subscriptions in JSON

**Current Problem:**
```
❌ Subscriptions stored in subscriptions.json (not persistent)
❌ No user database
❌ No login/signup
❌ Query limits per-browser, not per-user
❌ Can't track student progress
```

### Decision: MongoDB vs PostgreSQL
**Recommendation: MongoDB** (simpler for this app)
- JSONB-friendly schema
- Faster initial setup
- Good for user profiles + subscription tracking
- Use: MongoDB Atlas (free tier for testing)

### Action 2.1: Set Up MongoDB Atlas

```
1. Create account: https://www.mongodb.com/cloud/atlas
2. Create free cluster:
   - Cluster name: "science-hub"
   - Provider: AWS
   - Region: ap-south-1 (India)
3. Create database user:
   - Username: scienceapp
   - Password: [Generate strong password]
4. Whitelist IP: 0.0.0.0/0 (for development, restrict in production)
5. Get connection string:
   - Should look like: mongodb+srv://scienceapp:password@cluster.mongodb.net/science_hub?retryWrites=true
6. Add to .env:
   MONGODB_URI=mongodb+srv://scienceapp:password@cluster.mongodb.net/science_hub
```

### Action 2.2: Install Database Dependencies

```bash
npm install mongoose bcryptjs jsonwebtoken
npm install --save-dev nodemon  # For auto-restart during dev

# Update package.json scripts:
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Action 2.3: Create Database Models

**Create new file:** `models/User.js`

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Identity
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  fullName: String,
  
  // Subscription
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'class-pro', 'all-access'],
      default: 'free'
    },
    expiryDate: Date,
    razorpayOrderId: String,
    razorpayPaymentId: String
  },
  
  // Profile
  classLevel: {
    type: Number,
    enum: [6, 7, 8, 9, 10]
  },
  subjects: [String], // ['physics', 'chemistry', 'biology']
  
  // AI Query Tracking
  aiQueries: {
    count: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    dailyLimit: { type: Number, default: 3 }
  },
  
  // Account
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: Date
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(plainPassword) {
  return await bcrypt.compare(plainPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
```

**Create new file:** `models/Subscription.js`

```javascript
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Pricing
  tier: {
    type: String,
    enum: ['free', 'class-pro', 'all-access'],
    required: true
  },
  priceINR: Number,
  
  // Payment
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Dates
  purchaseDate: { type: Date, default: Date.now },
  expiryDate: Date,
  autoRenew: { type: Boolean, default: true },
  
  // Features
  features: {
    aiQueriesPerDay: Number,
    classNotesAccess: Boolean,
    ncertSolutions: Boolean,
    videoTutorials: Boolean,
    practiceTests: Boolean
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
```

### Action 2.4: Create Authentication Endpoints

**Update file:** `server.js`

Add at top (after requires):
```javascript
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

Add authentication routes (BEFORE existing routes):
```javascript
// SIGNUP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, fullName, classLevel } = req.body;

    // Validate
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const user = new User({
      email,
      passwordHash: password,
      fullName,
      classLevel
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: { id: user._id, email: user.email, fullName: user.fullName }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET USER PROFILE (Protected route)
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      classLevel: user.classLevel,
      subscription: user.subscription,
      aiQueries: user.aiQueries
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});
```

### Action 2.5: Create Auth Pages

**Create file:** `login.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login | A2Z Learning Solutions</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .auth-container {
      max-width: 400px;
      margin: 80px auto;
      padding: 40px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #ffffff;
    }
    .auth-container h1 { margin-bottom: 30px; text-align: center; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 1rem;
    }
    .form-group input:focus {
      outline: none;
      border-color: var(--teal);
      box-shadow: 0 0 0 3px rgba(33, 176, 166, 0.1);
    }
    button {
      width: 100%;
      padding: 12px;
      background: var(--teal);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
    }
    button:hover { background: #1a9e8f; }
    .error { color: var(--coral); margin-top: 10px; }
    .auth-link { text-align: center; margin-top: 20px; }
    .auth-link a { color: var(--teal); text-decoration: none; }
  </style>
</head>
<body>
  <div class="auth-container">
    <h1>🔐 Login</h1>
    <form id="loginForm">
      <div class="form-group">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
      </div>
      <button type="submit">Login</button>
      <div id="error" class="error"></div>
    </form>
    <div class="auth-link">
      Don't have an account? <a href="signup.html">Sign up here</a>
    </div>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error');
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          // Save token to localStorage
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Redirect to dashboard
          window.location.href = '/dashboard.html';
        } else {
          errorDiv.textContent = data.error || 'Login failed';
        }
      } catch (error) {
        errorDiv.textContent = 'Network error: ' + error.message;
      }
    });
  </script>
</body>
</html>
```

**Create file:** `signup.html` (similar structure, different endpoint)

---

## 🟡 PHASE 3: COMPLETE PAYMENT & LEGAL (DAYS 5-6)

### Action 3.1: Complete Razorpay Webhook

**Add to server.js** (after Razorpay initialization):

```javascript
// Razorpay Webhook Handler
app.post('/api/razorpay-webhook', async (req, res) => {
  try {
    const crypto = require('crypto');
    const shasum = req.headers['x-razorpay-signature'];
    const body = req.body.toString();

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (shasum !== expectedSignature) {
      console.warn('❌ Webhook signature mismatch');
      return res.status(400).json({ error: 'Signature mismatch' });
    }

    const event = req.body;

    // Handle payment success
    if (event.event === 'payment.authorized' || event.event === 'payment.captured') {
      const { razorpay_payment_id, razorpay_order_id } = event.payload.payment.entity;
      
      // Update subscription in database
      const subscription = await Subscription.findOne({ razorpayOrderId: razorpay_order_id });
      if (subscription) {
        subscription.razorpayPaymentId = razorpay_payment_id;
        subscription.paymentStatus = 'completed';
        subscription.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        await subscription.save();

        // Update user subscription
        const user = await User.findById(subscription.userId);
        user.subscription = {
          tier: subscription.tier,
          expiryDate: subscription.expiryDate,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id
        };
        await user.save();

        // Send receipt email
        await sendSubscriptionReceipt(user, subscription);

        console.log('✅ Subscription activated for user:', user.email);
      }
    }

    // Handle payment failed
    if (event.event === 'payment.failed') {
      const { razorpay_order_id } = event.payload.payment.entity;
      
      const subscription = await Subscription.findOne({ razorpayOrderId: razorpay_order_id });
      if (subscription) {
        subscription.paymentStatus = 'failed';
        await subscription.save();
      }
    }

    res.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function to send receipt
async function sendSubscriptionReceipt(user, subscription) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: user.email,
    subject: `✅ Subscription Confirmed - A2Z Learning Solutions`,
    html: `
      <h2>Thank you for subscribing, ${user.fullName}!</h2>
      <p><strong>Subscription Tier:</strong> ${subscription.tier}</p>
      <p><strong>Amount Paid:</strong> ₹${subscription.priceINR}</p>
      <p><strong>Valid Until:</strong> ${new Date(subscription.expiryDate).toLocaleDateString('en-IN')}</p>
      <p><strong>Order ID:</strong> ${subscription.razorpayOrderId}</p>
      <hr>
      <p>You can now access all premium features. Start learning with our AI Doubt Solver!</p>
      <p><a href="https://yourdomain.com/dashboard">Go to Dashboard</a></p>
    `
  };

  return smtpTransport.sendMail(mailOptions);
}
```

### Action 3.2: Create Legal Pages

**Create file:** `privacy-policy.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy | A2Z Learning Solutions</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .legal-container {
      max-width: 900px;
      margin: 40px auto;
      padding: 40px;
      line-height: 1.8;
    }
    .legal-container h1 { margin-bottom: 30px; }
    .legal-container h2 { margin-top: 30px; margin-bottom: 15px; color: var(--navy); }
    .legal-container p { margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="legal-container">
    <h1>🔒 Privacy Policy</h1>
    <p><strong>Last Updated:</strong> 2026-08-14</p>

    <h2>1. Data We Collect</h2>
    <p>We collect the following information when you use our services:</p>
    <ul>
      <li><strong>Account Information:</strong> Email, name, class level, and subjects</li>
      <li><strong>Usage Data:</strong> Questions asked, answers viewed, time spent on pages</li>
      <li><strong>Device Data:</strong> IP address, browser type, device information (via Google Analytics)</li>
      <li><strong>Payment Data:</strong> Transaction details (processed securely via Razorpay)</li>
    </ul>

    <h2>2. How We Use Your Data</h2>
    <ul>
      <li>To provide and improve our services</li>
      <li>To send you subscription confirmations and receipts</li>
      <li>To track usage for analytics and optimization</li>
      <li>To comply with legal obligations</li>
      <li>To prevent fraud and abuse</li>
    </ul>

    <h2>3. Data Sharing</h2>
    <p>We do NOT sell your data. We only share data with:</p>
    <ul>
      <li><strong>Razorpay:</strong> For payment processing (subject to their privacy policy)</li>
      <li><strong>Google Analytics:</strong> For usage analytics (anonymized)</li>
      <li><strong>OpenAI:</strong> Your questions (used only to generate answers, not to train models with GPT-3.5)</li>
      <li><strong>Email Providers:</strong> To send transactional emails</li>
    </ul>

    <h2>4. Data Security</h2>
    <p>We use industry-standard encryption (HTTPS, bcrypt hashing) to protect your data.</p>

    <h2>5. Your Rights</h2>
    <p>You can request to:</p>
    <ul>
      <li>Access your personal data</li>
      <li>Delete your account and all associated data</li>
      <li>Opt-out of analytics tracking</li>
    </ul>

    <h2>6. Contact Us</h2>
    <p>For privacy concerns, email us at: <strong>privacy@a2zlearning.com</strong></p>
  </div>
</body>
</html>
```

**Create file:** `terms-conditions.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms & Conditions | A2Z Learning Solutions</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .legal-container {
      max-width: 900px;
      margin: 40px auto;
      padding: 40px;
      line-height: 1.8;
    }
    .legal-container h1 { margin-bottom: 30px; }
    .legal-container h2 { margin-top: 30px; margin-bottom: 15px; color: var(--navy); }
  </style>
</head>
<body>
  <div class="legal-container">
    <h1>⚖️ Terms & Conditions</h1>
    <p><strong>Last Updated:</strong> 2026-08-14</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By using A2Z Learning Solutions, you agree to these terms and our Privacy Policy.</p>

    <h2>2. User Responsibilities</h2>
    <ul>
      <li>You are responsible for maintaining your account security</li>
      <li>You agree not to share your login credentials</li>
      <li>You must be at least 13 years old (parental consent required if under 18)</li>
      <li>You agree not to abuse our AI service (spam, harassment, illegal content)</li>
    </ul>

    <h2>3. Intellectual Property</h2>
    <p>All content on our platform (notes, solutions, diagrams) is owned by A2Z Learning Solutions or licensed from NCERT. You may use it for personal study only, not for commercial purposes.</p>

    <h2>4. Subscription Terms</h2>
    <ul>
      <li><strong>Billing:</strong> Subscriptions renew automatically on expiry</li>
      <li><strong>Cancellation:</strong> You can cancel anytime from your dashboard</li>
      <li><strong>Refunds:</strong> See our Refund Policy below</li>
      <li><strong>Price Changes:</strong> We may change prices with 30 days' notice</li>
    </ul>

    <h2>5. Refund Policy</h2>
    <ul>
      <li>Refunds available within 7 days of purchase for unused subscriptions</li>
      <li>If you've used 50%+ of the features, refund eligibility is at our discretion</li>
      <li>Refund requests should be sent to: refunds@a2zlearning.com</li>
      <li>Refunds are processed within 5-7 business days</li>
    </ul>

    <h2>6. Limitation of Liability</h2>
    <p>Our service is provided "as-is". We are not liable for:</p>
    <ul>
      <li>Incorrect AI answers (always verify with textbooks)</li>
      <li>Service downtime or data loss</li>
      <li>Third-party payment processor errors</li>
    </ul>

    <h2>7. Prohibited Activities</h2>
    <p>You agree NOT to:</p>
    <ul>
      <li>Hack or attempt to access unauthorized areas</li>
      <li>Scrape or automate content extraction</li>
      <li>Use the service for commercial tutoring without permission</li>
      <li>Resell access to other users</li>
      <li>Submit copyrighted solutions without attribution</li>
    </ul>

    <h2>8. Contact & Dispute Resolution</h2>
    <p>For disputes, contact us first at: <strong>support@a2zlearning.com</strong></p>
    <p>Disputes will be governed by Indian law and resolved through arbitration if needed.</p>
  </div>
</body>
</html>
```

**Create file:** `refund-policy.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Policy | A2Z Learning Solutions</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .legal-container {
      max-width: 900px;
      margin: 40px auto;
      padding: 40px;
      line-height: 1.8;
    }
    .legal-container h1 { margin-bottom: 30px; }
    .legal-container h2 { margin-top: 30px; margin-bottom: 15px; color: var(--navy); }
    .highlight {
      background: #fffbea;
      padding: 15px;
      border-left: 4px solid var(--amber);
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="legal-container">
    <h1>💰 Refund & Cancellation Policy</h1>
    <p><strong>Last Updated:</strong> 2026-08-14</p>

    <div class="highlight">
      <strong>Quick Summary:</strong> 7-day money-back guarantee for unused subscriptions. After 7 days or 50% usage, refunds are at our discretion.
    </div>

    <h2>1. Refund Eligibility</h2>
    <p><strong>✅ ELIGIBLE FOR REFUND:</strong></p>
    <ul>
      <li>Purchased within the last 7 calendar days</li>
      <li>Used less than 50% of subscription features</li>
      <li>No content downloaded or printed</li>
      <li>Requested via email to: refunds@a2zlearning.com</li>
    </ul>

    <p><strong>❌ NOT ELIGIBLE FOR REFUND:</strong></p>
    <ul>
      <li>Purchased more than 7 days ago</li>
      <li>Features used 50% or more (e.g., 5+ AI questions asked, multiple chapters viewed)</li>
      <li>Free trial conversions (no refund for free accounts)</li>
      <li>Refund requests initiated more than 7 days after purchase</li>
      <li>Subscription purchased with promotional codes (unless code terms specify otherwise)</li>
    </ul>

    <h2>2. How to Request a Refund</h2>
    <ol>
      <li>Send email to: <strong>refunds@a2zlearning.com</strong></li>
      <li>Include:
        <ul>
          <li>Your email address</li>
          <li>Order ID (from receipt)</li>
          <li>Reason for refund</li>
          <li>Screenshots if reporting technical issues</li>
        </ul>
      </li>
      <li>We will verify your eligibility within 24 hours</li>
      <li>If approved, refund will be processed within 5-7 business days</li>
    </ol>

    <h2>3. Cancellation (Without Refund)</h2>
    <p>You can cancel your subscription anytime from your <strong>Dashboard → Billing</strong>:</p>
    <ul>
      <li>Cancellation is immediate</li>
      <li>You'll lose access to premium features at next billing cycle</li>
      <li>No refund for remaining time (unless within 7-day window)</li>
      <li>Your data is preserved for 30 days after cancellation</li>
    </ul>

    <h2>4. Refund Method</h2>
    <p>Refunds are issued to the original payment method:</p>
    <ul>
      <li><strong>Credit/Debit Cards:</strong> Refund appears in 5-7 business days</li>
      <li><strong>Digital Wallets:</strong> Refund appears in 2-3 business days</li>
      <li><strong>Bank Transfers:</strong> Refund appears in 5-7 business days</li>
    </ul>

    <div class="highlight">
      <strong>⚠️ Note:</strong> Razorpay processes all refunds. Check your payment method provider if refund is delayed.
    </div>

    <h2>5. Exceptions</h2>
    <p>We may deny refund requests if we detect:</p>
    <ul>
      <li>Abuse of refund system (multiple refunds on same card)</li>
      <li>Fraudulent activity</li>
      <li>Account restrictions due to ToS violations</li>
    </ul>

    <h2>6. Issues Not Covered</h2>
    <p>We are NOT responsible for:</p>
    <ul>
      <li>Refunds due to accidental purchases (use cancellation instead)</li>
      <li>Incorrect billing (contact payment provider)</li>
      <li>Third-party payment processor issues</li>
    </ul>

    <h2>7. Contact Support</h2>
    <p>Questions about our refund policy?</p>
    <ul>
      <li>📧 Email: support@a2zlearning.com</li>
      <li>🆘 Refund Issues: refunds@a2zlearning.com</li>
    </ul>
  </div>
</body>
</html>
```

### Action 3.3: Update Footer Links

Add to all HTML pages (in footer):
```html
<footer style="background: #f6f5f0; padding: 40px 24px; border-top: 1px solid var(--line); margin-top: 60px;">
  <div style="max-width: 1100px; margin: 0 auto;">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; margin-bottom: 30px;">
      <div>
        <h4>A2Z Learning</h4>
        <p>AI-powered CBSE Science learning for Class 6-10 students.</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <ul style="list-style: none; padding: 0;">
          <li><a href="/">Home</a></li>
          <li><a href="/subscription.html">Pricing</a></li>
          <li><a href="/doubt-solver.html">Doubt Solver</a></li>
          <li><a href="/notes/">Study Notes</a></li>
        </ul>
      </div>
      <div>
        <h4>Legal</h4>
        <ul style="list-style: none; padding: 0;">
          <li><a href="/privacy-policy.html">Privacy Policy</a></li>
          <li><a href="/terms-conditions.html">Terms & Conditions</a></li>
          <li><a href="/refund-policy.html">Refund Policy</a></li>
          <li><a href="mailto:support@a2zlearning.com">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Support</h4>
        <ul style="list-style: none; padding: 0;">
          <li>📧 support@a2zlearning.com</li>
          <li>💰 Refunds: refunds@a2zlearning.com</li>
          <li>🔒 Security: security@a2zlearning.com</li>
        </ul>
      </div>
    </div>
    <div style="border-top: 1px solid var(--line); padding-top: 20px; text-align: center; color: var(--ink-soft);">
      <p>&copy; 2026 A2Z Learning Solutions. All rights reserved.</p>
    </div>
  </div>
</footer>
```

---

## 🟢 NEXT PHASES: QUICK START

**Phase 4-5** (Error Handling, Content, Analytics) are detailed in [LAUNCH_FIXES_PLAN.md](LAUNCH_FIXES_PLAN.md).

---

## ✅ IMMEDIATE CHECKLIST (Next 24 Hours)

- [ ] Rotate all API keys (Razorpay, OpenAI, SMTP)
- [ ] Fix .gitignore and commit
- [ ] Check git history for leaks
- [ ] Set up MongoDB Atlas free cluster
- [ ] Install mongoose and dependencies
- [ ] Create User model
- [ ] Test signup/login endpoints locally

---

**Questions?** Review the `.md` files in workspace for detailed reference.
