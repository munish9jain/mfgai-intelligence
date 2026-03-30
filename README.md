# MfgAI Intelligence — Deployment Guide

## What This Is
A live daily manufacturing AI briefing tool that:
- Generates fresh AI-powered stories every time someone visits
- Tracks visitor count
- Sends you an email notification for each visitor
- Has a full searchable story library
- Works on any device including mobile

---

## Deploy in 15 Minutes (Free)

### Step 1 — Get a free Resend account (email notifications)
1. Go to https://resend.com and sign up free
2. Go to API Keys → Create API Key → copy it
3. Verify your email address (for sending notifications to yourself)

### Step 2 — Upload to GitHub
1. Go to https://github.com and create a free account if needed
2. Click "New repository" → name it `mfgai-intelligence` → Create
3. Upload all files from this folder (drag and drop works)

### Step 3 — Deploy to Netlify
1. Go to https://netlify.com and sign up free (use GitHub login)
2. Click "Add new site" → "Import from Git" → Choose your GitHub repo
3. Build settings:
   - Build command: (leave empty)
   - Publish directory: `public`
4. Click "Deploy site"

### Step 4 — Add Environment Variables
In Netlify: Site Settings → Environment Variables → Add these:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your API key from https://console.anthropic.com |
| `RESEND_API_KEY` | Your Resend API key from Step 1 |
| `NOTIFY_EMAIL` | Your email address (where you want notifications) |
| `COUNTER_NAMESPACE` | `mfgai-intelligence` |
| `COUNTER_KEY` | `visits` |

### Step 5 — Trigger a redeploy
In Netlify: Deploys → Trigger Deploy → Deploy site

Your site is now live at: `https://[your-site-name].netlify.app`

---

## Getting Your Own Domain (Optional, Free with Netlify)
- Netlify gives you a free `.netlify.app` subdomain
- You can rename it to something like `mfgai-intelligence.netlify.app`
- In Netlify: Site Settings → General → Site name → change it

---

## Your API Key
Get your Anthropic API key from: https://console.anthropic.com
- Each visitor costs approximately $0.01-0.03 in API credits
- Anthropic gives $5 free credit to start
- At 1,000 visitors that's roughly $10-30 total

---

## Visitor Counter
Uses countapi.xyz (free, no account needed).
The counter increments on every visit and displays in the header.

---

## Email Notifications
Uses Resend (free tier: 100 emails/day, 3,000/month).
You get one email per visitor with time, referrer, and browser info.

---

## Sharing on LinkedIn
The tool has a "Share on LinkedIn" button built in.
Suggested LinkedIn post copy:

---
🏭 I built a free daily briefing tool showing how AI is improving manufacturing productivity.

Real examples. Real ROI numbers. Practical first steps for operations teams of all sizes.

10 categories: Process Automation, Quality Inspection, Predictive Maintenance, Scheduling, Safety, and more.

Check it out: [YOUR LINK]

#Manufacturing #AI #Industry40 #Operations #ManufacturingExcellence
---

## Troubleshooting

**"Could not generate briefing" error**
- Check that ANTHROPIC_API_KEY is set correctly in Netlify environment variables
- Make sure there are no spaces before/after the key
- Trigger a fresh deploy after adding variables

**Counter not working**
- countapi.xyz is a free service with occasional downtime — the site works fine without it

**Not receiving email notifications**
- Verify RESEND_API_KEY and NOTIFY_EMAIL are set
- Check your spam folder
- Make sure your email is verified in Resend dashboard
