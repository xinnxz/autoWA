# AutoWA Bot — Internationalization (i18n) Plan

> This document outlines the technical roadmap for making AutoWA Bot accessible to users worldwide. Implementation is planned for when the project gains significant traction.

---

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
3. [Proposed Architecture](#proposed-architecture)
4. [Phase 1: Core i18n Infrastructure](#phase-1-core-i18n-infrastructure)
5. [Phase 2: Multi-Language AI Replies](#phase-2-multi-language-ai-replies)
6. [Phase 3: Global Event Detection](#phase-3-global-event-detection)
7. [Phase 4: Documentation & Community](#phase-4-documentation--community)
8. [File Changes Summary](#file-changes-summary)
9. [Configuration Example](#configuration-example)

---

## Overview

AutoWA Bot currently operates with Indonesian language and cultural context hardcoded throughout the codebase. This plan details the systematic transformation into a globally usable WhatsApp auto-reply bot while maintaining the current Indonesian experience as default.

### Goals

- Zero breaking changes for existing Indonesian users
- Plug-and-play language switching via `config.js`
- Culturally aware AI responses for any region
- Community-driven language pack contributions

---

## Current State

| Component | Current Scope | i18n Required |
|-----------|--------------|---------------|
| AI Prompt | Indonesian only | Yes |
| Dynamic Context | WIB timezone, Indonesian holidays | Yes |
| Reply Styles | Indonesian presets (gaul, santai, formal, campur) | Yes |
| Bot Commands Output | Indonesian responses | Yes |
| README | Indonesian | Yes |
| Config Comments | Indonesian | Partial |
| QR Web Page | Indonesian | Yes |

---

## Proposed Architecture

```
config.js
├── language: "id"              // Language code (id, en, ms, ar, etc.)
├── timezone: "Asia/Jakarta"    // User's timezone (IANA format)
├── country: "ID"               // ISO 3166-1 country code
└── ai.replyStyle: "santai"     // Style presets per language

locales/
├── id.js                       // Indonesian (default)
├── en.js                       // English
├── ms.js                       // Malay
├── ar.js                       // Arabic
└── custom.js                   // Template for new languages
```

### Locale File Structure

Each locale file exports:

```js
module.exports = {
  meta: {
    code: 'en',
    name: 'English',
    direction: 'ltr',
  },

  // Reply style presets
  styles: {
    casual: {
      intro: 'You are {name}. You are a human, NOT an AI...',
      personality: 'Casual, friendly, and approachable',
      rules: '...',
    },
    formal: { ... },
    slang: { ... },
  },

  // Bot command responses
  commands: {
    help: '*Bot Commands*\n\n!help — Show this list\n...',
    awayOn: 'Away mode is now *ON*. Bot will auto-reply.',
    awayOff: 'Away mode is now *OFF*. Bot will stay silent.',
    status: 'Status: {status}\nMode: {mode}\n...',
    logout: 'Are you sure? Type *!logout confirm*',
    ...
  },

  // Dynamic context labels
  context: {
    timeOfDay: {
      midnight: 'midnight',
      dawn: 'dawn',
      morning: 'morning',
      noon: 'noon',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
      lateNight: 'late night',
    },
    dayType: {
      weekday: '{day} (weekday)',
      weekend: '{day} (weekend)',
    },
    activities: {
      sleeping: 'probably sleeping',
      working: 'likely at work or school',
      ...
    },
  },

  // Web QR page text
  web: {
    scanTitle: 'Scan QR Code',
    scanInstructions: 'Open WhatsApp > Settings > Linked Devices > Link a Device',
    secondsLeft: 'seconds remaining',
    expired: 'Expired',
    connected: 'Bot Connected',
  },
};
```

---

## Phase 1: Core i18n Infrastructure

### Objectives
- Add `language`, `timezone`, and `country` to `config.js`
- Create locale loader utility
- Create Indonesian locale file (extract from current hardcoded strings)
- Create English locale file

### Files to Modify

#### [NEW] `locales/id.js`
Extract all Indonesian strings from current codebase into structured locale file.

#### [NEW] `locales/en.js`
English translation of all user-facing strings.

#### [NEW] `src/utils/locale.js`
Locale loader utility:
```js
function loadLocale(langCode) {
  try {
    return require(`../../locales/${langCode}.js`);
  } catch {
    return require('../../locales/id.js'); // fallback
  }
}
```

#### [MODIFY] `config.js`
```js
// Language & region
language: "id",                    // id, en, ms, ar, etc.
timezone: "Asia/Jakarta",         // IANA timezone
country: "ID",                    // ISO country code
```

#### [MODIFY] `src/features/botControl.js`
Replace all hardcoded Indonesian strings with locale references.

#### [MODIFY] `src/features/aiReply.js`
Replace prompt templates with locale-driven templates.

---

## Phase 2: Multi-Language AI Replies

### Objectives
- Make `buildDynamicContext()` timezone-aware via config
- Locale-aware reply style presets
- AI prompt fully driven by locale file

### Key Changes

#### Timezone-Aware Context
```js
// Before (hardcoded)
const jakarta = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

// After (configurable)
const userTime = new Date(now.toLocaleString('en-US', { timeZone: config.timezone }));
```

#### Locale-Aware Styles
Each language has its own style presets that make cultural sense:

| Language | Style 1 | Style 2 | Style 3 | Style 4 |
|----------|---------|---------|---------|---------|
| Indonesian | gaul | santai | formal | campur |
| English | slang | casual | formal | mixed |
| Malay | santai | formal | rojak | baku |
| Arabic | عامية | فصحى | رسمي | مختلط |

---

## Phase 3: Global Event Detection

### Objectives
- Move holiday data to locale files or separate data files
- Support religious calendar variations (Islamic, Christian, Hindu, Buddhist, Chinese)
- Regional holiday awareness

### Proposed Structure

```js
// locales/en.js (partial)
events: {
  fixed: {
    '1-0': 'New Year\'s Day',
    '14-1': 'Valentine\'s Day',
    '17-2': 'St. Patrick\'s Day',
    '4-6': 'Independence Day',         // US
    '25-11': 'Christmas Day',
    '31-11': 'New Year\'s Eve',
  },
  seasonal: [
    { months: [5, 6, 7], label: 'Summer break season' },
    { months: [11], label: 'Holiday season' },
  ],
  islamic: true,    // Enable Ramadan, Eid detection
  chinese: false,   // Chinese New Year
  hindu: false,     // Diwali, Holi
}
```

### Ramadan Support (Global)
Current Ramadan dates table (2024-2030) remains global — it's the same worldwide. Only the contextual messages change per locale.

---

## Phase 4: Documentation & Community

### Objectives
- Bilingual README (English primary, Indonesian secondary)
- Contributing guide for new language packs
- Language pack template file

### Files

#### [NEW] `docs/CONTRIBUTING.md`
Guide for community members to add new language packs.

#### [NEW] `locales/_template.js`
Blank template with all required keys and comments explaining each section.

#### [MODIFY] `README.md`
Rewrite in English as primary language with collapsible Indonesian section.

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `config.js` | Modify | Add language, timezone, country |
| `locales/id.js` | New | Indonesian locale (default) |
| `locales/en.js` | New | English locale |
| `locales/_template.js` | New | Template for new languages |
| `src/utils/locale.js` | New | Locale loader utility |
| `src/features/aiReply.js` | Modify | Use locale-driven prompts |
| `src/features/botControl.js` | Modify | Use locale for command responses |
| `src/handler.js` | Modify | Use config.timezone |
| `index.js` | Modify | Use locale for web page text |
| `README.md` | Modify | Bilingual documentation |
| `docs/CONTRIBUTING.md` | New | Language contribution guide |

---

## Configuration Example

After i18n implementation, a user in the US would configure:

```js
// config.js
language: "en",
timezone: "America/New_York",
country: "US",
ai: {
  replyStyle: "casual",    // English preset
  model: "openai/gpt-oss-120b",
}
```

And the bot would automatically:
- Detect US holidays (4th of July, Thanksgiving, etc.)
- Reply in English casual style
- Use EST/EDT timezone for context
- Show QR page in English

---

## Priority & Timeline

| Phase | Priority | Estimated Effort | Trigger |
|-------|----------|-----------------|---------|
| Phase 1 | High | 2-3 days | 50+ GitHub stars |
| Phase 2 | High | 1-2 days | With Phase 1 |
| Phase 3 | Medium | 2-3 days | Community requests |
| Phase 4 | Medium | 1-2 days | First non-ID contributor |

---

*Document version: 1.0*
*Last updated: March 2026*
*Author: Luthfi (xinnxz)*
