---
description: Plan a new Tallow feature with security threat analysis and complexity assessment
---

Help plan a new feature for Tallow using the interview-then-spec approach:

1. **Interview phase**: Ask what the feature is. Then dig into the hard parts:
   - What crates does this touch?
   - Does it introduce new trust boundaries?
   - Does it increase the relay's capabilities (it should remain a dumb pipe)?
   - Does it require new crypto operations?
   - What happens if a malicious relay/sender/receiver exploits this feature?
   - Does it fit within Oracle Cloud free tier constraints?

2. **Threat analysis**: For the proposed feature, identify:
   - New attack surface introduced
   - Impact on existing security properties
   - Required mitigations

3. **Complexity assessment**: Rate honestly:
   - Is this worth the complexity?
   - Could a simpler approach get 90% of the value?
   - What's the maintenance burden?

4. **Write spec**: Save to SPEC.md with:
   - Feature description
   - Affected crates/modules
   - Security considerations and mitigations
   - Test strategy
   - Estimated complexity (low/medium/high)
   - Recommendation: build / simplify / defer / reject
