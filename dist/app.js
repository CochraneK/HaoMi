import { ALPHABET, romanize, pokerEncode, pokerDecode, caesar, vigenere, railFence, randomDigits, digitMask, unicodeDigits, digitsUnicode, MORSE, morseEncode, toBase64, fromBase64, utf8, hex, sha256, aesEncrypt, aesDecrypt, rsaKeys, rsaEncrypt, rsaDecrypt } from './ciphers.js';
const $ = id => document.getElementById(id);
const E = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short = (text, limit = 25) => [...text].length > limit ? [...text].slice(0,limit).join('') + '…' : text;
let toastTimer;
function toast(text) { $('toast').textContent = text; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(()=>$('toast').hidden=true,3200); }
async function copy(text) { if (!text) return toast('还没有可复制的结果'); try { await navigator.clipboard.writeText(text); toast('已复制'); } catch { toast('无法访问剪贴板，请选中结果手动复制'); } }
function setActive(selector, target) { document.querySelectorAll(selector).forEach(b => { const active = b === target; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); }); }

const rank = number => ({1:'A',11:'J',12:'Q',13:'K'}[number] || String(number));
function cardHTML(card, showLetter = true, diamond = false) {
  if (card.kind === 'space') return `<span class="space-card" title="${card.token === 'NL' ? '换行' : '空格'}" aria-label="${card.token === 'NL' ? '换行' : '空格'}">${card.token === 'NL' ? '↵' : '·'}</span>`;
  if (card.kind === 'literal') return `<span class="literal-card" title="原文保留 ${E(card.token)}，未映射为扑克牌"><strong>${E(card.char)}</strong><small>原文保留</small></span>`;
  const joker = card.kind === 'big' || card.kind === 'small';
  const suit = card.kind === 'red' ? (diamond ? '♦' : '♥') : (diamond ? '♣' : '♠');
  const name = joker ? (card.kind === 'big' ? '大王' : '小王') : `${card.kind === 'red' ? '红' : '黑'}牌 ${card.number}`;
  return `<span class="playing-card ${card.kind} ${joker?'joker':''}" title="${name} = ${E(card.char)}" aria-label="${name}，对应 ${E(card.char)}"><span class="card-corner">${joker?'JOKER':rank(card.number)}</span><span class="card-suit">${joker?name:suit}</span><span class="card-footer"><span class="card-letter">${showLetter?E(card.char):'·'}</span><span class="card-number">${joker?'':String(card.number).padStart(2,'0')}</span></span></span>`;
}
function renderHero() {
  const { normalized, cards } = pokerEncode($('hero-input').value);
  $('hero-normalized').textContent = normalized;
  $('hero-cards').innerHTML = cards.slice(0,18).map(c=>cardHTML(c)).join('') + (cards.length > 18 ? '<span class="space-card" title="完整序列见扑克密语">…</span>' : '');
}
$('hero-input').addEventListener('input',renderHero);
renderHero();
document.querySelector('.round-link').addEventListener('click',()=>{ if(pokerMode!=='encode'){switchPoker('encode');setActive('[data-poker-mode]',document.querySelector('[data-poker-mode="encode"]'));} $('poker-input').value = $('hero-input').value; pokerManual = false; pokerExpanded = false; $('pinyin-editor').hidden=true; renderPoker(); });

