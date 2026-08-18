# 🚀 Quick Reference - Launch Fixes at a Glance

**For:** Kuldeep Ohal  
**Project:** A2Z Science Study Hub  
**Date:** 2026-08-14

---

## 🔴 DO THIS FIRST (Next 4 Hours)

```bash
# 1. Check .gitignore
cat .gitignore | grep "\.env"
# Fix if missing:
echo ".env" >> .gitignore

# 2. Check git history
git log --all -p | grep -i "RAZORPAY_KEY\|OPENAI_API\|SMTP_PASS"
# If found, keys are EXPOSED - rotate immediately

# 3. Verify .env exists locally
ls -la .env

# 4. Rotate all keys:
# - RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET
# - OPENAI_API_KEY  
# - SMTP_PASS (Gmail app password)
```

**Why?** If keys are in git history, anyone can see them.

---

## 📚 Read These Files First

| File | Purpose | Time |
|------|---------|------|
| [LAUNCH_FIXES_PLAN.md](LAUNCH_FIXES_PLAN.md) | **Read first** - Overview of all 10 issues, dependency graph, tech stack | 15 min |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | **Copy-paste code** - Phase 1-3 with working examples | 30 min |
| [SECURITY_AUDIT.md](SECURITY_AUDIT.md) | **Security checklist** - Pre-launch verification commands | 15 min |

---

## 🎯 Implementation Phases

```
Phase 1: Security (1 day)
├─ Fix .gitignore ✅
├─ Rotate API keys ✅
└─ Validate .env

Phase 2: Database & Auth (4 days)
├─ MongoDB Atlas setup
├─ Install mongoose
├─ Create User model
├─ Signup/Login endpoints
└─ Auth pages (login.html, signup.html)

Phase 3: Payment & Legal (2 days)
├─ Complete Razorpay webhook
├─ Create privacy-policy.html
├─ Create terms-conditions.html
├─ Create refund-policy.html
└─ Test payment flow

Phase 4: UX & Content (3 days)
├─ Error handling
├─ Loading states
├─ PDF lead magnet
└─ Notes content audit

Phase 5: Monitoring (1 day)
├─ Google Analytics
├─ Error tracking (Sentry)
└─ Dashboard setup

Total: ~12 days
```

---

## 💾 Environment Variables Needed

```
# .env file (create/update this)

# Database
MONGODB_URI=mongodb+srv://scienceapp:password@cluster.mongodb.net/science_hub

# Authentication
JWT_SECRET=generate-a-random-32-char-string-here
REFRESH_SECRET=another-random-32-char-string

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

# Server
NODE_ENV=development
PORT=3000
```

---

## 🔗 Key Dependencies to Install

```bash
npm install mongoose bcryptjs jsonwebtoken
npm install --save-dev nodemon

# Already installed:
# - express, axios, dotenv, nodemailer, razorpay, compression
```

---

## 📁 Files You'll Create

```
server.js (UPDATE - add auth routes)
├─ /api/auth/signup
├─ /api/auth/login
├─ /api/auth/logout
└─ /api/auth/profile

models/ (NEW)
├─ models/User.js
├─ models/Subscription.js
└─ models/Transaction.js

pages/ (NEW)
├─ login.html
├─ signup.html
├─ dashboard.html
├─ privacy-policy.html
├─ terms-conditions.html
└─ refund-policy.html
```

---

## ✅ Pre-Launch Checklist

**Security:**
- [ ] All API keys rotated
- [ ] .env in .gitignore
- [ ] No secrets in git history
- [ ] HTTPS enabled
- [ ] Rate limiting added
- [ ] Webhook signature verification

**Functionality:**
- [ ] Signup/Login working
- [ ] Payments tested in sandbox
- [ ] Email receipts sending
- [ ] PDF lead magnet delivered
- [ ] Notes pages complete
- [ ] AI responses working

**Compliance:**
- [ ] Privacy Policy published
- [ ] Terms & Conditions published
- [ ] Refund Policy published
- [ ] Contact page working
- [ ] Legal review done

**Testing:**
- [ ] Test signup flow
- [ ] Test payment flow (sandbox)
- [ ] Test webhook
- [ ] Test password reset
- [ ] Test on mobile
- [ ] Test error states

**Monitoring:**
- [ ] Google Analytics added
- [ ] Error tracking enabled
- [ ] Logs setup
- [ ] Backup plan ready

---

## 🆘 Common Issues & Fixes

### Issue: `Cannot find module mongoose`
```bash
npm install mongoose
```

### Issue: `RAZORPAY_KEY_SECRET undefined`
```
1. Add to .env
2. Verify it's not committed to git
3. Restart npm start
```

### Issue: Payment webhook not firing
```
1. Check signature verification in server.js
2. Verify webhook URL in Razorpay dashboard
3. Test with Razorpay CLI:
   razorpay webhook send payment.authorized
```

### Issue: MongoDB connection failed
```
1. Check MONGODB_URI in .env
2. Verify IP whitelist (0.0.0.0/0 for dev)
3. Confirm cluster is running on Atlas
4. Test connection:
   npm run dev
```

---

## 📞 Support & Documentation

**Official Docs:**
- [Razorpay API](https://razorpay.com/docs/)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Express.js](https://expressjs.com/)
- [JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)

**Stack Overflow:**
- Search: "mongoose authentication example"
- Search: "express jwt middleware"
- Search: "razorpay webhook verification node.js"

---

## 🎓 Learning Path (If New to This)

1. **Authentication:** Understand JWT tokens (15 min video)
2. **Databases:** MongoDB CRUD operations (30 min)
3. **Webhooks:** How Razorpay sends payment updates (20 min)
4. **Security:** OWASP Top 10 (30 min read)

---

## 🚀 Start Now

**Step 1 (30 min):** Fix .gitignore and rotate API keys  
**Step 2 (1 hour):** Set up MongoDB Atlas  
**Step 3 (2 hours):** Copy code from IMPLEMENTATION_GUIDE.md, create models  
**Step 4 (1 hour):** Test signup/login locally  

**By end of today:** Phase 1 complete, foundation ready for Phase 2

---

**Questions?** Check the detailed guides above or contact: support@a2zlearning.com

**Last Updated:** 2026-08-14
