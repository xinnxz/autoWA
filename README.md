<div align="center">

<img src="public/logo.png" alt="AutoWA" width="280">

# AutoWA

**WhatsApp Auto-Reply Bot — AI-Powered, Self-Hosted**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-WebSocket-25D366?style=flat-square&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=flat-square&logo=groq&logoColor=white)](https://groq.com)
[![Gemini](https://img.shields.io/badge/Gemini-Fallback-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)](LICENSE)
[![Deploy](https://img.shields.io/badge/Deploy-Koyeb-121212?style=flat-square&logo=koyeb&logoColor=white)](https://www.koyeb.com)

A bot that automatically replies to your WhatsApp messages when you're away.<br>
Uses AI to generate contextual, human-like responses — not canned templates.

[Setup](#setup) · [Deploy](#deploy) · [Dashboard](#web-dashboard) · [Commands](#commands) · [Configuration](#configuration) · [Project Structure](#project-structure)

</div>

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Setup](#setup)
- [Deploy](#deploy)
  - [Local (CLI)](#option-1--local-cli)
  - [Koyeb (Cloud, Free)](#option-2--koyeb-cloud-free-tier)
  - [Termux (Android)](#option-3--termux-android)
- [Web Dashboard](#web-dashboard)
- [Commands](#commands)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [config.js Reference](#configjs-reference)
  - [AI Providers](#ai-providers)
  - [Languages](#languages)
  - [Reply Styles](#reply-styles)
- [Anti-Ban](#anti-ban)
- [Project Structure](#project-structure)
- [License](#license)

---

## Features

| Category | Feature | Description |
|----------|---------|-------------|
| **Core** | AI Contextual Reply | Replies match the context of the incoming message |
| | Away / DND Mode | Activate manually or on a schedule |
| | Multi-Provider AI | Groq (primary) + Gemini (fallback), automatic key rotation |
| | Chat History | AI remembers last 6 messages per contact for natural conversation |
| | Owner-Only Commands | Full control via WhatsApp chat commands |
| **Group** | Per-Group Control | Enable/disable bot and set custom styles per group |
| | Sender Mention | Replies in groups mention the original sender |
| **Dashboard** | 7-Page Web UI | Dashboard, Inbox, Logs, Contacts, Configuration, Groups, Connection |
| | Live Controls | Toggle away, change model/style/language from the web |
| | Real-Time Logs | Server-Sent Events log stream |
| | Latency Chart | Canvas-rendered AI response time graph |
| | Contact Tracker | Shows who messaged, how often, and when |
| | QR Scanner | Scan WhatsApp QR directly from the dashboard |
| | Theme Toggle | Dark and light mode |
| **i18n** | 10 Languages | id, en, es, ar, pt, ja, hi, ko, fr, ms |
| **Safety** | Anti-Ban | Reply delay, rate limiting, cooldown, group ignore |
| | Keep-Alive | Self-pinging to prevent cloud hosting sleep |

---

## Requirements

- **Node.js** 18 or higher — [download](https://nodejs.org)
- **Groq API key** (free) — [console.groq.com/keys](https://console.groq.com/keys)
- **Gemini API key** (optional, free) — [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- A WhatsApp account to link

---

## Setup

### Step 1 — Clone and install

```bash
git clone https://github.com/xinnxz/autoWA.git
cd autoWA
npm install
```

### Step 2 — Create environment file

```bash
cp .env.example .env
```

Open `.env` in any text editor and fill in your values:

```env
# Required
OWNER_NUMBER=628xxxxxxxxxx
OWNER_NAME=YourName

# At least one AI key is required
GROQ_API_KEY_1=gsk_your_key_here

# Optional: add more keys for rotation (recommended)
GROQ_API_KEY_2=gsk_your_second_key
GROQ_API_KEY_3=gsk_your_third_key

# Optional: Gemini as fallback
GEMINI_API_KEY_1=AIza_your_key_here

# Server port (default 3000)
PORT=3000
```

> **Where to get keys:**
> - Groq: go to [console.groq.com/keys](https://console.groq.com/keys), sign in, create a key. Free tier allows ~30 requests/minute.
> - Gemini: go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey), create a key. Free tier allows 60 requests/minute.

### Step 3 — Configure (optional)

Open `config.js` and adjust settings. Every option has comments explaining what it does. Key settings:

```js
language: "id",                   // Bot language (id, en, es, ar, pt, ja, hi, ko, fr, ms)

ai: {
  replyStyle: "santai",           // santai, formal, gaul, campur, or any custom string
  model: "llama-3.3-70b-versatile", // Groq model
  contextualMode: true,           // AI replies as if it's you
}
```

### Step 4 — Run

```bash
npm start
```

A QR code appears in the terminal. Open WhatsApp on your phone, go to **Settings > Linked Devices > Link a Device**, and scan the code.

The bot is now running. Send `!help` to yourself in WhatsApp to see available commands.

---

## Deploy

### Option 1 — Local (CLI)

Run directly on your machine. Bot stops when you close the terminal.

```bash
npm start
```

To keep it running in the background:

```bash
# Linux/Mac — using pm2
npm install -g pm2
pm2 start index.js --name autowa
pm2 save
pm2 startup    # auto-start on reboot

# Windows — using pm2
npm install -g pm2
pm2 start index.js --name autowa
```

Access the dashboard at `http://localhost:3000/dashboard?key=YOUR_OWNER_NUMBER`.

---

### Option 2 — Koyeb (Cloud, Free Tier)

Runs 24/7 without keeping your computer on. Koyeb has a free tier (no credit card required for the free instance).

#### Prerequisites

1. A [GitHub](https://github.com) account
2. A [Koyeb](https://www.koyeb.com) account (sign up with GitHub)
3. Your code pushed to a GitHub repository

#### Step 1 — Push to GitHub

If you haven't already:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/autoWA.git
git branch -M main
git push -u origin main
```

> **Important:** Make sure `.env` and `auth_info/` are in `.gitignore`. Never push secrets to GitHub.

#### Step 2 — Install Koyeb CLI (recommended)

The CLI gives you more control than the web UI.

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/koyeb/koyeb-cli/master/install.sh | sh
```

**Windows (PowerShell):**
```powershell
iwr -useb https://raw.githubusercontent.com/koyeb/koyeb-cli/master/install.ps1 | iex
```

**Or via npm (all platforms):**
```bash
npm install -g koyeb-cli
```

Login:
```bash
koyeb login
```
This opens a browser. Authorize, done.

#### Step 3 — Create the service

Using the CLI, run one command to create and deploy:

```bash
koyeb service create autowa \
  --app autowa \
  --git github.com/YOUR_USERNAME/autoWA \
  --git-branch main \
  --instance-type free \
  --port 3000:http \
  --route /:3000 \
  --env OWNER_NUMBER=628xxxxxxxxxx \
  --env OWNER_NAME=YourName \
  --env GROQ_API_KEY_1=gsk_xxx \
  --env GROQ_API_KEY_2=gsk_xxx \
  --env PORT=3000
```

> **Windows users:** replace `\` with `` ` `` (backtick) for line continuation in PowerShell, or put everything on one line.

Add more env vars as needed:
```bash
  --env GEMINI_API_KEY_1=AIza_xxx \
  --env GROQ_API_KEY_3=gsk_xxx
```

#### Step 4 — Wait for build

Monitor the deployment:
```bash
koyeb service get autowa --app autowa
```

Or watch logs:
```bash
koyeb service logs autowa --app autowa
```

Build takes 2-3 minutes. Once status shows `HEALTHY`, proceed.

#### Step 5 — Get your URL

```bash
koyeb app get autowa
```

This shows your public URL, for example: `https://autowa-YOUR_USERNAME.koyeb.app`

#### Step 6 — Scan QR code

Open `https://YOUR_URL/` in a browser. A QR code with a countdown timer appears. Scan it with WhatsApp.

Or use the dashboard:
```
https://YOUR_URL/dashboard?key=YOUR_OWNER_NUMBER
```
Navigate to **Connection** in the sidebar to scan from there.

#### Step 7 — Verify

Send `!status` to yourself in WhatsApp. If the bot replies, everything works.

#### Updating

After code changes, push and redeploy:

```bash
git add .
git commit -m "update"
git push
koyeb service redeploy autowa --app autowa
```

#### Alternative: Deploy via Koyeb Web UI

If you prefer not to use the CLI:

1. Go to [app.koyeb.com](https://app.koyeb.com)
2. Click **Create Service** > **Web Service**
3. Select **GitHub**, connect your account, choose the `autoWA` repo
4. Set branch to `main`, builder to **Buildpack**
5. Add environment variables (same as above)
6. Choose **Free** instance type
7. Click **Deploy**

#### Persistent Auth (No Re-Scan on Restart)

By default, Koyeb's free tier has no persistent storage. This means the bot loses its WhatsApp session on every restart and requires re-scanning the QR code.

To fix this, use **MongoDB Atlas** (free) to store the WhatsApp auth credentials in the cloud:

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a **free cluster** (M0 Sandbox, 512MB — no credit card)
3. Create a database user (username + password)
4. Go to **Network Access** → Add IP: `0.0.0.0/0` (allow all, required for Koyeb)
5. Go to **Database** → Click **Connect** → Choose **Drivers** → Copy the connection string
6. Replace `<password>` in the string with your database user's password
7. Add the connection string as `MONGODB_URI` in Koyeb environment variables:

```bash
koyeb service update autowa --app autowa \
  --env MONGODB_URI="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
```

After the first QR scan, the session is stored in MongoDB. All future restarts will auto-connect without scanning again.

---

### Option 3 — Termux (Android)

Run the bot directly from your Android phone using [Termux](https://f-droid.org/packages/com.termux/). No PC or server needed.

> **Important:** Install Termux from [F-Droid](https://f-droid.org/packages/com.termux/), NOT from Google Play Store. The Play Store version is outdated.

#### Step 1 — Install dependencies

Open Termux and run:

```bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts git
```

This installs Node.js 18+ and Git.

#### Step 2 — Clone and install

```bash
git clone https://github.com/xinnxz/autoWA.git
cd autoWA
npm install
```

> First `npm install` may take 2-5 minutes on phone. Be patient.

#### Step 3 — Create .env file

```bash
cp .env.example .env
nano .env
```

Fill in your values (same as [Step 2 in Setup](#step-2--create-environment-file)). Press `Ctrl+X`, then `Y`, then `Enter` to save.

#### Step 4 — Run the bot

```bash
node index.js
```

Scan the QR code from the terminal or open the dashboard in your phone's browser:

```
http://localhost:3000/dashboard?key=YOUR_OWNER_NUMBER
```

#### Keep running in background (tmux)

Without tmux, the bot stops when you close Termux. To keep it running:

```bash
pkg install -y tmux
tmux new -s autowa
cd autoWA && node index.js
```

To detach (bot keeps running): press `Ctrl+B`, then `D`

To reattach later:
```bash
tmux attach -t autowa
```

#### Termux Tips

| Tip | Detail |
|-----|--------|
| **Acquire Wakelock** | Open notification drawer → tap Termux notification → "Acquire Wakelock". Prevents Android from killing Termux. |
| **Disable battery optimization** | Settings → Apps → Termux → Battery → Unrestricted |
| **Access from PC** | Install `pkg install openssh`, run `sshd`. Connect via `ssh user@phone-ip -p 8022` |
| **Storage access** | Run `termux-setup-storage` to access phone files |

#### Termux Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm install` fails with gyp errors | Run `pkg install python make` first |
| "address already in use" | Another instance is running. Kill it: `pkill -f node` |
| Bot stops when phone sleeps | Acquire Wakelock (see tips above) |
| Permission denied | Run `chmod +x index.js` |

---

## Web Dashboard

The dashboard provides a full control panel accessible from any browser.

**Access:** `https://YOUR_URL/dashboard?key=YOUR_OWNER_NUMBER`

The `key` parameter is your `OWNER_NUMBER` from the `.env` file. Without it, the dashboard returns 401.

### Pages

| Page | What it shows |
|------|---------------|
| **Dashboard** | Stats (uptime, inbox count, AI calls, contacts), activity feed, latency chart (read-only monitoring) |
| **Inbox** | Messages received while in away mode |
| **Logs** | Real-time server log stream (SSE) |
| **Contacts** | List of people who messaged the bot, with message count and last seen |
| **Configuration** | Quick controls (away, style, model, language) + editable settings (delay, tokens, schedule, etc.) + Save button |
| **Groups** | Registered groups with per-group enable/disable toggle |
| **Connection** | QR code scanner for WhatsApp linking |

### Controls

From the Configuration page:

| Control | Action |
|---------|--------|
| **Away toggle** | Switch away mode on/off |
| **Style dropdown** | Change reply style (santai, formal, gaul, etc.) |
| **Model dropdown** | Change AI model at runtime |
| **Language dropdown** | Switch bot language (10 options) |
| **Clear History** | Wipe AI conversation memory |
| **Owner Name** | Change display name |
| **Timezone** | Set IANA timezone |
| **Reply Delay** | Adjust reply delay (500-10000ms) |
| **Max Tokens** | Adjust AI response length (200-4096) |
| **Max Replies** | Replies per contact per cooldown (1-20) |
| **Cooldown** | Cooldown period in seconds |
| **Contextual AI** | Toggle contextual reply mode |
| **Chat History** | Toggle AI conversation memory |
| **Ignore Groups** | Toggle group message filtering |
| **Auto Schedule** | Toggle scheduled away mode |
| **Sleep Start/End** | Set away schedule times |
| **Save** | Apply all editable settings |

All changes are **persisted** and survive bot restarts.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Dashboard |
| `I` | Inbox |
| `L` | Logs |
| `C` | Contacts |
| `S` | Configuration |
| `G` | Groups |
| `Q` | Connection |
| `R` | Refresh data |

### API Endpoints

All endpoints require `?key=OWNER_NUMBER`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard` | Dashboard HTML page |
| `GET` | `/api/stats` | All bot data (JSON) |
| `POST` | `/api/away` | Toggle away mode — body: `{ "action": "on" }` or `{ "action": "off" }` |
| `POST` | `/api/style` | Change style — body: `{ "style": "formal" }` |
| `POST` | `/api/model` | Change model — body: `{ "model": "llama-3.3-70b-versatile" }` |
| `POST` | `/api/language` | Change language — body: `{ "lang": "en" }` |
| `POST` | `/api/config` | Update config settings (delay, tokens, schedule, etc.) |
| `POST` | `/api/groups/toggle` | Toggle group enable/disable — body: `{ "id": "...", "enabled": true }` |
| `GET` | `/api/inbox/clear` | Clear inbox |
| `GET` | `/api/history/clear` | Clear chat history |
| `GET` | `/api/logs/clear` | Clear log buffer |
| `GET` | `/api/contacts/clear` | Clear contact tracker |
| `GET` | `/api/logs/stream` | SSE log stream |
| `GET` | `/api/qr` | QR code data (JSON) |
| `GET` | `/health` | Health check (no auth) |

---

## Commands

Send commands to **yourself** in WhatsApp (personal chat). Only the owner can execute commands.

### General

| Command | Description |
|---------|-------------|
| `!help` | Show all available commands |
| `!status` | Current bot status |
| `!on` | Deactivate away mode (bot stops replying) |
| `!off` | Activate away mode (bot starts replying) |
| `!dnd 2h` | Activate away mode for 2 hours, then auto-deactivate |
| `!dnd 30m` | Activate away mode for 30 minutes |

### Inbox

| Command | Description |
|---------|-------------|
| `!inbox` | Show messages received while away |
| `!inbox clear` | Clear the inbox |

### AI

| Command | Description |
|---------|-------------|
| `!ai <question>` | Ask the AI directly and get a response |
| `!style <name>` | Change reply style (santai, formal, gaul, campur, or any text) |
| `!model <name>` | Change AI model (e.g., `!model llama-3.3-70b-versatile`) |
| `!history clear` | Clear AI conversation memory |

### Group

| Command | Description |
|---------|-------------|
| `!group on` | Enable bot in current group |
| `!group off` | Disable bot in current group |
| `!group style <name>` | Set custom reply style for the group |
| `!group list` | Show all active groups |
| `!group reset` | Disable bot in all groups |

### System

| Command | Description |
|---------|-------------|
| `!logout` | Disconnect WhatsApp (requires re-scan) |

---

## Configuration

### Environment Variables

Defined in `.env`. Copy from `.env.example` to get started.

| Variable | Required | Description |
|----------|----------|-------------|
| `OWNER_NUMBER` | Yes | Your WhatsApp number in international format without `+` (e.g., `6281234567890`) |
| `OWNER_NAME` | Yes | Your name, used in AI prompts |
| `GROQ_API_KEY_1` | Yes | Groq API key. Get from [console.groq.com/keys](https://console.groq.com/keys) |
| `GROQ_API_KEY_2..N` | No | Additional Groq keys for rotation |
| `GEMINI_API_KEY_1` | No | Gemini API key (fallback). Get from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_API_KEY_2..N` | No | Additional Gemini keys for rotation |
| `PORT` | No | Server port. Default: `3000` |
| `MONGODB_URI` | No | MongoDB Atlas connection string. Enables cloud auth persistence. See [Persistent Auth](#persistent-auth-no-re-scan-on-restart) |

### config.js Reference

| Setting | Default | Description |
|---------|---------|-------------|
| `language` | `"id"` | Bot language. See [Languages](#languages) |
| `ai.replyStyle` | `"santai"` | Reply tone. See [Reply Styles](#reply-styles) |
| `ai.model` | `"llama-3.3-70b-versatile"` | Groq model name |
| `ai.geminiModel` | `"gemini-2.5-flash"` | Gemini fallback model |
| `ai.contextualMode` | `true` | AI generates replies as if it's the owner |
| `ai.maxTokens` | `500` | Maximum AI response length |
| `ai.chatHistory.enabled` | `true` | Remember conversation context |
| `ai.chatHistory.maxMessages` | `6` | Messages to remember per contact |
| `ai.chatHistory.maxAge` | `30` | History TTL in minutes |
| `awayMode.enabled` | `true` | Start with away mode on |
| `awayMode.schedule.enabled` | `false` | Auto-activate on schedule |
| `awayMode.schedule.sleepStart` | `"22:00"` | Schedule start time |
| `awayMode.schedule.sleepEnd` | `"07:00"` | Schedule end time |
| `safety.replyDelay` | `2000` | Delay before replying (ms) |
| `safety.maxRepliesPerContact` | `3` | Max replies per contact per cooldown |
| `safety.cooldownPerContact` | `300` | Cooldown period in seconds |
| `safety.ignoreGroups` | `true` | Ignore group messages by default |
| `cleanup.maxInbox` | `100` | Max inbox messages before auto-cleanup |
| `cleanup.inboxMaxAge` | `24` | Delete inbox messages after N hours |
| `keepAlive.enabled` | `true` | Self-ping to prevent sleep |
| `keepAlive.intervalMinutes` | `4` | Ping interval |

### AI Providers

The bot uses a fallback chain:

```
Groq (all keys) -> Gemini (all keys) -> Template message
```

Within each provider, keys are rotated round-robin. If one key hits a rate limit, the next key is tried automatically.

**Recommended setup:** 3 Groq keys + 1-2 Gemini keys. This gives high availability with zero downtime.

Available Groq models:

| Model | Description |
|-------|-------------|
| `llama-3.3-70b-versatile` | Best all-around, recommended |
| `llama-3.1-8b-instant` | Faster, less capable |
| `openai/gpt-oss-120b` | Largest open model |
| `openai/gpt-oss-20b` | Smaller variant |
| `qwen/qwen3-32b` | Alibaba model |
| `moonshotai/kimi-k2-instruct` | Moonshot, good at reasoning |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout |

### Languages

Set `language` in `config.js` or change via dashboard/command.

| Code | Language |
|------|----------|
| `id` | Bahasa Indonesia |
| `en` | English |
| `es` | Espanol |
| `ar` | Arabic |
| `pt` | Portugues |
| `ja` | Japanese |
| `hi` | Hindi |
| `ko` | Korean |
| `fr` | Francais |
| `ms` | Bahasa Melayu |

Each language has full translations for all bot responses, system messages, and help text. Locale files are in `locales/`.

### Reply Styles

| Style | Effect |
|-------|--------|
| `santai` | Casual, relaxed tone |
| `formal` | Professional, polite |
| `gaul` | Slang, very informal |
| `campur` | Mixed formal/informal |
| Any string | Custom — AI interprets your description as a persona |

Custom example: set style to `"british english with dry humor"` or `"bahasa sunda halus"` — the AI will follow that instruction.

---

## Anti-Ban

WhatsApp may flag accounts that behave like bots. This bot includes several safety mechanisms:

- **Reply delay** — waits 2 seconds before responding (configurable)
- **Rate limiting** — max 3 replies per contact per 5 minutes
- **Cooldown** — contacts are blocked for 5 minutes after hitting the limit
- **No broadcast** — bot only replies, never initiates contact
- **Group isolation** — groups are ignored by default (opt-in via `!group on`)
- **Human-like responses** — AI generates varied, natural text

**Additional recommendations:**
- Do not use on newly created WhatsApp numbers
- Do not forward or broadcast messages
- Do not send links or promotional content through the bot
- Keep your average daily message volume reasonable

---

## Project Structure

```
autoWA/
|-- index.js                    # Entry point, Express server, API endpoints, dashboard
|-- config.js                   # All configuration with inline documentation
|-- .env                        # API keys and secrets (not committed)
|-- .env.example                # Template for .env
|-- package.json
|-- LICENSE                     # GPL-3.0
|
|-- src/
|   |-- connection.js           # Baileys WhatsApp connection handler
|   |-- handler.js              # Incoming message handler, anti-spam, routing
|   |
|   |-- features/
|   |   |-- aiReply.js          # AI response generation, provider rotation, metrics
|   |   |-- botControl.js       # Command handler, state management, group settings
|   |   |-- autoReply.js        # Keyword-based auto-reply rules
|   |   |-- faq.js              # FAQ response database
|   |   |-- broadcast.js        # Broadcast utilities
|   |   |-- order.js            # Order-related features
|   |   +-- welcome.js          # Welcome message handler
|   |
|   |-- utils/
|   |   |-- logger.js           # Logging with SSE broadcast
|   |   |-- locale.js           # Language/locale loader
|   |   |-- contacts.js         # Contact tracking module
|   |   |-- store.js            # State persistence engine (JSON file)
|   |   +-- adminCmd.js         # Admin command utilities
|   |
|   +-- web/
|       +-- dashboard.html      # Dashboard UI (single-file, no build step)
|
|-- locales/
|   |-- id.js                   # Bahasa Indonesia
|   |-- en.js                   # English
|   |-- es.js                   # Espanol
|   |-- ar.js                   # Arabic
|   |-- pt.js                   # Portugues
|   |-- ja.js                   # Japanese
|   |-- hi.js                   # Hindi
|   |-- ko.js                   # Korean
|   |-- fr.js                   # Francais
|   |-- ms.js                   # Bahasa Melayu
|   +-- _template.js            # Template for adding new languages
|
+-- data/                       # Persisted state (auto-generated, not committed)
|   +-- state.json              # Inbox, contacts, groups, config overrides
|
+-- auth_info/                  # WhatsApp session data (not committed)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| QR code expired | Refresh the page or restart the bot. QRs expire after 60 seconds. |
| Bot not replying | Check `!status`. Make sure away mode is on (`!off` activates it). |
| "No API key" warning | Add at least one `GROQ_API_KEY_*` or `GEMINI_API_KEY_*` to `.env`. |
| Rate limit errors | Add more API keys. Each Groq key allows ~30 req/min. |
| Dashboard 401 | Make sure `?key=` matches your `OWNER_NUMBER` exactly. |
| Session lost after restart | Normal on cloud. Open the URL and scan QR again. |
| Port already in use | Change `PORT` in `.env` or stop the other process. |

---

## License

[GPL-3.0](LICENSE) — free to use and modify. Must credit the original author and keep it open source.

Copyright (c) 2026 [xinnxz](https://github.com/xinnxz)

---

<div align="center">

**Disclaimer** — This bot is for personal use. Misuse that violates WhatsApp's Terms of Service is the user's responsibility.

</div>
