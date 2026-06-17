# AI Pipeline Test Report

**Date:** 2026-06-17T06:29:42.489Z
**Provider:** `groq`
**Model:** `llama-3.3-70b-versatile`

### Summary
- **Total Cases:** 10
- **Passed:** 10
- **Failed:** 0

### Results Table

| Test Case | Status | Latency | Details / Reason |
| --- | --- | --- | --- |
| Normal Entry | 🟢 PASS | 680ms | EI=2.5, PR=3.5, SA=7.75 |
| High EI (Emotional Intensity) | 🟢 PASS | 924ms | EI=9, PR=6, SA=5 | ⚠️ Crisis (Risk_Language) |
| Low Agency | 🟢 PASS | 861ms | EI=9, PR=9, SA=2 | ⚠️ Crisis (Immediate) |
| High Rigidity | 🟢 PASS | 994ms | EI=9, PR=9, SA=2 | ⚠️ Crisis (Immediate) |
| Reflection Only | 🟢 PASS | 859ms | EI=4, PR=5, SA=7 |
| Very Short Entry | 🟢 PASS | 507ms | EI=2, PR=3, SA=3 |
| Risk Language (Concerning but not acute suicide) | 🟢 PASS | 1063ms | EI=8, PR=5, SA=4 |
| Immediate Crisis | 🟢 PASS | 788ms | EI=10, PR=10, SA=2 | ⚠️ Crisis (Immediate) |
| Mixed Signals (Crisis & Hope) | 🟢 PASS | 727ms | EI=7.75, PR=6.5, SA=3 | ⚠️ Crisis (Risk_Language) |
| Empty Entry | 🟢 PASS | 0ms | EI=-, PR=-, SA=- |
