#!/usr/bin/env bash
# End-to-end check of push notifications against a fake push service (~4 minutes: it waits for
# the scheduler and the 2-minute wishlist debounce).
#
#   npm run test:push              # build + run
#   npm run test:push -- --no-build
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=4180
DIR=data-push
[[ "${1:-}" == "--no-build" ]] || { echo "› building"; npm run build >/dev/null; }

rm -rf "$DIR"
mkdir -p "$DIR"
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -keyout "$DIR/key.pem" \
	-out "$DIR/cert.pem" -days 1 -subj /CN=localhost 2>/dev/null

echo "› starting preview on :$PORT"
# PUSH_TEST_HOSTS lets the app talk to the fake push service; never set it in production.
DATABASE_URL="$DIR/santa.db" DATA_DIR="$DIR" SITE_ADMIN_PASSWORD=x COOKIE_SECURE=false \
	ORIGIN="http://localhost:$PORT" PUSH_TEST_HOSTS=localhost:9443 NODE_TLS_REJECT_UNAUTHORIZED=0 \
	npx vite preview --port "$PORT" --strictPort >"$DIR/preview.log" 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT
for _ in $(seq 60); do
	curl -s -o /dev/null "http://localhost:$PORT" && break
	kill -0 "$SERVER" 2>/dev/null || { cat "$DIR/preview.log" >&2; exit 1; }
	sleep 0.5
done

node scripts/push-check.mjs
