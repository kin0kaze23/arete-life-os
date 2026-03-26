# AreteLifeOS - MVP Testing Checklist

## Test Session: [DATE]
**Tester:** [YOUR NAME]  
**Device:** [Mac/iPhone/iPad]  
**Browser:** [Chrome/Safari/Firefox]  
**Branch:** feature/phase-0-to-4-complete

---

## 🔐 SETUP (5 minutes)

### 1. Environment Check
- [ ] `.env.local` exists with Supabase credentials
- [ ] `npm install` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] Site accessible at http://localhost:5173

**Evidence:** Screenshot of dev server running

### 2. Fresh User State
```bash
# In browser DevTools → Application → Storage
- Clear all site data
- Clear localStorage
- Clear sessionStorage
- Clear IndexedDB
- Reload page
```

**Evidence:** Screenshot of clean storage

---

## 🎯 CORE VALUE PROPOSITION (15 minutes)

### 3. Onboarding Flow (Target: <90 seconds)
- [ ] Welcome screen loads with animation
- [ ] "Get Started" button works
- [ ] Profile Basics: Age picker works (18-80)
- [ ] Profile Basics: Location input accepts text
- [ ] Profile Basics: Role dropdown has 5 options
- [ ] Profile Basics: Skip link works
- [ ] Goal screen: Textarea accepts 20-280 chars
- [ ] Goal screen: Character counter updates
- [ ] Goal screen: Skip link works
- [ ] First Insights: Generates 2-3 insights
- [ ] First Insights: "Enter Dashboard" completes onboarding
- [ ] Tutorial overlay appears
- [ ] Tutorial highlights LifePulseBar
- [ ] Tutorial highlights Do & Watch section
- [ ] Tutorial highlights Log Bar
- [ ] Tutorial "Got it" completes flow

**⏱️ TIME TO COMPLETE:** ____ seconds (Target: <90s)

**Evidence:** Screen recording or screenshots of each screen

**Pass Criteria:**
- All screens load without errors
- Navigation works (back/forward/skip)
- First insights generate within 2 seconds
- Total time <90 seconds

### 4. First Log Experience (Target: <30 seconds)
- [ ] Dashboard loads after onboarding
- [ ] LifePulseBar shows 5 dimension scores
- [ ] Log bar visible at bottom
- [ ] Quick log actions visible (Check-in, Expense, Win)
- [ ] Add first log: "Testing first log - [timestamp]"
- [ ] Log appears in feed immediately
- [ ] LifePulseBar updates with animation
- [ ] No console errors

**⏱️ TIME TO FIRST LOG:** ____ seconds (Target: <30s)

**Evidence:** Before/after screenshots of LifePulseBar

### 5. Value Delivery (First 5 minutes)
- [ ] After 3 logs, insight appears
- [ ] Insight is relevant to logged data
- [ ] Dashboard shows "Do & Watch" section
- [ ] Dashboard shows upcoming events (if any)
- [ ] No errors in browser console
- [ ] No network errors

**Evidence:** Screenshot of first insight card

**Pass Criteria:**
- User sees personalized value within 5 minutes
- No errors degrade experience

---

## 🎨 UI/UX DELIGHT FACTOR (10 minutes)

### 6. Visual Design (iPhone 375px viewport)
- [ ] All text readable without zooming
- [ ] Touch targets 44x44px minimum (use DevTools ruler)
- [ ] No horizontal scroll
- [ ] Animations smooth (60fps)
- [ ] Colors consistent with design system
- [ ] Icons load correctly
- [ ] Images optimized (no loading lag)

**Evidence:** DevTools screenshot with viewport at 375px

### 7. Responsive Testing
| Device | Viewport | Status | Notes |
|--------|----------|--------|-------|
| iPhone SE | 375px | [ ] Pass [ ] Fail | |
| iPhone 14 Pro | 393px | [ ] Pass [ ] Fail | |
| iPad Mini | 768px | [ ] Pass [ ] Fail | |
| iPad Pro | 1024px | [ ] Pass [ ] Fail | |
| Desktop | 1440px | [ ] Pass [ ] Fail | |

**Evidence:** Screenshots at each breakpoint

### 8. Motion & Animation
- [ ] Page transitions smooth (0.3s)
- [ ] Button clicks have feedback
- [ ] Loading states show progress (not spinner)
- [ ] Success states animate
- [ ] `prefers-reduced-motion` respected (test in DevTools)

**Evidence:** Screen recording of interactions

### 9. Delight Moments
Rate each (1-5, 5 = most delightful):
- Welcome screen animation: ___
- First insight reveal: ___
- LifePulseBar update animation: ___
- Log completion feedback: ___
- Tutorial overlay: ___

**Average Delight Score:** ___/5 (Target: 4+)

---

## 🤖 INTELLIGENCE LAYER (10 minutes)

### 10. Pattern Detection
**Setup:** Log 10+ items across different categories

