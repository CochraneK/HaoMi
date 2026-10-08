import { unicodeDigits, digitMask, randomDigits, sha256, hex } from './ciphers.js';

const digest = async text => hex(await sha256(text));
const LIMIT = 8000;
export function cipherDigits(text) {
  const digits = text.replace(/\s/gu, '');
  if (!digits || !/^\d+$/.test(digits) || digits.length % 7) throw new Error('请粘贴完整数字密文：每组 7 位，空格和换行可保留。');
  if (digits.length > LIMIT * 7) throw new Error('数字密文最多支持 8000 个码组。');
  return digits;
}
export function formatHaomiDigits(digits) {
  return (digits.match(/.{1,56}/g) || []).map(line => line.match(/.{1,7}/g).join(' ')).join('\n');
}
export function readHaomiKey(text) {
  let key;
  try { key = JSON.parse(text); } catch { throw new Error('密钥格式不正确，请粘贴或导入保存的配套密钥 JSON。'); }
  if (!key || key.format !== 'haomi-digital-key' || key.version !== 1 || key.encoding !== 'unicode-codepoint-7') throw new Error('这不是本工具支持的豪密思路密钥文件。');
  if (typeof key.mask !== 'string' || !/^\d+$/.test(key.mask) || key.mask.length % 7 || key.mask.length > LIMIT * 7 || typeof key.cipherDigest !== 'string' || typeof key.plainDigest !== 'string' || !/^[0-9a-f]{64}$/.test(key.cipherDigest) || !/^[0-9a-f]{64}$/.test(key.plainDigest)) throw new Error('密钥内容不完整，请使用生成密文时保存的配套密钥。');
  return key;
}
export async function createHaomiMessage(text) {
  if (!text) throw new Error('请先输入需要加密的文字。');
  if (text.length > LIMIT) throw new Error('明文最多支持 8000 个输入字符。');
  if (/\p{Surrogate}/u.test(text)) throw new Error('输入含有不完整的 Unicode 字符，请检查文字。');
  const plain = unicodeDigits(text), mask = randomDigits(plain.length), digits = digitMask(plain, mask);
  const key = { format: 'haomi-digital-key', version: 1, encoding: 'unicode-codepoint-7', mask, cipherDigest: await digest(digits), plainDigest: await digest(text) };
  return { text, plain, digits, mask, cipher: formatHaomiDigits(digits), key: JSON.stringify(key, null, 2) };
}
export async function openHaomiMessage(cipher, keyText) {
  const digits = cipherDigits(cipher), key = readHaomiKey(keyText);
  if (key.mask.length !== digits.length || await digest(digits) !== key.cipherDigest) throw new Error('密文与密钥不匹配，或密文内容已被修改。');
  const plain = digitMask(digits, key.mask, true), points = plain.match(/.{7}/g).map(Number);
  if (points.some(p => p > 0x10ffff || (p >= 0xd800 && p <= 0xdfff))) throw new Error('密钥不匹配或内容已被修改，无法还原有效文字。');
  const text = points.map(p => String.fromCodePoint(p)).join('');
  if (await digest(text) !== key.plainDigest) throw new Error('密钥内容已被修改，无法还原对应原文。');
  return { text, plain, digits, mask: key.mask };
}

