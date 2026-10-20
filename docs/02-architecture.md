# Step 2: How the Application Works

> Full diagram: `docs/architecture.drawio` (open in draw.io)

## The flow, step by step

```
Evaluator fills the form (product, claim type, claim, evidence) → clicks "Assess"
      │
      │  POST /api/claims/assess
      ▼
NestJS
  1. Check the input is valid             (ValidationPipe + DTO)
  2. Save the claim                       (Prisma → PostgreSQL)
  3. Send claim + evidence to OpenAI      (LlmService)
  4. Check the AI's answer is in the right format   (Zod)
  5. Work out the final result            (justified + confidence)
  6. Save the assessment                  (Prisma → PostgreSQL)
      │
      ▼
React shows: Justified Yes/No · Confidence % · Reasoning · checklist
```

## The main idea: don't just ask the AI "yes or no"

If I only ask the AI "is this claim justified?", I get an answer I can't explain.
So I break the claim into small checks, and the AI answers each one:

| Check | Question |
|---|---|
| Right type of proof | Does the evidence type match the claim type? (clinical test for an efficacy claim) |
| What was measured | Did the study measure wrinkles? |
| How much | Did it reach 20% or more? |
| How long | Did it run for 4 weeks or more? |
| How reliable | Enough people? Placebo group? Statistically significant? |

Then **my code** decides the final result:
- **Justified** = all checks passed
- **Confidence** = checks passed ÷ checks that apply (some claims have no number or time, so those checks are skipped)

Example: 18% instead of 20% → 4 of 5 checks pass → **Justified: No, Confidence: 80%**, and the reasoning says exactly why.

This way the result is easy to explain to a scientist and easy to audit later.

## Why these tools

| Tool | Why I picked it |
|---|---|
| React | Required by the task; simple form + result card |
| NestJS | Required by the task; clean separation: controller, service, DTO |
| Prisma | Schema in one readable file, type-safe queries, built-in migrations |
| PostgreSQL | Real relational DB; supports enums and JSON columns. Azure has a managed version |
| Docker | Only to run Postgres locally with one command |
| OpenAI (structured output) | Forces the AI to reply in a fixed JSON format |
| Zod | Double-checks the AI reply before anything is saved |

## What happens when something goes wrong

| Problem | What the user sees |
|---|---|
| Empty or too-short evidence | 400: "Please add the study evidence" |
| OpenAI is slow or down | Retry once, then 502: "AI service unavailable, try again" |
| AI returns a broken answer | 502: nothing is saved |
| No API key set | The API refuses to start and says `OPENAI_API_KEY` is missing |