- [ ] Log health item (sleep, exercise, mood)
- [ ] Log finance item (expense, income)
- [ ] Log relationship item (win, interaction)
- [ ] Log work item (task, focus session)
- [ ] Log faith item (prayer, reflection)

After 10 logs:
- [ ] Pattern insight appears (e.g., "You log X on Mondays")
- [ ] Pattern is accurate
- [ ] Insight card dismissible
- [ ] Click-to-action works

**Evidence:** Screenshot of pattern insight

### 11. Trend Detection
- [ ] Trend arrows visible on dimension cards (↑ → ↓)
- [ ] Trend colors correct (green=up, red=down, gray=same)
- [ ] Percentage change shown
- [ ] Trends update after new logs

**Evidence:** Screenshot of trend indicators

### 12. Benchmarking
- [ ] Benchmark comparisons visible
- [ ] "vs others your age" or similar labeling
- [ ] Benchmarks feel relevant
- [ ] No false precision (e.g., "top 37.2%")

**Evidence:** Screenshot of benchmark insight

### 13. Insight Quality
Rate each insight type (1-5, 5 = most useful):
- Pattern insights: ___
- Benchmark insights: ___
- Predictive insights: ___
- Actionable insights: ___

**Average Insight Quality:** ___/5 (Target: 4+)

---

## 📱 IPHONE WEB APP (10 minutes)

### 14. iPhone Safari Testing
**Device:** Actual iPhone (not simulator)

