# 🎯 AI Doubt Solver - Quick Reference Guide

## 📍 Key Endpoints & Pages

| Feature | URL | Type |
|---------|-----|------|
| Floating Widget | `/` (all pages) | JS Widget |
| Doubt Solver Page | `/doubt-solver.html` | HTML Page |
| API Endpoint | `/api/ask-ai` | POST |
| Legacy Gemini API | `/api/gemini` | POST |

---

## 💻 API Endpoint Reference

### Main Endpoint: `/api/ask-ai`

**Request:**
```javascript
POST /api/ask-ai
Content-Type: application/json

{
  "prompt": "Explain photosynthesis",
  "model": "gpt-3.5-turbo"  // optional, defaults shown
}
```

**Response (Success):**
```json
{
  "answer": "Photosynthesis is the process where...",
  "model": "gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 156,
    "total_tokens": 201
  }
}
```

**Response (Fallback - No API Key):**
```json
{
  "answer": "🌱 **Photosynthesis Reaction:**\n\n$$6CO_2...",
  "model": "A2Z Science AI Engine v2 (Local)",
  "warning": "OpenAI API unavailable, using local AI response"
}
```

**Error Response:**
```json
{
  "error": "Prompt is required"
}
```

---

## 🎮 Frontend Implementation Examples

### Basic Usage (Widget):
```javascript
// Already integrated in script.js
const askBtn = document.getElementById('aiSendBtn');
askBtn.addEventListener('click', async () => {
  const response = await fetch('/api/ask-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: "Your question here" })
  });
  const data = await response.json();
  console.log(data.answer);
});
```

### Advanced Usage (with Context):
```javascript
// For doubt-solver.html
const prompt = `Class ${className} - ${subject}\n\n${userQuestion}`;
const response = await fetch('/api/ask-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    prompt: prompt,
    model: 'gpt-3.5-turbo'
  })
});
```

---

## ⚙️ Configuration & Customization

### 1. Change Daily Limits

**File**: `doubt-solver.html` (line ~11)
```javascript
// Change from 10 to your desired limit
const MAX_QUESTIONS_PER_DAY = 10;
```

**File**: `script.js` (line ~5)
```javascript
// Change from 3 to your desired limit
const MAX_FREE_QUERIES = 3;
```

### 2. Change AI Model

**Options**:
- `gpt-4` - Most capable (expensive, ~$0.03 per question)
- `gpt-3.5-turbo` - Balanced (cheap, ~$0.01 per question)
- `gpt-4-turbo` - Faster (expensive)

**Where to Change**:
- `doubt-solver.html` line ~300: `model: 'gpt-3.5-turbo'`
- `script.js` line ~18: `model: 'gpt-3.5-turbo'`

### 3. Customize System Prompt

**File**: `server.js` (around line 95)

Default (Science Tutor):
```javascript
const systemPrompt = `You are an expert CBSE Science tutor...`;
```

Example customizations:
```javascript
// For Math tutor
const systemPrompt = `You are an expert CBSE Math tutor...`;

// For Language Arts
const systemPrompt = `You are an expert English literature tutor...`;

// For Interview prep
const systemPrompt = `You are an expert interview coach...`;
```

### 4. Change Max Tokens

**File**: `server.js` (around line 108)

```javascript
const payload = {
  // ... other settings ...
  max_tokens: 1000,  // Change this number
  // Fewer tokens = shorter response + cheaper cost
};
```

---

## 📊 Monitoring & Analytics

### Track Usage Programmatically:
```javascript
// Get today's usage (Widget)
const usage = JSON.parse(localStorage.getItem('a2z_ai_usage') || '{}');
console.log(usage.count, 'questions asked today');

// Get today's usage (Doubt Solver)
const solverUsage = JSON.parse(localStorage.getItem('a2z_questions_used') || '{}');
console.log(solverUsage.count, 'questions from doubt solver');
```

### Check API Costs:
Visit: https://platform.openai.com/account/billing/overview