export function mountHaomiTool({ copy, toast }) {
  const $ = id => document.getElementById(id), E = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let mode = 'encrypt', panel = 'process', page = 0, epoch = 0, record = null, lastEncryption = null, newEncryption = false;
  const drafts = { encrypt: { input: $('haomi-input').value, key: '' }, decrypt: { input: '', key: '' } };
  const phone = window.matchMedia('(max-width: 900px)');
  const size = () => phone.matches ? 16 : 32;
  function status(text, error = false) { $('haomi-status').textContent = text; $('haomi-status').classList.toggle('error', error); }
  function controls() {
    const available = !!record;
    $('haomi-submit').disabled = !$('haomi-input').value || (mode === 'decrypt' && !$('haomi-key').value);
    $('haomi-key-decrypt').disabled = $('haomi-submit').disabled;
    $('haomi-copy-output').disabled = !available;
    $('haomi-save-output').disabled = !available;
    $('haomi-copy-key').disabled = mode === 'encrypt' ? !available : !$('haomi-key').value;
    $('haomi-save-key').disabled = mode !== 'encrypt' || !available;
    $('haomi-count').textContent = `${$('haomi-input').value.length} / ${mode === 'encrypt' ? '8000 字符' : '64000 字符'}`;
  }
  function showPanel(name) {
    panel = name;
    $('haomi-key-panel').hidden = name !== 'key'; $('haomi-process-panel').hidden = name !== 'process';
    document.querySelectorAll('[data-haomi-panel]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.haomiPanel === name)));
  }
  function renderProcess() {
    const count = record ? [...record.text].length : 0, pages = Math.max(1, Math.ceil(count / size()));
    page = Math.max(0, Math.min(page, pages - 1));
    $('haomi-paging').hidden = count <= size(); $('haomi-prev').disabled = page === 0; $('haomi-next').disabled = page === pages - 1;
    $('haomi-page').value = page + 1; $('haomi-page').max = pages;
    if (!record) { $('haomi-visual').innerHTML = '<p class="empty-state">生成密文后，可查看每个字的底码、乱数与密文。</p>'; $('haomi-range').textContent = ''; return; }
    const start = page * size(), end = Math.min(start + size(), count), chars = [...record.text];
    $('haomi-range').textContent = `${start + 1}–${end} / ${count} 个字符`;
    $('haomi-visual').innerHTML = `<div class="haomi-number-grid">${Array.from({ length: Math.ceil((end - start) / 8) }, (_, block) => {
      const a = start + block * 8, z = Math.min(a + 8, end);
      return `<div class="haomi-number-block"><div class="haomi-number-row haomi-number-head"><span>原字</span><span>底码</span><span>乱数</span><span>密文</span></div>${chars.slice(a, z).map((c, offset) => {
        const i = (a + offset) * 7;
        return `<div class="haomi-number-row"><b title="第 ${a + offset + 1} 个字符">${E(c === '\n' ? '↵' : c === ' ' ? '·' : c === '\t' ? '⇥' : c)}</b><span>${record.plain.slice(i, i + 7)}</span><span class="red-text">${record.mask.slice(i, i + 7)}</span><strong>${record.digits.slice(i, i + 7)}</strong></div>`;
      }).join('')}</div>`;
    }).join('')}</div>`;
    $('haomi-visual').scrollTop = 0;
  }
  function invalidate() {
    epoch++; record = null; page = 0; $('haomi-output').value = ''; $('haomi-paging').hidden = true;
    if (mode === 'encrypt') $('haomi-key').value = '';
    status(mode === 'encrypt' ? '输入后点击“生成密文”；每次生成新的配套乱数。' : '粘贴数字密文和配套密钥，再点击“解密文本”。');
    renderProcess(); controls();
  }
  function switchMode(next) {
    if (next === mode) return;
    drafts[mode] = { input: $('haomi-input').value, key: $('haomi-key').value };
    if (next === 'decrypt' && newEncryption && lastEncryption) { drafts.decrypt = { input: lastEncryption.cipher, key: lastEncryption.key }; newEncryption = false; }
    mode = next; $('haomi-input').value = drafts[mode].input; $('haomi-key').value = drafts[mode].key;
    $('haomi-tool').classList.toggle('haomi-decrypt', mode === 'decrypt');
    $('haomi-input').maxLength = mode === 'encrypt' ? 8000 : 64000; $('haomi-key').readOnly = mode === 'encrypt';
    $('haomi-input-label').textContent = mode === 'encrypt' ? '需要加密的文字' : '需要解密的数字密文';
    $('haomi-output-label').textContent = mode === 'encrypt' ? '数字密文' : '还原文字';
    $('haomi-submit').textContent = mode === 'encrypt' ? '生成密文' : '解密文本';
    $('haomi-key').placeholder = mode === 'encrypt' ? '生成密文后，这里会显示配套密钥。' : '在这里粘贴保存的配套密钥 JSON。';
    $('haomi-output').placeholder = mode === 'encrypt' ? '点击生成密文后，完整结果会显示在这里。' : '解密成功后，完整原文会显示在这里。';
    $('haomi-key-decrypt').hidden = mode !== 'decrypt';
    $('haomi-import-label').hidden = mode !== 'decrypt'; $('haomi-save-key').hidden = mode !== 'encrypt';
    $('haomi-key-note').textContent = mode === 'encrypt' ? '复制或保存此配套密钥，解密时需要它。密文与密钥分别保存。' : '粘贴配套密钥 JSON，或导入此前保存的密钥文件。';
    document.querySelectorAll('[data-haomi-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.haomiMode === mode)));
    invalidate(); showPanel(mode === 'encrypt' ? 'process' : 'key');
  }
  document.querySelectorAll('[data-haomi-mode]').forEach(b => b.addEventListener('click', () => switchMode(b.dataset.haomiMode)));
  document.querySelectorAll('[data-haomi-panel]').forEach(b => b.addEventListener('click', () => showPanel(b.dataset.haomiPanel)));
  $('haomi-input').addEventListener('input', invalidate);
  $('haomi-key').addEventListener('input', invalidate);
  $('haomi-submit').addEventListener('click', async () => {
    const token = ++epoch; record = null; controls(); $('haomi-submit').disabled = true; $('haomi-key-decrypt').disabled = true; status('正在处理…');
    try {
      const result = mode === 'encrypt' ? await createHaomiMessage($('haomi-input').value) : await openHaomiMessage($('haomi-input').value, $('haomi-key').value);
      if (token !== epoch) return;
      record = result; page = 0;
      if (mode === 'encrypt') { lastEncryption = result; newEncryption = true; $('haomi-key').value = result.key; }
      $('haomi-output').value = mode === 'encrypt' ? result.cipher : result.text;
      renderProcess(); status(mode === 'encrypt' ? `已生成 ${result.digits.length / 7} 个码组；请保存配套密钥。` : '解密成功，已核对完整原文。');
    } catch (error) {
      if (token !== epoch) return;
      $('haomi-output').value = ''; if (mode === 'encrypt') $('haomi-key').value = ''; renderProcess(); status(error.message, true);
    } finally { if (token === epoch) controls(); }
  });
  $('haomi-key-decrypt').addEventListener('click', () => $('haomi-submit').click());
  $('haomi-copy-output').addEventListener('click', () => copy($('haomi-output').value));
  $('haomi-copy-key').addEventListener('click', () => copy($('haomi-key').value));
  function download(text, name, type) {
    const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a');
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('haomi-save-output').addEventListener('click', () => download($('haomi-output').value, mode === 'encrypt' ? 'haomi-cipher.txt' : 'haomi-plaintext.txt', 'text/plain;charset=utf-8'));
  $('haomi-save-key').addEventListener('click', () => download($('haomi-key').value, 'haomi-key.json', 'application/json'));
  $('haomi-import').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    const token = epoch;
    try {
      if (file.size > 100000) throw new Error('密钥文件过大，请选择本工具导出的 JSON 密钥。');
      const text = await file.text(); readHaomiKey(text);
      if (token !== epoch || mode !== 'decrypt') return;
      $('haomi-key').value = text; invalidate(); status('已导入配套密钥，可点击“解密文本”。');
    } catch (error) { if (token === epoch) status(error.message, true); }
    event.target.value = '';
  });
  function changePage(value) { page = Number.isFinite(value) ? Math.trunc(value) : 0; renderProcess(); }
  $('haomi-prev').addEventListener('click', () => changePage(page - 1));
  $('haomi-next').addEventListener('click', () => changePage(page + 1));
  $('haomi-page').addEventListener('change', e => changePage(Number(e.target.value) - 1));
  phone.addEventListener('change', () => { page = 0; renderProcess(); });
  $('haomi-expand').addEventListener('click', () => {
    const wide = $('haomi-tool').classList.toggle('haomi-wide');
    $('haomi-expand').textContent = wide ? '恢复并排' : '展开过程'; $('haomi-expand').setAttribute('aria-pressed', String(wide));
    if (wide) showPanel('process');
  });
  invalidate(); showPanel(panel);
}
