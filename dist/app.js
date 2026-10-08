import { ALPHABET, romanize, pokerEncode, pokerDecode, caesar, vigenere, railFence, randomDigits, digitMask, unicodeDigits, digitsUnicode, MORSE, morseEncode, toBase64, fromBase64, utf8, hex, sha256, aesEncrypt, aesDecrypt, rsaKeys, rsaEncrypt, rsaDecrypt } from './ciphers.js';
import { HAND_WINDOW, sentenceHands, fanPosition, handsSVG } from './hands.js';
import { jokerSVG } from './joker.js';
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
  return `<span class="playing-card ${card.kind} ${joker?'joker':''}" title="${name} = ${E(card.char)}" aria-label="${name}，对应 ${E(card.char)}"><span class="card-corner">${joker?'JOKER':rank(card.number)}</span><span class="card-suit">${joker?jokerSVG():suit}</span><span class="card-footer"><span class="card-letter">${showLetter?E(card.char):'·'}</span><span class="card-number">${joker?'':String(card.number).padStart(2,'0')}</span></span></span>`;
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
let labVisualPage=0;
const labPageSizes={caesar:15,vigenere:15,rail:30,morse:13};
function labVisualRange(text,alg){
  const chars=[...text],size=labPageSizes[alg],pages=Math.max(1,Math.ceil(chars.length/size));
  labVisualPage=Math.min(labVisualPage,pages-1);
  const start=labVisualPage*size,end=Math.min(start+size,chars.length);
  $('lab-paging').hidden=pages<=1;$('lab-page-prev').disabled=labVisualPage===0;$('lab-page-next').disabled=labVisualPage===pages-1;
  $('lab-page-number').value=labVisualPage+1;$('lab-page-number').max=pages;$('lab-page-range').textContent=`${start+1}–${end} / ${chars.length} 字符`;
  return {start,end,chars:chars.slice(start,end),label:`第 ${start+1}–${end} / 共 ${chars.length} 个字符`};
}
function changeLabPage(page){
  if(!labPageSizes[currentAlg])return;
  const pages=Math.ceil([...romanize($('lab-input').value)].length/labPageSizes[currentAlg]);
  labVisualPage=Math.max(0,Math.min(Number.isFinite(page)?Math.trunc(page):0,Math.max(0,pages-1)));stopAudio();renderLab();
}
$('lab-page-prev').addEventListener('click',()=>changeLabPage(labVisualPage-1));
$('lab-page-next').addEventListener('click',()=>changeLabPage(labVisualPage+1));
$('lab-page-number').addEventListener('change',event=>changeLabPage(Number(event.target.value)-1));
const labCompactLayout=window.matchMedia('(max-width: 900px)');
let currentLabPanel='result';
function keepLabViewVisible() {
  if(!labCompactLayout.matches)return;
  const menu=document.querySelector('.lab-menu'), workspace=document.querySelector('.lab-workspace'), tabs=document.querySelector('.lab-tabs');
  const stacked=window.matchMedia('(max-width: 900px)').matches;
  const offset=stacked?parseFloat(getComputedStyle(menu).top)+menu.getBoundingClientRect().height+12:16;
  if(tabs.getBoundingClientRect().top<offset-1)window.scrollTo({top:window.scrollY+workspace.getBoundingClientRect().top-offset,behavior:'instant'});
}
function showLabPanel(name) {
  currentLabPanel=name;
  document.querySelectorAll('[data-lab-panel]').forEach(button=>{
    const active=button.dataset.labPanel===name;
    button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    $(`lab-panel-${button.dataset.labPanel}`).hidden=labCompactLayout.matches&&!active;
  });
  requestAnimationFrame(keepLabViewVisible);
}
function syncLabLayout() {
  document.querySelector('.lab-tabs').hidden=!labCompactLayout.matches;
  document.querySelector('.lab-explanation').open=labCompactLayout.matches;
  for(const name of ['result','process','principle']){
    const panel=$(`lab-panel-${name}`);
    panel.setAttribute('role',labCompactLayout.matches?'tabpanel':'region');
    panel.setAttribute('aria-labelledby',labCompactLayout.matches?`lab-tab-${name}`:({result:'lab-output-label',process:'lab-process-title',principle:'lab-title'}[name]));
  }
  showLabPanel(currentLabPanel);
}
labCompactLayout.addEventListener('change',syncLabLayout);
syncLabLayout();
document.querySelectorAll('[data-lab-panel]').forEach(button=>{
  button.addEventListener('click',()=>showLabPanel(button.dataset.labPanel));
  button.addEventListener('keydown',event=>{
    const tabs=[...document.querySelectorAll('[data-lab-panel]')],index=tabs.indexOf(button);
    const next=event.key==='ArrowRight'?tabs[(index+1)%tabs.length]:event.key==='ArrowLeft'?tabs[(index+tabs.length-1)%tabs.length]:event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):null;
    if(next){event.preventDefault();showLabPanel(next.dataset.labPanel);next.focus();}
  });
});
const labMenuObserver=new ResizeObserver(([entry])=>{
  document.querySelector('.lab-section').style.setProperty('--lab-menu-height',`${Math.ceil(entry.target.getBoundingClientRect().height)}px`);
});
labMenuObserver.observe(document.querySelector('.lab-menu'));
function settings() {
  if(currentAlg==='caesar')return `<label for="caesar-shift">字母位移 <span class="setting-value" id="shift-label">+${shift}</span></label><input id="caesar-shift" type="range" min="0" max="25" value="${shift}" aria-label="字母位移"><p class="setting-small">取值 0–25，移位后循环。</p>`;
  if(currentAlg==='vigenere')return `<label for="vigenere-key">循环密钥</label><input id="vigenere-key" value="${E(vigKey)}" maxlength="30" autocomplete="off"><p class="setting-small">只使用密钥中的英文字母。</p>`;
  if(currentAlg==='rail')return `<label for="rail-count">轨道数量</label><select id="rail-count">${[2,3,4,5,6,7,8].map(n=>`<option ${n===rails?'selected':''}>${n}</option>`).join('')}</select>`;
  if(currentAlg==='otp')return '<span>等长随机掩码</span><button class="small-button" id="lab-regenerate">重新生成掩码</button><p class="setting-small">掩码只用于本次演示。</p>';
  if(currentAlg==='aes')return '<span>256 位密钥</span><button class="small-button" id="lab-regenerate">重新生成密钥</button><p class="setting-small">密钥仅保留在本次页面中。</p>';
  if(currentAlg==='rsa')return '<span>2048 位密钥对</span><button class="small-button" id="lab-regenerate">重新生成密钥对</button><p class="setting-small">私钥仅保留在本次页面中。</p>';
  if(currentAlg==='morse')return '<span>电码试听</span><p class="setting-small">600 Hz · 每单位 65 ms<br>试听当前过程段，翻页后可试听后续文字。</p>';
  if(currentAlg==='sha')return '<span>对照输入</span><p class="setting-small">原文 ＋ 一个英文句号 .</p>';
  return '<span>UTF-8 → Base64</span><p class="setting-small">64 个字符，不需要密钥。</p>';
}
function chooseAlg(alg){
  stopAudio();currentAlg=alg;labEpoch++;labRecord=null;labVisualPage=0;
  const a=algorithms[alg];$('lab-title').textContent=a.title;$('lab-category').textContent=a.category;$('lab-description').textContent=a.desc;$('lab-input-note').textContent=a.note;$('lab-insight').textContent=a.insight;$('lab-settings').innerHTML=settings();$('lab-restored').hidden=true;$('lab-error').hidden=true;
  $('lab-setting-note').textContent=$('lab-settings').querySelector('.setting-small')?.textContent||'';
  $('lab-output-label').textContent=['sha','morse','base64'].includes(alg)?(alg==='sha'?'消息摘要':'编码结果'):'密文';
  $('lab-decrypt').hidden=['sha','morse'].includes(alg);$('lab-audio').hidden=alg!=='morse';
  const control=$('caesar-shift')||$('vigenere-key')||$('rail-count');
  if(control)control.addEventListener('input',()=>{if(currentAlg==='caesar'){shift=Number(control.value);$('shift-label').textContent=`+${shift}`;}if(currentAlg==='vigenere')vigKey=control.value;if(currentAlg==='rail')rails=Number(control.value);scheduleLab();});
  $('lab-regenerate')?.addEventListener('click',()=>{if(currentAlg==='aes')aesKey=null;if(currentAlg==='rsa'){rsaPair=null;rsaPromise=null;}renderLab();});
  renderLab();
}
function flow(blocks){return `<div class="flow-viz">${blocks.map(([label,value,note])=>`<div class="flow-block"><small>${E(label)}</small><strong>${E(value)}</strong>${note?`<p>${E(note)}</p>`:''}</div>`).join('')}</div>`;}
function shiftViz(text,keyValues,range){let j=[...text].slice(0,range.start).filter(c=>/[A-Z]/.test(c)).length;return `<div class="shift-grid">${range.chars.map(c=>{if(!/[A-Z]/.test(c))return `<div class="shift-cell separator"><b>${E(c===' '?'·':c==='\n'?'↵':c)}</b><small>·</small><b>${E(c===' '?'·':c==='\n'?'↵':c)}</b></div>`;const k=keyValues[j++%keyValues.length];return `<div class="shift-cell"><b>${c}</b><small>+${k}</small><b class="shift-result">${caesar(c,k)}</b></div>`;}).join('')}</div>`;}
function railViz(range){
  const chars=range.chars;
  return `<div class="rail-viz">${Array.from({length:Math.ceil(chars.length/8)},(_,block)=>{
    const localStart=block*8,start=range.start+localStart, chunk=chars.slice(localStart,localStart+8);
    return `<div class="rail-block" style="--rail-columns:${chunk.length}"><small>位置 ${String(start+1).padStart(2,'0')}–${String(start+chunk.length).padStart(2,'0')}</small>${Array.from({length:rails},(_,r)=>`<div class="rail-line"><b aria-label="轨道 ${r+1}">${r+1}</b>${chunk.map((c,j)=>{const i=start+j,p=i%(2*(rails-1)),rr=p<rails?p:2*(rails-1)-p;return `<span class="${rr===r?'filled':''}" ${rr===r?`aria-label="第 ${i+1} 个字符：${E(c===' '?'空格':c)}"`:''}>${rr===r?(/\s/u.test(c)?'·':E(c)):'·'}</span>`;}).join('')}</div>`).join('')}</div>`;
  }).join('')}</div>`;
}
function scheduleLab(){labEpoch++;labVisualPage=0;$('lab-paging').hidden=true;labCurrent='';labRecord=null;$('lab-copy').disabled=true;$('lab-decrypt').disabled=true;$('lab-audio').disabled=true;$('lab-restored').hidden=true;clearTimeout(labTimer);stopAudio();labTimer=setTimeout(renderLab,160);}
async function renderLab(){
  const epoch=++labEpoch, alg=currentAlg, original=$('lab-input').value;
  const menuRect=document.querySelector('.lab-menu').getBoundingClientRect(), keepView=menuRect.top>=0&&menuRect.bottom<=window.innerHeight;
  $('lab-byte-count').textContent=`${original.length} / 8000 · ${utf8(original).length} bytes${alg==='rsa'?' · RSA 上限 190 bytes':''}`;$('lab-paging').hidden=true;$('lab-error').hidden=true;$('lab-restored').hidden=true;$('lab-decrypt').disabled=true;$('lab-copy').disabled=true;$('lab-audio').disabled=true;labRecord=null;labCurrent='';
  if(!original){$('lab-output').value='';$('lab-visual').innerHTML='<p class="empty-state">输入一句话，观察它的变化。</p>';$('viz-caption').textContent='';if(keepView)requestAnimationFrame(keepLabViewVisible);return;}
  $('lab-output').value='计算中…';
  try{
    let output='',visual='',caption='',record;
    const normalized=['caesar','vigenere','rail','morse'].includes(alg)?romanize(original):original;
    const range=labPageSizes[alg]?labVisualRange(normalized,alg):null;
    if(alg==='caesar'){output=caesar(normalized,shift);visual=shiftViz(normalized,[shift],range);caption=`字母逐格移动 / ${range.label}`;record={shift};}
    if(alg==='vigenere'){const k=vigKey.toUpperCase().replace(/[^A-Z]/g,'');output=vigenere(normalized,k);visual=shiftViz(normalized,[...k].map(c=>c.charCodeAt(0)-65),range);caption=`KEY / ${k} · ${range.label}`;record={key:k};}
    if(alg==='rail'){output=railFence(normalized,rails);visual=railViz(range);caption=`${rails} 条轨道 / ${range.label}`;record={rails};}
    if(alg==='otp'){
      const bytes=utf8(original),mask=crypto.getRandomValues(new Uint8Array(bytes.length)),ciphertext=bytes.map((b,i)=>b^mask[i]);output=hex(ciphertext);record={mask,ciphertext};
      visual=flow([['明文字节',short(hex(bytes),20),'UTF-8 编码'],['等长掩码',short(hex(mask),20),'逐字节 XOR（异或）'],['密文字节',short(output,20),'密文 XOR 掩码 = 原文']]);caption=`全文 ${bytes.length} 字节 / 流程内容节选`;
    }
    if(alg==='aes'){
      if(!crypto.subtle)throw new Error('当前浏览器环境不支持安全密码运算；请使用 HTTPS 或本地预览地址。');
      record=await aesEncrypt(original,aesKey);if(epoch!==labEpoch)return;aesKey=record.key;output=`IV: ${hex(record.iv)}\n密文 + 128 位认证标签 (Base64):\n${toBase64(record.ciphertext)}`;
      visual=flow([['明文',short(original,18),`${utf8(original).length} 个 UTF-8 字节`],['AES-256-GCM','256-bit KEY',`IV ${short(hex(record.iv),12)}`],['认证密文',short(toBase64(record.ciphertext),18),'用同一密钥与 IV 解密验证']]);caption='完整输入已加密 / 流程内容节选';
    }
    if(alg==='rsa'){
      if(!crypto.subtle)throw new Error('当前浏览器环境不支持安全密码运算；请使用 HTTPS 或本地预览地址。');
      if(utf8(original).length>190)throw new Error('RSA-2048 / OAEP-SHA-256 单次最多支持 190 个 UTF-8 字节；请缩短输入。中文通常每字占 3 字节。');
      if(!rsaPair){rsaPromise??=rsaKeys();const pair=await rsaPromise;if(epoch!==labEpoch)return;rsaPair=pair;}
      record=await rsaEncrypt(original,rsaPair);if(epoch!==labEpoch)return;output=toBase64(record.ciphertext);
      visual=flow([['发送方',short(original,18),'明文 + 接收方公钥'],['RSA-2048','OAEP / SHA-256','随机填充后再加密'],['接收方',short(output,18),'配对私钥解密']]);caption='真实运算 / Web Crypto';
    }
    if(alg==='morse'){output=morseEncode(original);visual=`<div class="morse-viz">${range.chars.map(c=>`<div><strong>${E(MORSE[c]|| (c===' '||c==='\n'?'/':`[${c}]`))}</strong><small>${c===' '?'空格':c==='\n'?'换行':E(c)}</small></div>`).join('')}</div>`;caption=`点 1 单位 · 划 3 单位 / ${range.label}`;}
    if(alg==='base64'){const bytes=utf8(original);output=toBase64(bytes);const bitstring=[...bytes.slice(0,3)].map(b=>b.toString(2).padStart(8,'0')).join('');visual=flow([['UTF-8 字节',hex(bytes.slice(0,3)),'展示前 3 个字节'],['每组 6 位',bitstring.match(/.{1,6}/g)?.join(' ')||'', '6 位可表示 64 个值'],['Base64',output.slice(0,4),'对应前 4 个编码字符']]);caption='完整输入已编码 / 前 3 字节示例';}
    if(alg==='sha'){
      const [first,second]=await Promise.all([sha256(original),sha256(original+'.')]);if(epoch!==labEpoch)return;output=hex(first);
      const b1=[...first].map(x=>x.toString(2).padStart(8,'0')).join(''),b2=[...second].map(x=>x.toString(2).padStart(8,'0')).join('');let changed=0;
      visual=`<div class="hash-grid" aria-label="256 位摘要；红色表示添加句号后变化的位">${[...b1].map((b,i)=>{const different=b!==b2[i];if(different)changed++;return `<span class="${different?'changed':b==='1'?'one':''}" title="第 ${i+1} 位：${b} → ${b2[i]}"></span>`;}).join('')}</div><p class="hash-label">添加一个英文句号后，${changed} / 256 位发生改变（${(changed/256*100).toFixed(1)}%）。</p><p class="hash-label mono" style="overflow-wrap:anywhere">对照摘要：${hex(second)}</p>`;caption='每一格 / 1 bit';
    }
    if(epoch!==labEpoch)return;
    labRecord=record;labSource=normalized;labCurrent=output;$('lab-output').value=output;$('lab-visual').innerHTML=visual;$('lab-visual').scrollTop=0;$('viz-caption').textContent=caption;$('lab-decrypt').disabled=false;$('lab-copy').disabled=false;$('lab-audio').disabled=false;
  }catch(error){if(epoch!==labEpoch)return;$('lab-paging').hidden=true;$('lab-output').value='';$('lab-visual').innerHTML='<p class="empty-state">请调整输入后再试。</p>';$('lab-error').textContent=error.message;$('lab-error').hidden=false;}
  finally{if(epoch===labEpoch&&keepView)requestAnimationFrame(keepLabViewVisible);}
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
  try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();const symbols=[...romanize($('lab-input').value)].slice(labVisualPage*labPageSizes.morse,(labVisualPage+1)*labPageSizes.morse),unit=.065;
    const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=600;oscillator.connect(gain);gain.connect(audioContext.destination);gain.gain.setValueAtTime(0,audioContext.currentTime);
    let t=audioContext.currentTime+.05;
    symbols.forEach((c,i)=>{if(c===' '||c==='\n'){t+=4*unit;return;}const code=MORSE[c];if(!code){t+=3*unit;return;}[...code].forEach((s,j)=>{gain.gain.setValueAtTime(.12,t);t+=(s==='.'?1:3)*unit;gain.gain.setValueAtTime(0,t);if(j<code.length-1)t+=unit;});if(i<symbols.length-1)t+=3*unit;});
    oscillator.start();oscillator.stop(t+.05);audioOscillator=oscillator;$('lab-audio').textContent='停止试听';audioTimeout=setTimeout(()=>{audioOscillator=null;$('lab-audio').textContent='试听电码';},(t-audioContext.currentTime+.1)*1000);
  }catch{toast('当前环境无法播放声音。');}
});
chooseAlg('caesar');

