# 🤖 AutoWA Bot

Personal WhatsApp auto-reply bot menggunakan **Baileys** + **AI (Groq/Gemini)**.

Bot ini otomatis membalas chat saat kamu sedang tidur, meeting, atau sibuk. Dengan AI kontekstual, balasan terasa natural — bukan template!

## ✨ Features

- 🤖 **AI Contextual Reply** — Groq/Gemini jawab sesuai konteks, seolah kamu yang balas
- 🔄 **Multi-Provider AI** — Groq (primary) + Gemini (fallback) dengan key rotation
- 🔇 **DND Mode** — `!dnd 2h` aktifkan away mode sementara
- 🔄 **On/Off Toggle** — Kontrol bot dari chat (`!on` / `!off`)
- 📬 **Inbox Summary** — Rangkuman siapa aja yang chat saat kamu away
- ⏰ **Scheduled Away** — Otomatis aktif jam tidur (configurable)
- 🔑 **Keyword Auto-Reply** — Reply spesifik berdasarkan kata kunci
- 🛡️ **Anti-Ban Safety** — Reply delay, cooldown, ignore groups

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/autoWA.git
cd autoWA
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` dan isi:

```env
OWNER_NUMBER=628xxxxxxxxxx    # Nomor WA kamu
OWNER_NAME=NamaKamu           # Nama kamu
GROQ_API_KEY_1=gsk_xxx        # API key dari console.groq.com
```

### 3. Jalankan

```bash
npm start
```

Scan QR code yang muncul di terminal pakai WhatsApp → Settings → Linked Devices → Link a Device.

## 📱 Bot Commands

Kirim dari chat ke diri sendiri (Message Yourself):

| Command | Fungsi |
|---------|--------|
| `!off` | 🔴 Aktifkan away mode (bot reply) |
| `!on` | 🟢 Matikan away mode (bot diam) |
| `!dnd 2h` | 🔇 Away mode 2 jam |
| `!dnd 30m` | 🔇 Away mode 30 menit |
| `!status` | 📊 Cek status bot |
| `!inbox` | 📬 Rangkuman chat masuk |
| `!inbox clear` | 🗑️ Hapus inbox |
| `!ai <tanya>` | 🤖 Tanya AI |

## 🔑 AI Key Rotation

Bot support **banyak API key** yang di-rotasi. Kalau satu key kena rate limit, otomatis pindah ke key berikutnya.

```env
# Groq (primary) — dari console.groq.com/keys
GROQ_API_KEY_1=gsk_xxx
GROQ_API_KEY_2=gsk_xxx
GROQ_API_KEY_3=gsk_xxx

# Gemini (fallback) — dari aistudio.google.com/apikey
GEMINI_API_KEY_1=AIza_xxx
GEMINI_API_KEY_2=AIza_xxx
```

Urutan: `Groq 1 → 2 → ... → N → Gemini 1 → 2 → ... → N → Template`

## ⚙️ Configuration

Edit `config.json` untuk customize:

- **Away Messages** — Ubah template pesan di `awayMode.messages`
- **Schedule** — Atur jam tidur di `awayMode.schedule`
- **Safety** — Reply delay, max replies, cooldown
- **Keywords** — Auto-reply berdasarkan kata kunci

## 🛡️ Anti-Ban Tips

1. ✅ Bot hanya **reply**, tidak pernah kirim chat duluan
2. ✅ Group chat **diabaikan** (mengurangi aktivitas)
3. ✅ Max **3 reply** per kontak per 5 menit
4. ✅ Reply delay (configurable)
5. ❌ JANGAN broadcast ke banyak nomor
6. ❌ JANGAN spam link/promosi

## 📁 Project Structure

```
autoWA/
├── index.js                  # Entry point
├── config.json               # Bot configuration
├── .env                      # API keys (JANGAN commit!)
├── .env.example              # Template .env
├── src/
│   ├── connection.js         # Baileys WhatsApp connection
│   ├── handler.js            # Message handler & routing
│   ├── features/
│   │   ├── aiReply.js        # AI reply (Groq + Gemini rotation)
│   │   └── botControl.js     # Bot control commands (!on, !off, etc)
│   └── utils/
│       └── logger.js         # Console logger
├── auth_info/                # WA session (JANGAN commit!)
└── package.json
```

## 📝 License

MIT

## ⚠️ Disclaimer

Bot ini untuk penggunaan pribadi. Penggunaan yang melanggar ToS WhatsApp (spam, broadcast massal, dll) sepenuhnya tanggung jawab pengguna. Gunakan secara bijak!
