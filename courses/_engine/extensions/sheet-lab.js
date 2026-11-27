// Extensión «sheet-lab»: laboratorio simulado de hoja de cálculo (nada toca Excel ni el ordenador real).
// Lo usa la extensión «classic» cuando course.yaml declara `look.lab_kind: sheet`. Funciona sin el Worker.
// Contiene el motor de fórmulas (sintaxis italiana: separador «;», coma decimal) y la interfaz táctil.
// Todo el texto del usuario se escapa con esc(); el estado guardado se valida en restore().

// ---------- referencias ----------
export const colName = (n) => String.fromCharCode(64 + n); // 1 → A
export const colNum = (s) => s.charCodeAt(0) - 64;
const REF = /^(\$?)([A-H])(\$?)(\d{1,3})$/;
export function parseRef(ref) {
  const m = REF.exec(ref);
  return m ? { c: colNum(m[2]), r: Number(m[4]), ac: m[1] === '$', ar: m[3] === '$' } : null;
}
export const refName = (c, r) => `${colName(c)}${r}`;

export class Err { constructor(code) { this.code = code; } toString() { return this.code; } }
const E = { div: new Err('#DIV/0!'), name: new Err('#NOME?'), value: new Err('#VALORE!'), ref: new Err('#RIF!'), na: new Err('#N/D') };

