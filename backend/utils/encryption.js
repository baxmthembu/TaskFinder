const crypto = require('crypto');

// Ensure you have ENCRYPTION_KEY in your .env file (32 chars for aes-256-cbc)
// For production, this MUST be stored securely in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'; // Fallback for dev only
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return null;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function maskAccountNumber(accountNumber) {
  if (!accountNumber) return '';
  const visibleDigits = 4;
  const maskedLength = accountNumber.length - visibleDigits;
  if (maskedLength <= 0) return accountNumber;
  return '*'.repeat(maskedLength) + accountNumber.slice(-visibleDigits);
}

module.exports = { encrypt, decrypt, maskAccountNumber };