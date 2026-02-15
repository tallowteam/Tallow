# Exception Policy

## Required Fields

Every exception entry must include:

1. `approver`: accountable owner approving the exception.
2. `reason`: why the exception is needed.
3. `expiryDate`: when the exception automatically expires.
4. `revalidationDate`: next required validation checkpoint.
5. `evidence`: links/files that justify the exception.

## Rules

1. Expired exceptions are treated as failed gates.
2. No security-critical exception can bypass release sign-off requirements.
3. Every exception must be reviewed at or before `revalidationDate`.

## Storage

Store active exceptions in `docs/governance/EXCEPTIONS.json`.

