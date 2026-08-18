# 🔐 Security Audit Checklist - Science Study Hub

**Run this BEFORE launch to prevent breaches**  
**Generated:** 2026-08-14

---

## 🚨 CRITICAL (Do First)

### ✅ Environment Variables
```bash
# Run in terminal to check current state:

# 1. Verify .env is in .gitignore
cat .gitignore | grep -E "^\.env"
# Expected: Should show ".env" on its own line

# 2. Check if .env was ever committed
git log --all --full-history -- .env
# Expected: Should show NOTHING if .env was never committed

# 3. Search for exposed keys in git history
git log -p | grep -i "RAZORPAY_KEY\|OPENAI_API\|SMTP_PASS" | head -5
# Expected: Should show NOTHING

# 4. Check current .env file exists
ls -la .env
# Expected: -rw-r--r-- .env (should be readable only, not executable)
```

**If ANY keys are exposed:**
1. IMMEDIATELY rotate all keys
2. Use `git-filter-repo` to remove from history
3. Notify any affected users
4. Create new branch with clean history

### ✅ API Key Rotation Checklist

**Razorpay:**
- [ ] Go to https://dashboard.razorpay.com/app/settings/api-keys
- [ ] Click "Regenerate Key" for both ID and Secret
- [ ] Copy new values to .env
- [ ] Commit .env change (with rotated keys)
- [ ] Test payment endpoint with new keys
- [ ] Delete old keys from dashboard

**OpenAI:**
- [ ] Go to https://platform.openai.com/api-keys
- [ ] If API key is exposed, click "Delete"
- [ ] Create new API key
- [ ] Copy to .env
- [ ] Test `/api/ask-ai` endpoint
- [ ] Keep old key disabled for 24 hours, then delete

**SMTP (Gmail):**
- [ ] Go to https://myaccount.google.com/apppasswords
- [ ] Generate new 16-character app password
- [ ] Update SMTP_PASS in .env
- [ ] Test with quick email send
- [ ] Delete old app password

**Test all after rotation:**
```bash
npm start
# Open http://localhost:3000 and verify:
# - AI responses work
# - Payment page loads
# - Email sending works
```

---

## 🔒 Code Security

### ✅ Secrets Not in Code

Run this search:
```bash
# Search for hardcoded secrets
grep -r "sk-\|rzp_\|secret\|password" --include="*.js" --include="*.html" \
  | grep -v "process.env\|// " | head -20

# Should be EMPTY or only contain comments
```

**If found:**
1. Move to .env
2. Reference via `process.env.VARIABLE_NAME`
3. Remove from git history
4. Rotate the exposed key

### ✅ Dependency Vulnerabilities

```bash
# Check for known vulnerabilities
npm audit

# Fix high/critical issues
npm audit fix

# Review and test
npm start
```

### ✅ Password Security

In `models/User.js`, verify:
```javascript
// ✅ CORRECT: Password is hashed with salt
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// ❌ WRONG: Never do this
localStorage.setItem('password', password);  // Never store plain password
const hash = md5(password);  // MD5 is broken, use bcrypt
```

### ✅ SQL/NoSQL Injection Prevention

Check database queries:
```javascript
// ✅ CORRECT: Using parameterized queries
const user = await User.findOne({ email: userInput });

// ❌ WRONG: String concatenation
const query = "SELECT * FROM users WHERE email = '" + userInput + "'";
```

---

## 🌐 Network Security

### ✅ HTTPS Required

In production, ensure:
```
- All external URLs use https://
- Redirect http:// to https://
- Set secure cookies: httpOnly: true, secure: true, sameSite: 'Strict'
- Set HSTS header: Strict-Transport-Security: max-age=31536000
```

For Express.js:
```javascript
// Add to server.js for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      next();
    }
  });
}
```

### ✅ CORS Headers

Verify CORS is restricted:
```javascript
// In server.js
const cors = require('cors');
app.use(cors({
  origin: 'https://yourdomain.com',  // NOT '*'
  credentials: true
}));
```

### ✅ Rate Limiting

Add to prevent abuse:
```javascript
const rateLimit = require('express-rate-limit');

// Limit signup/login to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, try again later'
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  // ... login logic
});
```

---

## 🔐 Authentication Security

### ✅ Password Requirements

Enforce in signup:
```javascript
// ✅ Good password policy
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if (!passwordRegex.test(password)) {
  return res.status(400).json({
    error: 'Password must be 8+ chars with uppercase, lowercase, number, and symbol'
  });
}
```

### ✅ JWT Security

Verify JWT implementation:
```javascript
// ✅ CORRECT
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET, // Long random string, 32+ chars
  { expiresIn: '7d' }
);

// ❌ WRONG
jwt.sign({ userId, email, password }, 'secret');  // Never include password
jwt.sign({ userId }, 'secret', { expiresIn: '100y' });  // Too long expiry
```

### ✅ Session Management

For token refresh (optional but recommended):
```javascript
// On login, return both short-lived access token + refresh token
const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

// Store refresh token in secure httpOnly cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,  // HTTPS only
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});

return res.json({ accessToken });
```

---

## 💳 Payment Security

### ✅ Razorpay Webhook Signature