let pokerMode='encode',pokerManual=false,pokerExpanded=false,pokerResult={normalized:'',cards:[],serialized:''};
let handSource='', pokerHands=[], handPages=new Map(), handSelections=new Map(), pokerView='overview';
const handCards = hand => hand.filter(c => c.kind !== 'space');
function handCardName(card) {
  return card.kind==='literal'?`原文 ${card.char}`:card.kind==='big'?'大王':card.kind==='small'?'小王':`${card.kind==='red'?'红':'黑'}牌 ${card.number}`;
}
function handDetail(card,index) {
  return `第 ${index+1} 张 · ${card.token}${$('show-letters').checked?` → ${card.char}`:''}`;
}
function renderFan(visible,start,selected,interactive) {
  const show=$('show-letters').checked, diamond=$('suit-choice').value==='diamond';
  return `<div class="hand-stage ${interactive?'hand-inspect':'hand-overview'}">${visible.map((c,i)=>{
    const {position,angle,drop}=fanPosition(i,visible.length), index=start+i, tag=interactive?'button':'span';
    return `<${tag} ${interactive?`type="button" data-hand-card="${index}" aria-pressed="${index===selected}"`:''} class="hand-card" aria-label="第 ${index+1} 张，${E(handCardName(c))}${show?`，对应 ${E(c.char)}`:''}" style="--fan-left:${50+position*50};--fan-inset:${position*126};--fan-drop:${drop};--fan-angle:${angle};--fan-order:${i+1}">${cardHTML(c,show,diamond)}<span class="hand-edge" aria-hidden="true">${show?E(c.char):'·'}<small>${c.number?String(c.number).padStart(2,'0'):c.kind==='literal'?'原文':jokerSVG({width:14,height:17})}</small></span></${tag}>`;
  }).join('')}</div>`;
}
function renderHand(hand,handIndex) {
  const all=handCards(hand), page=handPages.get(handIndex)||0, start=page*HAND_WINDOW, visible=all.slice(start,start+HAND_WINDOW);
  let body;
  if(pokerView==='flat') {
    body=`<div class="flat-stage">${hand.map(c=>cardHTML(c,$('show-letters').checked,$('suit-choice').value==='diamond')).join('')}</div>`;
  } else if(pokerView==='overview') {
    body=Array.from({length:Math.ceil(all.length/HAND_WINDOW)},(_,part)=>{
      const offset=part*HAND_WINDOW, chunk=all.slice(offset,offset+HAND_WINDOW);
      return `${renderFan(chunk,offset,null,false)}${all.length>HAND_WINDOW?`<p class="hand-part">第 ${offset+1}–${offset+chunk.length} 张 / 共 ${all.length} 张</p>`:''}`;
    }).join('');
  } else {
    const selected=handSelections.get(handIndex)??start+Math.floor((visible.length-1)/2);
    handSelections.set(handIndex,selected);
    body=`${renderFan(visible,start,selected,true)}<div class="hand-reader"><label>逐张查看<input type="range" data-hand-reader min="${start}" max="${start+visible.length-1}" value="${selected}" aria-label="查看第 ${handIndex+1} 句的牌" aria-valuetext="${E(handDetail(all[selected],selected))}"></label><output class="hand-detail" aria-live="polite">${E(handDetail(all[selected],selected))}</output></div>${all.length>HAND_WINDOW?`<div class="hand-navigation"><button type="button" data-hand-page="${page-1}" ${page===0?'disabled':''}>前 ${HAND_WINDOW} 张</button><span>${start+1}–${start+visible.length} / ${all.length}</span><button type="button" data-hand-page="${page+1}" ${start+visible.length===all.length?'disabled':''}>后 ${HAND_WINDOW} 张</button></div>`:''}`;
  }
  return `<section class="sentence-hand" data-hand="${handIndex}" aria-label="第 ${handIndex+1} 句牌面"><div class="hand-heading"><span>第 ${String(handIndex+1).padStart(2,'0')} 句</span><span>${all.length} 张牌${all.some(c=>c.kind==='literal')?' / 含原文标记':''}</span></div><p class="hand-text">${E(hand.map(c=>c.char).join('').trim())}</p>${body}</section>`;
}
function renderHands() {
  $('poker-cards').dataset.view=pokerView;
  $('hand-help').textContent=({overview:'按逗号、句号等标点与换行分组，一段一把静态手牌；长段的全部牌面按顺序展示，无需拖动。',inspect:'按标点分组，点选牌面或滑动逐张查看；切换“手牌全貌”可收回抬起的单张牌。',flat:'按逗号、句号等标点分组，每张牌完整平铺、从左到右阅读，空格和换行也保留。'})[pokerView];
  const visible=pokerExpanded?pokerHands:pokerHands.slice(0,6);
  $('poker-cards').innerHTML=visible.length?visible.map(renderHand).join(''):'<p class="empty-state">写下一句话，手牌会在这里出现。</p>';
}
document.querySelectorAll('[data-poker-view]').forEach(b=>b.addEventListener('click',()=>{pokerView=b.dataset.pokerView;setActive('[data-poker-view]',b);renderHands();}));
function selectHandCard(section,index) {
  const handIndex=Number(section.dataset.hand), card=handCards(pokerHands[handIndex])[index];
  handSelections.set(handIndex,index);
  section.querySelectorAll('[data-hand-card]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.handCard)===index)));
  const reader=section.querySelector('[data-hand-reader]'), detail=handDetail(card,index);
  reader.value=index;reader.setAttribute('aria-valuetext',detail);section.querySelector('.hand-detail').textContent=detail;
}
$('poker-cards').addEventListener('click',e=>{
  const section=e.target.closest('[data-hand]');if(!section)return;
  const card=e.target.closest('[data-hand-card]');if(card)return selectHandCard(section,Number(card.dataset.handCard));
  const page=e.target.closest('[data-hand-page]');if(!page)return;
  const index=Number(section.dataset.hand), next=Number(page.dataset.handPage);
  handPages.set(index,next);handSelections.set(index,next*HAND_WINDOW);section.outerHTML=renderHand(pokerHands[index],index);
  $('poker-cards').querySelector(`[data-hand="${index}"] [data-hand-reader]`).focus();
});
$('poker-cards').addEventListener('input',e=>{if(e.target.matches('[data-hand-reader]'))selectHandCard(e.target.closest('[data-hand]'),Number(e.target.value));});
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
    if(handSource!==serialized){handSource=serialized;handPages.clear();handSelections.clear();}
    pokerHands=sentenceHands(cards).filter(hand=>handCards(hand).length);renderHands();
    $('poker-more').hidden=pokerHands.length<=6||pokerExpanded;$('poker-more').textContent=`展开全部 ${pokerHands.length} 把手牌`;
    $('poker-status').textContent=cards.length?`${pokerHands.length} 把手牌 · ${count} 张牌 · ${literals} 个规则外字符保留${pokerHands.length>6&&!pokerExpanded?' · 当前显示前 6 句；数字码包含完整序列':''}${pokerManual?' · 正在使用校正后的字母序列':''}`:'';
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
  const svg=handsSVG(cards,{showLetters:$('show-letters').checked,diamond:$('suit-choice').value==='diamond',layout:pokerView==='flat'?'flat':'fan'});
  const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='扑克密语.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('牌面已导出为 SVG');
});
renderPoker();