const history = {
  1929: {index:'001',title:'从上海的一部秘密电台开始',copy:'在李强、张沈川等人的参与下，上海的秘密无线电台逐渐建立。电台让消息有机会跨越距离；密码则要为这些消息守住内容。豪密的故事，发生在这套通信体系的形成过程中。',url:'https://dangshi.people.com.cn/n1/2021/0507/c436975-32096537.html'},
  1930: {index:'002',title:'能发出电波，还不够',copy:'1930 年，沪港两地曾实现无线电联络。同年 11 月香港台遭到破坏，早期联络与密码方式暴露的风险更加凸显。周恩来着手组织更高级密码的编制，数字背后需要一道新的保护。',url:'https://www.sac.gov.cn/jdbnhbz/bzgs/art/2021/art_f9ff56a5c7614bb2a0b8f363f4e3118e.html'},
  1931: {index:'003',title:'“伍豪”之名，成为一部密码的名字',copy:'1931 年，任弼时携带豪密前往中央苏区。人民网报道记述，同年 9 月 15 日沪苏区电台建立通报，双方开始通过豪密交流。周恩来、邓颖超、任弼时、陈琮英承担了早期译电工作。关于“首次使用”的时间和电文，公开资料有不同表述。',url:'https://dangshi.people.com.cn/n1/2021/0507/c436975-32096537.html'},
  1949: {index:'004',title:'从一部密码，到长久的机要通信',copy:'公开历史报道记述，从 20 世纪 30 年代到全国解放，国民党谍报机关未能破解豪密。这一历史评价，也让人看见保密通信在战争中的作用：一份可信的消息，背后是密码、设备与人的共同努力。',url:'https://www.sac.gov.cn/jdbnhbz/bzgs/art/2021/art_f9ff56a5c7614bb2a0b8f363f4e3118e.html'}
};
function showHistory(year) { const h = history[year]; $('timeline-index').textContent = `ARCHIVE / ${h.index}`; $('timeline-title').textContent = h.title; $('timeline-copy').textContent = h.copy; $('timeline-source').href = h.url; $('timeline-date').textContent = year; }
document.querySelectorAll('[data-year]').forEach(b=>b.addEventListener('click',()=>{setActive('[data-year]',b);showHistory(b.dataset.year);}));showHistory('1929');
const bookLines = ['山河明月照人归来','春风夜雨山河长安','星火相传岁月有声','平安归来明月如初'];
$('book-lines').innerHTML = bookLines.map((line,r)=>`<div class="book-line"><span>${String(r+1).padStart(2,'0')}</span>${[...line].map((c,i)=>`<button data-row="${r+1}" data-column="${i+1}" ${r===0&&i===0?'class="active" aria-pressed="true"':'aria-pressed="false"'} aria-label="${c}，第 1 页第 ${r+1} 行第 ${i+1} 字">${c}</button>`).join('')}</div>`).join('');
$('book-lines').addEventListener('click',e=>{ const b=e.target.closest('button');if(!b)return;setActive('#book-lines button',b);$('book-char').textContent=b.textContent;$('book-coordinate').innerHTML=`<span>01<small>页</small></span><i>·</i><span>${b.dataset.row.padStart(2,'0')}<small>行</small></span><i>·</i><span>${b.dataset.column.padStart(2,'0')}<small>字</small></span>`; });
function renderMask() {
  const text = $('mask-input').value;
  if (!text) { $('mask-table').innerHTML='<p class="empty-state">输入文字，生成底码与乱数。</p>';$('mask-restored').textContent='';return; }
  const plain = unicodeDigits(text), mask = randomDigits(plain.length), cipher = digitMask(plain,mask);
  const row = (label,values) => `<tr><th scope="row">${label}</th>${values.map(x=>`<td>${E(x)}</td>`).join('')}</tr>`;
  $('mask-table').innerHTML = `<table>${row('原文',[...text])}${row('自编底码',plain.match(/.{7}/g))}${row('＋ 随机乱数',mask.match(/.{7}/g))}${row('＝ 密文（mod 10）',cipher.match(/.{7}/g))}</table>`;
  $('mask-restored').textContent = digitsUnicode(digitMask(cipher,mask,true));
}
document.querySelectorAll('[data-model]').forEach(b=>b.addEventListener('click',()=>{setActive('[data-model]',b);$('book-model').hidden=b.dataset.model!=='book';$('mask-model').hidden=b.dataset.model!=='mask';if(b.dataset.model==='mask')renderMask();}));
$('mask-input').addEventListener('input',renderMask);$('mask-refresh').addEventListener('click',renderMask);

