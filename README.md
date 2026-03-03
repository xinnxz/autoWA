# AutoWA Bot

Bot auto-reply WhatsApp pribadi pake Baileys + AI (Groq/Gemini).

Kalo kamu lagi tidur, meeting, atau sibuk, bot ini bales chat masuk otomatis. Pake AI jadi balasannya nyambung, bukan template doang.

---

## Fitur

- **AI Contextual Reply** — Groq/Gemini bales sesuai isi chat, seolah kamu yang jawab
- **Multi-Provider AI** — Groq (primary) + Gemini (fallback) dengan key rotation
- **DND Mode** — ketik `!dnd 2h` bot aktif 2 jam terus mati sendiri
- **On/Off Toggle** — kontrol bot dari chat (`!on` / `!off`)
- **Inbox Summary** — rangkuman siapa aja yang chat pas kamu away
- **Scheduled Away** — otomatis aktif pas jam tidur
- **Keyword Auto-Reply** — reply otomatis berdasarkan kata kunci tertentu
- **Anti-Ban Safety** — ada delay, cooldown, ignore group

---

## Cara Pakai (Lokal)

### 1. Clone repo

```bash
git clone https://github.com/ximxz/autoWA.git
cd autoWA
npm install
```

### 2. Setup environment

```bash
cp .env.example .env
```

Buka file `.env`, isi:

```env
OWNER_NUMBER=628xxxxxxxxxx
OWNER_NAME=NamaKamu
GROQ_API_KEY_1=gsk_xxx
```

Buat API key Groq di [console.groq.com/keys](https://console.groq.com/keys). Gratis. Bisa isi banyak key buat rotasi (anti rate-limit).

### 3. Jalankan

```bash
npm start
```

Muncul QR code di terminal. Scan pake WhatsApp (Settings > Linked Devices > Link a Device). Selesai, bot jalan.

---

## Deploy ke Cloud (Koyeb) — Gratis 24/7

Kalo mau bot nya jalan terus walau PC mati, deploy ke Koyeb. Gratis.

### Step 1 — Buat akun Koyeb

Buka [koyeb.com](https://www.koyeb.com), sign up. Verifikasi kartu (ditarik $1 terus langsung di-refund).

### Step 2 — Push repo ke GitHub

Kalo belum punya repo:

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
3. Pilih **GitHub** > connect akun GitHub kamu > pilih repo `autoWA`
4. Branch: `main`
5. Builder: **Buildpack** (default, ga perlu diubah)
6. Build command: biarkan default
7. Run command: biarkan default
8. Klik **Next**

### Step 4 — Isi Environment Variables

Ini bagian paling penting. Klik **Environment variables**, tambahkan:

```
OWNER_NUMBER = 6281234567890
OWNER_NAME = NamaKamu
GROQ_API_KEY_1 = gsk_xxxxx
GROQ_API_KEY_2 = gsk_xxxxx
GROQ_API_KEY_3 = gsk_xxxxx
```

Isi semua Groq key kamu. Minimal 1, idealnya banyak biar ga kena rate limit.

Kalo punya Gemini key juga, tambahin:

```
GEMINI_API_KEY_1 = AIzaxxxxx
```

### Step 5 — Pilih instance

- Instance type: **Free** (Nano)
- Region: terserah, yang deket aja (Washington atau Singapore)
- Scaling: biarkan default

### Step 6 — Deploy

Klik **Deploy**. Tunggu 2-3 menit sampe build selesai.

### Step 7 — Scan QR dari browser

Setelah deploy selesai, Koyeb kasih URL (contoh: `https://autowa-xxxxx.koyeb.app`).

1. Buka URL itu di browser
2. Muncul QR code
3. Scan pake WhatsApp (Settings > Linked Devices > Link a Device)
4. Kalo udah connected, halaman berubah jadi "Bot Terhubung"

Selesai. Bot jalan 24/7.

---

## Bot Commands

Kirim dari chat ke diri sendiri di WhatsApp:

| Command | Fungsi |
|---------|--------|
| `!off` | aktifkan away mode (bot mulai reply) |
| `!on` | matikan away mode (bot diam) |
| `!dnd 2h` | away mode 2 jam, mati otomatis |
| `!dnd 30m` | away mode 30 menit |
| `!status` | cek status bot sekarang |
| `!inbox` | lihat rangkuman chat masuk pas away |
| `!inbox clear` | hapus inbox |
| `!ai <pertanyaan>` | tanya AI langsung |

---

## AI Key Rotation

Bot support banyak API key yang dirotasi otomatis. Kalo satu key kena rate limit, langsung pindah ke key berikutnya.

```env
# Groq (primary) — dari console.groq.com/keys
GROQ_API_KEY_1=gsk_xxx
GROQ_API_KEY_2=gsk_xxx
GROQ_API_KEY_3=gsk_xxx

# Gemini (fallback, opsional) — dari aistudio.google.com/apikey
GEMINI_API_KEY_1=AIza_xxx
GEMINI_API_KEY_2=AIza_xxx
```

Urutan pemakaian: `Groq 1 > 2 > ... > N > Gemini 1 > 2 > ... > N > Template`

---

## Konfigurasi

Edit `config.json` buat customize:

- `awayMode.messages` — ubah pesan auto-reply
- `awayMode.schedule` — jam tidur (kapan bot aktif otomatis)
- `safety.replyDelay` — delay sebelum reply (dalam ms)
- `safety.maxRepliesPerContact` — max berapa kali reply ke 1 orang
- `autoReplies` — keyword-based auto-reply

---

## Tips Anti-Ban

- Bot cuma reply, ga pernah kirim chat duluan
- Group chat diabaikan (ngurangin aktivitas)
- Max 3 reply per kontak per 5 menit
- Ada delay sebelum reply (configurable)
- Jangan broadcast ke banyak nomor
- Jangan spam link atau promosi

---

## Struktur Project

```
autoWA/
├── index.js                  # entry point + web QR scanner
├── config.json               # konfigurasi bot
├── .env                      # API keys (jangan commit)
├── .env.example              # template .env
├── src/
│   ├── connection.js         # koneksi WhatsApp (Baileys)
│   ├── handler.js            # handler pesan masuk
│   ├── features/
│   │   ├── aiReply.js        # AI reply (Groq + Gemini, key rotation)
│   │   └── botControl.js     # command bot (!on, !off, dll)
│   └── utils/
│       └── logger.js         # logger
├── auth_info/                # session WA (jangan commit)
└── package.json
```

---

## License

MIT

## Disclaimer

Bot ini buat pemakaian pribadi. Kalo dipake buat spam atau ngelanggar ToS WhatsApp, itu tanggung jawab kamu sendiri. Pake yang wajar aja.
