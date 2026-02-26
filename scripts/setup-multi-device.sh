#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set +u
  set -a
  source .env
  set +a
  set -u
fi
if [[ -f .env.local ]]; then
  set +u
  set -a
  source .env.local
  set +a
  set -u
fi

APP_URL="${1:-${APP_BASE_URL:-${ARETE_APP_URL:-}}}"

readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; }
info() { echo "[INFO] $*"; }

BLOCKERS=()
ACTIONS=()

require_var() {
  local key="$1"
  if [[ -z "${!key:-}" ]]; then
    BLOCKERS+=("Missing required env var: ${key}")
    return 1
  fi
  pass "${key} is set"
  return 0
}

extract_project_ref() {
  local url="$1"
  echo "$url" | sed -E 's#https://([^.]+)\.supabase\.co#\1#'
}

request_code() {
  local method="$1"
  local url="$2"
  local auth_header="$3"
  local body="${4:-}"
  if [[ -n "$body" ]]; then
    curl -sS -o /tmp/arete_setup_resp.json -w "%{http_code}" \
      -X "$method" "$url" \
      -H "apikey: ${auth_header}" \
      -H "Authorization: Bearer ${auth_header}" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -sS -o /tmp/arete_setup_resp.json -w "%{http_code}" \
      -X "$method" "$url" \
      -H "apikey: ${auth_header}" \
      -H "Authorization: Bearer ${auth_header}"
  fi
}

check_table_exists() {
  local table="$1"
  local code
  code=$(request_code "GET" "${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1" "$SUPABASE_SERVICE_ROLE_KEY")
  if [[ "$code" == "200" || "$code" == "206" ]]; then
    pass "Table '${table}' exists"
    return 0
  fi

  local body
  body="$(cat /tmp/arete_setup_resp.json || true)"
  if echo "$body" | rg -q "relation .* does not exist|Could not find the table"; then
    warn "Table '${table}' is missing"
    return 1
  fi

  warn "Table '${table}' check returned HTTP ${code}"
  return 1
}

