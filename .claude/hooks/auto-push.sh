#!/usr/bin/env bash
# Stop hook: commit any pending changes and push the current branch.
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

branch=$(git symbolic-ref --short HEAD 2>/dev/null) || exit 0

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -q -m "chore: auto-save $(date -u +'%Y-%m-%d %H:%M UTC')" || exit 0
fi

# Push only when there are commits the remote doesn't have yet.
if [ -z "$(git rev-parse --verify -q "origin/$branch")" ] || \
   [ -n "$(git log "origin/$branch..HEAD" --oneline 2>/dev/null)" ]; then
  for delay in 0 2 4 8 16; do
    sleep "$delay"
    git push -q -u origin "$branch" && exit 0
  done
  echo '{"systemMessage": "auto-push: git push failed"}'
fi
exit 0
