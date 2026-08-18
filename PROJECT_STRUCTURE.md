# 📂 Project Structure & Implementation Guide

**This file shows where to create new files and what to modify**

---

## Current Project Structure

```
Science_Study_Hub/
├── 📄 QUICK_START.md                    ← START HERE (5 min read)
├── 📄 READINESS_ASSESSMENT.md           ← Overview of all issues
├── 📄 LAUNCH_FIXES_PLAN.md              ← Detailed plan for each issue
├── 📄 IMPLEMENTATION_GUIDE.md           ← Code examples & tutorials
├── 📄 SECURITY_AUDIT.md                 ← Pre-launch security checklist
├── 📄 PROJECT_STRUCTURE.md              ← This file
│
├── 🔧 Configuration Files
│   ├── package.json                     ← Dependencies list
│   ├── .env                             ← API keys (NEVER COMMIT)
│   ├── .env.example                     ← Template for .env
│   ├── .gitignore                       ← Files to exclude from git
│   └── .git/                            ← Git repository
│
├── 🖥️  Server Files
│   └── server.js                        ← Express server (NEEDS UPDATE)
│
├── 🌐 Frontend - Main Site
│   ├── index.html                       ← Home page
│   ├── subscription.html                ← Pricing page
│   ├── doubt-solver.html                ← AI chatbot page
│   ├── script.js                        ← Frontend JavaScript (NEEDS UPDATE)
│   ├── style.css                        ← Styles
│   └── images/                          ← Images folder
│
├── 📚 Study Notes
│   └── notes/
│       ├── class6.html
│       ├── class7.html
│       ├── class8.html
│       ├── class9.html
│       └── class10.html
│
├── 📁 Media Folders
│   ├── pdf/                             ← PDFs to download
│   └── videos/                          ← Video files
│
├── 🌩️  Cloudflare Deployment
│   └── cloudflare-site/                 ← Copy of site for Cloudflare
│       ├── index.html
│       ├── script.js
│       ├── server.js
│       ├── style.css
│       ├── subscription.html
│       ├── images/
│       ├── notes/
│       ├── pdf/
│       └── videos/
│
└── 🚫 Ignored Folders
    ├── node_modules/                    ← npm packages (not in git)
    ├── .wrangler/                       ← Cloudflare build output
    └── .env                             ← Environment secrets (not in git)
```

---

## 📝 Files to Modify (Existing)

### 1. `.gitignore` (FIX IMMEDIATELY)
**Current:** Incomplete  
**Action:** Update to include all secrets files

```
# Before (INSECURE)
node_modules/
.env
.wrangler/

# After (SECURE)
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

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
dist/
build/
.wrangler/

# Optional
.npm
.eslintcache
*.backup
*.bak
```

---

### 2. `server.js` (ADD SECTIONS)
**Current:** Has AI endpoint, needs auth + database  
**Updates:**

```javascript
// ADD AT TOP (after requires)
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {...});

// Middleware
const authenticateToken = (req, res, next) => {...};

// NEW ROUTES TO ADD (before existing routes)
app.post('/api/auth/signup', async (req, res) => {...});
app.post('/api/auth/login', async (req, res) => {...});
app.get('/api/auth/profile', authenticateToken, async (req, res) => {...});

// UPDATE EXISTING ROUTE
app.post('/api/razorpay-webhook', async (req, res) => {
  // ADD: Signature verification
  // ADD: Update database on payment
  // ADD: Send receipt email
});
```

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for full code

---

### 3. `package.json` (ADD DEPENDENCIES)
**Current:**
```json
{
  "dependencies": {
    "axios": "^1.19.0",
    "compression": "^1.8.1",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "nodemailer": "^7.0.0",
    "razorpay": "^2.9.5"
  }
}
```

**Add to dependencies:**
```json
{
  "dependencies": {
    "mongoose": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "pdfkit": "^0.13.0"  // For PDF generation
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

**Update scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

---

### 4. `script.js` (UPDATE AI QUERY TRACKING)
**Current Issue:** Query limit tracked in localStorage (browser), not per-user

**Needed Update:**
```javascript
// Before: 
function trackAIQuery() {
  const count = localStorage.getItem('aiQueryCount') || 0;
  localStorage.setItem('aiQueryCount', parseInt(count) + 1);
}

