# Step 3: Pseudocode (the real code follows this)

## Database (Prisma)
```
Claim {
  id, productName, claimType, claimText, status, createdAt
  assessments → many Assessment
}

Assessment {
  id, claimId → Claim
  evidence, justified, confidence, reasoning
  criteria (JSON list of checks)
  model, promptVersion        // which AI model and prompt gave this answer
  createdAt
}

enum ClaimType   { EFFICACY, CONSUMER_PERCEPTION, SENSORY, SAFETY }
enum ClaimStatus { PROPOSED, APPROVED, REJECTED, IN_TESTING,
                   EVIDENCE_SUBMITTED, ASSESSED, VALIDATED }
```

## Backend (NestJS): POST /api/claims/assess
```
input: { productName, claimType, claimText, evidence }

validate input                         → 400 if wrong
claim = save Claim (status = EVIDENCE_SUBMITTED)

aiResult = LlmService.assess(claim, evidence)
    build prompt with the checks
    call OpenAI with a JSON format
    check the reply with Zod           → 502 if broken

applicable = checks that apply to this claim
justified  = every applicable check passed
confidence = passed ÷ applicable

in one transaction:
    save Assessment
    update Claim status = ASSESSED

return { claim, assessment }           → 201
```

## Frontend (React): ClaimAssessment page
```
form: product name, claim type (dropdown), claim text, evidence
on submit:
    show "Assessing…" and disable the button
    POST /api/claims/assess
    success → show result card
    error   → show the error message

result card:
    Justified: Yes / No
    Confidence: 80%
    Reasoning
    Checklist: ✅ / ❌ for each check
```
