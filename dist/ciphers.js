import { pinyin } from './vendor.js';

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function romanize(text) {
  return text.replace(/\p{Script=Han}+/gu, segment => pinyin(segment, { toneType: 'none', v: true, traditional: true, nonZh: 'consecutive' }))
    .replace(/[a-z]/g, c => c.toUpperCase()).replace(/，/g, ',').replace(/。/g, '.');
}
export function pokerEncode(text, alreadyRomanized = false) {
  const normalized = alreadyRomanized ? text.replace(/[a-z]/g, c => c.toUpperCase()).replace(/，/g, ',').replace(/。/g, '.') : romanize(text);
  const cards = [...normalized].map(char => {
    const index = ALPHABET.indexOf(char);
    if (index >= 0) return { char, kind: index < 13 ? 'red' : 'black', number: index % 13 + 1, token: `${index < 13 ? 'R' : 'B'}${String(index % 13 + 1).padStart(2, '0')}` };
    if (char === '.') return { char, kind: 'big', token: 'BIG' };
    if (char === ',') return { char, kind: 'small', token: 'SMALL' };
    if (char === ' ') return { char, kind: 'space', token: '/' };
    if (char === '\n') return { char, kind: 'space', token: 'NL' };
    return { char, kind: 'literal', token: `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}` };
  });
  return { normalized, cards, serialized: cards.map(c => c.token).join(' ') };
}
export function pokerDecode(text) {
  if (!text.trim()) return '';
  return text.trim().split(/\s+/).map(token => {
    token = token.toUpperCase();
    const m = /^([RB])(0?[1-9]|1[0-3])$/.exec(token);
    if (m) return ALPHABET[(m[1] === 'R' ? 0 : 13) + Number(m[2]) - 1];
    if (token === 'BIG') return '.';
    if (token === 'SMALL') return ',';
    if (token === '/') return ' ';
    if (token === 'NL') return '\n';
    if (/^U\+[0-9A-F]{4,6}$/.test(token)) {
      const cp = parseInt(token.slice(2), 16);
      if (cp <= 0x10FFFF && !(cp >= 0xD800 && cp <= 0xDFFF)) return String.fromCodePoint(cp);
    }
    throw new Error(`无法识别「${token}」。请使用 R01–R13、B01–B13、BIG、SMALL、/、NL 或 U+码点。`);
  }).join('');
}
export const mod = (n, m) => ((n % m) + m) % m;
export function caesar(text, shift = 3) {
  return text.replace(/[A-Za-z]/g, char => {
    const base = char >= 'a' ? 97 : 65;
    return String.fromCharCode(mod(char.charCodeAt(0) - base + Number(shift), 26) + base);
  });
}
export function vigenere(text, key, reverse = false) {
  const shifts = [...key.toUpperCase()].filter(c => /[A-Z]/.test(c)).map(c => c.charCodeAt(0) - 65);
  if (!shifts.length) throw new Error('密钥至少需要一个英文字母。');
  let i = 0;
  return text.replace(/[A-Za-z]/g, c => caesar(c, shifts[i++ % shifts.length] * (reverse ? -1 : 1)));
}
export function railFence(text, rails = 3, reverse = false) {
  rails = Math.max(2, Math.min(8, Number(rails)));
  const chars = [...text];
  const path = chars.map((_, i) => { const r = i % (2 * (rails - 1)); return r < rails ? r : 2 * (rails - 1) - r; });
  const lines = Array.from({ length: rails }, () => []);
  if (!reverse) { chars.forEach((c, i) => lines[path[i]].push(c)); return lines.flat().join(''); }
  let start = 0;
  lines.forEach((line, r) => { const count = path.filter(x => x === r).length; lines[r] = chars.slice(start, start + count); start += count; });
  return path.map(r => lines[r].shift()).join('');
}
export function randomDigits(length) {
  const out = [];
  while (out.length < length) {
    const values = crypto.getRandomValues(new Uint8Array(Math.max(32, length - out.length)));
    for (const v of values) { if (v < 250) out.push(String(v % 10)); if (out.length === length) break; }
  }
  return out.join('');
}
export function digitMask(digits, mask, reverse = false) {
  if (!/^\d*$/.test(digits) || !/^\d*$/.test(mask) || digits.length !== mask.length) throw new Error('底码与乱数须是等长数字。');
  return [...digits].map((n, i) => mod(Number(n) + Number(mask[i]) * (reverse ? -1 : 1), 10)).join('');
}
export function unicodeDigits(text) { return [...text].map(c => c.codePointAt(0).toString().padStart(7, '0')).join(''); }
export function digitsUnicode(digits) {
  if (digits.length % 7) throw new Error('码组长度应为 7 的倍数。');
  return digits.match(/.{7}/g)?.map(x => String.fromCodePoint(Number(x))).join('') ?? '';
}
export const MORSE = Object.fromEntries([
  ...['.-','-...','-.-.','-..','.','..-.','--.','....','..','.---','-.-','.-..','--','-.','---','.--.','--.-','.-.','...','-','..-','...-','.--','-..-','-.--','--..'].map((v,i)=>[ALPHABET[i],v]),
  ...['-----','.----','..---','...--','....-','.....','-....','--...','---..','----.'].map((v,i)=>[String(i),v]),
  ['.','.-.-.-'],[',','--..--'],['?','..--..'],["'",'.----.'],['/','-..-.'],['-','-....-'],['(', '-.--.'],[')', '-.--.-'],[':', '---...'],['=', '-...-'],['+', '.-.-.'],['@', '.--.-.']
]);
export function morseEncode(text) { return [...romanize(text)].map(c => c === ' ' || c === '\n' ? '/' : MORSE[c] || `[${c}]`).join(' '); }
export function toBase64(bytes) { return btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')); }
export function fromBase64(text) { return Uint8Array.from(atob(text), c => c.charCodeAt(0)); }
export const utf8 = text => new TextEncoder().encode(text);
export const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export async function sha256(text) { return new Uint8Array(await crypto.subtle.digest('SHA-256', utf8(text))); }
export async function aesEncrypt(text, key) {
  key ??= await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt','decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, utf8(text)));
  return { key, iv, ciphertext };
}
export async function aesDecrypt(record) { return new TextDecoder('utf-8', { fatal: true }).decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: record.iv }, record.key, record.ciphertext)); }
export async function rsaKeys() { return crypto.subtle.generateKey({ name:'RSA-OAEP', modulusLength:2048, publicExponent:new Uint8Array([1,0,1]), hash:'SHA-256' }, false, ['encrypt','decrypt']); }
export async function rsaEncrypt(text, keys) {
  if (utf8(text).length > 190) throw new Error('RSA-2048 / OAEP-SHA-256 单次最多支持 190 个 UTF-8 字节；请缩短输入。中文通常每字占 3 字节。');
  keys ??= await rsaKeys();
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name:'RSA-OAEP' }, keys.publicKey, utf8(text)));
  return { keys, ciphertext };
}
export async function rsaDecrypt(record) { return new TextDecoder('utf-8', { fatal:true }).decode(await crypto.subtle.decrypt({ name:'RSA-OAEP' }, record.keys.privateKey, record.ciphertext)); }
