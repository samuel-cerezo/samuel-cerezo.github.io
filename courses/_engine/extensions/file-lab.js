// Extensión «file-lab»: laboratorio simulado de archivos y carpetas (nada toca el ordenador real).
// Ruta: #laboratorio. Funciona también si el Worker no responde. Texto en italiano.
// Migra el estado del curso antiguo (localStorage «ppd-lab»).
const ID_RE = /^[A-Za-z0-9-]{1,40}$/;

export function newLab() {
  return { version: 1, location: null, selected: null, clipboard: null, visitedDocuments: false, nextId: 1, nodes: [
    { id: 'documents', name: 'Documenti', kind: 'folder', parent: null },
    { id: 'notes', name: 'Note.txt', kind: 'file', parent: 'documents', text: 'Mercoledì partecipo al corso PC.\nVoglio imparare a organizzare i miei documenti.' },
  ] };
}
const node = (s, id) => {
  const n = s.nodes.find((x) => x.id === id);
  if (!n) throw new Error('Seleziona un elemento dell’esercitazione.');
  return n;
};
function validName(s, name, parent, exclude) {
  name = String(name).trim();
  if (!name || name.length > 60 || /[<>:"/\\|?*\x00-\x1f]/.test(name) || /[. ]$/.test(name)) throw new Error('Scegli un nome breve, senza barre o caratteri speciali.');
  if (s.nodes.some((n) => n.id !== exclude && n.parent === parent && n.name.toLowerCase() === name.toLowerCase())) throw new Error('In questa cartella esiste già un elemento con questo nome. Scegline un altro.');
  return name;
}
export function openFolder(s, id) {
  const n = node(s, id);
  if (n.kind !== 'folder') throw new Error('Questo elemento è un documento.');
  s.location = id; s.selected = null;
  if (id === 'documents') s.visitedDocuments = true;
}
export function goUp(s) { if (s.location !== null) { s.location = node(s, s.location).parent; s.selected = null; } }
export function addFolder(s, name) {
  const clean = validName(s, name, s.location);
  const id = 'folder-' + s.nextId++;
  s.nodes.push({ id, name: clean, kind: 'folder', parent: s.location });
  s.selected = id;
}
export function rename(s, id, name) {
  const n = node(s, id);
  if (id === 'documents') throw new Error('Per questa attività manteniamo la cartella Documenti.');
  n.name = validName(s, name, n.parent, id);
}
export function cut(s, id) {
  if (id === 'documents') throw new Error('Scegli il documento da spostare.');
  node(s, id); s.clipboard = id;
}
export function paste(s) {
  if (!s.clipboard) throw new Error('Seleziona un elemento e premi prima Taglia.');
  const n = node(s, s.clipboard);
  if (n.parent === s.location) throw new Error('Sei ancora nella cartella di partenza. Apri la cartella di destinazione, poi premi Incolla.');
  let ancestor = s.location;
  while (ancestor !== null) {
    if (ancestor === n.id) throw new Error('Una cartella non può essere spostata dentro sé stessa.');
    ancestor = node(s, ancestor).parent;
  }
  validName(s, n.name, s.location, n.id);
  n.parent = s.location; s.selected = n.id; s.clipboard = null;
}
export function tasks(s) {
  const folder = s.nodes.find((n) => n.kind === 'folder' && n.parent === 'documents' && n.name.toLowerCase() === 'corso pc');
  const file = s.nodes.find((n) => n.id === 'notes');
  return [
    { done: s.visitedDocuments, title: 'Apri Documenti', help: 'Seleziona la cartella Documenti e premi Apri. Dal PC puoi anche fare doppio clic.' },
    { done: !!folder, title: 'Crea la cartella Corso PC', help: 'Dentro Documenti premi Nuova cartella, scrivi Corso PC e conferma.' },
    { done: file?.name === 'Promemoria.txt', title: 'Rinomina Note.txt', help: 'Seleziona Note.txt, premi Rinomina e scrivi Promemoria.txt.' },
    { done: !!folder && file?.parent === folder.id, title: 'Sposta il documento nella cartella', help: 'Seleziona il documento, premi Taglia, apri Corso PC e premi Incolla.' },
  ];
}
// Acepta solo la forma acotada que crea este ejercicio, nunca datos arbitrarios.
export function restoreLab(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.nodes) || value.nodes.length > 100) return newLab();
  const s = structuredClone(value);
  if (!s.nodes.some((n) => n.id === 'documents' && n.kind === 'folder' && n.parent === null) || !s.nodes.some((n) => n.id === 'notes' && n.kind === 'file')) return newLab();
  const ids = new Set(s.nodes.map((n) => n.id));
  if (ids.size !== s.nodes.length || !Number.isInteger(s.nextId) || s.nextId < 1) return newLab();
  for (const n of s.nodes) {
    if (typeof n.id !== 'string' || !ID_RE.test(n.id) || typeof n.name !== 'string' || !['file', 'folder'].includes(n.kind) || (n.parent !== null && !s.nodes.some((p) => p.id === n.parent && p.kind === 'folder'))) return newLab();
    let p = n.parent;
    const seen = new Set([n.id]);
    while (p !== null) {
      if (seen.has(p)) return newLab();
      seen.add(p); p = s.nodes.find((k) => k.id === p).parent;
    }
  }
  if (s.location !== null && !s.nodes.some((n) => n.id === s.location && n.kind === 'folder')) s.location = null;
  if (s.selected && !ids.has(s.selected)) s.selected = null;
  if (s.clipboard && !ids.has(s.clipboard)) s.clipboard = null;
  return s;
}

