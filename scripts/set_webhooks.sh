#!/bin/bash
# set_webhooks.sh

API_URL=${1:-"https://your-cloud-run-url.a.run.app"}

echo "Setting Telegram webhook..."
# Replace YOUR_TELEGRAM_BOT_TOKEN with actual token in prod
curl -X POST "https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/setWebhook" \
     -d "url=${API_URL}/api/webhooks/telegram"

echo ""
echo "Setting Twilio WhatsApp webhook (requires Twilio CLI)..."
# twilio phone-numbers:update "+1234567890" --sms-url="${API_URL}/api/webhooks/twilio"

echo "Webhooks configured to point to ${API_URL}"
