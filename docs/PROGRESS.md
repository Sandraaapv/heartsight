# HeartSight Build Progress

Tracking phases against `BUILD_PLAN.md`.

| Phase | Description | Status | Verification & Checks |
| --- | --- | --- | --- |
| **Phase 0** | Scaffold monorepo | Completed | `npm run build` passed, `npm run lint` passed, `pytest` passed (1/1), both dev servers tested with HTTP 200 responses |
| **Phase 1** | Machine learning (CAD model & SHAP) | Completed | `python ml/train.py` runs end-to-end; Logistic Regression selected (CV AUROC 0.8698 ± 0.0357, Brier 0.1471); `metrics.json` generated; 200 bootstrap models & SHAP background saved; all 5 pytest tests pass |
| **Phase 2** | Backend API (PCE, Heart Age, Artery Heuristic) | Completed | 2013 ACC/AHA PCE implemented with published Table A coefficients and verified against worked examples; all 6 endpoints implemented; 17/17 pytest tests passed; curl examples in `backend/README.md` |
| **Phase 3** | Frontend foundation & intake | Pending | |
| **Phase 4** | 3D scene (torso, heart, arteries) | Pending | |
| **Phase 5** | Results, explanations, and what-if | Pending | |
| **Phase 6** | Early deployment config | Pending | |
| **Phase 7** | Wow features (tier 1) | Pending | |
| **Phase 8** | About page, polish, final README | Pending | |
| **Phase 9** | Tier 2 features (optional) | Pending | |
