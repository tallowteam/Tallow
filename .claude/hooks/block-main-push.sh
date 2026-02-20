#!/bin/bash
# Block edits when on the main branch
BRANCH=$(git branch --show-current 2>/dev/null)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo '{"block": true, "reason": "Cannot edit files on main branch. Create a feature branch: git checkout -b feat/your-feature"}' >&2
  exit 2
fi
exit 0
