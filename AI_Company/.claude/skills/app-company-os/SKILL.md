---
name: app-company-os
description: Turn one app idea into a Final App Launch Plan by running it through six specialist agent perspectives (Customer, Product, UX, AI Strategy, Monetization, Growth) that build on each other, critique the result, and end in a BUILD / CHANGE / VALIDATE FIRST recommendation. Use when the user pastes an app idea and wants a structured launch plan, or asks to run "app company os" / "the 6 agents" on an idea.
---

# App Company OS

"$100M AI App Company" framework (branding only, not a valuation claim) — six specialist
personas inspired by publicly available product/UX/AI-strategy/monetization/growth/customer
frameworks. Not affiliated with, endorsed by, or trained on any real person. Never speak as,
quote, or claim endorsement from a real person while running this skill.

## How to run it

1. Collect the eight-line Master Input below from the user. Only APP IDEA, PROBLEM,
   TARGET USER, MAIN GOAL, and PLATFORM are required — the rest are optional. If the user
   hasn't given you an idea yet, ask for it before proceeding.
2. Run the Master Prompt pipeline (Steps 1–7 below) yourself, in order, each step building on
   the previous one's output.
3. To go deeper on a single dimension after the full run, use the matching standalone prompt in
   `agents/` (customer.md, product.md, ux.md, ai-strategy.md, monetization.md, growth.md) with
   the Master Input plus whatever prior agent output is relevant as CONTEXT.
4. End every run with the BUILD / CHANGE / VALIDATE FIRST call framed as a recommendation —
   the decision belongs to the user, made outside the chat.

## Ground rules (apply to every step and every agent)

- Never invent revenue, downloads, users, conversion rates, retention, App Store rankings,
  growth percentages, market size, customer research, funding, or performance numbers.
- If a number is unavailable, write `DATA NOT PROVIDED`. If it's a future measurement, write
  `[TO BE MEASURED]`.
- Never pretend an integration, API, or dataset already exists — mark it `[TO BUILD]` or
  `[VERIFY]`.
- Tag every substantive line `FACT` (from the user's input), `ASSUMPTION`, or `IDEA`.
- Short paragraphs, tables where useful, specific over clever.
- Disagree across agents where the evidence points different ways — don't converge for the
  sake of it.

## Master Input Template

```
APP IDEA: ______
WHAT PROBLEM DOES IT SOLVE: ______
TARGET USER: ______
MAIN GOAL: ______
PLATFORM: iOS / Android / Web
EXISTING FEATURES (OPTIONAL): ______
COMPETITORS (OPTIONAL): ______
BUDGET/RESOURCES (OPTIONAL): ______
```

## Master Prompt pipeline

Work through these in order, with clear headings, each step building on the last:

**STEP 1 — CUSTOMER**: target user · main problem · current alternatives · pain points ·
desired outcome · why they would use this app. Tag FACT / ASSUMPTION.

**STEP 2 — PRODUCT**: turn the idea into a focused V1 — core value proposition · 3–5
must-have features · features to REMOVE · main user action · product differentiation.
Prioritize simplicity.

**STEP 3 — UX**: the user journey DOWNLOAD/OPEN → ONBOARD → INPUT → CORE ACTION →
RESULT → EDIT → SAVE/SHARE → RETURN, then describe the main screens.

**STEP 4 — AI STRATEGY**: where AI is actually useful · what should NOT use AI ·
AI-powered features · required data · suggested high-level architecture · human
review/safety where needed. Do not pretend integrations already exist.

**STEP 5 — MONETIZATION**: three models — FREE, PRO, ONE-TIME/PREMIUM. For each: what's
free · what users pay for · why the upgrade has value. Do NOT invent revenue or conversion
numbers.

**STEP 6 — GROWTH**: acquisition ideas · activation moment · retention strategy ·
referral/share loop · 5 growth experiments · launch channels.

**STEP 7 — 6-AGENT REVIEW**: PRODUCT (is it simple and useful?) · UX (does it feel
effortless?) · AI (does AI create meaningful value?) · MONETIZATION (is there a clear
reason to pay?) · GROWTH (why would people return or share?) · CUSTOMER (does this solve a
real problem?). Each agent gives 3 specific critiques and 1 fix. Disagree where the
evidence points different ways. Then combine the strongest feedback.

**FINAL APP LAUNCH PLAN** — exactly these fields: APP NAME · ONE-SENTENCE PITCH · TARGET
USER · PROBLEM · SOLUTION · CORE FEATURES · USER FLOW · AI FEATURES · PRICING OPTIONS ·
GROWTH PLAN · LAUNCH STRATEGY · RISKS · WHAT TO TEST FIRST · NEXT 5 ACTIONS.

End with: **BUILD / CHANGE / VALIDATE FIRST** — explain the recommendation. The final
decision is the user's.

## Before-you-build checklist to surface at the end

- Talked to at least 5 real target users about the problem?
- V1 is 3–5 features and one main action — nothing else?
- Every AI feature has a plan for when the model is wrong?
- Every number in the plan is `DATA NOT PROVIDED`, a `FACT` the user supplied, or
  `[TO BE MEASURED]`?
- The BUILD / CHANGE / VALIDATE FIRST decision is the user's, made outside this chat.

## Disclaimer to include with any launch plan output

"$100M AI App Company" is creative branding and does not represent actual company value,
revenue, funding, or guaranteed results. These agent personas are inspired by publicly
available ideas and frameworks associated with the people referenced; they are not
affiliated with or endorsed by them, none of those people created, trained, reviewed,
approved, or use this system, and no quotes are attributed to them. AI outputs are a
starting point — validate with real users before building.
