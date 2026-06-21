#!/usr/bin/env bash
# smoke-test.sh — Pack and install the CLI into a temp prefix, then verify
# `opencode-path --help` exits 0 and contains expected subcommand names.
# Tests the PACKAGED binary (dist/cli.js via bin entry), not source via tsx.
#
# Usage:
#   npm run smoke                 (builds first via package.json script)
#   bash scripts/smoke-test.sh   (expects dist/ to already exist)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

TARBALL=""
TMPPREFIX=""

cleanup() {
  [ -n "$TMPPREFIX" ] && rm -rf "$TMPPREFIX"
  [ -n "$TARBALL" ] && rm -f "$ROOT/$TARBALL"
}
trap cleanup EXIT

echo "==> Packing..."
TARBALL=$(npm pack --json | node -e \
  "const d=require('fs').readFileSync('/dev/stdin','utf8'); \
   console.log(JSON.parse(d)[0].filename)")
echo "    Packed: $TARBALL"

TMPPREFIX=$(mktemp -d)
echo "==> Installing into temp prefix: $TMPPREFIX"

# `npm install --prefix <dir>` puts binaries under <dir>/node_modules/.bin
npm install --prefix "$TMPPREFIX" "$ROOT/$TARBALL"

BINDIR="$TMPPREFIX/node_modules/.bin"

if [ ! -f "$BINDIR/opencode-path" ]; then
  echo "ERROR: expected binary not found at $BINDIR/opencode-path"
  echo "Contents of $BINDIR:"
  ls "$BINDIR" 2>/dev/null || echo "  (directory does not exist)"
  exit 1
fi

echo "==> Running: opencode-path --help"
"$BINDIR/opencode-path" --help

echo "==> Asserting --help output..."
OUTPUT=$("$BINDIR/opencode-path" --help 2>&1)

EXPECTED_STRINGS=(
  "opencode-path"
  "init"
  "agents"
  "models"
  "profiles"
  "uninstall"
)

ALL_PASS=true
for STR in "${EXPECTED_STRINGS[@]}"; do
  if echo "$OUTPUT" | grep -q "$STR"; then
    echo "    ✓ --help contains '$STR'"
  else
    echo "    ✗ --help missing '$STR'"
    ALL_PASS=false
  fi
done

if [ "$ALL_PASS" = "true" ]; then
  echo "==> Smoke test passed."
else
  echo "==> Smoke test FAILED."
  exit 1
fi
