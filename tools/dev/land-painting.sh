#!/bin/zsh
# Merge one finished painting's branch, rerun the art guarantee on the merged build, and only then bump and push.
#   tools/dev/land-painting.sh <branch> <work id> "<commit subject after the build number>"   (serve the repo on 8871 first)
set -u
cd "$(git rev-parse --show-toplevel)"
git merge -q --no-edit "$1" >/dev/null 2>&1
python3 - <<'PY'
import re
p='src/life/index.js'; s=open(p).read()
if '<<<<<<<' in s:
    s=re.sub(r'<<<<<<< [^\n]*\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n', lambda m: m.group(1)+m.group(2), s, flags=re.S); open(p,'w').write(s)
PY
git add src/life/index.js; git commit -q --no-edit 2>/dev/null
if [ -n "$(git status --short | grep -v '^??' | grep -v 'tools/dev/queue')" ]; then echo "MERGE NOT CLEAN"; git status --short | grep -v '^??'; exit 1; fi      # (the queue's own state rides along with the bump)
R=$(node tools/lifesheet.mjs "$2" --port 8871 --no-sheet --out /tmp/lifecheck 2>&1 | grep -E "^guarantee" | cut -c1-80)
[ -z "$R" ] && R=$(node tools/lifesheet.mjs "$2" --port 8871 --no-sheet --out /tmp/lifecheck 2>&1 | grep -E "^guarantee" | cut -c1-80)
echo "$R"
case "$R" in *PASS*) ;; *) echo "NOT DEPLOYED: the check did not pass"; exit 1;; esac
cur=$(grep -o "^const BUILD = '[^']*'" src/main.js | grep -o "[0-9.]*[0-9]"); n=${cur##*.}; next="${cur%.*}.$((n + 1))"
sed -i '' "s/^const BUILD = '$cur'/const BUILD = '$next'/" src/main.js
git commit -qam "Bump build $next: $3

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
git push -q origin main 2>/dev/null || git push -q origin main
echo "live: $(git ls-remote origin main | cut -c1-8)  head: $(git rev-parse --short HEAD)  build $next  alive $(ls src/life | grep -c '^[0-9]')"