apply_schema_via_management_api() {
  local project_ref="$1"
  local sql_file="$ROOT_DIR/docs/supabase/001_multi_device_journaling.sql"

  if [[ ! -f "$sql_file" ]]; then
    BLOCKERS+=("Missing SQL migration file: ${sql_file}")
    return 1
  fi

  if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    BLOCKERS+=("Cannot auto-apply schema: SUPABASE_ACCESS_TOKEN not set")
    return 1
  fi

  local query
  query="$(cat "$sql_file")"
  local payload
  payload=$(jq -n --arg query "$query" '{query: $query}')

  info "Attempting Supabase Management API schema apply"
  local code
  code=$(curl -sS -o /tmp/arete_setup_mgmt.json -w "%{http_code}" \
    -X POST "https://api.supabase.com/v1/projects/${project_ref}/database/query" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if [[ "$code" == "200" || "$code" == "201" ]]; then
    pass "Schema applied via Supabase Management API"
    ACTIONS+=("Applied SQL schema via Management API")
    return 0
  fi

  local resp
  resp="$(cat /tmp/arete_setup_mgmt.json || true)"
  warn "Management API schema apply failed (HTTP ${code})"
  BLOCKERS+=("Schema not applied automatically (HTTP ${code}); response: ${resp}")
  return 1
}

ensure_bucket() {
  local bucket="$1"
  local code
  code=$(request_code "GET" "${SUPABASE_URL}/storage/v1/bucket/${bucket}" "$SUPABASE_SERVICE_ROLE_KEY")
  if [[ "$code" == "200" ]]; then
    pass "Bucket '${bucket}' already exists"
    return 0
  fi

  local create_payload
  create_payload=$(jq -n --arg id "$bucket" '{id: $id, name: $id, public: false}')
  code=$(request_code "POST" "${SUPABASE_URL}/storage/v1/bucket" "$SUPABASE_SERVICE_ROLE_KEY" "$create_payload")
  if [[ "$code" == "200" || "$code" == "201" ]]; then
    pass "Bucket '${bucket}' created"
    ACTIONS+=("Created bucket ${bucket}")
    return 0
  fi

  local body
  body="$(cat /tmp/arete_setup_resp.json || true)"
  if echo "$body" | rg -q "already exists"; then
    pass "Bucket '${bucket}' already exists"
    return 0
  fi

  BLOCKERS+=("Failed to ensure bucket '${bucket}' (HTTP ${code})")
  return 1
}

set_telegram_webhook() {
  if [[ -z "$APP_URL" ]]; then
    BLOCKERS+=("Cannot set Telegram webhook: missing APP_BASE_URL/ARETE_APP_URL or script arg")
    return 1
  fi

  local clean_base
  clean_base="${APP_URL%/}"
  local webhook_url="${clean_base}/api/telegram/webhook"

  local response
  response=$(curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
    --get \
    --data-urlencode "url=${webhook_url}" \
    --data-urlencode "secret_token=${TELEGRAM_BOT_SECRET}")

  if echo "$response" | rg -q '"ok":true'; then
    pass "Telegram webhook set to ${webhook_url}"
    ACTIONS+=("Registered Telegram webhook")
    return 0
  fi

  BLOCKERS+=("Failed to register Telegram webhook: ${response}")
  return 1
}

write_report() {
  local report_path="$ROOT_DIR/docs/supabase/setup-automation-report.md"
  {
    echo "# Setup Automation Report"
    echo
    echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo
    echo "## Actions"
    if [[ ${#ACTIONS[@]} -eq 0 ]]; then
      echo "- No actions executed."
    else
      for a in "${ACTIONS[@]}"; do
        echo "- ${a}"
      done
    fi
    echo
    echo "## Blockers"
    if [[ ${#BLOCKERS[@]} -eq 0 ]]; then
      echo "- None"
    else
      for b in "${BLOCKERS[@]}"; do
        echo "- ${b}"
      done
    fi
  } > "$report_path"

  info "Report written to ${report_path}"
}

main() {
  info "Starting multi-device setup automation"

  require_var "SUPABASE_URL" || true
  require_var "SUPABASE_SERVICE_ROLE_KEY" || true
  require_var "TELEGRAM_BOT_TOKEN" || true
  require_var "TELEGRAM_BOT_SECRET" || true

  if [[ ${#BLOCKERS[@]} -gt 0 ]]; then
    write_report
    fail "Missing required env vars."
    return 2
  fi

  local project_ref
  project_ref=$(extract_project_ref "$SUPABASE_URL")
  if [[ -z "$project_ref" || "$project_ref" == "$SUPABASE_URL" ]]; then
    BLOCKERS+=("Could not parse project ref from SUPABASE_URL")
    write_report
    fail "Could not parse project ref."
    return 2
  fi
  pass "Parsed Supabase project ref"

  local missing_tables=0
  for table in user_profiles vault_entries inbox_entries telegram_bindings dimension_snapshots; do
    if ! check_table_exists "$table"; then
      missing_tables=$((missing_tables + 1))
    fi
  done

  if [[ "$missing_tables" -gt 0 ]]; then
    warn "${missing_tables} required table(s) missing. Attempting auto-apply SQL migration."
    apply_schema_via_management_api "$project_ref" || true

    for table in user_profiles vault_entries inbox_entries telegram_bindings dimension_snapshots; do
      check_table_exists "$table" || true
    done
  fi

  ensure_bucket "vault-files" || true
  ensure_bucket "inbox-media" || true

  set_telegram_webhook || true

  write_report

  if [[ ${#BLOCKERS[@]} -gt 0 ]]; then
    warn "Setup completed with blockers."
    printf '%s\n' "${BLOCKERS[@]}" | sed 's/^/- /'
    return 2
  fi

  pass "Setup completed without blockers"
  return 0
}

main "$@"