// ---------- interfaz ----------
let key, lab, form = null, message = '', preview = null;
const load = (api) => {
  key = `pdf2course:${api.slug}:lab`;
  const saved = api.store.get(key, null) ?? api.store.get('ppd-lab', null);
  lab = restoreLab(saved);
};

export function init(api) { load(api); }

export function navLinks(api) {
  return api.h('a', { href: '#laboratorio', class: 'nav-link', 'aria-current': location.hash === '#laboratorio' ? 'page' : null }, 'Laboratorio PC');
}
export function offlineLinks(api) {
  return api.h('a', { class: 'btn btn-primary', href: '#laboratorio' }, 'Intanto puoi esercitarti nel laboratorio PC');
}

export function route(hash, api) {
  if (hash !== 'laboratorio') return null;
  if (!lab) load(api);
  return view(api);
}

function view(api) {
  const { h } = api;
  const act = (fn) => () => {
    try { message = ''; fn(); } catch (e) { message = e.message; }
    api.store.set(key, lab);
    api.refresh();
  };
  const items = lab.nodes.filter((n) => n.parent === lab.location);
  const selected = lab.nodes.find((n) => n.id === lab.selected);
  const where = lab.location === null ? 'Questo PC' : lab.nodes.find((n) => n.id === lab.location)?.name;
  const list = tasks(lab);
  const next = list.findIndex((x) => !x.done);
  const open = () => {
    if (!selected) throw new Error('Seleziona prima un elemento.');
    if (selected.kind === 'folder') { openFolder(lab, selected.id); preview = null; } else preview = selected.id;
    form = null;
  };
  const btn = (label, fn, disabled = false) => h('button', { type: 'button', class: 'btn lab-btn', disabled, onclick: act(fn) }, label);
  const previewNode = preview && lab.nodes.find((n) => n.id === preview);
  return h('article', { class: 'lab' },
    h('p', { class: 'eyebrow' }, 'LABORATORIO PC'),
    h('h1', {}, 'Prova con file e cartelle'),
    h('p', { class: 'lead' }, 'Un ambiente di esercitazione: i documenti qui sotto sono simulati e restano solo su questo dispositivo. Non puoi rovinare nulla.'),
    h('ol', { class: 'lab-tasks' }, list.map((x, i) => h('li', { class: x.done ? 'is-done' : i === next ? 'is-next' : '' },
      h('strong', {}, `${x.done ? '✓ ' : ''}${x.title}`), i === next ? h('span', { class: 'lab-help' }, ` — ${x.help}`) : null))),
    h('p', { class: 'lab-where' }, `Sei in: ${where}`),
    h('div', { class: 'lab-bar', role: 'toolbar', 'aria-label': 'Azioni' },
      btn('Su', () => { goUp(lab); preview = null; }, lab.location === null),
      btn('Documenti', () => { openFolder(lab, 'documents'); preview = null; }),
      btn('Apri', open, !selected),
      btn('Nuova cartella', () => { form = 'new'; }, lab.location === null),
      btn('Rinomina', () => { form = 'rename'; }, !selected || selected.id === 'documents'),
      btn('Taglia', () => { cut(lab, lab.selected); message = 'Documento pronto da spostare. Apri la cartella di destinazione e premi Incolla.'; }, !selected || selected.id === 'documents'),
      btn('Incolla', () => { paste(lab); message = 'Documento spostato nella cartella che hai aperto.'; }, !lab.clipboard),
      btn('Ricomincia', () => { lab = newLab(); form = null; preview = null; })),
    form ? h('form', { class: 'lab-form', onsubmit: (e) => {
      e.preventDefault();
      const name = new FormData(e.currentTarget).get('name');
      act(() => { if (form === 'new') addFolder(lab, name); else rename(lab, lab.selected, name); form = null; message = 'Operazione completata. Osserva il nome nell’elenco.'; })();
    } },
      h('label', { for: 'lab-name' }, form === 'new' ? 'Nome della nuova cartella' : 'Nuovo nome'),
      h('input', { id: 'lab-name', name: 'name', type: 'text', maxlength: '60', required: true, autocomplete: 'off', value: form === 'rename' ? selected?.name : '' }),
      h('button', { type: 'submit', class: 'btn btn-primary' }, 'Conferma'),
      btn('Annulla', () => { form = null; })) : null,
    message ? h('p', { class: 'notice', role: 'status' }, message) : null,
    h('ul', { class: 'lab-items', 'aria-label': 'Elementi' }, items.length ? items.map((n) => h('li', {},
      h('button', { type: 'button', class: `lab-item${n.id === lab.selected ? ' is-selected' : ''}${n.id === lab.clipboard ? ' is-cut' : ''}`, 'aria-pressed': String(n.id === lab.selected),
        onclick: act(() => { lab.selected = n.id; }),
        ondblclick: act(open) }, h('span', { 'aria-hidden': 'true' }, n.kind === 'folder' ? '📁 ' : '📄 '), n.name))) : h('li', { class: 'lab-empty' }, 'Questa cartella è vuota.')),
    previewNode ? h('section', { class: 'lab-preview' }, h('h2', {}, previewNode.name), h('pre', {}, previewNode.text ?? ''), btn('Chiudi', () => { preview = null; })) : null,
    h('a', { class: 'btn', href: '#home' }, '← Torna al corso'));
}
