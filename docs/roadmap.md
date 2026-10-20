# Product Roadmap

Where LorealClaim could go with ample time and no limits on the solution.

---

## Phase 1: the core assessment (done today)

- Evaluator enters a claim and the study evidence.
- AI answers five checks; our code decides **Justified / Not justified** and the confidence score.
- Every assessment is saved with model and prompt version (audit history).
- Clear loading, error and retry states. Unit-tested backend and frontend.

---

## Phase 2: Production-ready

| Feature | Why it matters |
|---|---|
| **Sign-in with Microsoft Entra ID + roles** (business, claim manager, scientist, evaluator) | Each person sees and does only their part |
| **Evaluator sign-off**: accept or override the AI, with a reason (`VALIDATED`) | The human decision is recorded next to the AI recommendation |
| **Upload study PDFs**: extract the text, and show the exact sentences each check relied on | Evaluators can verify the AI against the source in seconds |
| **Job queue** for assessments (status updates in the UI) | Handles long documents and many users without timeouts |
| **Azure deployment**: AKS, Azure OpenAI, Key Vault, CI/CD | Confidential data stays in the L'Oréal tenant |
| **Fallback model** and cost/latency monitoring | Keeps working when one model is busy |
| **Evaluation set**: real past claims with expert verdicts, run on every prompt or model change | Measures accuracy before any change goes live |

---

## Phase 3: The whole claim lifecycle

- **Business team** proposes claims; **claim manager** approves or rejects with reasons; **scientist** links test plans and formulas: the full flow from the business diagram.
- **"What can we claim?"**: when a claim fails, suggest the strongest wording the evidence *does* support (e.g. *"Reduces wrinkles by up to 18% in 4 weeks"*).
- **Several studies per claim**, weighed together.
- **Claim library**: reuse approved claims and their evidence across products and countries.

---

## Phase 4: Claims intelligence

- **Knowledge graph** of products, formulas, ingredients, studies, claims and markets.
  - "Which existing studies could support this new claim?"
  - "Which claims depend on this study if it is withdrawn?"
- **Market-specific verdicts**: the same claim checked against EU (Regulation 655/2013), India (Cosmetics Rules 2020), US and China rules, with one result per country.
- **Regulation-aware AI (RAG)** over regulations, internal guidelines and past decisions, citing which rule each finding comes from.
- **Agent team**, each with one job: evidence extractor → statistician (sample size, significance) → regulatory reviewer per market → critic that challenges the result before a human sees it.

---

## Phase 5: Helping R&I before the study

- **Study design assistant**: for a target claim, suggest the study needed: method, duration, panel size, control group.
- **Feasibility prediction**: from the formula and past results, estimate how likely a claim is to be supported, before money is spent on testing.
- **Learning loop**: every evaluator decision becomes training and evaluation data.
- **Portfolio dashboard**: claims by status, market and risk across brands.

---

## Principles that stay the same in every phase

- **A human always makes the final decision.**
- Every result is **explainable** and **traceable** (evidence, model, prompt, reviewer).
- Confidential R&I data **never leaves** L'Oréal's environment.
- Accuracy is **measured**, not assumed.