- [ ] Site loads on Safari
- [ ] All buttons tappable (no "hover" states that don't work)
- [ ] Keyboard doesn't cover inputs
- [ ] Pull-to-refresh doesn't break app
- [ ] Back/forward navigation works
- [ ] No iOS-specific bugs

**Evidence:** Photo of iPhone showing app

### 15. Add to Home Screen
- [ ] "Add to Home Screen" prompt appears
- [ ] App icon displays correctly
- [ ] App opens full-screen (no browser UI)
- [ ] Status bar color matches theme
- [ ] Feels like native app

**Evidence:** Photo of home screen with app icon

### 16. Offline Capability
**Test:** Turn on Airplane Mode

- [ ] App loads from cache
- [ ] Can view existing logs
- [ ] Can add new logs (queued for sync)
- [ ] "Offline" indicator visible
- [ ] Syncs when back online

**Evidence:** Screenshot of offline state

---

## 🤖 TELEGRAM INTEGRATION (10 minutes)

### 17. Bot Setup
- [ ] Telegram bot token configured in .env
- [ ] Webhook configured (`/api/telegram/webhook`)
- [ ] Bot responds to /start command
- [ ] Bot shows welcome message

**Evidence:** Screenshot of Telegram chat

### 18. Logging via Telegram
- [ ] Send message: "Log: Great workout today 💪"
- [ ] Bot confirms log added
- [ ] Log appears in web dashboard
- [ ] Category detected correctly (Health)

**Evidence:** Before/after screenshots (Telegram + Dashboard)

### 19. Chat with AI
- [ ] Send message: "What should I focus on today?"
- [ ] AI responds with relevant guidance
- [ ] Response time <5 seconds
- [ ] Response feels personalized

**Evidence:** Screenshot of AI response

### 20. Image Analysis (if implemented)
- [ ] Send photo (e.g., meal, workout)
- [ ] Bot analyzes image
- [ ] Extracts relevant data
- [ ] Creates log entry

**Evidence:** Screenshot of image analysis result

### 21. Sync Verification
- [ ] Log in Telegram → appears in web app within 10s
- [ ] Log in web app → visible in Telegram history
- [ ] No duplicate entries
- [ ] No lost entries

**Evidence:** Side-by-side comparison

---

## 🔄 SYNC & DATA INTEGRITY (5 minutes)

### 22. Supabase Sync
- [ ] Log on Mac → check Supabase Table Editor
- [ ] Entry appears in vault_entries table
- [ ] Entry is encrypted (not plaintext)
- [ ] Log on iPhone → appears on Mac within 10s
- [ ] No sync conflicts
- [ ] No data loss

**Evidence:** Supabase Table Editor screenshot

### 23. Multi-Device Test
**Devices:** Mac + iPhone

- [ ] Log "Test from Mac" on Mac
- [ ] Refresh iPhone → appears within 10s
- [ ] Log "Test from iPhone" on iPhone
- [ ] Refresh Mac → appears within 10s
- [ ] No duplicate entries
- [ ] No missing entries

**Evidence:** Photo showing both devices with same data

---

## ⚡ PERFORMANCE (5 minutes)

### 24. Page Load Performance
**Tool:** Chrome DevTools → Lighthouse

- [ ] First Contentful Paint: <1.5s
- [ ] Time to Interactive: <3s
- [ ] Total Blocking Time: <200ms
- [ ] Cumulative Layout Shift: <0.1

**Evidence:** Lighthouse report screenshot

### 25. Dashboard Performance
- [ ] Dashboard render: <100ms (use DevTools Performance tab)
- [ ] Scroll smooth (60fps)
- [ ] No jank during interactions
- [ ] Memory usage stable (no leaks)

**Evidence:** Performance tab screenshot

### 26. Bundle Size
- [ ] Main bundle: <500KB (check dist/assets/)
- [ ] Initial load: <100KB
- [ ] Lazy loading works for heavy components

**Evidence:** Build output screenshot

---

## 🔒 SECURITY & PRIVACY (5 minutes)

### 27. Authentication
- [ ] Can create account
- [ ] Can log in
- [ ] Can log out
- [ ] Session persists across reloads
- [ ] Session expires after logout

**Evidence:** Screenshot of auth flow

### 28. Data Encryption
- [ ] Check Supabase vault_entries → data is encrypted
- [ ] Can't read plaintext in database
- [ ] Encryption key stored in localStorage (not sent to server)

**Evidence:** Supabase Table Editor showing encrypted data

### 29. Security Headers
**Tool:** https://securityheaders.com/

- [ ] Content-Security-Policy: Present
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security: Present

**Evidence:** Security headers report

### 30. No Secrets in Code
- [ ] No API keys in frontend code
- [ ] No secrets in localStorage
- [ ] Environment variables prefixed with VITE_ (client) or no prefix (server)

**Evidence:** Screenshot of DevTools → Application → Local Storage

---

## 🐛 ERROR HANDLING (5 minutes)

### 31. Network Errors
**Test:** Turn on Airplane Mode

- [ ] User-friendly error message appears
- [ ] App doesn't crash
- [ ] Retry button works
- [ ] Offline mode activates

**Evidence:** Screenshot of error state

### 32. Invalid Input
- [ ] Age: Rejects <18 and >80
- [ ] Goal: Rejects <20 chars
- [ ] Amount: Rejects non-numeric
- [ ] Clear error messages shown

**Evidence:** Screenshot of validation errors

### 33. API Errors
**Test:** Set invalid Supabase URL in .env.local

- [ ] Graceful error message
- [ ] No crash
- [ ] Recovery possible after fix

**Evidence:** Screenshot of error handling

---

## ✅ FINAL CHECKLIST

### 34. Must-Have Features
- [ ] Onboarding completes in <90s
- [ ] First log within 30s of onboarding
- [ ] First insight within 5 minutes
- [ ] Dashboard loads <100ms
- [ ] Sync works Mac ↔ iPhone
- [ ] Telegram logging works
- [ ] No critical bugs (crashes, data loss)

### 35. Nice-to-Have Features
- [ ] Trend indicators
- [ ] Benchmark comparisons
- [ ] Weekly digest
- [ ] Smart suggestions
- [ ] Add to Home Screen works

### 36. Blockers for Production
- [ ] No data loss
- [ ] No security vulnerabilities
- [ ] No PII exposed
- [ ] No console errors
- [ ] No network errors in production

---

## 📊 TEST RESULTS SUMMARY

**Date:** ___________  
**Tester:** ___________

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| Onboarding (<90s) | ___/10 | [ ] Pass [ ] Fail | |
| First Log (<30s) | ___/10 | [ ] Pass [ ] Fail | |
| UI/UX Delight | ___/10 | [ ] Pass [ ] Fail | |
| Intelligence Quality | ___/10 | [ ] Pass [ ] Fail | |
| iPhone Experience | ___/10 | [ ] Pass [ ] Fail | |
| Telegram Integration | ___/10 | [ ] Pass [ ] Fail | |
| Sync & Data | ___/10 | [ ] Pass [ ] Fail | |
| Performance | ___/10 | [ ] Pass [ ] Fail | |
| Security | ___/10 | [ ] Pass [ ] Fail | |
| Error Handling | ___/10 | [ ] Pass [ ] Fail | |

**TOTAL SCORE:** ___/100

**PRODUCTION READY?** [ ] YES [ ] NO - See blockers below

### Critical Blockers (must fix before production):
1. 
2. 
3. 

### Major Issues (fix within 1 week):
1. 
2. 
3. 

### Minor Issues (nice to fix):
1. 
2. 
3. 

### Wins & Delight Moments:
1. 
2. 
3. 

---

## 🚀 DEPLOYMENT CHECKLIST (After Testing)

- [ ] All critical blockers fixed
- [ ] .env.example updated with all required vars
- [ ] Supabase credentials added to Vercel
- [ ] Deploy to Vercel production
- [ ] Test production URL on iPhone
- [ ] Verify sync works in production
- [ ] Monitor Vercel logs for errors
- [ ] Celebrate! 🎉

---

**Testing Complete:** [DATE/TIME]  
**Ready for Production:** [ ] YES [ ] NO  
**Next Steps:** _________________
