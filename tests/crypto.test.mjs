import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHABET, romanize, pokerEncode, pokerDecode, caesar, vigenere, railFence, randomDigits, digitMask, unicodeDigits, digitsUnicode, morseEncode, toBase64, fromBase64, utf8, hex, sha256, aesEncrypt, aesDecrypt, rsaKeys, rsaEncrypt, rsaDecrypt } from '../dist/ciphers.js';

test('26 letters obey all red/black boundaries and both jokers',()=>{
  const {cards,serialized}=pokerEncode(ALPHABET+',.');
  assert.deepEqual(cards.slice(0,13).map(c=>c.token),Array.from({length:13},(_,i)=>`R${String(i+1).padStart(2,'0')}`));
  assert.deepEqual(cards.slice(13,26).map(c=>c.token),Array.from({length:13},(_,i)=>`B${String(i+1).padStart(2,'0')}`));
  assert.equal(cards[26].token,'SMALL');assert.equal(cards[27].token,'BIG');assert.equal(pokerDecode(serialized),ALPHABET+',.');
});
test('Chinese, English, punctuation, umlauts, polyphonic words and traditional text',()=>{
  assert.equal(romanize('你好，世界。Hello, world.'),'NI HAO,SHI JIE.HELLO, WORLD.');
  assert.equal(romanize('重庆银行'),'CHONG QING YIN HANG');
  assert.equal(romanize('女绿'),'NV LV');
  assert.equal(romanize('漢語'),'HAN YU');
  const result=pokerEncode('2026年！♥😀\nHello');
  assert.equal(pokerDecode(result.serialized),result.normalized);
  assert.equal(result.cards.filter(c=>c.kind==='literal').length,7);
});
test('spaces, newlines, punctuation and unsupported characters remain visible and reversible',()=>{
  for(const text of ['', 'A  B\nC\tD', '<script>你好</script>', 'éß-123😀!?', 'M,N.Z']){
    const data=pokerEncode(text);assert.equal(pokerDecode(data.serialized),data.normalized);
  }
  assert.equal(pokerDecode('r1 B13 BIG SMALL / NL U+1F600'),'AZ., \n😀');
  for(const invalid of ['R00','B14','R1X','U+D800','U+FFFFFF','JOKER'])assert.throws(()=>pokerDecode(invalid));
});
test('Caesar and Vigenere use published conventional examples',()=>{
  assert.equal(caesar('ATTACK AT DAWN!',3),'DWWDFN DW GDZQ!');
  assert.equal(caesar('Zz',1),'Aa');
  assert.equal(vigenere('ATTACKATDAWN','LEMON'),'LXFOPVEFRNHR');
  assert.equal(vigenere('LXFOPVEFRNHR','LEMON',true),'ATTACKATDAWN');
  assert.throws(()=>vigenere('TEST','123'));
});
test('rail fence reference vector and Unicode round trips',()=>{
  assert.equal(railFence('WEAREDISCOVEREDFLEEATONCE',3),'WECRLTEERDSOEEFEAOCAIVDEN');
  for(const n of [2,3,4,8])for(const text of ['','A','HELLO, WORLD.','山河😀\nA B'])assert.equal(railFence(railFence(text,n),n,true),text);
});
test('decimal masking is digitwise, without carry, and reverses every code point',()=>{
  assert.equal(digitMask('1234','9876'),'0000');
  assert.equal(digitMask('0000','9876',true),'1234');
  for(const text of ['山河山河','😀，Hello.\n','']){
    const digits=unicodeDigits(text),mask=randomDigits(digits.length);assert.equal(digitsUnicode(digitMask(digitMask(digits,mask),mask,true)),text);
  }
  assert.throws(()=>digitMask('123','12'));
});
test('Morse SOS and Unicode UTF-8 Base64 known vector',()=>{
  assert.equal(morseEncode('SOS'),'... --- ...');assert.equal(morseEncode('你好'),'-. .. / .... .- ---');
  assert.equal(toBase64(utf8('你好')),'5L2g5aW9');
  assert.equal(new TextDecoder().decode(fromBase64(toBase64(utf8('山河😀')))),'山河😀');
});
test('SHA-256 official known answer abc',async()=>{
  assert.equal(hex(await sha256('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('AES-GCM round trip, new IV and tamper rejection',async()=>{
  const first=await aesEncrypt('你好，世界。😀\nHello'),second=await aesEncrypt('你好，世界。😀\nHello',first.key);
  assert.equal(await aesDecrypt(first),'你好，世界。😀\nHello');assert.notDeepEqual(first.iv,second.iv);assert.notDeepEqual(first.ciphertext,second.ciphertext);
  const damaged={...first,ciphertext:first.ciphertext.slice()};damaged.ciphertext[0]^=1;await assert.rejects(()=>aesDecrypt(damaged));
});
test('RSA-OAEP Unicode round trip, random padding and byte limit',async()=>{
  const keys=await rsaKeys(),first=await rsaEncrypt('你好，世界。😀',keys),second=await rsaEncrypt('你好，世界。😀',keys);
  assert.equal(await rsaDecrypt(first),'你好，世界。😀');assert.notDeepEqual(first.ciphertext,second.ciphertext);
  assert.equal(await rsaDecrypt(await rsaEncrypt('x'.repeat(190),keys)),'x'.repeat(190));
  await assert.rejects(()=>rsaEncrypt('x'.repeat(191),keys),/190/);
  await assert.rejects(()=>rsaEncrypt('中'.repeat(64),keys),/190/);
});