// After: Move to server-side
async function trackAIQuery() {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/user/track-query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

---

## 📄 Files to Create (New)

### 1. **Database Models** (Create `models/` folder)

#### `models/User.js`
```
Purpose: Define user schema (email, password, subscription, profile)
Size: ~80 lines
Dependencies: mongoose, bcryptjs
See: IMPLEMENTATION_GUIDE.md - Action 2.3
```

#### `models/Subscription.js`
```
Purpose: Define subscription schema (tier, payment details, expiry)
Size: ~50 lines
Dependencies: mongoose
See: IMPLEMENTATION_GUIDE.md - Action 2.3
```

#### `models/Transaction.js` (Optional)
```
Purpose: Log all payments for audit trail
Size: ~40 lines
Dependencies: mongoose
```

---

### 2. **Authentication Pages**

#### `login.html`
```
Purpose: Email + password login form
Size: ~200 lines
Features:
  - Email validation
  - Password input (masked)
  - "Forgot password?" link
  - "Sign up" link
  - Error message display
  - Loading state
See: IMPLEMENTATION_GUIDE.md - Action 2.5
```

#### `signup.html`
```
Purpose: Email + password registration form
Size: ~250 lines
Features:
  - Full name input
  - Email validation
  - Password strength checker
  - Class level selection (6-10)
  - Terms & Conditions checkbox
  - Loading state
  - Email verification
See: IMPLEMENTATION_GUIDE.md - Action 2.5
```

#### `dashboard.html` (User Dashboard)
```
Purpose: Show user profile, subscription status, usage
Size: ~300 lines
Features:
  - Profile section (name, email, class)
  - Subscription status (tier, expiry date)
  - AI query usage (X/10 per day)
  - Upgrade button
  - Cancel subscription option
  - Logout button
  - Edit profile button
```

#### `forgot-password.html`
```
Purpose: Email recovery flow
Size: ~150 lines
Features:
  - Email input
  - "Send reset link" button
  - Success message
  - Resend option
```

#### `reset-password.html`
```
Purpose: Change password with token
Size: ~150 lines
Features:
  - New password input
  - Confirm password input
  - Strength indicator
  - Submit button
```

---

### 3. **Legal Pages**

#### `privacy-policy.html`
```
Purpose: Privacy & data protection disclosure
Size: ~200 lines
Sections:
  - Data collection
  - Data usage
  - Data sharing (Razorpay, OpenAI, GA)
  - Security measures
  - User rights
  - Contact info
See: IMPLEMENTATION_GUIDE.md - Action 3.2
```

#### `terms-conditions.html`
```
Purpose: Terms of service
Size: ~250 lines
Sections:
  - Acceptance of terms
  - User responsibilities
  - Intellectual property
  - Subscription terms
  - Refund policy
  - Limitation of liability
  - Prohibited activities
See: IMPLEMENTATION_GUIDE.md - Action 3.2
```

#### `refund-policy.html`
```
Purpose: Clear refund & cancellation policy
Size: ~200 lines
Sections:
  - Eligibility criteria
  - How to request
  - Cancellation process
  - Refund timeline
  - Method of refund
  - Exceptions
See: IMPLEMENTATION_GUIDE.md - Action 3.2
```

---

### 4. **Other Pages**

#### `contact-us.html`
```
Purpose: Customer support contact page
Size: ~150 lines
Features:
  - Email form
  - Phone number
  - FAQ section
  - Support email links
```

#### `pdf-lead-magnet.html` (Optional)
```
Purpose: Landing page for PDF download
Size: ~200 lines
Features:
  - Email capture form
  - Preview of PDF
  - Auto-send after signup
  - Redirect to dashboard
```

---

## 🗂️ Folder Structure to Create

```
models/
├── User.js
├── Subscription.js
├── Transaction.js
└── index.js (export all models)

controllers/ (Optional, for organization)
├── authController.js
├── paymentController.js
└── userController.js

middleware/ (Optional)
├── auth.js (authenticateToken)
├── errorHandler.js
└── logger.js

utils/ (Optional)
├── validators.js
├── emailService.js
└── pdfGenerator.js
```

---

## 📋 Implementation Order

### **Phase 1: Foundation** (Days 1)
1. ✅ Update `.gitignore`
2. ✅ Rotate API keys
3. ✅ Add to `package.json` dependencies
4. ✅ Install: `npm install mongoose bcryptjs jsonwebtoken pdfkit`

### **Phase 2: Database & Auth** (Days 2-4)
1. Create `models/User.js`
2. Create `models/Subscription.js`
3. Update `server.js` with auth routes
4. Create `login.html`
5. Create `signup.html`
6. Create `dashboard.html`
7. Test locally

### **Phase 3: Payment & Legal** (Days 5-6)
1. Complete Razorpay webhook in `server.js`
2. Create `privacy-policy.html`
3. Create `terms-conditions.html`
4. Create `refund-policy.html`
5. Update footer on all pages with links
6. Create `contact-us.html`

### **Phase 4: UX & Content** (Days 7-9)
1. Implement error handling in `server.js`
2. Add loading states in HTML
3. Create PDF generation in `utils/pdfGenerator.js`
4. Update `script.js` for server-side query tracking
5. Audit and complete `notes/*.html` content

### **Phase 5: Monitoring** (Day 10)
1. Add Google Analytics to all HTML files
2. Set up Sentry error tracking
3. Create monitoring dashboard

---

## 🔑 Environment Variables (.env)

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/science_hub

# Authentication
JWT_SECRET=your-random-32-character-string-here
REFRESH_SECRET=another-random-32-character-string

# Payment
RAZORPAY_KEY_ID=rzp_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxx
RAZORPAY_MODE=test

# AI
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# Application
NODE_ENV=development
PORT=3000
SITE_URL=http://localhost:3000
```

---

## ✅ Final Checklist

### Before Starting:
- [ ] Read QUICK_START.md
- [ ] Read LAUNCH_FIXES_PLAN.md
- [ ] Read IMPLEMENTATION_GUIDE.md

### Day 1:
- [ ] Update .gitignore
- [ ] Rotate API keys
- [ ] Update package.json
- [ ] npm install
- [ ] Set up MongoDB Atlas

### Days 2-4:
- [ ] Create models
- [ ] Create auth endpoints
- [ ] Create auth pages
- [ ] Test locally

### Days 5-6:
- [ ] Complete payment webhook
- [ ] Create legal pages
- [ ] Test payment flow

### Days 7-10:
- [ ] Error handling
- [ ] Content audit
- [ ] Analytics setup
- [ ] Security audit

---

## 📞 Questions?

- **Code implementation:** See IMPLEMENTATION_GUIDE.md
- **What needs fixing:** See LAUNCH_FIXES_PLAN.md
- **Security issues:** See SECURITY_AUDIT.md
- **Quick overview:** See QUICK_START.md
- **Current status:** See READINESS_ASSESSMENT.md

---

**Generated:** 2026-08-14  
**Status:** Ready for implementation