// ---------- análisis de la fórmula ----------
function tokenize(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ') { i++; continue; }
    let m;
    if (ch === '"') {
      let j = i + 1, s = '';
      while (j < src.length && !(src[j] === '"' && src[j + 1] !== '"')) { if (src[j] === '"') j++; s += src[j]; j++; }
      if (j >= src.length) throw E.value;
      out.push({ t: 'str', v: s }); i = j + 1; continue;
    }
    if ((m = /^\d+(?:[.,]\d+)?|^[.,]\d+/.exec(src.slice(i)))) { out.push({ t: 'num', v: Number(m[0].replace(',', '.')) }); i += m[0].length; continue; }
    if ((m = /^\$?[A-Za-z]{1,2}\$?\d{1,3}(?![A-Za-z0-9(])/.exec(src.slice(i)))) { out.push({ t: 'ref', v: m[0].toUpperCase() }); i += m[0].length; continue; }
    if ((m = /^[A-Za-z][A-Za-z0-9.]*(?=\()/.exec(src.slice(i)))) { out.push({ t: 'fn', v: m[0].toUpperCase() }); i += m[0].length; continue; }
    if ((m = /^(?:<>|>=|<=|[-+*/^&=<>():;%])/.exec(src.slice(i)))) { out.push({ t: 'op', v: m[0] }); i += m[0].length; continue; }
    throw E.name;
  }
  return out;
}
function parse(src) {
  const toks = tokenize(src); let p = 0;
  const peek = () => toks[p], isOp = (v) => toks[p]?.t === 'op' && toks[p].v === v;
  const bin = (next, ops) => () => {
    let l = next();
    while (toks[p]?.t === 'op' && ops.includes(toks[p].v)) { const op = toks[p++].v; l = { k: 'bin', op, l, r: next() }; }
    return l;
  };
  const primary = () => {
    const t = toks[p++];
    if (!t) throw E.value;
    if (t.t === 'num') return { k: 'lit', v: t.v };
    if (t.t === 'str') return { k: 'lit', v: t.v };
    if (t.t === 'ref') {
      if (isOp(':')) { p++; const b = toks[p++]; if (!b || b.t !== 'ref') throw E.ref; return { k: 'range', a: t.v, b: b.v }; }
      return { k: 'ref', v: t.v };
    }
    if (t.t === 'fn') {
      p++; // «(»
      const args = [];
      if (!isOp(')')) { for (;;) { args.push(expr()); if (isOp(';')) { p++; continue; } break; } }
      if (!isOp(')')) throw E.value;
      p++;
      return { k: 'fn', name: t.v, args };
    }
    if (t.t === 'op' && t.v === '(') { const e = expr(); if (!isOp(')')) throw E.value; p++; return e; }
    if (t.t === 'op' && (t.v === '-' || t.v === '+')) return { k: 'neg', s: t.v === '-' ? -1 : 1, e: unary() };
    throw E.value;
  };
  const postfix = () => { let e = primary(); while (isOp('%')) { p++; e = { k: 'pct', e }; } return e; };
  const unary = () => postfix();
  const power = bin(unary, ['^']), mul = bin(power, ['*', '/']), add = bin(mul, ['+', '-']), cat = bin(add, ['&']);
  const expr = bin(cat, ['=', '<>', '<', '>', '<=', '>=']);
  const tree = expr();
  if (p < toks.length) throw E.value;
  return tree;
}

// ---------- valores ----------
const NUM = /^\s*[-+]?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?\s*(%?)\s*$/;
export function parseNumber(text) {
  const m = NUM.exec(text);
  if (!m) return null;
  const n = Number(text.replace('%', '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? (m[1] ? n / 100 : n) : null;
}
export const isFormula = (raw) => typeof raw === 'string' && raw.startsWith('=') && raw.length > 1;

export function createSheet(cells = {}) { return { cells: { ...cells }, filter: null, flags: {} }; }

function rangeCells(a, b) {
  const x = parseRef(a), y = parseRef(b);
  if (!x || !y) throw E.ref;
  const out = [];
  for (let r = Math.min(x.r, y.r); r <= Math.max(x.r, y.r); r++) for (let c = Math.min(x.c, y.c); c <= Math.max(x.c, y.c); c++) out.push(refName(c, r));
  return out;
}
const num = (v) => (v instanceof Err ? v : typeof v === 'number' ? v : typeof v === 'boolean' ? Number(v) : v === '' || v == null ? 0 : parseNumber(String(v)) ?? E.value);
function matcher(crit) {
  if (typeof crit === 'number') return (v) => typeof v === 'number' && v === crit;
  const m = /^(<>|>=|<=|=|<|>)?(.*)$/.exec(String(crit));
  const op = m[1] || '=', want = m[2], n = parseNumber(want);
  const test = (cmp) => ({ '=': cmp === 0, '<>': cmp !== 0, '<': cmp < 0, '>': cmp > 0, '<=': cmp <= 0, '>=': cmp >= 0 }[op]);
  return (v) => {
    if (n !== null) return typeof v === 'number' ? test(v - n) : op === '<>';
    if (op !== '=' && op !== '<>') return false;
    const a = String(v).toLowerCase(), b = want.toLowerCase();
    return test(a === b ? 0 : 1);
  };
}

/** Valor calculado de una celda: número, texto, booleano o Err. */
export function valueOf(sheet, ref, stack = []) {
  const raw = sheet.cells[ref];
  if (raw === undefined || raw === '') return '';
  if (!isFormula(raw)) return parseNumber(raw) ?? raw;
  if (stack.includes(ref)) return E.ref;
  let tree;
  try { tree = parse(raw.slice(1)); } catch (e) { return e instanceof Err ? e : E.value; }
  const args = (list) => list.flatMap((a) => (a.k === 'range' ? rangeCells(a.a, a.b).map((c) => ({ v: valueOf(sheet, c, [...stack, ref]), cell: true })) : [{ v: ev(a), cell: false }]));
  const ev = (n) => {
    switch (n.k) {
      case 'lit': return n.v;
      case 'ref': { if (!parseRef(n.v)) return E.ref; const v = valueOf(sheet, n.v.replace(/\$/g, ''), [...stack, ref]); return v; }
      case 'range': return E.value;
      case 'neg': { const v = num(ev(n.e)); return v instanceof Err ? v : v * n.s; }
      case 'pct': { const v = num(ev(n.e)); return v instanceof Err ? v : v / 100; }
      case 'bin': {
        const a = ev(n.l), b = ev(n.r);
        if (a instanceof Err) return a;
        if (b instanceof Err) return b;
        if (n.op === '&') return `${a}${b}`.replace(/\./g, ',');
        if (['=', '<>', '<', '>', '<=', '>='].includes(n.op)) {
          const x = typeof a === 'string' && typeof b === 'string' ? a.toLowerCase() : a === '' ? 0 : a, y = typeof a === 'string' && typeof b === 'string' ? b.toLowerCase() : b === '' ? 0 : b;
          return { '=': x === y, '<>': x !== y, '<': x < y, '>': x > y, '<=': x <= y, '>=': x >= y }[n.op];
        }
        const x = num(a), y = num(b);
        if (x instanceof Err) return x;
        if (y instanceof Err) return y;
        if (n.op === '/') return y === 0 ? E.div : x / y;
        return { '+': x + y, '-': x - y, '*': x * y, '^': x ** y }[n.op];
      }
      case 'fn': return call(n);
    }
    return E.value;
  };
  const numbers = (list) => { const all = args(list); const err = all.find((a) => a.v instanceof Err); if (err) return err.v; return all.filter((a) => typeof a.v === 'number' || (!a.cell && num(a.v) === a.v)).map((a) => Number(a.v)); };
  const call = (n) => {
    const a = n.args;
    switch (n.name) {
      case 'SOMMA': { const v = numbers(a); return v instanceof Err ? v : v.reduce((s, x) => s + x, 0); }
      case 'MEDIA': { const v = numbers(a); return v instanceof Err ? v : v.length ? v.reduce((s, x) => s + x, 0) / v.length : E.div; }
      case 'MIN': { const v = numbers(a); return v instanceof Err ? v : v.length ? Math.min(...v) : 0; }
      case 'MAX': { const v = numbers(a); return v instanceof Err ? v : v.length ? Math.max(...v) : 0; }
      case 'CONTA.NUMERI': { const v = args(a); return v.filter((x) => typeof x.v === 'number').length; }
      case 'CONTA.VALORI': { const v = args(a); return v.filter((x) => x.v !== '').length; }
      case 'ARROTONDA': {
        if (a.length !== 2) return E.value;
        const x = num(ev(a[0])), d = num(ev(a[1]));
        if (x instanceof Err) return x;
        if (d instanceof Err) return d;
        const k = 10 ** d; return Math.round((x + Number.EPSILON) * k) / k;
      }
      case 'SE': {
        if (a.length < 2 || a.length > 3) return E.value;
        const c = ev(a[0]);
        if (c instanceof Err) return c;
        return c ? ev(a[1]) : a[2] ? ev(a[2]) : false;
      }
      case 'SE.ERRORE': { if (a.length !== 2) return E.value; const v = ev(a[0]); return v instanceof Err ? ev(a[1]) : v; }
      case 'CONTA.SE': {
        if (a.length !== 2 || a[0].k !== 'range') return E.value;
        const ok = matcher(ev(a[1])); return rangeCells(a[0].a, a[0].b).filter((c) => ok(valueOf(sheet, c, [...stack, ref]))).length;
      }
      case 'SOMMA.SE': {
        if (a.length < 2 || a.length > 3 || a[0].k !== 'range') return E.value;
        const ok = matcher(ev(a[1])), crit = rangeCells(a[0].a, a[0].b);
        const sum = a[2] ? (a[2].k === 'range' ? rangeCells(a[2].a, a[2].b) : null) : crit;
        if (!sum) return E.value;
        return crit.reduce((s, c, i) => { const v = valueOf(sheet, sum[i], [...stack, ref]); return ok(valueOf(sheet, c, [...stack, ref])) && typeof v === 'number' ? s + v : s; }, 0);
      }
      case 'E': { const v = a.map(ev); return v.find((x) => x instanceof Err) ?? v.every(Boolean); }
      case 'O': { const v = a.map(ev); return v.find((x) => x instanceof Err) ?? v.some(Boolean); }
      default: return E.name;
    }
  };
  const result = ev(tree);
  return result === undefined ? '' : result;
}

// ---------- visualización ----------
const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export function formatNumber(n, fmt) {
  if (fmt === 'pct') return `${formatNumber(Math.round(n * 1e6) / 1e4)}%`;
  const neg = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (fmt === 'eur') { const [i, d] = abs.toFixed(2).split('.'); return `${neg}${group(i)},${d} €`; }
  const [i, d] = String(Math.round(abs * 1e6) / 1e6).split('.');
  return `${neg}${group(i)}${d ? ',' + d : ''}`;
}
export function display(sheet, ref, fmt) {
  const v = valueOf(sheet, ref);
  if (v instanceof Err) return v.code;
  if (typeof v === 'number') return formatNumber(v, fmt);
  if (typeof v === 'boolean') return v ? 'VERO' : 'FALSO';
  return String(v);
}

// ---------- operaciones ----------
/** Copia la fórmula de `from` en las filas siguientes hasta `toRow`, ajustando las referencias relativas. */
export function fillDown(sheet, from, toRow) {
  const src = parseRef(from), raw = sheet.cells[from];
  if (!src || raw === undefined || raw === '') throw new Error('Seleziona prima una cella con una formula.');
  if (toRow <= src.r) throw new Error('Sotto questa cella non ci sono altre righe da riempire.');
  for (let r = src.r + 1; r <= toRow; r++) {
    sheet.cells[refName(src.c, r)] = isFormula(raw)
      ? raw.split(/("(?:[^"]|"")*")/).map((part, i) => (i % 2 ? part : part.replace(/(\$?)([A-Ha-h])(\$?)(\d{1,3})(?![A-Za-z0-9(])/g, (m, ac, c, ar, row) => (ar ? m : `${ac}${c.toUpperCase()}${Number(row) + (r - src.r)}`)))).join('')
      : raw;
  }
}
export function sortRows(sheet, area, col, desc) {
  const rows = [];
  for (let r = area.top; r <= area.bottom; r++) rows.push(Object.fromEntries(Array.from({ length: area.right }, (_, i) => [i + 1, sheet.cells[refName(i + 1, r)]])));
  const key = (row) => { const v = row[col]; return v === undefined || v === '' ? null : parseNumber(String(v)) ?? String(v).toLowerCase(); };
  rows.sort((x, y) => { const a = key(x), b = key(y); if (a === b) return 0; if (a === null) return 1; if (b === null) return -1; return (a < b ? -1 : 1) * (desc ? -1 : 1); });
  rows.forEach((row, i) => { for (let c = 1; c <= area.right; c++) { const ref = refName(c, area.top + i); if (row[c] === undefined) delete sheet.cells[ref]; else sheet.cells[ref] = row[c]; } });
  sheet.flags.sorted = { col, desc };
}

// ---------- esercizi ----------
const val = (s, r) => valueOf(s, r);
const near = (a, b) => typeof a === 'number' && Math.abs(a - b) < 1e-6;
const fx = (s, r) => isFormula(s.cells[r]);
export const EXERCISES = [
  {
    id: 'forniture', lesson: 2, title: 'Il totale delle forniture', file: 'Forniture_ufficio.xlsx',
    intro: 'Calcola il valore di ogni articolo e il totale. Cambia un numero e guarda come si aggiorna tutto.',
    cols: 4, rows: 6, fmt: { C: 'eur', D: 'eur' }, fillTo: 5,
    cells: { A1: 'Articolo', B1: 'Quantità', C1: 'Prezzo', D1: 'Valore', A2: 'Guanti', B2: '120', C2: '0,08', A3: 'Siringhe', B3: '200', C3: '0,11', A4: 'Garze', B4: '85', C4: '0,15', A5: 'Cerotti', B5: '60', C5: '0,20', A6: 'Totale' },
    tasks: [
      { title: 'Calcola il valore dei guanti', help: 'Seleziona D2, scrivi =B2*C2 nella barra della formula e premi Invio.', done: (s) => fx(s, 'D2') && near(val(s, 'D2'), 9.6) },
      { title: 'Copia la formula verso il basso', help: 'Seleziona D2 e premi «Trascina giù»: la formula si adatta a ogni riga.', done: (s) => [3, 4, 5].every((r) => fx(s, `D${r}`)) && near(val(s, 'D3'), 22) && near(val(s, 'D5'), 12) },
      { title: 'Calcola il totale', help: 'In D6 scrivi =SOMMA(D2:D5) e premi Invio.', done: (s) => fx(s, 'D6') && near(val(s, 'D6'), 56.35) },
    ],
    success: 'Totale 56,35 €. Ora cambia una quantità: il totale si aggiorna da solo.',
  },
  {
    id: 'iva', lesson: 2, title: 'L’IVA e il simbolo $', file: 'Prospetto_acquisto.xlsx',
    intro: 'L’aliquota IVA sta in una sola cella (G1). Il simbolo $ la tiene ferma quando copi la formula.',
    cols: 7, rows: 5, fmt: { B: 'eur', C: 'eur', D: 'eur', G: 'pct' }, fillTo: 5,
    cells: { A1: 'Voce', B1: 'Imponibile', C1: 'IVA', D1: 'Totale', F1: 'Aliquota', G1: '22%', A2: 'Carta', B2: '120', A3: 'Toner', B3: '340', A4: 'Cancelleria', B4: '85,5', A5: 'Pulizie', B5: '210' },
    tasks: [
      { title: 'Calcola l’IVA della prima riga', help: 'In C2 scrivi =B2*$G$1 e premi Invio. Il $ blocca la cella G1.', done: (s) => /\$G\$1/.test(s.cells.C2 ?? '') && near(val(s, 'C2'), 26.4) },
      { title: 'Copia la formula verso il basso', help: 'Seleziona C2 e premi «Trascina giù». G1 resta ferma, B cambia riga.', done: (s) => [3, 4, 5].every((r) => /\$G\$1/.test(s.cells[`C${r}`] ?? '')) && near(val(s, 'C5'), 46.2) },
      { title: 'Calcola il totale di ogni riga', help: 'In D2 scrivi =B2+C2, poi premi «Trascina giù».', done: (s) => [2, 3, 4, 5].every((r) => fx(s, `D${r}`)) && near(val(s, 'D2'), 146.4) && near(val(s, 'D5'), 256.2) },
    ],
    success: 'Prova a cambiare G1 in 10%: tutte le righe si aggiornano insieme.',
  },
  {
    id: 'ordina', lesson: 3, title: 'Ordinare e filtrare un elenco', file: 'Inventario.xlsx',
    intro: 'Metti in ordine un piccolo elenco e mostra solo le righe che ti servono.',
    cols: 4, rows: 9, fmt: { C: 'eur' }, area: { top: 2, bottom: 9, right: 4 },
    cells: { A1: 'Ufficio', B1: 'Bene', C1: 'Valore', D1: 'Stato', A2: 'Economato', B2: 'Scrivania', C2: '250', D2: 'In uso', A3: 'Personale', B3: 'Armadio', C3: '180', D3: 'In uso', A4: 'Acquisti', B4: 'Stampante', C4: '420', D4: 'Da riparare', A5: 'Economato', B5: 'Monitor', C5: '160', D5: 'In uso', A6: 'Acquisti', B6: 'Scanner', C6: '310', D6: 'In uso', A7: 'Personale', B7: 'Sedia', C7: '90', D7: 'Da riparare', A8: 'Economato', B8: 'Proiettore', C8: '540', D8: 'In uso', A9: 'Acquisti', B9: 'Telefono', C9: '75', D9: 'In uso' },
    tasks: [
      { title: 'Ordina dal valore più alto', help: 'Seleziona una cella della colonna C e premi «Dal più grande».', done: (s) => s.flags.sorted?.col === 3 && s.flags.sorted.desc && near(val(s, 'C2'), 540) && near(val(s, 'C9'), 75) },
      { title: 'Mostra solo l’Economato', help: 'Seleziona una cella con «Economato» nella colonna A e premi «Filtra».', done: (s) => s.flags.filtered === true },
      { title: 'Togli il filtro', help: 'Premi «Togli filtro»: tornano tutte le righe.', done: (s) => s.flags.filtered === true && s.filter === null },
    ],
    success: 'Ordinare e filtrare non cancella nulla: i dati restano tutti nel foglio.',
  },
  {
    id: 'se', lesson: 4, title: 'La funzione SE', file: 'Procedure.xlsx',
    intro: 'Fai decidere al foglio: sopra 1.000 € serve una gara, altrimenti è sotto soglia.',
    cols: 6, rows: 7, fmt: { B: 'eur' }, fillTo: 7,
    cells: { A1: 'Fornitore', B1: 'Importo', C1: 'Procedura', E1: 'Gare', A2: 'Rossi srl', B2: '800', A3: 'Verdi spa', B3: '1500', A4: 'Bianchi', B4: '450', A5: 'Neri sas', B5: '2300', A6: 'Gialli', B6: '990', A7: 'Azzurri', B7: '1000' },
    tasks: [
      { title: 'Scrivi la regola nella prima riga', help: 'In C2 scrivi =SE(B2>1000;"Gara";"Sotto soglia") e premi Invio.', done: (s) => /^=SE\(/i.test(s.cells.C2 ?? '') && val(s, 'C2') === 'Sotto soglia' },
      { title: 'Copia la regola verso il basso', help: 'Seleziona C2 e premi «Trascina giù».', done: (s) => [3, 4, 5, 6, 7].every((r) => fx(s, `C${r}`)) && val(s, 'C3') === 'Gara' && val(s, 'C7') === 'Sotto soglia' },
      { title: 'Conta le gare', help: 'In F1 scrivi =CONTA.SE(C2:C7;"Gara") e premi Invio.', done: (s) => /CONTA\.SE/i.test(s.cells.F1 ?? '') && near(val(s, 'F1'), 2) },
    ],
    success: '1.000 € esatti non superano la soglia: «>» significa «maggiore di», senza uguale.',
  },
  {
    id: 'somma-se', lesson: 4, title: 'Il totale per fornitore', file: 'Ordini.xlsx',
    intro: 'Somma solo gli importi di un fornitore, senza filtrare e senza fare i conti a mano.',
    cols: 5, rows: 7, fmt: { B: 'eur', E: 'eur' }, fillTo: 4,
    cells: { A1: 'Fornitore', B1: 'Importo', D1: 'Fornitore', E1: 'Totale', A2: 'Rossi srl', B2: '1200', A3: 'Verdi spa', B3: '450', A4: 'Rossi srl', B4: '300', A5: 'Bianchi', B5: '800', A6: 'Verdi spa', B6: '150', A7: 'Rossi srl', B7: '90', D2: 'Rossi srl', D3: 'Verdi spa', D4: 'Bianchi' },
    tasks: [
      { title: 'Calcola il totale di Rossi srl', help: 'In E2 scrivi =SOMMA.SE($A$2:$A$7;D2;$B$2:$B$7) e premi Invio.', done: (s) => /SOMMA\.SE/i.test(s.cells.E2 ?? '') && near(val(s, 'E2'), 1590) },
      { title: 'Copia la formula per gli altri fornitori', help: 'Seleziona E2 e premi «Trascina giù»: D cambia riga, gli intervalli con $ restano fermi.', done: (s) => near(val(s, 'E3'), 600) && near(val(s, 'E4'), 800) },
    ],
    success: 'I $ bloccano gli intervalli. Senza $, copiando la formula gli intervalli scivolerebbero in basso e i totali sarebbero sbagliati.',
  },
];

// ---------- stato ----------
const CELL_KEY = /^[A-H]\d{1,3}$/;
export function newState() { return { version: 1, ex: 0, selected: 'A1', sheets: {} }; }
export function restore(value) {
  const st = newState();
  if (!value || value.version !== 1 || typeof value.sheets !== 'object' || !value.sheets) return st;
  if (Number.isInteger(value.ex) && value.ex >= 0 && value.ex < EXERCISES.length) st.ex = value.ex;
  for (const ex of EXERCISES) {
    const saved = value.sheets[ex.id];
    if (!saved || typeof saved.cells !== 'object' || !saved.cells) continue;
    const cells = {};
    for (const [k, v] of Object.entries(saved.cells)) if (CELL_KEY.test(k) && typeof v === 'string' && v.length <= 200) cells[k] = v;
    const sheet = createSheet(cells);
    sheet.flags = { filtered: saved.flags?.filtered === true };
    const so = saved.flags?.sorted;
    if (so && Number.isInteger(so.col) && so.col >= 1 && so.col <= 8) sheet.flags.sorted = { col: so.col, desc: so.desc === true };
    const f = saved.filter;
    if (f && Number.isInteger(f.col) && f.col >= 1 && f.col <= 8 && typeof f.value === 'string') sheet.filter = { col: f.col, value: f.value.slice(0, 60) };
    st.sheets[ex.id] = sheet;
  }
  return st;
}
export const sheetOf = (st, ex) => (st.sheets[ex.id] ??= createSheet(ex.cells));
export const taskStatus = (ex, sheet) => ex.tasks.map((t) => ({ title: t.title, help: t.help, done: Boolean(t.done(sheet)) }));

// ---------- interfaz ----------
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICON = { back: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6 6-6-6 6-6"/></svg>' };

function gridHtml(ex, sheet, st) {
  const colsOn = Array.from({ length: ex.cols }, (_, i) => colName(i + 1));
  const hidden = (r) => r > 1 && sheet.filter && display(sheet, refName(sheet.filter.col, r)) !== sheet.filter.value;
  const head = `<tr><th class="corner" scope="col"><span class="sr-only">Cella</span></th>${colsOn.map((c) => `<th scope="col">${c}</th>`).join('')}</tr>`;
  const rows = [];
  for (let r = 1; r <= ex.rows; r++) {
    if (hidden(r)) continue;
    rows.push(`<tr><th scope="row">${r}</th>${colsOn.map((c) => {
      const ref = `${c}${r}`, raw = sheet.cells[ref] ?? '', v = valueOf(sheet, ref);
      const cls = ['cell', ref === st.selected ? 'sel' : '', r === 1 && raw !== '' ? 'hd' : '', typeof v === 'number' ? 'num' : '', v instanceof Err ? 'err' : ''].filter(Boolean).join(' ');
      return `<td class="${cls}" data-cell="${ref}" tabindex="${ref === st.selected ? 0 : -1}" aria-label="${ref}${raw ? ': ' + esc(display(sheet, ref, r > 1 ? ex.fmt?.[c] : undefined)) : ', vuota'}">${esc(raw === '' ? '' : display(sheet, ref, r > 1 ? ex.fmt?.[c] : undefined))}</td>`;
    }).join('')}</tr>`);
  }
  return `<table class="sheet-grid" aria-label="Foglio di calcolo simulato">${head}${rows.join('')}</table>`;
}

/** Monta il laboratorio dentro `root`. `storage` ofrece get(key, fallback) y set(key, value). */
export function mountSheetLab(root, { storage, key, backHref = '#home', icon = ICON }) {
  let st = restore(storage.get(key, null));
  let message = '';
  const save = () => storage.set(key, st);
  const ex = () => EXERCISES[st.ex];
  const sheet = () => sheetOf(st, ex());
  const raw = () => sheet().cells[st.selected] ?? '';

  const render = () => {
    const e = ex(), s = sheet(), tasks = taskStatus(e, s), next = tasks.findIndex((t) => !t.done), count = tasks.filter((t) => t.done).length;
    root.innerHTML = `<a class="breadcrumb" href="${esc(backHref)}">${icon.back} Torna al corso</a>
<div class="lab-heading"><div><p class="eyebrow">LABORATORIO EXCEL</p><h1>Prova con<br>il foglio di calcolo.</h1><p class="intro">Un foglio simulato: puoi scrivere, sbagliare e ricominciare. I tuoi file non vengono toccati.</p></div></div>
<nav class="sheet-steps" aria-label="Esercizi">${EXERCISES.map((x, i) => `<button type="button" data-ex="${i}" class="${i === st.ex ? 'active' : ''}" aria-pressed="${i === st.ex}"><small>Incontro ${x.lesson}</small>${esc(x.title)}${taskStatus(x, sheetOf(st, x)).every((t) => t.done) ? ' ✓' : ''}</button>`).join('')}</nav>
<div class="lab-layout guided-mode"><section class="lab-task-panel"><h2>${esc(e.title)}</h2><p>${esc(e.intro)}</p><ol>${tasks.map((t, i) => `<li class="${t.done ? 'done' : next === i ? 'current' : ''}"><span>${t.done ? '✓' : i + 1}</span><div><strong>${esc(t.title)}</strong>${next === i ? `<p>${esc(t.help)}</p>` : ''}</div></li>`).join('')}</ol><p class="lab-count">${count} di ${tasks.length} passaggi completati</p>${count === tasks.length ? `<div class="lab-success" role="status">Esercizio completato! ${esc(e.success)}</div>` : ''}<button class="btn btn-quiet" type="button" data-act="reset">Ricomincia l’esercizio</button></section>
<section class="lab-workspace sheet-workspace" aria-label="Foglio di calcolo simulato"><div class="lab-window-bar"><span>${esc(e.file)} – Excel (simulato)</span><span class="window-decoration" aria-hidden="true">● ● ●</span></div>
<form class="formula-bar" id="formula-form" autocomplete="off"><output class="name-box" id="name-box" aria-label="Cella selezionata">${st.selected}</output><span class="fx" aria-hidden="true">fx</span><input id="formula-input" name="f" type="text" inputmode="text" maxlength="200" spellcheck="false" autocapitalize="off" aria-label="Contenuto della cella ${st.selected}" value="${esc(raw())}"><button class="btn btn-primary" type="submit" aria-label="Conferma">✓</button><button class="btn btn-secondary" type="button" data-act="cancel" aria-label="Annulla modifica">✕</button></form>
<div class="lab-toolbar" role="toolbar" aria-label="Strumenti">${e.fillTo ? '<button type="button" data-act="fill">Trascina giù</button>' : ''}${e.area ? '<button type="button" data-act="asc">Dal più piccolo</button><button type="button" data-act="desc">Dal più grande</button><button type="button" data-act="filter">Filtra</button><button type="button" data-act="unfilter">Togli filtro</button>' : ''}</div>
<div class="sheet-scroll">${gridHtml(e, s, st)}</div>
<p class="lab-message" id="sheet-message" role="status">${esc(message)}</p><p class="lab-device-tip">Tocca una cella, scrivi nella barra della formula e premi Invio o ✓. Le formule iniziano con =, gli argomenti si separano con il punto e virgola.</p></section></div>`;
  };

  const select = (ref) => {
    const prev = root.querySelector('td.sel');
    prev?.classList.remove('sel'); prev?.setAttribute('tabindex', '-1');
    st.selected = ref; save();
    const td = root.querySelector(`[data-cell="${ref}"]`);
    td?.classList.add('sel'); td?.setAttribute('tabindex', '0');
    root.querySelector('#name-box').textContent = ref;
    const input = root.querySelector('#formula-input');
    input.value = raw(); input.setAttribute('aria-label', `Contenuto della cella ${ref}`);
    return td;
  };
  const say = (text) => { message = text; const el = root.querySelector('#sheet-message'); if (el) el.textContent = text; };
  const commit = () => {
    const text = root.querySelector('#formula-input').value.trim();
    const s = sheet();
    if (text === '') delete s.cells[st.selected]; else s.cells[st.selected] = text.length > 200 ? text.slice(0, 200) : text;
    const sp = parseRef(st.selected), shown = display(s, st.selected, sp.r > 1 ? ex().fmt?.[colName(sp.c)] : undefined);
    message = isFormula(text) ? (valueOf(s, st.selected) instanceof Err ? `Excel mostra ${shown}: controlla la formula (maiuscole, parentesi, punto e virgola).` : `Risultato in ${st.selected}: ${shown}`) : '';
    save(); render();
    root.querySelector(`[data-cell="${st.selected}"]`)?.focus({ preventScroll: true });
  };
  const act = (name) => {
    const e = ex(), s = sheet();
    try {
      if (name === 'reset') { delete st.sheets[e.id]; message = ''; }
      else if (name === 'cancel') { root.querySelector('#formula-input').value = raw(); return; }
      else if (name === 'fill') { fillDown(s, st.selected, e.fillTo); message = 'Formula copiata verso il basso.'; }
      else if (name === 'asc' || name === 'desc') { const c = parseRef(st.selected).c; sortRows(s, e.area, c, name === 'desc'); message = 'Elenco ordinato.'; }
      else if (name === 'filter') {
        const p = parseRef(st.selected);
        if (p.r < 2 || !s.cells[st.selected]) throw new Error('Seleziona una cella con un valore sotto l’intestazione.');
        s.filter = { col: p.c, value: display(s, st.selected) }; s.flags.filtered = true; message = `Vedi solo le righe con «${s.filter.value}». Le altre sono nascoste, non cancellate.`;
      } else if (name === 'unfilter') { s.filter = null; message = 'Tutte le righe sono visibili.'; }
    } catch (err) { message = err.message; }
    save(); render();
  };

  root.addEventListener('click', (ev) => {
    const cell = ev.target.closest('[data-cell]');
    if (cell) { select(cell.dataset.cell); cell.focus({ preventScroll: true }); return; }
    const step = ev.target.closest('[data-ex]');
    if (step) { st.ex = Number(step.dataset.ex); st.selected = 'A1'; message = ''; save(); render(); return; }
    const btn = ev.target.closest('[data-act]');
    if (btn) act(btn.dataset.act);
  });
  root.addEventListener('submit', (ev) => { if (ev.target.id === 'formula-form') { ev.preventDefault(); commit(); } });
  root.addEventListener('keydown', (ev) => {
    if (ev.target.id === 'formula-input') { if (ev.key === 'Escape') act('cancel'); return; }
    const cell = ev.target.closest?.('[data-cell]');
    if (!cell) return;
    const p = parseRef(cell.dataset.cell), e = ex();
    const move = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[ev.key];
    if (move) {
      ev.preventDefault();
      const c = Math.min(e.cols, Math.max(1, p.c + move[0])), r = Math.min(e.rows, Math.max(1, p.r + move[1]));
      select(refName(c, r))?.focus({ preventScroll: true });
    } else if (ev.key === 'Enter' || ev.key === 'F2') { ev.preventDefault(); const i = root.querySelector('#formula-input'); i.focus(); i.select(); }
  });
  render();
  return { state: () => st, exercise: ex, say };
}
