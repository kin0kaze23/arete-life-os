#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://arete-life-os.vercel.app}"

echo "[prod-smoke] base URL: $BASE_URL"

health_json="$(curl -fsS "$BASE_URL/api/health")"
node -e '
const payload = JSON.parse(process.argv[1]);
if (!payload.ok) throw new Error("health endpoint returned ok=false");
if (!payload.services?.ai?.configured) throw new Error("AI is not configured in production");
console.log("[prod-smoke] health: OK");
' "$health_json"

ask_json="$(curl -fsS "$BASE_URL/api/gemini" -H 'content-type: application/json' --data-raw '{"action":"askAura","payload":{"text":"Give one short focus tip for today","history":[],"profile":{"id":"u1","identify":{"name":"Prod Smoke"}},"promptConfig":{"template":"Profile: {{profile}} History: {{history}} Query: {{input}}","defaultTemplate":"Profile: {{profile}} History: {{history}} Query: {{input}}"}}}')"
node -e '
const payload = JSON.parse(process.argv[1]);
if (!payload.text || typeof payload.text !== "string") throw new Error("askAura response missing text");
console.log("[prod-smoke] askAura: OK");
' "$ask_json"

intake_json="$(curl -fsS "$BASE_URL/api/gemini" -H 'content-type: application/json' --data-raw '{"action":"processInput","payload":{"input":"Tomorrow 9am call Sarah about budget and gym after work","history":[],"activeProfile":{"id":"u1","identify":{"name":"Prod Smoke"}},"promptConfig":{"template":"INPUT={{input}} PROFILE={{profile}} HISTORY={{history}} FAMILY={{family}} FILE_META={{fileMeta}} CURRENT_DATE={{currentDate}}","defaultTemplate":"INPUT={{input}} PROFILE={{profile}} HISTORY={{history}} FAMILY={{family}} FILE_META={{fileMeta}} CURRENT_DATE={{currentDate}}"},"familyMembers":[]}}')"
node -e '
const payload = JSON.parse(process.argv[1]);
if (!Array.isArray(payload.items) || payload.items.length === 0) {
  throw new Error("processInput response missing items");
}
console.log("[prod-smoke] processInput: OK");
' "$intake_json"

origin_ask_json="$(curl -fsS "$BASE_URL/api/gemini" -H "origin: $BASE_URL" -H 'content-type: application/json' --data-raw '{"action":"askAura","payload":{"text":"Origin smoke check","history":[],"profile":{"id":"u1","identify":{"name":"Prod Smoke"}},"promptConfig":{"template":"{{input}}","defaultTemplate":"{{input}}"}}}')"
node -e '
const payload = JSON.parse(process.argv[1]);
if (!payload.text || typeof payload.text !== "string") throw new Error("origin-based askAura failed");
console.log("[prod-smoke] browser-origin askAura: OK");
' "$origin_ask_json"

echo "[prod-smoke] all checks passed"
