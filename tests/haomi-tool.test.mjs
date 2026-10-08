import test from 'node:test';
import assert from 'node:assert/strict';
import { createHaomiMessage, openHaomiMessage, cipherDigits, readHaomiKey } from '../dist/haomi-tool.js';

test('saved ciphertext and serialized key restore exact Unicode without session state', async () => {
  for (const text of ['千山鸟飞绝，万径人踪灭。', 'Hello, 世界😀\n  空格\t<&>é', '山'.repeat(7999) + '终']) {
    const message = await createHaomiMessage(text);
    const restored = await openHaomiMessage(message.cipher.replaceAll(' ', '\n'), JSON.stringify(JSON.parse(message.key)));
    assert.equal(restored.text, text);
    assert.equal(restored.digits.length, [...text].length * 7);
  }
});
test('new random keys differ; mismatched, altered or incomplete material is rejected', async () => {
  const a = await createHaomiMessage('你好，世界。'), b = await createHaomiMessage('你好，世界。');
  assert.notEqual(a.cipher, b.cipher);
  assert.notEqual(JSON.parse(a.key).mask, JSON.parse(b.key).mask);
  await assert.rejects(() => openHaomiMessage(a.cipher, b.key), /不匹配/);
  await assert.rejects(() => openHaomiMessage(a.cipher.slice(1), a.key), /7 位/);
  const altered = JSON.parse(a.key);
  altered.mask = String((Number(altered.mask[0]) + 1) % 10) + altered.mask.slice(1);
  await assert.rejects(() => openHaomiMessage(a.cipher, JSON.stringify(altered)), /修改|不匹配/);
  await assert.rejects(() => openHaomiMessage(a.cipher.replace(/\d/, 'x'), a.key), /7 位/);
  const invalidVersion = { ...JSON.parse(a.key), version: 2 };
  assert.throws(() => readHaomiKey(JSON.stringify(invalidVersion)), /不支持|不是/);
  assert.throws(() => readHaomiKey('{'), /格式/);
  assert.throws(() => readHaomiKey('null'), /不是/);
  assert.throws(() => cipherDigits('1234567'.repeat(8001)), /8000/);
  await assert.rejects(() => createHaomiMessage('山'.repeat(8001)), /8000/);
  await assert.rejects(() => createHaomiMessage(''), /输入/);
  await assert.rejects(() => createHaomiMessage('\ud800'), /Unicode/);
});
