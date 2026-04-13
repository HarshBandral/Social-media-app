#!/bin/bash
# pre-bash-check.sh — React Native project
# Blocks dangerous commands and warns on risky native operations.

COMMAND=$(echo "${CLAUDE_TOOL_INPUT:-}" | jq -r '.command // empty' 2>/dev/null)
if [[ -z "$COMMAND" ]]; then exit 0; fi

DANGEROUS=("rm -rf /" "rm -rf ~" ":(){ :|:& };:" "> /dev/sda" "dd if=/dev/zero" "mkfs.")
for pattern in "${DANGEROUS[@]}"; do
  if [[ "$COMMAND" == *"$pattern"* ]]; then
    echo "BLOCKED: Dangerous command pattern '$pattern'." >&2
    exit 2
  fi
done

# Warn on clearing caches — can be slow to rebuild
if [[ "$COMMAND" == *"watchman watch-del-all"* ]] || [[ "$COMMAND" == *"--reset-cache"* ]]; then
  echo "WARNING: Clearing Metro/Watchman cache will slow the next build." >&2
fi

if [[ "$COMMAND" == *"git push"*"--force"* ]] || [[ "$COMMAND" == *"git push"*"-f"* ]]; then
  echo "WARNING: Force push detected." >&2
fi

exit 0
