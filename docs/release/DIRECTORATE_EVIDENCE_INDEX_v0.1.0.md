# Directorate Evidence Index - v0.1.0

## Scope

This index maps required release directorate/security sign-offs to their evidence artifacts for `v0.1.0`.

Source of truth for approval state:

- `release-signoffs/v0.1.0.json`

## Sign-Off Evidence

| Approver | Role | Status | Evidence Artifact |
| --- | --- | --- | --- |
| `002` | CIPHER | Approved | `reports/security/crypto-signoff-v0.1.0.md` |
| `019` | CRYPTO-AUDITOR | Approved | `reports/security/red-team-v0.1.0.md` |
| `078` | SECURITY-PENETRATOR | Approved | `reports/security/owasp-validation-v0.1.0.md` |
| `075` | DC-GOLF | Approved | `reports/security/qa-directorate-signoff-v0.1.0.md` |
| `086` | DC-HOTEL | Approved | `reports/security/ops-directorate-signoff-v0.1.0.md` |
| `001` | RAMSAD | Approved | `reports/security/final-release-approval-v0.1.0.md` |

## Verification Command

Run:

```bash
node scripts/verify-release-signoffs.js v0.1.0
```

Expected result:

- Exit code `0`
- Output confirms required security/directorate chain is verified.