const algorithms = {
  caesar:{title:'凯撒密码',category:'经典 · 替换密码',desc:'让每个字母沿字母表移动相同的格数。A 移动 3 格变成 D，Z 会绕回 C。',note:'中文先转拼音；标点保留。',insight:'同一个字母总变成同一个密文字母，频率规律依旧存在。26 种位移很容易逐个尝试；它适合解释替换思路。'},
  vigenere:{title:'维吉尼亚密码',category:'经典 · 多表替换',desc:'把密钥里的字母当作不同的位移量，循环使用。A 表示 0 格，B 表示 1 格，直到 Z 的 25 格。',note:'中文先转拼音；空格、标点不消耗密钥。',insight:'比固定移位多了一层变化，但循环密钥仍留下周期。短而重复的密钥容易受到统计分析。'},
  rail:{title:'栅栏密码',category:'经典 · 换位密码',desc:'把文字沿几条轨道上下折返写入，再逐轨读取。字符不变，改变的是它们所在的位置。',note:'中文先转拼音；空格和标点也参与换位。',insight:'字符的频率完全保留。知道轨道数和写入路径，就可以把轨道重新拼回原文。'},
  otp:{title:'一次一密',category:'随机掩码 · 教学演示',desc:'用与明文等长的掩码逐字节异或。相同消息配上不同掩码，会产生不同密文。这里用 UTF-8 字节展示运算。',note:'保留中文原文，按 UTF-8 字节运算。',insight:'完善保密性要求密钥均匀随机、独立、等长、保密且仅使用一次。本演示使用浏览器安全随机源；屏幕展示掩码用于教学，不能把演示当成保密通信。'},
  aes:{title:'AES-GCM',category:'现代 · 对称加密',desc:'用同一把密钥加密和解密。AES-256 的密钥为 256 位，GCM 同时提供机密性与认证；下方运行真实浏览器密码运算。',note:'保留中文原文；每次运算生成新的 96 位 IV。',insight:'同一把密钥可以加密不同消息，但 GCM 的 IV 在同一密钥下不能重复。密文附带认证标签，篡改后解密会失败。这里的流程图展示外部数据流，不是 AES 轮函数细节。'},
  rsa:{title:'RSA-OAEP',category:'现代 · 非对称加密',desc:'用公钥加密，用配对私钥解密。这里生成 2048 位密钥，使用 OAEP 与 SHA-256 填充，运行真实浏览器密码运算。',note:'保留中文原文；单次上限 190 个 UTF-8 字节。',insight:'公钥可交给发送方，私钥由接收方保管。实践中常用 RSA 保护短密钥，再用 AES 加密较长内容；本展演示一段短消息的直接加密。'},
  morse:{title:'摩斯电码',category:'信号编码 · 不是加密',desc:'把字符写成点和划。点持续 1 个单位，划持续 3 个单位；点划间隔 1，字母间隔 3，单词间隔 7。',note:'中文先转拼音；不支持的符号用 [原文] 标记。',insight:'摩斯电码解决的是“怎样发出信号”，并不隐藏意思。任何持有字符表的人都能读出电码；密码可以先加密，再通过电码传输。'},
  base64:{title:'Base64',category:'数据编码 · 不是加密',desc:'把二进制数据每 6 位一组，转换成 64 个可打印字符。这里把文字的 UTF-8 字节转换成 Base64。',note:'保留中文原文；无须密钥，可以直接还原。',insight:'Base64 是表示数据的方式，不提供保密性。看起来不像原文，并不代表经过加密。末尾的 = 用来填充编码长度。'},
  sha:{title:'SHA-256',category:'哈希 · 不是加密',desc:'把任意长度的消息映射成 256 位摘要。下方同时计算“原文”和“原文多一个句号”，观察两份摘要的差异。',note:'保留中文原文；摘要为 64 个十六进制字符。',insight:'摘要没有配对解密操作，常用于检查数据完整性。这里对比添加英文句号后的摘要；红格表示输出位不同，深色表示该位为 1。'}
};
let currentAlg='caesar', labEpoch=0, labTimer, labRecord, aesKey, rsaPair, rsaPromise, labCurrent='', labSource='';
let shift=3, vigKey='HAOMI', rails=3;
function settings() {
  if(currentAlg==='caesar')return `<label for="caesar-shift">字母位移 <span class="setting-value" id="shift-label">+${shift}</span></label><input id="caesar-shift" type="range" min="0" max="25" value="${shift}" aria-label="字母位移"><p class="setting-small">取值 0–25，移位后循环。</p>`;
  if(currentAlg==='vigenere')return `<label for="vigenere-key">循环密钥</label><input id="vigenere-key" value="${E(vigKey)}" maxlength="30" autocomplete="off"><p class="setting-small">只使用密钥中的英文字母。</p>`;
  if(currentAlg==='rail')return `<label for="rail-count">轨道数量</label><select id="rail-count">${[2,3,4,5,6,7,8].map(n=>`<option ${n===rails?'selected':''}>${n}</option>`).join('')}</select>`;
  if(currentAlg==='otp')return '<span>等长随机掩码</span><button class="small-button" id="lab-regenerate">重新生成掩码</button><p class="setting-small">掩码只用于本次演示。</p>';
  if(currentAlg==='aes')return '<span>256 位密钥</span><button class="small-button" id="lab-regenerate">重新生成密钥</button><p class="setting-small">密钥仅保留在本次页面中。</p>';
  if(currentAlg==='rsa')return '<span>2048 位密钥对</span><button class="small-button" id="lab-regenerate">重新生成密钥对</button><p class="setting-small">私钥仅保留在本次页面中。</p>';
  if(currentAlg==='morse')return '<span>电码试听</span><p class="setting-small">600 Hz · 每单位 65 ms<br>试听输入的前 24 个字符。</p>';
  if(currentAlg==='sha')return '<span>对照输入</span><p class="setting-small">原文 ＋ 一个英文句号 .</p>';
  return '<span>UTF-8 → Base64</span><p class="setting-small">64 个字符，不需要密钥。</p>';
}
function chooseAlg(alg){
  stopAudio();currentAlg=alg;labEpoch++;labRecord=null;
  const a=algorithms[alg];$('lab-title').textContent=a.title;$('lab-category').textContent=a.category;$('lab-description').textContent=a.desc;$('lab-input-note').textContent=a.note;$('lab-insight').textContent=a.insight;$('lab-settings').innerHTML=settings();$('lab-restored').hidden=true;$('lab-error').hidden=true;
  $('lab-output-label').textContent=['sha','morse','base64'].includes(alg)?(alg==='sha'?'消息摘要':'编码结果'):'密文';
  $('lab-decrypt').hidden=['sha','morse'].includes(alg);$('lab-audio').hidden=alg!=='morse';
  const control=$('caesar-shift')||$('vigenere-key')||$('rail-count');
  if(control)control.addEventListener('input',()=>{if(currentAlg==='caesar'){shift=Number(control.value);$('shift-label').textContent=`+${shift}`;}if(currentAlg==='vigenere')vigKey=control.value;if(currentAlg==='rail')rails=Number(control.value);scheduleLab();});
  $('lab-regenerate')?.addEventListener('click',()=>{if(currentAlg==='aes')aesKey=null;if(currentAlg==='rsa'){rsaPair=null;rsaPromise=null;}renderLab();});
  renderLab();
}
function flow(blocks){return `<div class="flow-viz">${blocks.map(([label,value,note])=>`<div class="flow-block"><small>${E(label)}</small><strong>${E(value)}</strong>${note?`<p>${E(note)}</p>`:''}</div>`).join('')}</div>`;}
function shiftViz(text,keyValues){let j=0;return `<div class="shift-grid">${[...text].slice(0,15).map(c=>{if(!/[A-Z]/.test(c))return `<div class="shift-cell separator"><b>${E(c)}</b><small>·</small><b>${E(c)}</b></div>`;const k=keyValues[j++%keyValues.length];return `<div class="shift-cell"><b>${c}</b><small>+${k}</small><b class="shift-result">${caesar(c,k)}</b></div>`;}).join('')}</div>`;}
function railViz(text){const chars=[...text].slice(0,30);return `<div class="rail-viz">${Array.from({length:rails},(_,r)=>`<div class="rail-line">${chars.map((c,i)=>{const p=i%(2*(rails-1));const rr=p<rails?p:2*(rails-1)-p;return `<span class="${rr===r?'filled':''}">${rr===r?(c===' '?'·':E(c)):'·'}</span>`;}).join('')}</div>`).join('')}</div>`;}
function scheduleLab(){labEpoch++;labCurrent='';labRecord=null;$('lab-copy').disabled=true;$('lab-decrypt').disabled=true;$('lab-audio').disabled=true;$('lab-restored').hidden=true;clearTimeout(labTimer);stopAudio();labTimer=setTimeout(renderLab,160);}
async function renderLab(){
  const epoch=++labEpoch, alg=currentAlg, original=$('lab-input').value;
  $('lab-byte-count').textContent=`${utf8(original).length} bytes`;$('lab-error').hidden=true;$('lab-restored').hidden=true;$('lab-decrypt').disabled=true;$('lab-copy').disabled=true;$('lab-audio').disabled=true;labRecord=null;labCurrent='';
  if(!original){$('lab-output').value='';$('lab-visual').innerHTML='<p class="empty-state">输入一句话，观察它的变化。</p>';$('viz-caption').textContent='';return;}
  $('lab-output').value='计算中…';
  try{
    let output='',visual='',caption='',record;
    const normalized=['caesar','vigenere','rail','morse'].includes(alg)?romanize(original):original;
    if(alg==='caesar'){output=caesar(normalized,shift);visual=shiftViz(normalized,[shift]);caption='字母逐格移动 / 前 15 个字符';record={shift};}
    if(alg==='vigenere'){const k=vigKey.toUpperCase().replace(/[^A-Z]/g,'');output=vigenere(normalized,k);visual=shiftViz(normalized,[...k].map(c=>c.charCodeAt(0)-65));caption=`KEY / ${k} · 前 15 个字符`;record={key:k};}
    if(alg==='rail'){output=railFence(normalized,rails);visual=railViz(normalized);caption=`${rails} 条轨道 / 前 30 个字符`;record={rails};}
    if(alg==='otp'){
      const bytes=utf8(original),mask=crypto.getRandomValues(new Uint8Array(bytes.length)),ciphertext=bytes.map((b,i)=>b^mask[i]);output=hex(ciphertext);record={mask,ciphertext};
      visual=flow([['明文字节',short(hex(bytes),20),'UTF-8 编码'],['等长掩码',short(hex(mask),20),'逐字节 XOR（异或）'],['密文字节',short(output,20),'密文 XOR 掩码 = 原文']]);caption=`${bytes.length} 字节 / 十六进制`;
    }
    if(alg==='aes'){
      if(!crypto.subtle)throw new Error('当前浏览器环境不支持安全密码运算；请使用 HTTPS 或本地预览地址。');
      record=await aesEncrypt(original,aesKey);if(epoch!==labEpoch)return;aesKey=record.key;output=`IV: ${hex(record.iv)}\n密文 + 128 位认证标签 (Base64):\n${toBase64(record.ciphertext)}`;
      visual=flow([['明文',short(original,18),`${utf8(original).length} 个 UTF-8 字节`],['AES-256-GCM','256-bit KEY',`IV ${short(hex(record.iv),12)}`],['认证密文',short(toBase64(record.ciphertext),18),'用同一密钥与 IV 解密验证']]);caption='真实运算 / Web Crypto';
    }
    if(alg==='rsa'){
      if(!crypto.subtle)throw new Error('当前浏览器环境不支持安全密码运算；请使用 HTTPS 或本地预览地址。');
      if(utf8(original).length>190)throw new Error('RSA-2048 / OAEP-SHA-256 单次最多支持 190 个 UTF-8 字节；请缩短输入。中文通常每字占 3 字节。');
      if(!rsaPair){rsaPromise??=rsaKeys();const pair=await rsaPromise;if(epoch!==labEpoch)return;rsaPair=pair;}
      record=await rsaEncrypt(original,rsaPair);if(epoch!==labEpoch)return;output=toBase64(record.ciphertext);
      visual=flow([['发送方',short(original,18),'明文 + 接收方公钥'],['RSA-2048','OAEP / SHA-256','随机填充后再加密'],['接收方',short(output,18),'配对私钥解密']]);caption='真实运算 / Web Crypto';
    }
    if(alg==='morse'){output=morseEncode(original);visual=`<div class="morse-viz">${[...normalized].slice(0,13).map(c=>`<div><strong>${E(MORSE[c]|| (c===' '?'/':`[${c}]`))}</strong><small>${c===' '?'空格':E(c)}</small></div>`).join('')}</div>`;caption='点 / 1 单位 · 划 / 3 单位';}
    if(alg==='base64'){const bytes=utf8(original);output=toBase64(bytes);const bitstring=[...bytes.slice(0,3)].map(b=>b.toString(2).padStart(8,'0')).join('');visual=flow([['UTF-8 字节',hex(bytes.slice(0,3)),'展示前 3 个字节'],['每组 6 位',bitstring.match(/.{1,6}/g)?.join(' ')||'', '6 位可表示 64 个值'],['Base64',output.slice(0,4),'对应前 4 个编码字符']]);caption='UTF-8 bytes / 6-bit groups';}
    if(alg==='sha'){
      const [first,second]=await Promise.all([sha256(original),sha256(original+'.')]);if(epoch!==labEpoch)return;output=hex(first);
      const b1=[...first].map(x=>x.toString(2).padStart(8,'0')).join(''),b2=[...second].map(x=>x.toString(2).padStart(8,'0')).join('');let changed=0;
      visual=`<div class="hash-grid" aria-label="256 位摘要；红色表示添加句号后变化的位">${[...b1].map((b,i)=>{const different=b!==b2[i];if(different)changed++;return `<span class="${different?'changed':b==='1'?'one':''}" title="第 ${i+1} 位：${b} → ${b2[i]}"></span>`;}).join('')}</div><p class="hash-label">添加一个英文句号后，${changed} / 256 位发生改变（${(changed/256*100).toFixed(1)}%）。</p><p class="hash-label mono" style="overflow-wrap:anywhere">对照摘要：${hex(second)}</p>`;caption='每一格 / 1 bit';
    }
    if(epoch!==labEpoch)return;
    labRecord=record;labSource=normalized;labCurrent=output;$('lab-output').value=output;$('lab-visual').innerHTML=visual;$('viz-caption').textContent=caption;$('lab-decrypt').disabled=false;$('lab-copy').disabled=false;$('lab-audio').disabled=false;
  }catch(error){if(epoch!==labEpoch)return;$('lab-output').value='';$('lab-visual').innerHTML='<p class="empty-state">请调整输入后再试。</p>';$('lab-error').textContent=error.message;$('lab-error').hidden=false;}
}
document.querySelectorAll('[data-alg]').forEach(b=>b.addEventListener('click',()=>{setActive('[data-alg]',b);chooseAlg(b.dataset.alg);}));
$('lab-input').addEventListener('input',scheduleLab);$('lab-copy').addEventListener('click',()=>copy(labCurrent));
$('lab-decrypt').addEventListener('click',async()=>{
  const epoch=labEpoch,alg=currentAlg,record=labRecord,cipher=labCurrent;
  try{let text;
    if(alg==='caesar')text=caesar(cipher,-record.shift);
    if(alg==='vigenere')text=vigenere(cipher,record.key,true);
    if(alg==='rail')text=railFence(cipher,record.rails,true);
    if(alg==='otp')text=new TextDecoder('utf-8',{fatal:true}).decode(record.ciphertext.map((b,i)=>b^record.mask[i]));
    if(alg==='aes')text=await aesDecrypt(record);
    if(alg==='rsa')text=await rsaDecrypt(record);
    if(alg==='base64')text=new TextDecoder('utf-8',{fatal:true}).decode(fromBase64(cipher));
    if(epoch!==labEpoch)return;$('lab-restored').textContent=`还原结果：${text}\n${text===labSource?'与本次处理的输入一致。':'与输入不同，请检查参数。'}`;$('lab-restored').hidden=false;
  }catch(error){toast(`还原失败：${error.message}`);}
});

