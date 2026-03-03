<div align="center">

# AutoWA Bot

**Personal WhatsApp Auto-Reply Bot**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-WebSocket-25D366?style=flat-square&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![Groq](https://img.shields.io/badge/Groq-AI_Engine-F55036?style=flat-square&logo=groq&logoColor=white)](https://groq.com)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)](LICENSE)
[![Deploy](https://img.shields.io/badge/Deploy-Koyeb-4c4c4c?style=flat-square&logo=koyeb&logoColor=white)](https://www.koyeb.com)

Bot yang auto-reply chat WhatsApp kamu pas lagi tidur, meeting, atau sibuk.<br>
Pake AI biar balasannya nyambung — bukan template.

[Cara Pakai](#cara-pakai) · [Deploy ke Cloud](#deploy-ke-cloud-koyeb) · [Commands](#bot-commands) · [Konfigurasi](#konfigurasi)

</div>

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **AI Contextual Reply** | Groq/Gemini bales sesuai isi chat, seolah kamu yang jawab |
| **Multi-Provider AI** | Groq (primary) + Gemini (fallback) dengan key rotation otomatis |
| **DND Mode** | `!dnd 2h` — bot aktif 2 jam terus mati sendiri |
| **On/Off Toggle** | Kontrol bot dari chat (`!on` / `!off`) |
| **Inbox Summary** | Rangkuman siapa aja yang chat pas kamu away |
| **Scheduled Away** | Otomatis aktif pas jam tidur |
| **Keyword Auto-Reply** | Reply otomatis berdasarkan kata kunci tertentu |
| **Anti-Ban Safety** | Delay, cooldown, ignore group — biar aman |
| **Web QR Scanner** | Scan QR dari browser (buat deploy cloud) |

---

## Cara Pakai

### 1. Clone repo

```bash
git clone https://github.com/xinnxz/autoWA.git
cd autoWA
npm install
```

### 2. Setup environment

```bash
cp .env.example .env
```

Buka file `.env`, isi yang ini:

```env
OWNER_NUMBER=628xxxxxxxxxx
OWNER_NAME=NamaKamu
GROQ_API_KEY_1=gsk_xxx
```

> API key Groq bisa dibuat gratis di [console.groq.com/keys](https://console.groq.com/keys).
> Bisa isi banyak key buat rotasi (anti rate-limit).

### 3. Jalankan

```bash
npm start
```

Muncul QR code di terminal. Scan pake WhatsApp (Settings > Linked Devices > Link a Device). Selesai, bot jalan.

---

## Deploy ke Cloud (Koyeb)

Kalo mau bot nya jalan terus walau PC mati, deploy ke Koyeb. Gratis.

<details>
<summary><b>Klik untuk lihat langkah deploy</b></summary>

### Step 1 — Buat akun Koyeb

Buka [koyeb.com](https://www.koyeb.com), sign up. Verifikasi kartu (ditarik $1 terus langsung di-refund).

### Step 2 — Push repo ke GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/USERNAME/autoWA.git
git branch -M main
git push -u origin main
```

### Step 3 — Buat service di Koyeb

1. Login ke [app.koyeb.com](https://app.koyeb.com)
2. Klik **Create Service** > **Web service**
3. Pilih **GitHub** > connect akun GitHub > pilih repo `autoWA`
4. Branch: `main`
5. Builder: **Buildpack** (default)
6. Build/Run command: biarkan default
7. Klik **Next**

### Step 4 — Isi Environment Variables

Tambahkan semua variable yang dibutuhin:

```
OWNER_NUMBER = 6281234567890
OWNER_NAME = NamaKamu
GROQ_API_KEY_1 = gsk_xxxxx
GROQ_API_KEY_2 = gsk_xxxxx
```

Isi semua Groq key. Minimal 1.

Kalo punya Gemini key juga bisa ditambahin:

```
GEMINI_API_KEY_1 = AIzaxxxxx
```

### Step 5 — Pilih instance

- Instance type: **Free** (Nano)
- Region: terserah
- Scaling: biarkan default

### Step 6 — Deploy

Klik **Deploy**. Tunggu 2-3 menit.

### Step 7 — Scan QR dari browser

1. Koyeb kasih URL publik (contoh: `https://autowa-xxxxx.koyeb.app`)
2. Buka URL itu di browser — muncul QR code dengan countdown timer
3. Scan pake WhatsApp
4. Halaman berubah jadi "Bot Terhubung"

Selesai. Bot jalan 24/7.

> Kalau Koyeb restart, tinggal buka URL lagi dan scan ulang. Bot tetap running, cuma perlu re-pair aja.

</details>

---

## Bot Commands

Kirim dari chat ke diri sendiri di WhatsApp:

| Command | Fungsi |
|---------|--------|
| `!help` | Tampilkan daftar command |
| `!off` | Aktifkan away mode (bot mulai reply) |
| `!on` | Matikan away mode (bot diam) |
| `!dnd 2h` | Away mode 2 jam, mati otomatis |
| `!dnd 30m` | Away mode 30 menit |
| `!status` | Cek status bot sekarang |
| `!inbox` | Lihat rangkuman chat masuk pas away |
| `!inbox clear` | Hapus inbox |
| `!ai <pertanyaan>` | Tanya AI langsung |
| `!logout` | Logout dari WhatsApp (perlu scan QR ulang) |

> Commands cuma bisa dijalankan oleh owner.

---

## AI Key Rotation

Bot support banyak API key yang dirotasi otomatis. Kalo satu key kena rate limit, langsung switch ke key berikutnya.

```env
# Groq (primary)
GROQ_API_KEY_1=gsk_xxx
GROQ_API_KEY_2=gsk_xxx
GROQ_API_KEY_3=gsk_xxx

# Gemini (fallback, opsional)
GEMINI_API_KEY_1=AIza_xxx
GEMINI_API_KEY_2=AIza_xxx
```

```
Urutan: Groq 1 > 2 > ... > N > Gemini 1 > 2 > ... > N > Template message
```

---

## Konfigurasi

Edit `config.js` — setiap setting udah ada comment penjelasannya di file:

| Setting | Deskripsi |
|---------|-----------|
| `ai.model` | Model AI di Groq (default: `openai/gpt-oss-120b`) |
| `ai.geminiModel` | Model Gemini fallback (default: `gemini-2.0-flash`) |
| `ai.contextualMode` | AI reply seolah kamu yang bales |
| `ai.maxTokens` | Panjang max jawaban AI |
| `awayMode.messages` | Daftar pesan fallback |
| `awayMode.schedule` | Jam tidur (away otomatis) |
| `safety.replyDelay` | Delay sebelum reply (ms) |
| `safety.maxRepliesPerContact` | Max reply per kontak |
| `safety.cooldownPerContact` | Cooldown antar reply (detik) |
| `cleanup.maxInbox` | Max pesan di inbox |
| `cleanup.inboxMaxAge` | Hapus inbox lebih dari X jam |
| `keepAlive.enabled` | Anti-sleep untuk cloud hosting |
| `keepAlive.intervalMinutes` | Interval ping (menit) |

---

## Anti-Ban

- Bot cuma reply, ga pernah kirim chat duluan
- Group chat diabaikan
- Max 3 reply per kontak per 5 menit
- Ada delay sebelum reply
- Jangan broadcast ke banyak nomor
- Jangan spam link atau promosi

---

## Struktur Project

```
autoWA/
├── index.js                  # entry point + web QR scanner
├── config.js                 # konfigurasi bot (ada comment lengkap)
├── .env                      # API keys (jangan commit)
├── .env.example              # template .env
├── LICENSE                   # GPL-3.0
├── src/
│   ├── connection.js         # koneksi WhatsApp (Baileys)
│   ├── handler.js            # handler pesan masuk + anti-spam
│   ├── features/
│   │   ├── aiReply.js        # AI reply (Groq + Gemini, key rotation)
│   │   └── botControl.js     # command bot (!help, !on, !off, dll)
│   └── utils/
│       └── logger.js         # logger
├── auth_info/                # session WA (jangan commit)
└── package.json
```

---

## License

[GPL-3.0](LICENSE) — boleh dipake dan dimodif, tapi wajib credit author asli dan tetep open source.

Copyright (c) 2026 Luthfi ([xinnxz](https://github.com/xinnxz))

---

<div align="center">

**Disclaimer** — Bot ini buat pemakaian pribadi. Kalo dipake buat spam atau ngelanggar ToS WhatsApp, itu tanggung jawab kamu sendiri.

</div>
