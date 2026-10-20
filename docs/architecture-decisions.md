# Technical Architecture Justification

The key decisions, the alternatives I considered, and why I chose what I did.

---

## Overview

```
React (Vite)  →  NestJS API  →  OpenAI SDK  →  LLM (Gemini now · Azure OpenAI in production)
                     │
                     └──→  Prisma  →  PostgreSQL
```

One NestJS service with clear modules (`claims`, `llm`, `prisma`, `health`), one database, one external AI service.

---

## Decisions

### 1. The AI answers questions; our code makes the decision
- **Chosen:** The AI answers five fixed checks. Our code computes *justified* (all applicable checks passed) and the *confidence* (passed ÷ applicable).
- **Alternative:** Ask the AI "is this claim justified, and how confident are you?"
- **Why:** The verdict becomes explainable ("failed: 18% vs 20%"), repeatable and unit-tested. LLM self-reported confidence is not reliable.
- **Trade-off:** The five checks are fixed. A new kind of check needs a code and prompt change (versioned via `promptVersion`).

### 2. Strict verdict, no threshold
- **Chosen:** One failed check means *Not justified*, even at 80%.
- **Alternative:** "Justified if confidence ≥ 80%".
- **Why:** A claim that overstates the result (20% claimed, 18% measured) cannot be published. A threshold would let it through.
- **Trade-off:** The UI must make clear that 80% means "one specific gap", which the checklist shows.

### 3. Structured output, validated twice
- **Chosen:** JSON schema response format sent to the model, then validated again with Zod, plus a check that each of the 5 checks appears exactly once.
- **Alternative:** Free text parsed with regex, or trusting the SDK's parsing alone.
- **Why:** Nothing malformed ever reaches the database. Invalid replies return **502** and are logged.

### 4. Save the claim first, then save the result in one transaction
- **Chosen:** Save the claim (`EVIDENCE_SUBMITTED`) → call AI → save the assessment and set the claim to `ASSESSED` in **one transaction**.
- **Alternative:** Call the AI first and save everything only on success.
- **Why:** The submission is recorded even if the AI is down, so it can be re-assessed. The transaction guarantees there is never an assessment without the status update, or the other way round.
- **Trade-off:** Claims can sit in `EVIDENCE_SUBMITTED` without an assessment, which is intended and visible.

### 5. One claim → many assessments
- **Chosen:** Separate `Claim` and `Assessment` tables (1 : N). Each assessment stores the model and prompt version.
- **Alternative:** Store the result columns on the claim.
- **Why:** Full audit history: re-assessments with new evidence or a newer model never overwrite the past.

### 6. PostgreSQL + Prisma
- **Chosen:** PostgreSQL with Prisma 7.
- **Alternatives:** MongoDB (my usual stack); TypeORM.
- **Why PostgreSQL:** The data is relational (claims → assessments, and later products, studies, users), it needs transactions and enums, and `JSONB` still stores the flexible list of checks. Azure has a managed version.
- **Why Prisma:** One readable schema file, generated TypeScript types, built-in migrations. TypeORM would fit NestJS's decorator style but is more verbose.

### 7. Synchronous request for now
- **Chosen:** The API waits for the AI (5–20 s) and returns the result.
- **Alternative:** A job queue (e.g. BullMQ/Redis or Azure Service Bus) with status polling or server-sent events.
- **Why:** Simpler for one evaluator at a time; the UI shows a loading state, with a 30 s server timeout and one retry.
- **When to change:** Long PDFs, many users, or batch assessments → move to a queue (roadmap phase 2).

### 8. Official OpenAI SDK with a configurable endpoint
- **Chosen:** `openai` SDK; `OPENAI_BASE_URL` and `OPENAI_MODEL` in `.env`.
- **Alternatives:** A vendor-specific SDK; an orchestration framework such as LangChain.
- **Why:** The task asks for OpenAI. The same code runs against OpenAI, **Azure OpenAI** or Gemini, by configuration only. One structured call does not need a framework.

### 9. Modular monolith, not microservices
- **Chosen:** One NestJS app with separate modules.
- **Alternative:** Separate services for claims and AI.
- **Why:** One feature, one team, one day. Module boundaries (`ClaimsModule`, `LlmModule`) keep it easy to split later if the AI part needs to scale on its own.

### 10. Evaluator types the claim (for this task)
- **Chosen:** The form takes product, claim type, claim and evidence.
- **Alternative:** Select an already-approved claim from earlier workflow steps.
- **Why:** The task's endpoint "takes the claim and evidence", and the earlier steps are out of scope. The tables already support selecting existing claims later.

### 11. Frontend: Vite + React, not Next.js
- **Why:** A single internal page behind login needs no server rendering or SEO. Vite is fast and simple; in development it proxies `/api` to the backend, so no CORS setup is needed.

### 12. Validation and errors at the edges
- Global `ValidationPipe` with whitelist and DTO rules → clear **400** messages.
- AI failures → **502** with a message the UI turns into "AI service didn't answer. Your claim is saved".
- Database down → health check returns **503**.

### 13. Security basics
- API keys only on the server, in `.env` (never committed).
- Prompt-injection guard (see research doc).
- Production: Azure OpenAI in the L'Oréal tenant, secrets in Azure Key Vault, sign-in with Microsoft Entra ID.

---

## Production view (Azure, matching the job's stack)

| Concern | Choice |
|---|---|
| Hosting | Backend and frontend containers on **AKS**, deployed by a CI/CD pipeline |
| AI | **Azure OpenAI**: data stays in the tenant, capacity can be reserved |
| Database | Azure Database for PostgreSQL (Flexible Server) |
| Secrets | Azure Key Vault |
| Identity | Microsoft Entra ID, role-based access per actor |
| Monitoring | Application Insights: latency, AI errors, cost per assessment |

## Testing

- **Backend (Jest):** verdict logic, service flow (save order, transaction, AI failure), AI client (schema, retries, invalid replies), DTO validation, prompt content.
- **Frontend (Vitest + React Testing Library):** API error handling, form behaviour, loading / error / result states, reset and retry.
