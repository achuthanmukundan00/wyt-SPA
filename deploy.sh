#!/usr/bin/env bash
# The one way to deploy watchyourtemper.com, and PRESSURE TEST at /pressure-test/.
# Read AGENTS.md first. Pushing to GitHub does not deploy.
#
#   ./deploy.sh            deploy the commit at HEAD (it must already be on origin/master)
#   ./deploy.sh --dry-run  build and check everything, upload nothing
set -euo pipefail
cd "$(dirname "$0")"
ROOT=$(pwd)
ACCOUNT_ID=2be661efcc5940eba07b8f005d627a91 # the "watchyourtemper" account, as in wrangler.jsonc
DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

grep -q "\"account_id\": \"$ACCOUNT_ID\"" wrangler.jsonc || { echo "wrangler.jsonc must pin account_id $ACCOUNT_ID." >&2; exit 1; }

# Production is always a commit that is on GitHub's master.
COMMIT=$(git rev-parse HEAD)
git fetch -q origin master
if [[ $DRY_RUN == 0 ]] && ! git merge-base --is-ancestor "$COMMIT" origin/master; then
  echo "HEAD ($COMMIT) is not on origin/master. Commit, push to master, then deploy." >&2
  exit 1
fi

WRANGLER="$ROOT/watchyourtemper-site/node_modules/.bin/wrangler"
[[ -x $WRANGLER ]] || { echo "Run npm ci in watchyourtemper-site/ first." >&2; exit 1; }
if ! "$WRANGLER" whoami 2>/dev/null | grep -q "$ACCOUNT_ID"; then
  echo "Wrangler is not logged in to the watchyourtemper account ($ACCOUNT_ID)." >&2
  echo "Sign in to dash.cloudflare.com as hello.watchyourtemper@gmail.com, then run:" >&2
  echo "  $WRANGLER logout && $WRANGLER login" >&2
  exit 1
fi

# Build the commit itself in a clean checkout, so uncommitted files never ship.
TREE=$(mktemp -d)
trap 'git -C "$ROOT" worktree remove --force "$TREE" >/dev/null 2>&1 || rm -rf "$TREE"' EXIT
git worktree add -q --detach "$TREE" "$COMMIT"
ln -s "$ROOT/watchyourtemper-site/node_modules" "$TREE/watchyourtemper-site/node_modules"
(cd "$TREE/watchyourtemper-site" && npm run build)
[[ -f $TREE/watchyourtemper-site/dist/pressure-test/index.html ]] || { echo "PRESSURE TEST is missing from the build (public/pressure-test/)." >&2; exit 1; }
[[ ! -e $TREE/watchyourtemper-site/dist/wrangler.json ]] || { echo "The build emitted dist/wrangler.json; remove whatever produced it." >&2; exit 1; }
BUNDLE=$(cd "$TREE/watchyourtemper-site/dist/assets" && ls index-*.js)

if [[ $DRY_RUN == 1 ]]; then
  (cd "$TREE" && "$WRANGLER" deploy --dry-run)
  echo "Dry run of $COMMIT passed. Nothing was uploaded."
  exit 0
fi
(cd "$TREE" && "$WRANGLER" deploy)

# The live site must now be this build.
sleep 5
curl -fsS "https://watchyourtemper.com/?deploy=$COMMIT" | grep -q "$BUNDLE" || { echo "watchyourtemper.com is not serving $BUNDLE yet. Check it." >&2; exit 1; }
curl -fsS https://watchyourtemper.com/api/health | grep -q '"ok":true' || { echo "The live API health check failed." >&2; exit 1; }
curl -fsS https://watchyourtemper.com/pressure-test/ | grep -q "<title>PRESSURE TEST" || { echo "PRESSURE TEST is not live at /pressure-test/." >&2; exit 1; }
echo "Deployed $COMMIT to watchyourtemper.com and checked the live site."
