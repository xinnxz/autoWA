// ============================================
// src/utils/locale.js — Locale Loader
// ============================================
// Memuat file locale berdasarkan kode bahasa di config.
// Fallback ke Bahasa Indonesia (id) jika bahasa tidak ditemukan.
// ============================================

const config = require('../../config.js');
const logger = require('./logger');

let _locale = null;

/**
 * Load locale berdasarkan config.language
 * Cache setelah load pertama
 */
function getLocale() {
  if (_locale) return _locale;

  const lang = config.language || 'id';

  try {
    _locale = require(`../../locales/${lang}.js`);
    logger.info(`Locale loaded: ${_locale.meta.name} (${_locale.meta.code})`);
  } catch (err) {
    logger.warn(`Locale "${lang}" not found, falling back to Indonesian (id)`);
    _locale = require('../../locales/id.js');
  }

  return _locale;
}

/**
 * Get style presets dari locale yang aktif
 * Return array of style names
 */
function getStylePresets() {
  const locale = getLocale();
  return Object.keys(locale.styles);
}

/**
 * Get style object by name
 * Return null jika tidak ditemukan
 */
function getStyle(styleName) {
  const locale = getLocale();
  return locale.styles[styleName] || null;
}

/**
 * Set bahasa secara dinamis
 */
function setLocale(lang) {
  _locale = null; // Clear cache
  config.language = lang;
  return getLocale();
}

module.exports = { getLocale, getStylePresets, getStyle, setLocale };
