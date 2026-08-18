# 🏗️ System Architecture & Data Flow

**For understanding how everything connects after fixes are implemented**

---

## 🌐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  index.html  subscription.html  doubt-solver.html  login    │  │
│  │  signup      dashboard          notes                       │  │
│  └──────────────────────┬──────────────────────────────────────┘  │
│                         │ HTTPS                                    │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │   EXPRESS.JS SERVER (Node.js)           │
        │   Running on Port 3000                  │
        │  ┌────────────────────────────────────┐ │
        │  │ Routes & Endpoints                 │ │
        │  │ ✓ /api/auth/signup               │ │
        │  │ ✓ /api/auth/login                │ │
        │  │ ✓ /api/auth/profile              │ │
        │  │ ✓ /api/ask-ai (OpenAI)           │ │
        │  │ ✓ /api/payment/create-order      │ │
        │  │ ✓ /api/razorpay-webhook          │ │
        │  │ ✓ /api/subscribe                 │ │
        │  └────────────────────────────────────┘ │
        └──────────────┬──────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌─────────┐  ┌─────────┐  ┌──────────────┐
    │ MongoDB │  │OpenAI   │  │ Email/SMTP   │
    │ Atlas   │  │ API     │  │ Razorpay     │
    │         │  │         │  │ Analytics    │
    │ Users   │  │GPT-3.5  │  │              │
    │ Subsc.  │  │Responses│  │              │
    │ Trans.  │  │         │  │              │
    └─────────┘  └─────────┘  └──────────────┘
```

---

## 🔐 Authentication Flow

```
START
  │
  ▼
┌─────────────────────────────────────┐
│ User clicks "Login" or "Sign Up"    │
└──────────────┬──────────────────────┘
               │
               ▼
       ┌───────────────────┐
       │ Fills out form    │
       │ Email + Password  │
       └───────────┬───────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
     ┌────────┐         ┌─────────┐
     │ SIGNUP │         │ LOGIN   │
     └───┬────┘         └────┬────┘
         │                   │
         ▼                   ▼
    Validate Email      Find User
    (must be new)       in DB
         │                   │
         ▼                   ▼
    Hash Password        Compare
    with bcrypt          Password
         │               (bcrypt.compare)
         │                   │
         ▼                   ▼
    Save User            ✓ Match?
    to MongoDB           │    │
         │               ─────┘
         │                │ ✗
         │                ▼
         │            Return 401
         │            (Invalid)
         │
         ▼
    Generate JWT
    Token & Refresh Token
         │
         ▼
    Return to Browser
         │
         ▼
    localStorage.setItem(
      'authToken', token
    )
         │
         ▼
    Redirect to Dashboard
         │
         ▼
    Dashboard loads,
    fetches user profile
    using JWT token
         │
         ▼
    Server validates token
    (authenticateToken middleware)
         │
    ┌────┴────┐
    │          │
    ▼          ▼
   ✓ Valid   ✗ Expired/Invalid
    │          │
    ▼          ▼
   Return     Return 403
   Profile    Forbidden
    │
    ▼
  LOGGED IN
```

---

## 💳 Payment & Subscription Flow

```
USER VISITS SUBSCRIPTION PAGE
        │
        ▼
SEES PRICING TIERS
┌─────────────────┐
│ Free            │  ← AI: 3/day
│ Class Pro (₹499)│  ← AI: 20/day, Notes access
│ All Access      │  ← Unlimited AI, All features
└────────────┬────┘
             │
             ▼
   USER CLICKS "SUBSCRIBE"
             │
             ▼
   ✓ Already logged in?
     │              │
   ✓              ✗ (Redirect to login)
     │
     ▼
   CREATE ORDER
   POST /api/payment/create-order
     │
     ▼
   SERVER:
   1. Create Subscription record
   2. Generate Razorpay Order ID
   3. Store in MongoDB
   4. Return order details
     │
     ▼
   RAZORPAY PAYMENT MODAL
     │
     ├─ Shows payment options
     ├─ Card / UPI / Wallet
     │
     ▼
   USER COMPLETES PAYMENT
     │
     ├─ ✓ Success    ✗ Failed
     │ │             │
     │ ▼             ▼
     │ Razorpay      Return to
     │ sends         Dashboard
     │ webhook       with error
     │ POST /api/razorpay-webhook
     │ │
     │ ▼
     │ SERVER:
     │ 1. Verify signature
     │    (crypto HMAC-SHA256)
     │ 2. Update Subscription
     │    - paymentStatus = 'completed'
     │    - expiryDate = now + 365 days
     │ 3. Update User
     │    - subscription.tier = 'class-pro'
     │ 4. Send Email Receipt
     │ 5. Log Transaction
     │
     ▼
   USER SEES "✓ PAYMENT SUCCESSFUL"
     │
     ▼
   EMAIL RECEIPT SENT
   📧 to user@example.com
   ├─ Amount: ₹499
   ├─ Order ID: 123456
   ├─ Valid Until: 2027-08-14
     │
     ▼
   FEATURES UNLOCKED
     │
     ├─ Dashboard shows "Class Pro Pass"
     ├─ AI limit increases to 20/day
     ├─ Can access class notes
     ├─ Subscription can be cancelled
     │
     ▼
   READY TO USE FEATURES
