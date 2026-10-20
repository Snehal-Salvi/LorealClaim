# LorealClaim: API Reference

Base URL: `http://localhost:3000/api`

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/health` | Checks the API is up and the database is reachable |
| POST | `/claims/assess` | Saves the claim, asks the AI, saves and returns the assessment |
| GET | `/claims/:id` | Returns a claim with its full assessment history |

## 1. Health check
```bash
curl http://localhost:3000/api/health
```
Response: `{"status":"ok","database":"connected"}`

## 2. Assess a claim: evidence falls short (Not justified)
```bash
curl -X POST http://localhost:3000/api/claims/assess \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Revitalift Night Cream",
    "claimType": "EFFICACY",
    "claimText": "Reduces wrinkles by 20% in 4 weeks",
    "evidence": "4-week double-blind study, 100 women aged 40-65, wrinkle depth measured by profilometry, 18% average reduction vs 3% in placebo group, p < 0.05."
  }'
```
Expected: `"justified": false`, `"confidence": 0.8`: the MAGNITUDE check fails (18% vs 20%).

## 3. Assess a claim: evidence supports it (Justified)
```bash
curl -X POST http://localhost:3000/api/claims/assess \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Hydra Genius Serum",
    "claimType": "SENSORY",
    "claimText": "Absorbs in 30 seconds",
    "evidence": "Sensory panel of 20 trained assessors, standardised application of 0.5 ml on the forearm. Mean absorption time 24 seconds; all panelists recorded absorption under 30 seconds."
  }'
```

## 4. Validation error (400)
```bash
curl -X POST http://localhost:3000/api/claims/assess \
  -H "Content-Type: application/json" \
  -d '{"productName": "X", "claimType": "MAGIC", "claimText": "hi", "evidence": "too short"}'
```
Returns a `400` with a message for each invalid field.

## 5. Claim with assessment history
Use the `claim.id` returned by the assess call:
```bash
curl http://localhost:3000/api/claims/<claim-id>
```

## Request body: `POST /claims/assess`

| Field | Type | Rules |
|---|---|---|
| `productName` | string | 2–200 characters |
| `claimType` | enum | `EFFICACY`, `CONSUMER_PERCEPTION`, `SENSORY`, `SAFETY` |
| `claimText` | string | 5–500 characters |
| `evidence` | string | 50–10,000 characters |

## Status codes

| Code | When |
|---|---|
| `201` | Assessment created |
| `400` | Invalid input or invalid claim ID |
| `404` | Claim not found |
| `502` | The AI did not answer or returned an invalid response (the claim is still saved) |
| `503` | Database unreachable (health check) |