CRITICAL: Always verify webhook signatures:
```javascript
// ✅ CORRECT
const crypto = require('crypto');
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(body)
  .digest('hex');

if (shasum !== expectedSignature) {
  return res.status(400).json({ error: 'Invalid signature' });
}

// ❌ WRONG: Trusting webhook without verification
app.post('/webhook', (req, res) => {
  // Directly using payment data without signature check
  // ⚠️ VULNERABLE TO FRAUDULENT PAYMENTS!
});
```

### ✅ No Sensitive Data in Logs

```javascript
// ❌ WRONG
console.log('Payment details:', { razorpayPaymentId, amount, userEmail });

// ✅ CORRECT
console.log('Payment processed for user:', userId);  // Log user ID only, not email
```

### ✅ PCI Compliance

- [ ] Never store full credit card numbers
- [ ] Use Razorpay's tokenization for recurring payments
- [ ] Never log payment card data
- [ ] Use HTTPS for all payment pages

---

## 📊 Data Protection

### ✅ Encryption at Rest (Database)

For MongoDB Atlas:
- [x] Enable MongoDB encryption at rest (default for Atlas)
- [x] Use strong database password
- [x] Whitelist IP addresses (not 0.0.0.0/0 in production)

### ✅ Data Deletion

Implement GDPR-compliant deletion:
```javascript
// DELETE ACCOUNT endpoint
app.delete('/api/user/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Delete all user data
    await User.findByIdAndDelete(userId);
    await Subscription.deleteMany({ userId });
    // Delete any other user data tables
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Deletion failed' });
  }
});
```

### ✅ Data Access Logs

Log when data is accessed:
```javascript
// In authenticateToken middleware
console.log(`[${new Date().toISOString()}] User ${req.user.userId} accessed endpoint: ${req.path}`);
```

---

## 🛡️ Application Security

### ✅ Input Validation

Always validate user input:
```javascript
// ✅ CORRECT
const { email, password } = req.body;

if (!email || !email.includes('@')) {
  return res.status(400).json({ error: 'Invalid email' });
}

if (!password || password.length < 6) {
  return res.status(400).json({ error: 'Invalid password' });
}

// ❌ WRONG
const email = req.body.email;  // No validation
const user = await User.findOne({ email });  // Could be NoSQL injection
```

### ✅ XSS Prevention

In HTML/frontend:
```javascript
// ❌ WRONG - Vulnerable to XSS
document.getElementById('content').innerHTML = userInput;

// ✅ CORRECT - Safe
document.getElementById('content').textContent = userInput;
```

### ✅ Error Messages

Don't leak system information:
```javascript
// ❌ WRONG - Leaks database structure
res.status(500).json({ error: 'MongoDB connection failed at line 42' });

// ✅ CORRECT - Generic message
res.status(500).json({ error: 'An error occurred. Please contact support.' });

// Log details server-side only
console.error('Database error:', error);
```

---

## 📱 Third-Party Services

### ✅ Google Analytics

No sensitive data in GA:
```javascript
// ✅ CORRECT - Track events, not user data
gtag('event', 'signup', {
  event_category: 'engagement',
  event_label: 'free_tier'
});

// ❌ WRONG - Sends personal data
gtag('pageview', {
  page_path: '/user/123@example.com'  // Never send user email
});
```

### ✅ Third-Party API Keys

Store safely:
```
OPENAI_API_KEY ✅ Environment variable
SMTP_PASS ✅ Environment variable
RAZORPAY_KEY_SECRET ✅ Environment variable

❌ Never hardcode in script.js
❌ Never in comments
❌ Never in git history
```

---

## 🔍 Testing Checklist

### ✅ Security Test Cases

```bash
# 1. Try to access protected route without token
curl http://localhost:3000/api/auth/profile
# Expected: 401 Unauthorized

# 2. Try to access with invalid token
curl -H "Authorization: Bearer invalid" http://localhost:3000/api/auth/profile
# Expected: 403 Forbidden

# 3. Try to login with wrong password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
# Expected: 401 Unauthorized (not 404 or 500)

# 4. Try to signup with weak password
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123","fullName":"Test"}'
# Expected: 400 Bad Request with password requirement message

# 5. Try SQL injection
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com\"; DROP TABLE users; --","password":"123"}'
# Expected: Should fail safely, not drop tables
```

---

## 📋 Pre-Launch Security Sign-Off

- [ ] All API keys rotated
- [ ] .env in .gitignore (verified)
- [ ] No secrets in code
- [ ] No secrets in git history
- [ ] HTTPS enabled on production domain
- [ ] Rate limiting implemented
- [ ] Webhook signature verification enabled
- [ ] Password hashing with bcrypt verified
- [ ] JWT expiration set
- [ ] CORS restricted (not '*')
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak info
- [ ] Database encryption enabled
- [ ] Admin credentials secure
- [ ] Backup plan documented
- [ ] Incident response plan ready

---

## 📞 If Breach is Suspected

1. **Immediately:**
   - Rotate all API keys
   - Disable affected accounts
   - Review server logs for unauthorized access
   - Take down the application if necessary

2. **Within 24 hours:**
   - Determine what data was accessed
   - Notify affected users
   - File incident report

3. **Within 72 hours:**
   - Deploy security fixes
   - Audit code for vulnerabilities
   - Implement additional monitoring

4. **Contact:**
   - 🔒 Security: security@a2zlearning.com
   - 🆘 Support: support@a2zlearning.com

---

**Last Updated:** 2026-08-14  
**Next Review:** Before going live to production
