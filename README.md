# Telegram Status Tracker

Track Telegram user online status via MTProto and get statistics through a bot.

## Features

- 🔍 Track user online/offline status via MTProto (60-120s polling)
- 📊 Smart session aggregation with 3-minute gap rule
- 🤖 Telegram bot for stats and notifications
- 📈 Statistics for 24/48/72 hours periods
- 🔔 Notifications when user comes online
- 💾 Turso (PostgreSQL) database for persistent storage

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

Edit `.env` file:

- `API_ID` and `API_HASH` - Get from https://my.telegram.org
- `BOT_TOKEN` - Get from @BotFather
- `TURSO_URL` and `TURSO_API_KEY` - Your Turso database credentials
- `TARGET_USER` - Username or ID of the user to track (e.g., @username)
- `NOTIFICATION_CHAT_ID` - Your chat ID for notifications (send /start to the bot to get it)

3. **First run (MTProto authentication):**

```bash
npm run dev
```

You'll be prompted for:

- Phone number
- Login code
- 2FA password (if enabled)

Save the session string for future use.

## Usage

**Start the tracker:**

```bash
npm run dev
```

**Bot Commands:**

- `/status` - Current online/offline status
- `/stats 24` - Statistics for last 24 hours
- `/stats 48` - Statistics for last 48 hours
- `/stats 72` - Statistics for last 72 hours
- `/help` - Show available commands

## How It Works

### 3-Minute Gap Rule

If the user goes offline and comes back online within 3 minutes, it's considered the same session. This eliminates:

- Network fluctuations
- MTProto delays
- False offline detections

### Architecture

```
MTProto Client → Status Tracker → Session Aggregator → Database
                                        ↓
                                  Telegram Bot ← Commands & Notifications
```

## Database Schema

**status_checks** - Raw polling data

- `id`, `checked_at`, `status`, `created_at`

**online_sessions** - Aggregated sessions

- `id`, `session_start`, `session_end`, `duration_minutes`, `created_at`, `updated_at`

## Safety

- 1 request per 60-120 seconds (randomized)
- Tracking 1 user only
- No FloodWait risk
- No ban risk

## License

MIT
