#!/usr/bin/env bash
# Deploys the push-reminder function to Supabase in one go.
# First run `npx supabase login` once, then:  bash scripts/deploy-reminders.sh
set -euo pipefail
cd "$(dirname "$0")/.."

REF=$(grep -oP '^VITE_SUPABASE_URL=https://\K[a-z0-9]+' .env || true)
PUBLIC_KEY=$(grep -oP '^VITE_VAPID_PUBLIC_KEY=\K\S+' .env || true)
if [ -z "$REF" ] || [ -z "$PUBLIC_KEY" ]; then
  echo "✗ Couldn't read VITE_SUPABASE_URL / VITE_VAPID_PUBLIC_KEY from .env"
  exit 1
fi

echo "→ Checking you're logged in to Supabase…"
if ! npx --yes supabase projects list >/dev/null 2>&1; then
  echo "✗ Not logged in. Run this first, then run this script again:"
  echo "    npx supabase login"
  exit 1
fi
echo "✓ Logged in"

# The key pair lives in a private, git-ignored file (created with: npx web-push generate-vapid-keys --json).
KEY_FILE=supabase/.vapid-keys.json
if [ ! -f "$KEY_FILE" ]; then
  echo "✗ $KEY_FILE not found. Create it with:"
  echo "    npx web-push generate-vapid-keys --json > $KEY_FILE"
  echo "  and put its publicKey in .env as VITE_VAPID_PUBLIC_KEY."
  exit 1
fi
PRIVATE_KEY=$(node -p "require('./$KEY_FILE').privateKey")

# Make sure the private key belongs to the public key in .env.
if ! node -e '
  const crypto = require("crypto");
  const [priv, pub] = process.argv.slice(1);
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.setPrivateKey(Buffer.from(priv, "base64url"));
  process.exit(ecdh.getPublicKey("base64url") === pub ? 0 : 1);
' "$PRIVATE_KEY" "$PUBLIC_KEY" 2>/dev/null; then
  echo "✗ That private key doesn't match the public key in .env."
  echo "  Update VITE_VAPID_PUBLIC_KEY in .env to the publicKey in $KEY_FILE."
  exit 1
fi
echo "✓ Private key matches"

read -rp "Your email (shown to push services as the sender contact): " EMAIL
EMAIL=$(echo "$EMAIL" | tr -d '[:space:]')

CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")

echo "→ Saving secrets on the server…"
npx supabase secrets set --project-ref "$REF" \
  VAPID_PUBLIC_KEY="$PUBLIC_KEY" \
  VAPID_PRIVATE_KEY="$PRIVATE_KEY" \
  VAPID_SUBJECT="mailto:$EMAIL" \
  CRON_SECRET="$CRON_SECRET"

echo "→ Deploying the send-reminders function…"
npx supabase functions deploy send-reminders --project-ref "$REF" --no-verify-jwt

# Ready-to-paste scheduler SQL (contains the secret, so it's git-ignored).
sed -e "s/<PROJECT_REF>/$REF/g" -e "s/<CRON_SECRET>/$CRON_SECRET/g" supabase/cron.sql > supabase/cron.filled.sql

echo
echo "✓ Done! Last step: open supabase/cron.filled.sql, copy all of it,"
echo "  paste it into the Supabase SQL Editor and click Run."
