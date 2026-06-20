# AI Pipeline Test Report

**Date:** 2026-06-19T07:58:22.582Z
**Provider:** `groq`
**Model:** `llama-3.3-70b-versatile`

### Summary
- **Total Cases:** 10
- **Passed:** 10
- **Failed:** 0

### Results Table

| Test Case | Status | Latency | Details / Reason |
| --- | --- | --- | --- |
| Normal Entry | 🟢 PASS | 834ms | EI=2.5, PR=3.5, SA=7.75 |
| High EI (Emotional Intensity) | 🟢 PASS | 962ms | EI=9, PR=6, SA=6 | ⚠️ Crisis (Risk_Language) |
| Low Agency | 🟢 PASS | 1625ms | EI=9, PR=9, SA=1 | ⚠️ Crisis (Immediate) |
| High Rigidity | 🟢 PASS | 1473ms | EI=9, PR=9, SA=2 | ⚠️ Crisis (Immediate) |
| Reflection Only | 🟢 PASS | 966ms | EI=4, PR=5, SA=7 |
| Very Short Entry | 🟢 PASS | 1225ms | EI=2, PR=2, SA=2 |
| Risk Language (Concerning but not acute suicide) | 🟢 PASS | 994ms | EI=8, PR=6, SA=4 |
| Immediate Crisis | 🟢 PASS | 1621ms | EI=10, PR=10, SA=2 | ⚠️ Crisis (Immediate) |
| Mixed Signals (Crisis & Hope) | 🟢 PASS | 799ms | EI=7.75, PR=6.75, SA=3 | ⚠️ Crisis (Risk_Language) |
| Empty Entry | 🟢 PASS | 0ms | EI=-, PR=-, SA=- |
