# POOLSIDE — Project README & Roadmap

## What Is Poolside?

Poolside is a SaaS product that lets anyone run golf pools (and eventually other sports pools) with live ESPN scores, real-time leaderboards, tiered drafting, and automatic scoring. The tagline: **"Run your pool from Poolside."**

**Target customers:** Country clubs, office groups, fraternities, fantasy golf leagues, friend groups — anyone who currently runs pools on spreadsheets.

**Revenue model:** Freemium with three tiers:
- **Free:** 1 league, 20 players max, basic leaderboard
- **Pro ($19/mo or $149/yr):** Unlimited leagues & players, custom bonuses, weather/news, CSV exports, advanced stats
- **Elite ($39/mo or $299/yr):** Everything in Pro + prop challenges, season-long tracking, custom themes & logo, white-label

---

## Current State (as of March 29, 2026)

### What's Built & Working

| Feature | Status |
|---|---|
| Firebase Auth (Google + email/password) | ✅ Complete |
| Separate Firebase project (poolside-pro-ca6c6) | ✅ Complete |
| Multi-league dashboard (create, open, delete) | ✅ Complete |
| Create League form (name, tournament, entry fee, admin fee, payout structure, Venmo, tiers, picks, lock date, theme, logo) | ✅ Complete |
| Stripe payment integration (4 payment links: Pro/Elite × Monthly/Annual) | ✅ Complete |
| Stripe webhook (Netlify Function) writes subscription to Firebase | ✅ Complete |
| Auto-refresh subscription status (real-time Firebase listener) | ✅ Complete |
| Pro paywall enforcement (1 league + 20 player limit for free) | ✅ Complete |
| Upgrade modal with Monthly/Annual toggle and "Save 20%" badge | ✅ Complete |
| Pro→Elite upgrade flow (context-aware modal, shows difference pricing) | ✅ Complete |
| 5 theme presets (Clubhouse, Augusta, Burgundy, Slate, Turf) | ✅ Complete |
| Theme selector in Create League form (visual grid) | ✅ Complete |
| Themes apply inside leagues (all styles are theme-driven) | ✅ Complete |
| Logo upload (file upload or URL paste, stored in Firebase) | ✅ Complete |
| Shareable league links (public URL, no login required for participants) | ✅ Complete |
| League config passthrough (league settings drive the pool component) | ✅ Complete |
| League-scoped data isolation (each league's teams/scores stored separately) | ✅ Complete |
| Branded login screen with sign-up flow | ✅ Complete |
| Landing page (separate static site) | ✅ Complete |
| Full GolfPool engine inside each league (ESPN live scores, OWGR tiers, bonuses, missed cut penalties, scorecards, weather, news ticker, admin tools, registration, Venmo QR, email invites, tier compliance check) | ✅ Complete |

### Deployment

| Site | URL | Repo |
|---|---|---|
| Poolside App | poolside-pro.netlify.app | github.com/ayayyron/golf-pool-pro |
| Landing Page | (deploy when ready) | github.com/ayayyron/poolside-landing |
| Personal Pool (unchanged) | golf-pool.netlify.app | separate, do not touch |

### Tech Stack
- **Frontend:** Single HTML file, React 18 (UMD + Babel in-browser), inline styles
- **Backend:** Firebase Realtime Database + Firebase Auth
- **Payments:** Stripe (test mode, Payment Links)
- **Serverless:** Netlify Functions (stripe-webhook.js)
- **Hosting:** Netlify (auto-deploy from GitHub)

### Key Credentials & Config
- **Firebase project:** poolside-pro-ca6c6
- **Stripe account:** "Golf Pool Pro sandbox" (test mode)
- **Netlify env vars:** STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
- **EmailJS:** service_fejhh3j / template_swuo2vq / key Lj2-JEJW4Tn_ZA1Q0

---

## What's NOT Built Yet (Priority Order)

### 1. Season-Long Fantasy League (Elite Tier)
**What it is:** A league that spans multiple tournaments across a season. Players accumulate points across events.

**How it works:**
- Admin selects which tournaments count (e.g., all 4 majors, or 10 Signature Events, or custom)
- Each tournament, players pick a new team OR keep roster with limited trades/swaps
- Cumulative scoring: lowest total across all tournaments wins
- Could include a "no-repeat" rule: once you pick a golfer, you can't pick them again in a future tournament

**What needs to be built:**
- Season data model in Firebase: `seasons/{seasonId}/tournaments/[...]`, `seasons/{seasonId}/standings/{teamName}`
- Season creation form in admin (select tournaments, set trade rules)
- Season leaderboard that sums across tournaments
- Tournament-to-tournament transition flow

### 2. Prop Challenges with Point Staking (Elite Tier)
**What it is:** Before each tournament, admins publish Yes/No or Over/Under props. Players stake accumulated season points on these props.

**How it works:**
- Admin creates 8-12 props per tournament (e.g., "Will there be a hole-in-one?", "Winner from top 10 OWGR?", "Over/under 20 field eagles")
- Each prop has odds (e.g., Yes at +150, No at -200)
- Players allocate points from their season total (max 25% per tournament)
- Win: get stake back + payout at odds
- Lose: lose staked points
- Creates massive leaderboard swings and engagement

**What needs to be built:**
- Prop creation UI in admin panel
- Prop betting interface for players (before tournament starts)
- Prop resolution logic (after tournament ends, auto-resolve using ESPN data where possible)
- Point staking math and leaderboard recalculation
- Props history/results page

### 3. Pro Paywall Feature Gating
**What's done:** League limit (1 free) and player limit (20 free) are enforced.

**Still needed:**
- Gate weather widget behind Pro check
- Gate news ticker behind Pro check  
- Gate CSV export behind Pro check
- Gate custom bonuses behind Pro check
- Show "Upgrade to unlock" prompts at the right moments instead of just hiding features

### 4. Stripe Live Mode
**What's needed to go live with real payments:**
- Toggle Stripe from Test to Live mode in the dashboard
- Create 4 new Live payment links (Pro/Elite × Monthly/Annual)
- Replace test payment link URLs in the code with live ones
- Update webhook endpoint URL if different
- Get a new webhook signing secret for live mode
- Update Netlify env vars with live keys
- **Important:** Do NOT go live until you've tested the full flow in test mode

### 5. Custom Domain
- Buy a domain (poolside.app, getpoolside.com, poolside.co, etc.)
- Point root domain to landing page Netlify site
- Point app.poolside.xxx to the app Netlify site
- Update Firebase authorized domains
- Update all hardcoded URLs in the code (POOL_URL, landing page links)

### 6. Email System Upgrade
- Current: EmailJS (upgrading to 2,000/month plan)
- Eventually: Switch to Resend or Mailgun for higher volume and better deliverability
- Needed: Welcome email when someone creates a Poolside account, subscription confirmation emails, weekly digest emails for season-long leagues

### 7. Mobile Polish
- Test thoroughly on iOS Safari and Android Chrome
- Ensure all modals scroll properly on small screens
- Touch-friendly tap targets (already mostly done)
- Consider PWA (add to home screen) improvements

### 8. Code Architecture Migration (Post-Revenue)
- Current: Single 5,000+ line HTML file with inline React/Babel
- Target: Vite + React project with proper component files
- When: After reaching $1k+ MRR (don't fix what's making money)
- This improves: load time, developer experience, code splitting, testing

---

## Marketing Plan: Step-by-Step Guide

### Phase 1: Free Marketing (Week 1-2) — $0

#### Reddit (Highest ROI for golf tools)

**How Reddit works:**
- Reddit is organized into "subreddits" (communities) focused on specific topics
- Each subreddit has rules — read them before posting (sidebar on desktop, "About" tab on mobile)
- Reddit HATES self-promotion. If your first post is "buy my product," you'll get banned instantly
- The key: provide value first, mention your product naturally

**Step-by-step:**
1. Create a Reddit account (use a personal-sounding username, not "PoolsideApp")
2. Spend 2-3 days browsing and commenting on posts in these subreddits:
   - r/golf (2.5M+ members — THE golf community)
   - r/fantasygolf
   - r/GolfSwing (smaller but engaged)
   - r/ProGolf
3. After you have some comment history (important!), make your first post:

**Template post for r/golf (post this the week before a major):**
```
Title: I built a free tool to run your Masters pool — live ESPN scores, automatic leaderboard, no spreadsheets

Hey r/golf,

Every year I run a Masters pool for my friends and every year I waste 
hours updating a spreadsheet. This year I finally built something to 
automate it.

It's called Poolside — you create a pool, share a link, your friends 
pick their teams across OWGR tiers, and the leaderboard updates 
automatically from ESPN. It handles entry fees via Venmo QR codes, 
tracks who's paid, and even has weather for the tournament venue.

Free for up to 20 players. Just wanted to share in case anyone else 
is tired of the spreadsheet grind.

[link to landing page]

Happy to answer any questions about how it works.
```

**Critical Reddit rules:**
- Only post this ONCE per subreddit. Reposting = ban
- Respond to every comment (engagement helps your post rank higher)
- Be genuine and helpful, not salesy
- If people criticize it, thank them for feedback
- Don't use link shorteners (Reddit blocks them)
- Best posting times: Tuesday-Thursday, 9-11am EST

#### Twitter/X

**Step-by-step:**
1. Create @PoolsideApp (or similar) account
2. Set profile pic to your gold P logo, cover photo to a screenshot of the leaderboard
3. Bio: "Run your pool from Poolside. Live scores, auto leaderboards, zero spreadsheets. Free to start. ⛳"
4. Post 3-5 tweets before promoting:
   - Screenshot of a leaderboard during a live tournament
   - "The worst part of running a pool is updating the spreadsheet" (relatable content)
   - A hot take about the current tournament
5. Then post the launch tweet:

```
I built a tool that replaces the spreadsheet you use to run your golf pool.

→ Live ESPN scores
→ OWGR-tiered drafting  
→ Venmo QR for entry fees
→ Real-time leaderboard

Free for up to 20 players.

poolside-pro.netlify.app

Perfect timing for The Masters 🏌️‍♂️
```

6. Tag golf accounts with 5k-20k followers (they're more likely to engage than massive accounts)
7. Post during tournaments when golf Twitter is most active

#### LinkedIn (Your Finance Network)

**Why this works:** You're a finance professional who built a SaaS product. That's a compelling story for LinkedIn.

**Post template:**
```
I've been running a golf pool for my friends for years using a spreadsheet.

This year, I decided to build something better.

Poolside is a free tool that automates everything — live ESPN scores, 
OWGR-based team drafting, Venmo payment collection, real-time leaderboards.

I built it in about 2 weeks using React, Firebase, and way too much coffee.

If you run an office pool, a club tournament, or just want to make the 
Masters more fun — check it out: [link]

Curious what other "I got tired of spreadsheets" problems people 
have that could be turned into tools?

#golf #masters #saas #buildinpublic
```

#### Facebook Golf Groups

**Step-by-step:**
1. Search Facebook for groups: "Masters Pool", "Fantasy Golf", "Golf Betting", "PGA Tour Fans"
2. Join 5-10 groups (some require approval, apply to all)
3. Once approved, post something like the Reddit template (but shorter, more casual)
4. Facebook groups are less hostile to self-promotion than Reddit, but still lead with value
5. Best time: the week before a major tournament

#### Word of Mouth

- Send the landing page to everyone in your personal Masters pool
- Ask each of them to share with ONE other person who runs a pool
- Text/email your golf buddies: "Hey, I built this thing, would love your feedback"
- Ask your country club pro shop if they'd be interested in using it

### Phase 2: Cheap Paid Marketing (Week 3-4) — $50-200

#### Instagram/Facebook Ads

**How to set up:**
1. Go to business.facebook.com → Create an account (or use personal)
2. Go to Ads Manager → Create Campaign
3. Settings:
   - **Objective:** Traffic (send people to your landing page)
   - **Audience:** 
     - Age: 25-55
     - Interests: Golf, PGA Tour, Fantasy Sports, Masters Tournament
     - Location: United States
   - **Budget:** $10-20/day for 5-7 days ($50-140 total)
   - **Placement:** Instagram Feed + Instagram Stories + Facebook Feed
4. **Ad creative:** Screenshot of the leaderboard on a phone mockup with text overlay: "Run your pool from Poolside. Free for up to 20 players."
5. **Landing page URL:** Your landing page
6. Run it the week before a major for maximum relevance

**Tips:**
- Start with $10/day and see what the click-through rate is
- If CTR is above 1%, increase budget
- If below 0.5%, change the creative
- Kill ads that don't perform after 3 days

#### Reddit Ads (Surprisingly Effective for Niche Products)

1. Go to ads.reddit.com
2. Create campaign → Traffic objective
3. Target subreddits: r/golf, r/fantasygolf, r/sports
4. Budget: $5-10/day
5. Reddit ads look like normal posts — this is good, they blend in
6. Use the same copy as your organic Reddit post

### Phase 3: Growth & Retention (Ongoing)

- **"Powered by Poolside"** footer on every shared league page (free marketing from every participant)
- **Referral incentive:** "Invite a league organizer → get 1 month Pro free" (build this later)
- **Email sequence:** After someone signs up, send a 3-email welcome sequence:
  1. Day 0: "Welcome to Poolside — here's how to create your first league"
  2. Day 2: "Pro tip: Share your league link in your group chat"
  3. Day 5: "The Masters starts Thursday — is your pool ready?" (timely)
- **Content marketing:** Write a blog post: "How to Run a Masters Pool in 2026" — SEO will bring in organic traffic every April forever
- **Seasonal pushes:** Market heavily the week before each major (Masters, PGA Championship, US Open, Open Championship)

---

## Revenue Projections

Conservative estimates:

| Milestone | Timeline | MRR |
|---|---|---|
| 10 free users, 2 Pro | Month 1 | $38 |
| 50 free users, 10 Pro, 2 Elite | Month 3 | $268 |
| 200 free users, 40 Pro, 8 Elite | Month 6 | $1,072 |
| 500 free users, 100 Pro, 20 Elite | Month 12 | $2,680 |
| 1000 free, 200 Pro, 50 Elite | Month 18 | $5,750 |

The $5k MRR target is realistic within 12-18 months if you market consistently around each major tournament and the product works well.

---

## Key Decisions Made

1. **Product name:** Poolside (sport-agnostic, expandable)
2. **Separate Firebase project** from personal pool (poolside-pro-ca6c6)
3. **Keep single-file architecture** until post-revenue, then migrate to Vite+React
4. **Stripe Payment Links** (not custom Checkout Sessions) for simplicity
5. **No betting/gambling features** — just league management software
6. **Navy/gold "Modern Clubhouse" theme** as default (not Masters green)
7. **Participants don't need accounts** — only league admins need to sign in
8. **Each league admin sets their own Venmo** — Poolside never touches entry fee money

---

## Files & Repo Structure

```
poolside/ (formerly golf-pool-pro)
  index.html                    — The entire Poolside app (~5000 lines)
  netlify.toml                  — Netlify config (publish dir + functions location)
  netlify/
    functions/
      stripe-webhook.js         — Handles Stripe payment webhooks → writes to Firebase

poolside-landing/
  index.html                    — Static landing/marketing page

golf-pool/
  index.html                    — Personal Masters pool (DO NOT MODIFY)
```

---

## How to Resume Development

When starting a new Claude session, say something like:

> "I'm building a SaaS product called Poolside (poolside-pro.netlify.app). It's a golf pool management platform. I need to continue development. Here's my current index.html file [attach]. I need to build [specific feature]. The app uses React 18 (UMD + Babel in-browser), Firebase Realtime Database (project: poolside-pro-ca6c6), Stripe for payments, and Netlify for hosting with a serverless function for webhooks."

Then attach your current index.html file so Claude has the full codebase.

Key context to include:
- The `THEMES` object defines 5 color presets
- `makeStyles(T)` generates all styles from a theme
- `GolfPool` component accepts `leagueTheme`, `leagueConfig`, and `leagueId` props
- `LCFG` inside GolfPool overrides `CFG` with league-specific settings
- Storage functions `loadS`/`saveS` use `_leaguePrefix` for data isolation
- `PoolsideApp` is the top-level component with auth, dashboard, and league routing
- Shared league links use URL params: `?league=ID&owner=UID`

---

## Contact & Accounts

- **GitHub:** github.com/ayayyron
- **Email:** sandiferaaron@gmail.com
- **Stripe:** "Golf Pool Pro sandbox" (rename to "Poolside" when going live)
- **Firebase Console:** console.firebase.google.com (project: poolside-pro-ca6c6)
- **Netlify:** app.netlify.com (project: poolside-pro)
