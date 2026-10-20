# Step 1: Understanding the Requirement

## What are we building? (one line)
A React page where an evaluator enters a product claim and pastes the clinical study results. The NestJS backend asks OpenAI whether the study really proves the claim, Prisma saves the answer in the database, and React shows the result: **Justified (Yes/No), Confidence Score and Reasoning.**

## The business flow, in plain words

| Who | What they do | Claim status |
|---|---|---|
| Business team | Comes up with a claim, e.g. "Reduces wrinkles by 20% in 4 weeks" | `PROPOSED` |
| Claim manager | Checks if the claim makes sense and is possible to prove | `APPROVED` / `REJECTED` |
| Scientist | Makes the formula and runs the test | `IN_TESTING` |
| Evaluator | Gets the study results and submits them | `EVIDENCE_SUBMITTED` |
| AI (our feature) | Checks if the results really prove the claim | `ASSESSED` |
| Evaluator | Reads the AI result and gives the final OK | `VALIDATED` |

## What part am I building?
Only the **evaluator + AI step**. The earlier steps (propose, approve, test) are out of scope for this task.

## What the evaluator fills in

| Field | Example |
|---|---|
| Product name | Anti-ageing night cream |
| Claim type | Efficacy |
| Claim | Reduces wrinkles by 20% in 4 weeks |
| Study evidence | 4-week study, 100 women aged 40–65, wrinkle depth measured with a skin-imaging device, 18% average reduction vs 3% in the placebo group, p < 0.05 |

## Why claim type matters
Different claims need different proof. If someone submits a survey for a clinical claim, the AI should catch it.

| Claim type | Example | What proof is needed |
|---|---|---|
| Efficacy | "Reduces wrinkles by 20% in 4 weeks" | Clinical measurement with a device |
| Consumer perception | "9 out of 10 women saw smoother skin" | Consumer survey |
| Sensory | "Non-greasy, absorbs in 30 seconds" | Sensory panel test |
| Safety | "Dermatologically tested" | Dermatologist safety study |

## My assumptions
1. The evaluator types the claim directly. In the full system, the claim would already exist from the earlier steps and the evaluator would just pick it. My database already supports that because Claim and Assessment are separate tables.
2. Evidence is pasted as text for now. PDF upload comes later.
3. The AI only gives a recommendation. A human always makes the final decision.
4. The same claim can be assessed again later, so I keep every assessment as history.

## Questions I would ask the business
- Which country's rules do we follow: EU, US, India?
- Who is allowed to overrule the AI result?
- Are the study documents confidential? (If yes, we should use Azure OpenAI so data stays inside L'Oréal.)
