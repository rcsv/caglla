#!/usr/bin/env bash
set -euo pipefail

# Generate .env.local from Google Secret Manager values.
# Usage:
#   GOOGLE_CLOUD_PROJECT=caglla-prod ./scripts/pull-secrets.sh
#   # or: GCLOUD_PROJECT=caglla-prod ./scripts/pull-secrets.sh
#
# You can override secret names via env vars:
#   GOOGLE_PLACES_API_KEY_SECRET=MY_BACKEND_MAPS_KEY \
#   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY_SECRET=MY_FRONT_MAPS_KEY \
#   ./scripts/pull-secrets.sh

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-${GCLOUD_PROJECT:-}}"
if [[ -z "${PROJECT_ID}" ]]; then
	echo "ERROR: Set GOOGLE_CLOUD_PROJECT or GCLOUD_PROJECT." >&2
	exit 1
fi

ENV_FILE=".env.local"
TEMP_FILE="${ENV_FILE}.tmp"
> "${TEMP_FILE}"

GOOGLE_PLACES_API_KEY_SECRET="${GOOGLE_PLACES_API_KEY_SECRET:-GOOGLE_PLACES_API_KEY}"
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY_SECRET="${NEXT_PUBLIC_GOOGLE_PLACES_API_KEY_SECRET:-NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}"

fetch_and_write() {
	local secret_name="$1"
	local env_key="$2"

	# Fetch secret; return empty on failure (keeps script going to write others)
	local value
	if ! value="$(gcloud secrets versions access latest \
		--secret="${secret_name}" \
		--project="${PROJECT_ID}" 2>/dev/null)"; then
		echo "WARN: Failed to fetch ${secret_name} (env: ${env_key})." >&2
		return
	fi

	if [[ -z "${value}" ]]; then
		echo "WARN: Secret ${secret_name} is empty; skipping ${env_key}." >&2
		return
	fi

	# Append KEY=VALUE
	printf "%s=%s\n" "${env_key}" "${value}" >> "${TEMP_FILE}"
}

fetch_and_write "${GOOGLE_PLACES_API_KEY_SECRET}" "GOOGLE_PLACES_API_KEY"
fetch_and_write "${NEXT_PUBLIC_GOOGLE_PLACES_API_KEY_SECRET}" "NEXT_PUBLIC_GOOGLE_PLACES_API_KEY"

mv "${TEMP_FILE}" "${ENV_FILE}"
echo "Generated ${ENV_FILE} from Secret Manager (project: ${PROJECT_ID})."

