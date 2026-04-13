#!/bin/bash
# protect-files.sh — React Native project
# Blocks edits to sensitive, generated, or native build files.

FILE_PATH=$(echo "${CLAUDE_TOOL_INPUT:-}" | jq -r '.file_path // empty' 2>/dev/null)
if [[ -z "$FILE_PATH" ]]; then exit 0; fi
FILE_PATH="${FILE_PATH//\\//}"

BLOCKED=(
  ".env"
  ".env.local"
  ".env.production"
  "package-lock.json"
  "yarn.lock"
  ".git/"
  "node_modules/"
  "android/build/"
  "android/.gradle/"
  "ios/Pods/"
  "ios/build/"
  ".expo/"
  "coverage/"
  "Podfile.lock"
  "android/gradle/wrapper/gradle-wrapper.jar"
)

for pattern in "${BLOCKED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: Editing '$FILE_PATH' is not allowed (matches '$pattern')." >&2
    exit 2
  fi
done

exit 0