```

---

## 🤖 AI Doubt Solver Flow (With Auth)

```
USER VISITS /doubt-solver.html
        │
        ▼
   CHECK TOKEN
   ┌─ Token in localStorage?
   │  │              │
   │  ✓              ✗
   │  │              │
   │  │              ▼
   │  │          Redirect to login
   │  │
   │  ▼
   │ LOAD DASHBOARD
   │ ├─ Show class level selector
   │ ├─ Show subject buttons
   │ ├─ Show suggested questions
   │ ├─ Show AI query counter
   │ │  (e.g., "5/10 queries used today")
   │
   ▼
USER TYPES QUESTION
   │
   ▼
CLICK "ASK AI"
   │
   ▼
FRONTEND VALIDATION
├─ Question not empty?
├─ Under 500 chars?
├─ Class/Subject selected?
   │
   ▼
SEND TO SERVER
POST /api/ask-ai
Headers: {
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
Body: {
  "prompt": "What is photosynthesis?",
  "class": 9,
  "subject": "biology"
}
   │
   ▼
SERVER RECEIVES REQUEST
   │
   ▼
VALIDATE JWT TOKEN
(authenticateToken middleware)
   │              │
   ✓              ✗ (Return 403)
   │
   ▼
EXTRACT USER ID FROM TOKEN
   │
   ▼
CHECK DAILY LIMIT
   │
   ├─ Get user from MongoDB
   ├─ Check aiQueries.count
   ├─ Check if count < dailyLimit
   │
   ▼ (Within limit)
   │
   ▼
CALL OPENAI API
   │
   ├─ Model: gpt-3.5-turbo
   ├─ System prompt: "You are a CBSE Science tutor"
   ├─ Max tokens: 1000
   │
   ▼
OPENAI RETURNS ANSWER
   │
   ▼
INCREMENT QUERY COUNTER
   │
   ├─ user.aiQueries.count++
   ├─ Save to MongoDB
   │
   ▼
RETURN RESPONSE TO FRONTEND
{
  "answer": "Photosynthesis is...",
  "tokensUsed": 156,
  "queriesRemaining": 4
}
   │
   ▼
FRONTEND DISPLAYS
   │
   ├─ Show formatted answer
   ├─ Show "Copy" button
   ├─ Update query counter (5/10)
   ├─ Update "Upgrade" button visibility
   │  (if limit reached)
   │
   ▼
USER CAN:
├─ Copy answer
├─ Ask another question
├─ Click "Upgrade" to buy subscription
   │
   ▼
LIMIT REACHED?
├─ Show "You've used 10/10 queries today"
├─ Show "Upgrade to Class Pro for 20/day"
├─ Disable question input
   │
   ▼
DONE
```

---

## 📧 Email Flow

```
TRIGGER EVENT
   │
   ├─ User signs up
   ├─ Payment successful
   ├─ Download lead magnet
   ├─ Password reset requested
   │
   ▼
SERVER CALLS sendEmail()
   │
   ├─ Build HTML template
   ├─ Insert user data
   ├─ Include links/tokens
   │
   ▼
NODEMAILER CONNECTS TO SMTP
   │
   host: smtp.gmail.com
   port: 465
   user: your-email@gmail.com
   pass: app-password-16-chars
   │
   ▼
SEND EMAIL VIA GMAIL
   │
   ▼
GMAIL ACCEPTS
   │
   ├─ Adds to SMTP queue
   ├─ Attempts delivery
   ├─ Max 3 retries
   │
   ▼
EMAIL DELIVERED/BOUNCED
   │
   ├─ Success → Log to console
   ├─ Failed → Log error, retry
   │
   ▼
USER RECEIVES EMAIL
   │
   ├─ Receipt email
   ├─ PDF attachment
   ├─ Reset link
   │
   ▼
DONE
```

---

## 📊 Database Schema

```
MongoDB Collections:
════════════════════════════════════

USERS Collection
├─ _id (ObjectId)
├─ email (String, unique)
├─ passwordHash (String, bcrypt)
├─ fullName (String)
├─ classLevel (Number, 6-10)
├─ subjects (Array)
├─ subscription {
│  ├─ tier (String: free/class-pro/all-access)
│  ├─ expiryDate (Date)
│  ├─ razorpayOrderId (String)
│  └─ razorpayPaymentId (String)
├─ aiQueries {
│  ├─ count (Number)
│  ├─ lastResetDate (Date)
│  └─ dailyLimit (Number)
├─ emailVerified (Boolean)
├─ createdAt (Date)
└─ lastLoginAt (Date)

SUBSCRIPTIONS Collection
├─ _id (ObjectId)
├─ userId (ObjectId, ref: Users)
├─ tier (String)
├─ priceINR (Number)
├─ razorpayOrderId (String)
├─ razorpayPaymentId (String)
├─ paymentStatus (String: pending/completed/failed)
├─ purchaseDate (Date)
├─ expiryDate (Date)
├─ autoRenew (Boolean)
└─ features {
   ├─ aiQueriesPerDay (Number)
   ├─ classNotesAccess (Boolean)
   ├─ ncertSolutions (Boolean)
   ├─ videoTutorials (Boolean)
   └─ practiceTests (Boolean)

TRANSACTIONS Collection
├─ _id (ObjectId)
├─ userId (ObjectId)
├─ orderId (String)
├─ paymentId (String)
├─ amount (Number)
├─ currency (String: "INR")
├─ status (String)
├─ createdAt (Date)
└─ metadata {
   ├─ tier (String)
   ├─ planDuration (String)
   └─ ipAddress (String)
```

---

## 🔄 Request/Response Cycle (Example)

```
CLIENT REQUEST
───────────────────────────────────────
POST /api/auth/login
Headers:
  Content-Type: application/json
  
Body:
{
  "email": "student@example.com",
  "password": "SecurePass123!"
}

SERVER PROCESSING
───────────────────────────────────────
1. Parse request body
2. Validate email format
3. Query MongoDB: User.findOne({ email })
4. Compare password with bcrypt.compare()
5. If valid:
   - Generate JWT token
   - Generate refresh token
   - Update lastLoginAt
   - Save to DB
6. If invalid:
   - Log attempt (security)
   - Return 401 error

SERVER RESPONSE (Success)
───────────────────────────────────────
HTTP 200 OK
Headers:
  Content-Type: application/json
  Set-Cookie: refreshToken=...; HttpOnly; Secure

Body:
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@example.com",
    "fullName": "John Doe",
    "subscription": {
      "tier": "free",
      "expiryDate": null
    }
  }
}

CLIENT STORES
───────────────────────────────────────
localStorage.setItem('authToken', accessToken)
// Token used in all future requests:
// Authorization: Bearer {accessToken}
```

---

## 🛡️ Security Layers

```
REQUEST COMES IN
      │
      ▼
  HTTPS/TLS
  (Encrypted in transit)
      │
      ▼
  Express Middleware
  (CORS, Rate limiting)
      │
      ▼
  Input Validation
  (Type, length, format)
      │
      ▼
  JWT Verification
  (If auth required)
  │          │
  ✓          ✗ (401/403)
  │
  ▼
  Database Query
  (Parameterized)
      │
      ▼
  Business Logic
      │
      ▼
  Response
      │
      ├─ No sensitive data
      ├─ No error details
      ├─ HTTPS only
      └─ Secure cookies (httpOnly)
```

---

## 📈 Scaling Considerations

```
Phase 1: Single Server (0-1000 users)
├─ Node.js + Express
├─ MongoDB Atlas free tier
├─ Basic server setup

Phase 2: Separated Services (1k-10k users)
├─ Load balancer
├─ Multiple Node.js instances
├─ MongoDB paid tier
├─ Redis cache for sessions
├─ CDN for static files

Phase 3: Enterprise (10k+ users)
├─ Kubernetes orchestration
├─ Microservices architecture
├─ Database replication
├─ Message queue (Bull/RabbitMQ)
├─ Dedicated email service
├─ Video CDN
```

---

## 🔗 External Integrations

```
┌──────────────────┐
│  Your App        │
│  (Node.js)       │
└────────┬─────────┘
         │
    ┌────┼─────┬─────────┬──────────┐
    │    │     │         │          │
    ▼    ▼     ▼         ▼          ▼
┌──────┐ ┌─────┐ ┌──────┐ ┌──────┐ ┌─────┐
│OAuth2│ │SMTP │ │OpenAI│ │ Razor│ │GA4  │
│      │ │Gmail│ │API   │ │pay   │ │     │
└──────┘ └─────┘ └──────┘ └──────┘ └─────┘
  ✓ User  ✓ Email ✓ AI    ✓ Payment ✓ Analytics
  Auth    Delivery Responses Processing Tracking
```

---

**Last Updated:** 2026-08-14  
**Architecture Version:** v1.0