Calculate approximate monthly cost:
- 100 questions/day × 200 tokens avg = 20,000 tokens/day
- 20,000 × 0.0005 = $10/day ≈ $300/month (GPT-3.5)
- Same with GPT-4 = $3000+/month

**Recommendation**: Use gpt-3.5-turbo and limit free questions to 3-5/day

---

## 🔒 Security Best Practices

### 1. Never Expose API Keys
```javascript
// ❌ WRONG - API key in frontend
const response = await fetch('https://api.openai.com/v1/...', {
  headers: { 'Authorization': `Bearer ${API_KEY}` }
});

// ✅ CORRECT - Use backend proxy
const response = await fetch('/api/ask-ai', {
  method: 'POST',
  body: JSON.stringify({ prompt: userInput })
});
```

### 2. Rate Limiting (Backend)
```javascript
// Add to server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute
});

app.post('/api/ask-ai', limiter, async (req, res) => {
  // ... handle request
});
```

### 3. Input Validation
```javascript
// Validate prompt length
if (!prompt || prompt.length > 500) {
  return res.status(400).json({ error: 'Invalid prompt' });
}

// Sanitize input (prevent injection)
const cleanPrompt = prompt.replace(/[<>\"']/g, '');
```

### 4. Environment Variables
```bash
# ✅ CORRECT: Store in .env
OPENAI_API_KEY=sk_...

# ❌ WRONG: Store in code
const API_KEY = "sk_...";
```

---

## 🚨 Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | Invalid API key | Check OPENAI_API_KEY in .env |
| `429 Too Many Requests` | Rate limit hit | Add delays between requests |
| `500 Internal Server Error` | Server crash | Check server logs |
| `Network Error` | Backend not running | Start with `npm start` |
| `Invalid model` | Wrong model name | Use gpt-3.5-turbo or gpt-4 |

### Implement Error Handling:
```javascript
try {
  const response = await fetch('/api/ask-ai', { /* ... */ });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unknown error');
  }
  
  const data = await response.json();
  return data;
  
} catch (err) {
  console.error('AI Error:', err.message);
  // Show fallback message to user
  return { answer: 'Unable to get answer. Please try again.' };
}
```

---

## 🧪 Testing Checklist

Before deploying to production:

- [ ] Test widget appears on homepage
- [ ] Test doubt-solver.html loads correctly
- [ ] Test 1 question through widget
- [ ] Test 1 question through doubt-solver
- [ ] Test daily limit counter
- [ ] Test copy answer functionality
- [ ] Test error handling (disconnect internet)
- [ ] Test on mobile (responsive design)
- [ ] Check browser console (no errors)
- [ ] Check server logs (no errors)
- [ ] Verify API key not exposed in network requests
- [ ] Test with different class/subject combinations

---

## 📱 Responsive Design

The widget and doubt-solver page are mobile-responsive. Test on:
- Desktop (1920×1080)
- Tablet (768×1024)
- Mobile (375×812)

---

## 🔄 Updating Questions & Suggestions

### Add Custom Suggested Questions:

**File**: `doubt-solver.html` (around line ~365)

```javascript
const suggestedQuestions = {
  physics: [
    "What are Newton's three laws of motion?",
    "Your new question here",
    "Another question"
  ],
  chemistry: [ /* ... */ ],
  biology: [ /* ... */ ],
  general: [ /* ... */ ]
};
```

---

## 📞 Support & Resources

- **OpenAI Docs**: https://platform.openai.com/docs
- **API Reference**: https://platform.openai.com/docs/api-reference/chat
- **Status Page**: https://status.openai.com
- **Community Forum**: https://community.openai.com

---

## 💡 Future Enhancements

Consider adding:
- [ ] Voice input (speech-to-text)
- [ ] Save favorite answers
- [ ] Share answers via URL
- [ ] Export to PDF
- [ ] Conversation history
- [ ] Multi-language support
- [ ] Custom AI models per subject
- [ ] Integration with video tutorials
- [ ] Real-time collaboration
- [ ] Admin dashboard for monitoring

---

**Last Updated**: 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
