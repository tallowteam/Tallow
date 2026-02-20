---
description: Perform STRIDE threat modeling on a Tallow component
---

Analyze the attack surface of a specified component:

1. Ask which component or feature to analyze
2. Read docs/threat-model.md for existing analysis
3. Apply STRIDE methodology:
   - **S**poofing: Can an attacker impersonate a legitimate party?
   - **T**ampering: Can data be modified in transit or at rest?
   - **R**epudiation: Can actions be denied?
   - **I**nformation disclosure: Can secrets leak?
   - **D**enial of service: Can the service be disrupted?
   - **E**levation of privilege: Can unauthorized actions be performed?
4. For each threat: assess likelihood × impact
5. Document existing mitigations and gaps
6. Update docs/threat-model.md with findings