let audioContext,audioOscillator,audioTimeout;
function stopAudio(){clearTimeout(audioTimeout);if(audioOscillator){try{audioOscillator.stop();}catch{}audioOscillator=null;}$('lab-audio').textContent='试听电码';}
$('lab-audio').addEventListener('click',async()=>{
  if(audioOscillator){stopAudio();return;}
  try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();const symbols=[...romanize($('lab-input').value)].slice(0,24),unit=.065;
    const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=600;oscillator.connect(gain);gain.connect(audioContext.destination);gain.gain.setValueAtTime(0,audioContext.currentTime);
    let t=audioContext.currentTime+.05;
    symbols.forEach((c,i)=>{if(c===' '||c==='\n'){t+=4*unit;return;}const code=MORSE[c];if(!code){t+=3*unit;return;}[...code].forEach((s,j)=>{gain.gain.setValueAtTime(.12,t);t+=(s==='.'?1:3)*unit;gain.gain.setValueAtTime(0,t);if(j<code.length-1)t+=unit;});if(i<symbols.length-1)t+=3*unit;});
    oscillator.start();oscillator.stop(t+.05);audioOscillator=oscillator;$('lab-audio').textContent='停止试听';audioTimeout=setTimeout(()=>{audioOscillator=null;$('lab-audio').textContent='试听电码';},(t-audioContext.currentTime+.1)*1000);
  }catch{toast('当前环境无法播放声音。');}
});
chooseAlg('caesar');

