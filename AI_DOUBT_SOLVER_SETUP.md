# 🚀 AI Instant Doubt Solver - Setup Guide

Welcome to your **AI-Powered Science Doubt Solver** for A2Z Learning Solutions! This guide will help you set up and integrate OpenAI's ChatGPT into your website.

---

## 📋 What's New?

### Features Added:
✅ **Floating AI Chat Widget** - Available on all pages  
✅ **Dedicated Doubt Solver Page** - Full-featured Q&A interface  
✅ **OpenAI GPT Integration** - Advanced science explanations  
✅ **Daily Query Limits** - Control usage/encourage subscriptions  
✅ **Class & Subject Filters** - Context-aware answers  
✅ **Suggested Questions** - Quick-start templates  
✅ **Fallback System** - Works without API key in demo mode  

---

## 🔑 Step 1: Get Your OpenAI API Key

### Create OpenAI Account:
1. Go to **[https://platform.openai.com](https://platform.openai.com)**
2. Click **"Sign Up"** or **"Log In"**
3. Complete email verification

### Generate API Key:
1. Navigate to **Account → [API Keys](https://platform.openai.com/api-keys)**
2. Click **"+ Create new secret key"**
3. Name it (e.g., "A2Z Science Site")
4. Copy the key immediately (you won't see it again!)

### Pricing Info:
- **Free Trial**: $5 credit (expires after 3 months)
- **Pay-as-you-go**: 
  - GPT-3.5-turbo: ~$0.50 per 1M input tokens
  - Input is ~4 characters = 1 token
  - A typical doubt answer uses ~100-500 tokens
  - *Cost estimate: $0.05-0.25 per question*

---

## 📝 Step 2: Configure Environment Variables

### 1. Copy the Template File:
```bash
# In your project root directory
cp .env.example .env
```

### 2. Edit `.env` File:
```
OPENAI_API_KEY=sk_your_api_key_here
```

Replace `sk_your_api_key_here` with your actual OpenAI API key.

### Example (with fake key):
```
OPENAI_API_KEY=sk-proj-abc123def456...
PORT=3000
RAZORPAY_MODE=test
RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### ⚠️ Security Warning:
- **NEVER commit `.env` to GitHub!**
- Check your `.gitignore`:
  ```
  .env
  .env.local
  node_modules/
  ```

---

## 🌐 Step 3: Start Your Server

### Install Dependencies (if not done):
```bash
npm install
```

### Start the Server:
```bash
npm start
# Server runs on http://localhost:3000
```

You should see:
```
Server running on http://localhost:3000
```

---

## ✅ Step 4: Test the Integration

### Test 1: Floating Widget
1. Open **http://localhost:3000** in your browser
2. Look for **"Ask AI Science Tutor"** button (bottom-right)
3. Click it to open the chat widget
4. Ask: *"Explain Ohm's Law"*
5. Wait for AI response ✅

### Test 2: Dedicated Doubt Solver Page
1. Open **http://localhost:3000/doubt-solver.html**
2. Select Class: **Class 10**
3. Select Subject: **Physics**
4. Ask: *"What is Newton's first law of motion?"*
5. Click **"Ask AI Tutor"**
6. See the detailed answer ✅

### Test 3: Daily Limit
1. Ask 3 questions on the widget
2. On 4th question, you should see: **"Daily Limit Reached!"**
3. Verify localStorage by opening browser DevTools:
   ```javascript
   // In Console
   JSON.parse(localStorage.getItem('a2z_questions_used'))
   ```

---

## 🎨 Customization Options

### Change Daily Question Limit:
Edit **`doubt-solver.html`** and **`script.js`**:
```javascript
// Line 4 in doubt-solver.html
const MAX_QUESTIONS_PER_DAY = 10; // Change this number
```

### Change AI Model:
In the API calls, update the model:
```javascript
// Use GPT-4 (more expensive but better)
model: 'gpt-4'

// Or keep GPT-3.5-turbo (cheaper)
model: 'gpt-3.5-turbo'
```

### Customize System Prompt:
Edit **`server.js`** around line 95:
```javascript
const systemPrompt = `You are an expert CBSE Science tutor...`;
// Modify this to change AI behavior
```

---

## 🚀 Advanced: Deploy to Production

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables
# Add: OPENAI_API_KEY=sk_...
```

### Option 2: Heroku
```bash
heroku login
heroku create your-app-name
heroku config:set OPENAI_API_KEY=sk_...
git push heroku main
```

### Option 3: Docker
Create `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Deploy:
```bash
docker build -t a2z-science .
docker run -e OPENAI_API_KEY=sk_... -p 3000:3000 a2z-science
```

---

## 🔧 Troubleshooting

### Issue: "Invalid API Key"
**Solution**: 
- Verify your key in `.env` (no extra spaces)
- Check key hasn't been rotated on OpenAI dashboard
- Regenerate a new key if needed

### Issue: "Quota Exceeded"
**Solution**:
- Check OpenAI billing page
- Increase billing limit or reduce question limit
- Set max tokens to 500 instead of 1000

### Issue: "Widget not showing"
**Solution**:
- Check browser console for errors (F12)
- Ensure `script.js` is loaded
- Verify `initAiWidget()` is called

### Issue: "CORS Error"
**Solution**:
- The backend should handle this
- If persists, check server is running
- Restart: `npm start`

### Issue: "No Internet in Demo Mode"
**Solution**:
- Without API key, uses local AI fallback
- Responses will be generic templates
- To get smart responses, add OPENAI_API_KEY

---

## 📊 API Usage Monitoring

### Check Token Usage:
The API response includes usage data:
```javascript
{
  answer: "...",
  model: "gpt-3.5-turbo",
  usage: {
    prompt_tokens: 45,
    completion_tokens: 156,
    total_tokens: 201
  }
}
```

### Monitor on OpenAI Dashboard:
1. Go to [https://platform.openai.com/account/billing/overview](https://platform.openai.com/account/billing/overview)
2. See "Current Usage" and "Billing"
3. Set spending limits to avoid surprise charges

---

## 📄 File Structure

```
Science_Study_Hub/
├── server.js                 # Backend with OpenAI endpoint
├── script.js                 # Widget & page logic
├── style.css                 # All styling
├── index.html                # Home (with floating widget)
├── doubt-solver.html         # ✨ NEW - Dedicated solver page
├── subscription.html         # Upgrade/Plans
├── .env.example              # Config template
├── package.json              # Dependencies
└── README.md                 # This file
```

---

## 🔗 Quick Links

- **OpenAI API Docs**: https://platform.openai.com/docs
- **GPT-3.5-turbo Pricing**: https://openai.com/pricing
- **Your API Keys**: https://platform.openai.com/api-keys
- **Usage Monitoring**: https://platform.openai.com/account/billing/overview

---

## 💡 Pro Tips

1. **Use Temperature**: Lower temp (0.3) = factual, Higher (0.9) = creative
2. **Add Context**: Include class/subject for better answers
3. **Cache System Prompts**: Reduces token usage
4. **Batch Questions**: Process multiple questions efficiently
5. **Rate Limiting**: Add backend rate limiting to prevent abuse

---

## 📞 Support

For issues or questions:
- Check browser console (F12 → Console)
- Review server logs (terminal running `npm start`)
- Verify API key validity
- Test with simple questions first

---

**Happy teaching! 🎓🚀**

*Built with ❤️ for CBSE Students | A2Z Learning Solutions*
