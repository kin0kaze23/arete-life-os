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

guidance_json="$(curl -fsS "$BASE_URL/api/gemini" -H 'content-type: application/json' --data-raw '{"action":"generateGuidanceDigest","payload":{"history":[],"profile":{"id":"u1","identify":{"name":"Prod Smoke"},"personal":{"jobRole":"Operator","company":"","interests":["markets"]},"health":{"height":"","weight":"","sleepTime":"","wakeTime":"","activities":[],"activityFrequency":"","conditions":[],"medications":[]},"finances":{"assetsTotal":"","assetsBreakdown":{"cash":"","investments":"","property":"","other":""},"liabilities":"","income":"8000","fixedCosts":"3000","variableCosts":"1500"},"relationship":{"relationshipStatus":"Single","livingArrangement":"","socialEnergy":"","dailyCommitments":[],"socialGoals":[]},"spiritual":{"worldview":"","coreValues":["Discipline"],"practicePulse":""}},"doCandidates":[{"id":"rec-1","ownerId":"u1","category":"Personal","title":"Review goals","description":"Re-anchor the week","impactScore":8,"rationale":"A short review improves focus.","steps":["Open your goals","Choose one priority"],"estimatedTime":"15m","inputs":[],"definitionOfDone":"One priority is chosen","risks":[],"status":"ACTIVE","needsReview":false,"missingFields":[],"createdAt":1,"evidenceLinks":{"claims":[],"sources":[]}}],"watchCandidates":[{"id":"watch-1","ownerId":"u1","signal":"Budget drift","why":"Spending may exceed plan.","confidence":0.8,"severity":"med","actions":["Review discretionary spend"],"category":"Finance","createdAt":1}],"questionCandidates":[{"id":"q-1","ownerId":"u1","category":"Finance","prompt":"What is your target savings rate?","reason":"Improves finance guidance","sourceType":"profile_gap","urgency":"medium","channel":"dashboard","answerType":"number","status":"open"}],"externalScanEnabled":true}}')"
node -e '
const payload = JSON.parse(process.argv[1]);
if (!payload.summary || !Array.isArray(payload.doItems) || !Array.isArray(payload.watchItems)) {
  throw new Error("generateGuidanceDigest response missing required fields");
}
console.log("[prod-smoke] guidance digest: OK");
' "$guidance_json"

telegram_guidance_json="$(curl -fsS "$BASE_URL/api/telegram/webhook?dryRun=1")"
node -e '
const payload = JSON.parse(process.argv[1]);
if (!payload.ok || typeof payload.processed !== "number") throw new Error("telegram proactive dry-run failed");
console.log("[prod-smoke] telegram proactive dry-run: OK");
' "$telegram_guidance_json"

echo "[prod-smoke] all checks passed"
