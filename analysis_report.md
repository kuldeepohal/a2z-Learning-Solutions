# A2Z Learning Solutions - Website Analysis and Roadmap

## 4. Day-Wise Roadmap (2 Hours Daily)
This plan assumes 2 hours of focused work each day to implement the above improvements over the next 2-3 weeks.

### Week 1: Cleanup and Foundation
* **Day 1: Repo Cleanup & Fixes (Completed)**
  * Resolve merge conflicts in `index.html`.
  * Consolidate duplicate files (`about.html`/`about-us.html`, `contact.html`/`contact-us.html`, `terms.html`/`terms-conditions.html`).
  * Fix all broken internal links across the site.
* **Day 2: Site Architecture & SEO (Completed)**
  * Ensure all active pages have correct meta titles and descriptions.
  * Setup proper directory structures for Classes 6-12 (e.g., creating standard templates for Mathematics, Science, etc.).
* **Day 3: User Authentication Setup (Completed)**
  * Polish `auth.html` UI.
  * Connect a basic backend (using the existing `server.js` or Firebase) for user login/registration.
* **Day 4: Creating the User Dashboard (Completed)**
  * Build a simple dashboard page where a logged-in user is redirected.
  * Add placeholders for "My Bookmarks" and "My Subscriptions".
* **Day 5: Affiliate Marketing Integration**
  * Sign up for the Amazon Affiliate program.
  * Add "Recommended Books" sections to class-specific pages with affiliate links.

### Week 2: Premium Features & Monetization
* **Day 6: Implementing the Freemium Logic (Completed)**
  * Modify chapter pages to show a preview of premium content (blur or lock icon).
  * Add logic to check if a user has a premium subscription before rendering the full content.
* **Day 7: Subscription/Payment Gateway (Completed)**
  * Polish the `subscription.html` page.
  * Integrate a payment gateway like Stripe or Razorpay in `server.js` for handling premium payments.
* **Day 8: Doubt Solver Feature (Completed)**
  * Enhance `doubt-solver.html` to integrate with the backend API.
  * Setup the AI logic (referencing `AI_DOUBT_SOLVER_SETUP.md`) or a manual queue system.
* **Day 9: Test Series Portal UI (Completed)**
  * Create a new page for taking mock tests (`mock-test.html`).
  * Build the UI for multiple-choice questions, timers, and submission.
* **Day 10: Test Series Backend (Completed)**
  * Setup database models (or JSON files) to store questions and answers.
  * Implement the grading logic in the backend to calculate and display scores.

### Week 3: Content Expansion and Ads
* **Day 11: Ads Integration (Completed)**
  * Apply for Google AdSense.
  * Carefully place ad slots on free pages (sidebar, footer, mid-content) without disrupting the learning experience.
* **Day 12: Blog Section Setup (Completed)**
  * Create a basic blog layout.
  * Write and publish the first 2 SEO-optimized study tip articles.
* **Day 13: Video Integration (Completed)**
  * Create a video library component.
  * Embed relevant educational YouTube videos into the chapter pages.
* **Day 14: Testing and Quality Assurance**
  * Go through the entire site as a new user (register, browse, pay, use features).
  * Fix any bugs or mobile-responsiveness issues.
* **Day 15: Launch & Marketing**
  * Deploy the latest changes (Vercel/Cloudflare).
  * Share the website on social media, student forums (Reddit, Quora), and WhatsApp/Telegram groups.
