// ==========================================================================
// A2Z Learning Solutions - Frontend Interaction Engine
// ==========================================================================

// AI Query Counter (3 free per day)
const MAX_FREE_QUERIES = 3;

function getQueryCount() {
  const today = new Date().toISOString().split('T')[0];
  const stored = JSON.parse(localStorage.getItem('a2z_ai_usage') || '{}');
  if (stored.date !== today) {
    return { count: 0, date: today };
  }
  return stored;
}

function incrementQueryCount() {
  const usage = getQueryCount();
  usage.count += 1;
  localStorage.setItem('a2z_ai_usage', JSON.stringify(usage));
  return usage.count;
}

// API Communication with Backend
async function askGemini(prompt) {
  const resp = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!resp.ok) throw new Error('Failed to get answer from AI Tutor');
  return resp.json();
}

// Format markdown bold & math formulas simple renderer
function formatAiText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
    .replace(/\$(.*?)\$/g, '<code style="background:rgba(33,176,166,0.15);padding:2px 4px;border-radius:4px;font-family:monospace">$1</code>');
}

// Initialize AI Widget
function initAiWidget() {
  const trigger = document.getElementById('aiWidgetTrigger');
  const chatWindow = document.getElementById('aiChatWindow');
  const closeBtn = document.getElementById('aiCloseBtn');
  const sendBtn = document.getElementById('aiSendBtn');
  const input = document.getElementById('aiInput');
  const messages = document.getElementById('aiMessages');
  const limitSpan = document.getElementById('aiLimitCount');

  if (!trigger || !chatWindow) return;

  function updateLimitUI() {
    const usage = getQueryCount();
    const remaining = Math.max(0, MAX_FREE_QUERIES - usage.count);
    if (limitSpan) limitSpan.textContent = remaining;
  }

  updateLimitUI();

  trigger.addEventListener('click', () => {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) input?.focus();
  });

  closeBtn?.addEventListener('click', () => {
    chatWindow.classList.remove('active');
  });

  async function handleSend() {
    const prompt = input.value.trim();
    if (!prompt) return;

    const usage = getQueryCount();
    if (usage.count >= MAX_FREE_QUERIES) {
      appendMessage('bot', '⚠️ <strong>Free Daily Limit Reached!</strong><br>You have used your 3 free AI Tutor prompts for today. Upgrade to the <strong>Class Pro Pass</strong> for unlimited instant subject help across Science, Maths, SST, and English.<br><br><a href="subscription.html" style="color:#FF6B57;font-weight:bold;text-decoration:underline">Upgrade to Pro Pass →</a>');
      input.value = '';
      return;
    }

    // Append User Message
    appendMessage('user', prompt);
    input.value = '';

    // Append Loading Indicator
    const loadingId = appendMessage('bot', '<em>Searching NCERT study database...</em>');

    try {
      const data = await askGemini(prompt);
      incrementQueryCount();
      updateLimitUI();
      const botMsgEl = document.getElementById(loadingId);
      if (botMsgEl) {
        botMsgEl.innerHTML = formatAiText(data.answer || data.text || JSON.stringify(data));
      }
    } catch (err) {
      const botMsgEl = document.getElementById(loadingId);
      if (botMsgEl) {
        botMsgEl.innerHTML = `❌ Error: ${err.message}. Please try again.`;
      }
    }
  }

  function appendMessage(sender, htmlContent) {
    const msgDiv = document.createElement('div');
    const msgId = 'msg_' + Date.now();
    msgDiv.id = msgId;
    msgDiv.className = `chat-bubble ${sender}`;
    msgDiv.innerHTML = htmlContent;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
    return msgId;
  }

  sendBtn?.addEventListener('click', handleSend);
  input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}