let pokerMode='encode',pokerManual=false,pokerExpanded=false,pokerResult={normalized:'',cards:[],serialized:''};
function renderPoker(){
  $('poker-error').hidden=true;
  const text=$('poker-input').value;
  $('poker-count').textContent=pokerMode==='decode'?`${textTokenCount(text)} 个码元`:`${[...text].length} / 600`;
  try{
    if(pokerMode==='decode'){
      const decoded=pokerDecode(text);pokerResult=pokerEncode(decoded,true);$('poker-normalized').textContent=decoded;
    }else{
      pokerResult=pokerEncode(pokerManual?$('pinyin-input').value:text,pokerManual);$('poker-normalized').textContent=pokerResult.normalized;
      if(!pokerManual)$('pinyin-input').value=pokerResult.normalized;
    }
    const {cards,serialized}=pokerResult;const count=cards.filter(c=>c.kind!=='space'&&c.kind!=='literal').length,literals=cards.filter(c=>c.kind==='literal').length;
    $('poker-cards').innerHTML=cards.length?(pokerExpanded?cards:cards.slice(0,180)).map(c=>cardHTML(c,$('show-letters').checked,$('suit-choice').value==='diamond')).join(''):'<p class="empty-state">写下一句话，牌面会在这里出现。</p>';
    $('poker-more').hidden=cards.length<=180||pokerExpanded;$('poker-more').textContent=`展开全部 ${cards.length} 个位置`;
    $('poker-status').textContent=cards.length?`${count} 张牌 · ${literals} 个规则外字符保留${cards.length>180&&!pokerExpanded?' · 当前显示前 180 个位置；数字码包含完整序列':''}${pokerManual?' · 正在使用校正后的字母序列':''}`:'';
    $('poker-code').value=serialized;$('poker-copy').disabled=!serialized;$('poker-export').disabled=!cards.length;
  }catch(error){pokerResult={normalized:'',cards:[],serialized:''};$('poker-normalized').textContent='';$('poker-cards').innerHTML='';$('poker-code').value='';$('poker-status').textContent='';$('poker-more').hidden=true;$('poker-error').textContent=error.message;$('poker-error').hidden=false;$('poker-copy').disabled=true;$('poker-export').disabled=true;}
}
function switchPoker(mode){
  if(mode===pokerMode)return;
  $('poker-input').value=mode==='decode'?pokerResult.serialized:(()=>{try{return pokerDecode($('poker-input').value);}catch{return '';}})();
  pokerMode=mode;pokerManual=false;pokerExpanded=false;$('pinyin-editor').hidden=true;
  $('poker-input-label').textContent=mode==='decode'?'输入数字码，例如 R01 B01 SMALL / R13 BIG':'输入英文、中文，或两者混合';
  $('poker-transcription-label').textContent=mode==='decode'?'解读后的字母 / 拼音':'拼音 / 字母序列';
  $('poker-input').maxLength=mode==='decode'?30000:600;$('poker-edit').hidden=mode==='decode';document.querySelector('.example-buttons').hidden=mode==='decode';renderPoker();
  if(mode==='decode')$('poker-count').textContent=`${textTokenCount($('poker-input').value)} 个码元`;
}
function textTokenCount(text){return text.trim()?text.trim().split(/\s+/).length:0;}
document.querySelectorAll('[data-poker-mode]').forEach(b=>b.addEventListener('click',()=>{setActive('[data-poker-mode]',b);switchPoker(b.dataset.pokerMode);}));
$('poker-input').addEventListener('input',()=>{pokerManual=false;pokerExpanded=false;$('pinyin-editor').hidden=true;renderPoker();if(pokerMode==='decode')$('poker-count').textContent=`${textTokenCount($('poker-input').value)} 个码元`;});
document.querySelectorAll('[data-poker-example]').forEach(b=>b.addEventListener('click',()=>{$('poker-input').value=b.dataset.pokerExample;pokerManual=false;pokerExpanded=false;$('pinyin-editor').hidden=true;renderPoker();}));
$('show-letters').addEventListener('change',renderPoker);$('suit-choice').addEventListener('change',renderPoker);
$('poker-edit').addEventListener('click',()=>{$('pinyin-editor').hidden=!$('pinyin-editor').hidden;if(!$('pinyin-editor').hidden)$('pinyin-input').focus();});
$('pinyin-input').addEventListener('input',()=>{pokerManual=true;renderPoker();});
$('pinyin-reset').addEventListener('click',()=>{pokerManual=false;renderPoker();});
$('poker-more').addEventListener('click',()=>{pokerExpanded=true;renderPoker();});
$('poker-copy').addEventListener('click',()=>copy(pokerResult.serialized));
$('poker-mapping').innerHTML=[...ALPHABET].map((c,i)=>`<div class="mapping-cell ${i<13?'red':'black'}"><strong>${c}</strong><small>${i<13?'♥':'♠'} ${i%13+1}</small></div>`).join('');
$('poker-export').addEventListener('click',()=>{
  const cards=pokerResult.cards;if(!cards.length)return;
  const columns=13,cellW=78,cellH=124,padding=32,width=columns*cellW+2*padding,height=Math.ceil(cards.length/columns)*cellH+140;
  const diamond=$('suit-choice').value==='diamond';
  const shapes=cards.map((c,i)=>{
    const x=padding+(i%columns)*cellW,y=105+Math.floor(i/columns)*cellH;
    if(c.kind==='space')return `<text x="${x+32}" y="${y+57}" text-anchor="middle" fill="#909985" font-size="18">${c.token==='NL'?'↵':'·'}</text>`;
    const literal=c.kind==='literal',joker=['big','small'].includes(c.kind),red=['red','big'].includes(c.kind),color=literal?'#767d6e':red?'#b84131':'#202522';
    return `<g transform="translate(${x},${y})"><rect width="64" height="104" rx="5" fill="${literal?'#e5e9dd':'#fffefa'}" stroke="#c5ceba"/><text x="8" y="21" fill="${color}" font-size="14" font-family="monospace">${literal?'原文':joker?'JOKER':rank(c.number)}</text><text x="32" y="61" text-anchor="middle" fill="${color}" font-size="${joker?21:30}">${literal?E(c.char):joker?(c.kind==='big'?'大王':'小王'):c.kind==='red'?(diamond?'♦':'♥'):(diamond?'♣':'♠')}</text><path d="M0 79H64" stroke="#e0e5d6"/><text x="9" y="96" fill="${color}" font-size="13" font-family="monospace">${$('show-letters').checked||literal?E(c.char):''}</text><text x="56" y="96" text-anchor="end" fill="#737f63" font-size="12" font-family="monospace">${c.number||''}</text></g>`;
  }).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f5f3ed"/><text x="32" y="43" font-size="24" fill="#202522" font-family="serif">豪密 · 扑克密语</text><text x="32" y="72" font-size="13" fill="#737f63">红牌 1–13 = A–M / 黑牌 1–13 = N–Z / 大王 = 句号 / 小王 = 逗号</text>${shapes}<text x="32" y="${height-15}" font-size="11" fill="#737f63">中文转无声调拼音 · 灰色为规则外原文标记 · 不保留大小写和声调</text></svg>`;
  const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='扑克密语.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('牌面已导出为 SVG');
});
renderPoker();
