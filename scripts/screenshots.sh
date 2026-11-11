#!/usr/bin/env bash
# Regenerates docs/screenshots/*.webp end to end:
# builds the app, starts a preview server on a throwaway data dir, seeds demo data
# through the UI (scripts/screenshots.mjs) and stops the server again.
#
#   npm run screenshots             # build + capture
#   npm run screenshots -- --no-build
#   PORT=4175 npm run screenshots   # if 4174 is taken
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-4174}"
DIR=data-shots
BUILD=1
[[ "${1:-}" == "--no-build" ]] && BUILD=0

if curl -s -o /dev/null "http://localhost:$PORT"; then
	echo "Port $PORT is already in use; set PORT=… to use another one." >&2
	exit 1
fi

if ((BUILD)); then
	echo "› building"
	npm run build >/dev/null
fi

rm -rf "$DIR"
mkdir -p "$DIR"

echo "› starting preview on :$PORT"
DATABASE_URL="$DIR/santa.db" DATA_DIR="$DIR" SITE_ADMIN_PASSWORD=shots COOKIE_SECURE=false \
	ORIGIN="http://localhost:$PORT" npx vite preview --port "$PORT" --strictPort >"$DIR/preview.log" 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT

for _ in $(seq 60); do
	curl -s -o /dev/null "http://localhost:$PORT" && break
	kill -0 "$SERVER" 2>/dev/null || { cat "$DIR/preview.log" >&2; exit 1; }
	sleep 0.5
done

echo "› capturing"
node scripts/screenshots.mjs "http://localhost:$PORT"