// Payment Modal Logic for Subscription Page
function initSubscriptionCheckout() {
  const modal = document.getElementById('checkoutModal');
  const modalClose = document.getElementById('modalClose');
  const payBtn = document.getElementById('confirmPayBtn');
  const planTitleEl = document.getElementById('modalPlanTitle');
  const planAmountEl = document.getElementById('modalPlanAmount');
  const messageEl = document.getElementById('checkoutMessage');

  let currentPlan = { id: 'pro', title: 'Class Pro Pass', price: 499 };
  let razorpayScriptPromise = null;

  function ensureRazorpayScript() {
    if (window.Razorpay) return Promise.resolve();
    if (!razorpayScriptPromise) {
      razorpayScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
        document.body.appendChild(script);
      });
    }
    return razorpayScriptPromise;
  }

  window.openCheckout = function(planId, planTitle, price) {
    currentPlan = { id: planId, title: planTitle, price: price };
    if (planTitleEl) planTitleEl.textContent = planTitle;
    if (planAmountEl) planAmountEl.textContent = '₹' + price;
    if (messageEl) messageEl.textContent = '';
    modal?.classList.add('active');
  };

  modalClose?.addEventListener('click', () => {
    modal?.classList.remove('active');
  });

  payBtn?.addEventListener('click', async () => {
    const name = document.getElementById('custName')?.value.trim();
    const email = document.getElementById('custEmail')?.value.trim();
    const grade = document.getElementById('custGrade')?.value || '10';

    if (!name || !email) {
      if (messageEl) {
        messageEl.style.color = 'crimson';
        messageEl.textContent = 'Please provide full name and email address.';
      }
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Generating secure payment...';

    try {
      const orderResp = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: currentPlan.id, amount: currentPlan.price, grade })
      });
      const orderData = await orderResp.json();

      if (!orderResp.ok) throw new Error(orderData.error || 'Unable to create payment order');

      if (orderData.mockMode) {
        const subResp = await fetch('/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, grade, plan: currentPlan.title, amount: currentPlan.price })
        });
        const subData = await subResp.json();

        if (!subResp.ok) throw new Error(subData.error || 'Payment failed');

        if (messageEl) {
          messageEl.style.color = '#10B981';
          messageEl.innerHTML = `🎉 <strong>Payment Successful!</strong><br>Transaction ID: ${subData.txnId}<br>Confirmation email sent to ${email}.`;
        }
        payBtn.textContent = 'Subscribed!';
        setTimeout(() => {
          modal?.classList.remove('active');
          payBtn.disabled = false;
          payBtn.textContent = 'Pay Now & Unlock';
        }, 3000);
        return;
      }

      await ensureRazorpayScript();

      const razorpay = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'A2Z Learning Solutions',
        description: `${currentPlan.title} for Class ${grade}`,
        order_id: orderData.orderId,
        handler: async function(response) {
          const verifyResp = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              name,
              email,
              grade,
              plan: currentPlan.title,
              amount: currentPlan.price
            })
          });
          const verifyData = await verifyResp.json();

          if (!verifyResp.ok) throw new Error(verifyData.error || 'Payment verification failed');

          if (messageEl) {
            messageEl.style.color = '#10B981';
            messageEl.innerHTML = `🎉 <strong>Payment Successful!</strong><br>Transaction ID: ${verifyData.txnId}<br>Confirmation email sent to ${email}.`;
          }
          payBtn.textContent = 'Subscribed!';
          setTimeout(() => {
            modal?.classList.remove('active');
            payBtn.disabled = false;
            payBtn.textContent = 'Pay Now & Unlock';
          }, 3000);
        },
        prefill: { name, email },
        theme: { color: '#21B0A6' },
        modal: {
          ondismiss: function() {
            payBtn.disabled = false;
            payBtn.textContent = 'Pay Now & Unlock';
          }
        }
      });

      razorpay.open();
    } catch (err) {
      if (messageEl) {
        messageEl.style.color = 'crimson';
        messageEl.textContent = 'Error: ' + err.message;
      }
      payBtn.disabled = false;
      payBtn.textContent = 'Pay Now & Unlock';
    }
  });
}

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  initAiWidget();
  initSubscriptionCheckout();

  // Lead magnet form submit listener
  const leadForm = document.getElementById('leadMagnetForm');
  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('leadEmail').value;
      alert(`Success! Class 10 Science Formula Cheat-Sheet sent to ${email}`);
      leadForm.reset();
    });
  }
});
