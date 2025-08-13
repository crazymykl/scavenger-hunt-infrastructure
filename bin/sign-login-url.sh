#!/bin/sh
set -euo pipefail

STAGE_TYPE=${1:-beta}
HOST=$(aws cloudformation describe-stacks --stack-name "${STAGE_TYPE}-stage-assets" --query "Stacks[0].Outputs[?OutputKey=='domainName'].OutputValue | [0]" --output text)
EXPIRY="${2:-$(expr $(date +%s) + 604800)}" # Default expiry to one week from now

getSecret() {
  aws secretsmanager get-secret-value --secret-id "$1" --query SecretString --output text
}

KEY_PAIR_ID=$(getSecret "admin-key-pair-${STAGE_TYPE}/public-key-id")
PRIVATE_KEY=$(getSecret "admin-key-pair-${STAGE_TYPE}/private")

aws cloudfront sign --url "https://${HOST}/login" \
    --key-pair-id "${KEY_PAIR_ID}" --private-key "${PRIVATE_KEY}" --date-less-than "${EXPIRY}"
