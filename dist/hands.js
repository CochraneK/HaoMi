export const HAND_WINDOW = 24;

// Keep every code position, including spaces; commas stay inside a sentence.
export function sentenceHands(cards) {
  const hands = [];
  let current = [], ended = false;
  const terminal = card => card.kind === 'big' || /[!?！？]/u.test(card.char);
  const closing = card => /[”’"'）)\]】》]/u.test(card.char);
  const flush = () => { if (current.length) hands.push(current); current = []; ended = false; };
  for (const card of cards) {
    if (ended && card.kind !== 'space' && !terminal(card) && !closing(card)) flush();
    current.push(card);
    if (terminal(card)) ended = true;
    if (card.token === 'NL') flush();
  }
  flush();
  return hands;
}

export function fanPosition(index, count) {
  const position = count === 1 ? 0 : index / (count - 1) * 2 - 1;
  const spread = Math.min(1, (count - 1) / 9);
  return { position: position * spread, angle: position * spread * 27, drop: position ** 2 * spread * 33 };
}

export function handsSVG(cards, { showLetters = true, diamond = false } = {}) {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lines = (text, size) => Array.from({length: Math.ceil([...text].length / size)}, (_, i) => [...text].slice(i * size, (i + 1) * size).join(''));
  const hands = sentenceHands(cards).filter(hand => hand.some(c => c.kind !== 'space'));
  let y = 105;
  const panels = hands.map((hand, handIndex) => {
    const visible = hand.filter(c => c.kind !== 'space');
    const textLines = lines(hand.map(c => c.char).join('').trim(), 75);
    const codeLines = lines(hand.map(c => c.token).join(' '), 93);
    const windows = Math.ceil(visible.length / HAND_WINDOW);
    const height = 84 + textLines.length * 23 + windows * 250 + 28 + codeLines.length * 18;
    const top = y; y += height + 20;
    const heading = `<text x="${56}" y="${top+30}" font-size="13" fill="#b84131">第 ${String(handIndex+1).padStart(2,'0')} 句</text><text x="904" y="${top+30}" text-anchor="end" font-size="13" fill="#737f63">${visible.length} 张牌</text>`;
    const text = textLines.map((line, i) => `<text x="56" y="${top+58+i*23}" font-size="15" fill="#546247" xml:space="preserve">${escape(line)}</text>`).join('');
    const fans = Array.from({length: windows}, (_, page) => {
      const chunk = visible.slice(page*HAND_WINDOW,(page+1)*HAND_WINDOW);
      const base = top + 65 + textLines.length*23 + page*250;
      const shapes = chunk.map((c,i) => {
        const {position,angle,drop} = fanPosition(i,chunk.length);
        const x = 480 + position*(330-126) - 34;
        const cy = base+drop+24;
        const literal=c.kind==='literal',joker=['big','small'].includes(c.kind),red=['red','big'].includes(c.kind),color=literal?'#767d6e':red?'#b84131':'#202522';
        const rank = ({1:'A',11:'J',12:'Q',13:'K'}[c.number] || c.number);
        const suit = literal?c.char:joker?(c.kind==='big'?'大王':'小王'):c.kind==='red'?(diamond?'♦':'♥'):(diamond?'♣':'♠');
        return `<g transform="translate(${x},${cy}) rotate(${angle},34,203)"><rect width="68" height="116" rx="6" fill="${literal?'#e5e9dd':'#fffefa'}" stroke="#c5ceba"/><text x="6" y="17" fill="${color}" font-size="${joker?8:14}">${literal?'原文':joker?'JOKER':rank}</text><text x="6" y="37" fill="${color}" font-size="11">${showLetters?escape(c.char):'·'}</text><text x="6" y="49" fill="${color}" font-size="9">${c.number?String(c.number).padStart(2,'0'):literal?'原文':c.kind==='big'?'大王':'小王'}</text><text x="34" y="77" text-anchor="middle" fill="${color}" font-size="${joker?18:30}">${escape(suit)}</text><path d="M0 91H68" stroke="#e0e5d6"/><text x="7" y="108" fill="${color}" font-size="13">${showLetters||literal?escape(c.char):''}</text><text x="61" y="108" text-anchor="end" fill="#737f63" font-size="12">${c.number||''}</text></g>`;
      }).join('');
      return `${shapes}${windows>1?`<text x="480" y="${base+230}" text-anchor="middle" font-size="12" fill="#737f63">${page*HAND_WINDOW+1}–${page*HAND_WINDOW+chunk.length} / ${visible.length}</text>`:''}`;
    }).join('');
    const codesTop = top+78+textLines.length*23+windows*250;
    const codes = codeLines.map((line,i)=>`<text x="56" y="${codesTop+i*18}" font-size="12" fill="#737f63" xml:space="preserve">${escape(line)}</text>`).join('');
    return `<rect x="32" y="${top}" width="896" height="${height}" rx="12" fill="#eef1e7" stroke="#d8ddce"/>${heading}${text}${fans}${codes}`;
  }).join('');
  const height = y+40;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}" viewBox="0 0 960 ${height}" font-family="monospace"><rect width="100%" height="100%" fill="#f5f3ed"/><text x="32" y="43" font-size="24" fill="#202522" font-family="serif">豪密 · 一句话，一把牌</text><text x="32" y="72" font-size="13" fill="#737f63">红牌 1–13 = A–M / 黑牌 1–13 = N–Z / 大王 = 句号 / 小王 = 逗号</text>${panels}<text x="32" y="${height-20}" font-size="11" fill="#737f63">中文转无声调拼音 · 灰色为规则外原文标记 · 长句按顺序展示全部牌面</text></svg>`;
}
