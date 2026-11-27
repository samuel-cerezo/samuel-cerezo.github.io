// Extensión «classic»: página completa con el diseño del curso original «Primi passi digitali»
// (barra lateral con logos, hoja de ruta por colores, pestañas de lección, laboratorio, ayuda).
// Los textos propios del curso vienen de `look` en course.yaml. Contenido siempre escapado con esc().
// Generado a partir del frontend antiguo; el estado del laboratorio y del promemoria se guarda en este dispositivo.
const V = new URL(import.meta.url).search; // ?v= del motor (evita cachés antiguas)
const { mountSheetLab } = await import(`./sheet-lab.js${V}`);
const { newLab, openFolder, addFolder, rename, cut, paste, tasks, restoreLab, goUp } = await import(`./file-lab.js${V}`);

const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  computer: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8m-4-5v5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1 .7-1.7 1-1.7 2.7m0 3h.01"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5ZM20 2v4m-2-2h4"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6 6-6-6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-12 4h.01m3 0h.01m3 0h.01"/>',
  coffee: '<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Zm13 1h2a3 3 0 0 1 0 6h-2M7 3v2m4-2v2m4-2v2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  book: '<path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
  pencil: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 15Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  file: '<path d="M14 2H5v20h14V7Zm0 0v6h5M8 13h8m-8 4h5"/>',
  folder: '<path d="M3 7V4h7l2 3h9v13H3Zm0 3h18"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  light: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
  video: '<rect x="3" y="5" width="12" height="14" rx="2"/><path d="m15 10 6-4v12l-6-4"/>',
  print: '<path d="M7 7V3h10v4M7 17H3V8h18v9h-4M7 14h10v7H7Zm10-3h.01"/>',
  leaf: '<path d="M20 3C10 2 3 5 4 13c1 7 12 8 15-2l1-8ZM4 21c1-6 5-10 11-13"/>'
};
function icon(name, cls='') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.book}</svg>`; }
function esc(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
const storage = {
  get(key, fallback) { try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
};
function gradeQuiz(questions,answers){const items=questions.map((q,i)=>({selected:Number.isInteger(answers[i])?answers[i]:null,correct:q.correct,ok:answers[i]===q.correct,states:q.options.map((_,n)=>n===q.correct?'correct':n===answers[i]?'selected-wrong':'neutral')}));return {items,score:items.filter(i=>i.ok).length,total:items.length};}

let A;                 // api del motor
let content, look = {}, current = { page: 'home' }, step = 0, toastTimer, main;
let lab, labForm = null, labMessage = '', previewId = null, labMode = 'guided', largeText = false;
const attempts = new Map();
let labKey, memoKey, textKey, labKind = 'files';

const assetUrl = (name) => A.apiUrl(`/api/courses/${encodeURIComponent(A.slug)}/assets/${encodeURIComponent(name)}`);
const availableLesson = (id) => content.lessons.find((l) => l.id === id);
const isDone = (id) => { const l = availableLesson(id); return Boolean(l && A.progress().done[l.key]); };
const doneCount = () => content.lessons.filter((l) => isDone(l.id)).length;
const total = () => Math.max(content.total, content.lessons.length);
const br = (s) => esc(s).replace(/\n/g, '<br>');

// ---------- adaptación de los datos del motor al modelo del diseño original ----------
function adapt(data) {
  look = data.course.look || {};
  labKind = look.lab_kind === 'sheet' ? 'sheet' : 'files';
  storage.set(`pdf2course:${A.slug}:lab-kind`, labKind);
  const meeting = data.course.meetingUrl || null;
  const lessons = data.lessons.map((l) => {
    const lk = l.look || {};
    const guideFromPdf = (l.sections || []).filter((s) => (s.paragraphs || []).length).slice(0, 8).map((s) => ({ title: s.heading || l.title, text: s.paragraphs.join(' ').slice(0, 1500) }));
    return {
      id: l.number, key: l.id, title: l.title, shortTitle: l.shortTitle, description: l.description || '', pdfUrl: l.pdfUrl ? A.apiUrl(l.pdfUrl) : null,
      icon: lk.icon || 'book', color: lk.color || 'sage', label: lk.label || l.shortTitle, result: lk.result || '', memo: Boolean(lk.memo), lab: Boolean(lk.lab),
      objectives: l.objectives || [], words: (l.words || []).map((w) => ({ term: w.term, meaning: w.definition })),
      guide: (lk.guide && lk.guide.length ? lk.guide : guideFromPdf.length ? guideFromPdf : [{ title: l.title, text: l.description || '' }]),
      activity: { title: l.activity?.title || 'Prova tu', steps: l.activity?.steps || [], intro: lk.activity_intro || '', success: lk.activity_success || '' },
      recap: l.recap || [], exercises: lk.exercises || [], extraExercises: lk.extra_exercises || [], problems: lk.problems || [],
      quiz: (l.quiz || []).map((q) => ({ prompt: q.prompt, correct: q.correct, hint: q.hint || '', options: q.options.map((o, i) => ({ label: o, feedback: q.feedback?.[i] || (i === q.correct ? 'Risposta corretta.' : 'Questa non è la risposta giusta: rivedi la lezione e riprova.') })) })),
    };
  });
  content = { course: { meetingUrl: meeting }, lessons, upcoming: data.upcoming || [], total: lessons.length + (data.upcoming || []).length, canManage: Boolean(data.teacher), state: data.state || null, raw: data };
}

function zoomEntry(cls = 'btn btn-primary') {
  const name = look.meeting_name || 'Zoom';
  return content.course.meetingUrl
    ? `<a class="${cls}" href="${esc(content.course.meetingUrl)}" target="_blank" rel="noopener noreferrer">${icon('video')} Entra nella lezione su ${esc(name)} ${icon('arrow')}</a>`
    : `<a class="${cls}" href="#aiuto">${icon('video')} Come entrare su ${esc(name)} ${icon('arrow')}</a>`;
}

function applyTextSize() {
  document.body.classList.toggle('large-text', largeText);
  const b = document.getElementById('text-size');
  if (!b) return;
  b.setAttribute('aria-pressed', String(largeText));
  b.setAttribute('title', largeText ? 'Ripristina la dimensione del testo' : 'Ingrandisci il testo');
  b.setAttribute('aria-label', largeText ? 'Ripristina la dimensione del testo' : 'Ingrandisci il testo');
  b.querySelector('.text-size-label').textContent = largeText ? 'Testo standard' : 'Testo più grande';
}

function heroArt(){return `<svg class="hero-art" viewBox="0 0 350 275" fill="none" role="img" aria-label="Un computer, un documento e una pianta: uno spazio tranquillo per imparare">
  <path d="M31 168c-20-65 9-132 84-134 50-2 65-28 118-7 66 26 89 105 54 167-38 65-210 69-256-26Z" fill="#E8EDE0"/>
  <path d="M52 230h256" stroke="#B4C0A7" stroke-width="2" stroke-linecap="round"/>
  <rect x="58" y="68" width="215" height="143" rx="11" fill="#D5DECC" stroke="#61785D" stroke-width="2"/>
  <rect x="67" y="78" width="197" height="123" rx="5" fill="#FAFBF6"/>
  <path d="M131 211v18h68v-18" fill="#D5DECC" stroke="#61785D" stroke-width="2"/>
  <path d="M111 230h107" stroke="#61785D" stroke-width="2" stroke-linecap="round"/>
  <rect x="83" y="94" width="165" height="91" rx="5" fill="white" stroke="#D8E0CF"/>
  <path d="M83 107h165" stroke="#E1E7DA"/><circle cx="91" cy="101" r="2" fill="#C18B65"/><circle cx="98" cy="101" r="2" fill="#B6C29B"/><circle cx="105" cy="101" r="2" fill="#9FAF95"/>
  <rect x="96" y="119" width="30" height="38" rx="4" fill="#E9EFDE"/><path d="M104 128h14m-14 7h14m-14 7h9" stroke="#98AD86" stroke-width="2" stroke-linecap="round"/>
  <rect x="137" y="120" width="90" height="6" rx="3" fill="#ADBCA0"/><rect x="137" y="134" width="72" height="4" rx="2" fill="#E0E7D6"/><rect x="137" y="144" width="82" height="4" rx="2" fill="#E0E7D6"/><rect x="137" y="160" width="56" height="13" rx="4" fill="#52734F"/>
  <g transform="rotate(9 275 75)"><rect x="243" y="37" width="57" height="72" rx="7" fill="#F4E6C1" stroke="#AC9C72" stroke-width="1.5"/><path d="m257 69 9 9 18-20" stroke="#817C4E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M256 89h29" stroke="#C2B587" stroke-width="2" stroke-linecap="round"/></g>
  <path d="M289 193v-49m0 25c-18-2-24-12-21-23 14 1 22 8 21 23Zm0-13c18-1 25-9 24-21-16-1-24 7-24 21Z" fill="#90A77C"/><path d="M289 193v-50" stroke="#637E53" stroke-width="2"/>
  <path d="M273 188h33l-5 41h-23Z" fill="#D9AC8A" stroke="#A97D5E" stroke-width="1.5"/>
  <path d="m44 40 2-7 2 7 7 2-7 2-2 7-2-7-7-2Z" fill="#C1A36C"/><circle cx="318" cy="113" r="3" fill="#C6AA79"/><circle cx="33" cy="191" r="3" fill="#A9BA9B"/>
  </svg>`;}


function sheetArt(){return `<svg class="hero-art" viewBox="0 0 350 275" fill="none" role="img" aria-label="Un foglio di calcolo con una tabella, una somma e un grafico a colonne">
  <path d="M31 168c-20-65 9-132 84-134 50-2 65-28 118-7 66 26 89 105 54 167-38 65-210 69-256-26Z" fill="#E8EDE0"/>
  <rect x="52" y="52" width="235" height="165" rx="11" fill="#D5DECC" stroke="#61785D" stroke-width="2"/>
  <rect x="61" y="62" width="217" height="145" rx="5" fill="#FAFBF6"/>
  <rect x="61" y="62" width="217" height="16" rx="5" fill="#52734F"/>
  <rect x="61" y="86" width="217" height="12" fill="#EEF2E8"/><path d="M61 110h217M61 122h217M61 134h217M61 146h217M105 86v121M149 86v121M193 86v121" stroke="#D8E0CF"/>
  <rect x="108" y="124" width="38" height="8" rx="2" fill="#F4E6C1"/><path d="M68 92h28m6 0h38m6 0h30m6 0h30M68 116h24m6 0h30m6 0h18" stroke="#98AD86" stroke-width="3" stroke-linecap="round"/>
  <rect x="197" y="150" width="14" height="50" fill="#98AD86"/><rect x="215" y="136" width="14" height="64" fill="#52734F"/><rect x="233" y="158" width="14" height="42" fill="#C18B65"/><rect x="251" y="144" width="14" height="56" fill="#B6C29B"/>
  <g transform="rotate(9 305 75)"><rect x="272" y="37" width="62" height="40" rx="7" fill="#F4E6C1" stroke="#AC9C72" stroke-width="1.5"/><text x="303" y="63" text-anchor="middle" font-size="18" font-weight="700" fill="#817C4E" font-family="Source Sans 3, Arial">=SOMMA</text></g>
  <path d="m44 40 2-7 2 7 7 2-7 2-2 7-2-7-7-2Z" fill="#C1A36C"/><circle cx="318" cy="150" r="3" fill="#C6AA79"/><circle cx="33" cy="191" r="3" fill="#A9BA9B"/>
  </svg>`;}

// ---------- estructura de la página ----------
function shell() {
  const logos = (look.logos || []).map((lg, i) => `${i ? '<span class="logo-divider" aria-hidden="true"></span>' : ''}<a href="${esc(lg.url || '#')}" target="_blank" rel="noopener noreferrer" aria-label="${esc(lg.label || lg.alt)}"><img src="${esc(assetUrl(lg.asset))}" alt="${esc(lg.alt)}" class="${esc(lg.cls || '')}" width="${Number(lg.width) || 100}" height="${Number(lg.height) || 60}"></a>`).join('');
  const brand = look.brand || [A.data?.course?.title || 'Corso', ''];
  A.root.innerHTML = `<a class="skip-link" href="#main">Vai al contenuto</a>
  <aside class="sidebar" aria-label="Navigazione del corso">
    ${logos ? `<div class="institutional-logos">${logos}</div>` : ''}
    <a class="brand" href="#home" aria-label="${esc(brand.join(' '))}, pagina iniziale"><span>${esc(brand[0])}<span class="brand-second">${esc(brand[1] || '')}</span></span></a>
    <button type="button" id="menu-toggle" class="mobile-menu-toggle" aria-expanded="false" aria-controls="navigation"><span aria-hidden="true">☰</span> Menu corso</button>
    <div class="org">${esc(look.org || A.data?.course?.organization || '')}<span>${esc(look.org_sub || '')}</span></div>
    <a class="catalog-back" href="/courses/">← Tutti i corsi</a><div class="nav-caption">IL TUO QUADERNO DIGITALE</div>
    <nav id="navigation" aria-label="Sezioni del corso">
      <a class="nav-link home-link" href="#home"><span data-icon="home"></span> Il mio corso</a>
      <p class="nav-caption lessons-caption">LE LEZIONI</p>
      <div id="lesson-navigation"></div>
      <a class="nav-link help-link" href="#aiuto"><span data-icon="help"></span> Hai bisogno di aiuto?</a>
    </nav>
  </aside>
  <div class="page-shell">
    <header class="topbar">
      <span class="course-descriptor">${esc(look.descriptor || '')}</span>
      <div class="topbar-actions"><button class="text-size-button" id="text-size" type="button" aria-pressed="false" title="Ingrandisci il testo"><span aria-hidden="true">A<span class="big-a">A</span></span><span class="text-size-label">Testo più grande</span></button><span class="online-badge"><i></i> Corso online</span></div>
    </header>
    <main id="main" tabindex="-1"><div class="loading-state">Prepariamo il tuo quaderno digitale…</div></main>
  </div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  main = document.getElementById('main');
  applyTextSize();
}

function renderNavigation() {
  document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
  document.getElementById('lesson-navigation').innerHTML = content.lessons.map((l) => `<a class="nav-link ${current.page === 'lesson' && current.id === l.id ? 'active' : ''}" href="#lezione-${l.id}" ${current.page === 'lesson' && current.id === l.id ? 'aria-current="page"' : ''}><span class="nav-num">${String(l.id).padStart(2, '0')}</span><span>${esc(l.shortTitle)}</span>${isDone(l.id) ? `<span class="nav-done" aria-label="Completata">${icon('check')}</span>` : ''}</a>`).join('');
  let tools = document.getElementById('course-tools');
  if (!tools) { tools = document.createElement('div'); tools.id = 'course-tools'; document.querySelector('nav').append(tools); }
  tools.innerHTML = `<a class="nav-link ${current.page === 'materials' ? 'active' : ''}" href="#materiali">${icon('download')} Materiali e PDF</a>${A.hasLab ? `<a class="nav-link ${current.page === 'lab' ? 'active' : ''}" href="#laboratorio">${icon('computer')} ${esc(look.lab_nav||'Laboratorio PC')}</a>` : ''}<a class="nav-link teacher-link ${current.page === 'admin' ? 'active' : ''}" href="#docente">${icon('pencil')} ${content.canManage ? 'Area docente' : 'Accesso docente'}</a>`;
  for (const [selector, active] of [['.home-link', current.page === 'home'], ['.help-link', current.page === 'help']]) {
    const link = document.querySelector(selector);
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
}

// ---------- páginas ----------
function home() {
  const n = doneCount(), tot = total(), hero = look.hero || {};
  return `<section class="hero" aria-labelledby="home-title"><div><p class="eyebrow">${esc(hero.eyebrow || 'IL TUO PERCORSO COMINCIA QUI')}</p><h1 id="home-title">${br(hero.title || content.raw.course.title)}</h1><p class="intro">${esc(hero.intro || content.raw.course.description || '')}</p>${zoomEntry('hero-join')}<div class="course-facts">${(look.facts || []).map((f) => `<span>${icon(f.icon)} ${esc(f.text)}</span>`).join('')}</div></div>${(look.hero?.art==='sheet'?sheetArt():heroArt())}</section>
 <section class="progress-panel" aria-label="I tuoi progressi"><div class="progress-copy"><strong>${n === 0 ? 'Ogni passo conta.' : n === tot ? 'Hai completato il percorso!' : 'Stai facendo progressi.'}</strong><span>${content.lessons.length} ${content.lessons.length === 1 ? 'lezione disponibile' : 'lezioni disponibili'} di ${tot}</span></div><div class="progress-right"><div class="progress-track" role="progressbar" aria-label="Lezioni segnate come completate" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="${tot}"><div class="progress-fill" style="width:${tot ? Math.round((n / tot) * 100) : 0}%"></div></div><span class="progress-amount">${n} di ${tot} completate</span></div></section>
 <section aria-labelledby="lessons-title"><div class="section-heading"><h2 id="lessons-title">Le lezioni, in ordine</h2><span>Un argomento alla volta</span></div>${roadmap()}<div class="lessons-grid ${content.lessons.length === 1 ? 'single' : ''}">${content.lessons.map((l) => `<article class="lesson-card lesson-theme-${themeOf(l)} ${l.id === 1 ? 'featured' : ''}"><div class="card-top"><span class="lesson-icon ${esc(l.color)}">${icon(l.icon)}</span><div class="lesson-meta">LEZIONE ${String(l.id).padStart(2, '0')} <span></span> 2 ORE</div></div><h3><span class="lesson-title-number">${l.id}.</span> ${esc(l.title)}</h3><p>${esc(l.description)}</p><div class="card-bottom"><span class="card-state">${isDone(l.id) ? icon('check') + ' Completata' : 'Disponibile'}</span><a class="card-action" href="#lezione-${l.id}" aria-label="Apri la lezione ${l.id}: ${esc(l.title)}">Apri la lezione ${icon('arrow')}</a></div></article>`).join('')}</div>${content.lessons.length === 0 ? '<div class="objective-box"><p>Le lezioni compariranno qui quando il docente le renderà disponibili.</p></div>' : ''}${content.lessons.length < tot ? '<p class="release-note">Le altre lezioni appariranno qui quando le affronteremo insieme. Quelle già aperte restano disponibili per ripassare.</p>' : ''}</section>
 <aside class="bottom-note">${icon('folder')}<div><strong>Porta i materiali con te.</strong><p>Scarica le schede PDF sul PC per rileggerle o stamparle quando vuoi.</p></div><a href="#materiali">Apri i materiali</a></aside>
`;
}
const themeOf = (l) => ((l.id - 1) % 4) + 1;

function roadmap() {
  const steps = [...content.lessons.map((l) => ({ l })), ...content.upcoming.map((u) => ({ u }))];
  return `<nav class="course-roadmap" aria-label="Ordine delle lezioni">${steps.map(({ l, u }, i) => {
    if (l) return `<a href="#lezione-${l.id}" class="roadmap-step available lesson-theme-${themeOf(l)}"><span class="roadmap-circle">${isDone(l.id) ? icon('check') : l.id}</span><span><strong>Lezione ${l.id}</strong><small>${esc(l.label)}</small></span></a>`;
    return `<span class="roadmap-step locked"><span class="roadmap-circle">${u.number ?? i + 1}</span><span><strong>Lezione ${u.number ?? i + 1}</strong><small>Da aprire</small></span></span>`;
  }).join('')}</nav>`;
}

function visual(type,alt){if(/\.(png|jpe?g|webp|svg)$/i.test(type)){const u=assetUrl(type);return `<figure class="lesson-diagram"><a href="${u}" target="_blank" rel="noopener noreferrer" aria-label="Ingrandisci l’immagine: ${esc(alt||'schermata')}"><img src="${u}" alt="${esc(alt||'')}" loading="lazy"></a><figcaption>${esc(alt||'Schermata')} · Tocca per ingrandire</figcaption></figure>`;}const labels={bookmark:'La stella conserva il sito tra i preferiti',mouse:'Un clic seleziona, due clic aprono',keyboard:'Invio va a capo; Backspace cancella a sinistra',file:'Un nome descrittivo aiuta a riconoscere il documento',folder:'Una cartella raccoglie i documenti',browser:'La barra degli indirizzi e il comando indietro',search:'Una ricerca precisa indica servizio, luogo e informazione',mail:'Destinatario, oggetto, testo e allegato',shield:'Fermati, controlla e verifica da un canale conosciuto'};return `<figure class="lesson-diagram"><a href="${assetUrl('diagram-'+type+'.svg')}" target="_blank" rel="noopener noreferrer" aria-label="Ingrandisci lo schema: ${labels[type]}"><img src="${assetUrl('diagram-'+type+'.svg')}" alt="${labels[type]}" width="760" height="340"></a><figcaption>Schema della lezione · Tocca per ingrandire</figcaption></figure>`;}
function wordBox(l){return `<aside><div class="word-box"><h3>Parole, in parole semplici.</h3><dl>${l.words.map(w=>`<div class="word-pair"><dt>${esc(w.term)}</dt><dd>${esc(w.meaning)}</dd></div>`).join('')}</dl></div><p class="side-tip">${icon('help')} Un passaggio non è chiaro? Fermati e chiedi al docente. Qui le domande sono benvenute.</p></aside>`;}
function guide(l){
  const s=l.guide[Math.min(step,l.guide.length-1)];
  return `<div class="objective-box"><h2>Alla fine saprai…</h2><ul class="check-list">${l.objectives.map(o=>`<li>${icon('check')}<span>${esc(o)}</span></li>`).join('')}</ul></div><section class="guide-card" aria-label="Guida passo a passo"><div class="guide-controls" role="group" aria-label="Scegli un passaggio">${l.guide.map((g,i)=>`<button class="step-dot ${step===i?'active':''}" type="button" data-step="${i}" aria-label="Passaggio ${i+1}: ${esc(g.title)}" ${step===i?'aria-current="step"':''}>${i+1}</button>`).join('')}</div><div class="guide-inner" id="guide-step" aria-live="polite"><p class="guide-kicker">PASSAGGIO ${step+1} DI ${l.guide.length}</p><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${s.visual?visual(s.visual,s.visual_alt):''}${s.tip?`<div class="tip">${icon('light')}<span>${esc(s.tip)}</span></div>`:''}</div><div class="guide-footer"><button class="btn btn-quiet" data-action="previous-step" type="button" ${step===0?'disabled':''}>${icon('back')} Indietro</button>${step>=l.guide.length-1?`<a class="btn btn-primary" href="#lezione-${l.id}/pratica">Ora prova tu ${icon('arrow')}</a>`:`<button class="btn btn-primary" data-action="next-step" type="button">Avanti ${icon('arrow')}</button>`}</div></section>`;
}
function practice(l){return `<section class="practice-card"><p class="eyebrow">ESERCIZIO GUIDATO · CIRCA 15 MINUTI</p><h2>${esc(l.activity.title)}</h2><p>${esc(l.activity.intro||'')}</p><ol class="numbered-steps">${l.activity.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>${l.memo?`<form class="editor-box" id="memo-form"><label class="form-label" for="memo-text">Il tuo promemoria</label><textarea class="form-field" id="memo-text" name="memo" placeholder="Per esempio: Mercoledì partecipo al corso di informatica. Voglio imparare a organizzare le mie foto." maxlength="10000" required>${esc(storage.get('ppd-memo',''))}</textarea><div class="input-row"><label class="form-label" for="memo-name">Come vuoi chiamare il documento?</label><input class="form-field" id="memo-name" name="filename" value="Promemoria corso" maxlength="70" required><p class="field-hint">Il documento sarà un file di testo (.txt). La posizione dipende dalle impostazioni del tuo browser.</p></div><button class="btn btn-primary" type="submit">${icon('download')} Salva il promemoria</button><p class="form-message" id="memo-message" role="status" aria-live="polite"></p></form>`:''}${l.lab?`<div class="lab-launch"><strong>${esc(look.lab_cta_title||'Prima di provare sul tuo PC')}</strong><p>${esc(look.lab_cta_text||'Esercitati con cartelle e documenti in uno spazio guidato.')}</p><a class="btn btn-secondary" href="#laboratorio">${icon('computer')} ${esc(look.lab_cta||'Apri il laboratorio PC')}</a></div>`:''}${l.activity.success?`<div class="success-box">${icon('check')}<p><strong>Come sai di aver fatto bene?</strong>${esc(l.activity.success)}</p></div>`:''}</section>`;}
function recapExtra(l){
  const ex=l.exercises.length?`<h3 class="recap-h">ESERCITAZIONI PRATICHE</h3>${l.exercises.map((e,i)=>`<div class="recap-card"><strong>Esercitazione ${i+1} · ${esc(e.title)}</strong><ol>${(e.steps||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>${e.goal?`<p class="recap-goal">${esc(e.goal)}</p>`:''}</div>`).join('')}`:'';
  const pr=l.problems.length?`<h3 class="recap-h">PROBLEMI COMUNI E COME AFFRONTARLI</h3>${l.problems.map(p=>`<div class="recap-card problem"><strong>${esc(p.problem)}</strong><p><b>Perché succede.</b> ${esc(p.cause)}</p><p><b>Che cosa fare.</b> ${esc(p.fix)}</p>${p.visual?visual(p.visual,p.visual_alt):''}</div>`).join('')}`:'';
  const more=l.extraExercises.length?`<h3 class="recap-h">ESERCIZI AGGIUNTIVI PER CONTINUARE A ESERCITARSI</h3><p class="intro">Dal più facile al più impegnativo: fai quanti ne vuoi, a casa, con dati inventati.</p>${l.extraExercises.map((e,i)=>`<div class="recap-card"><strong>${i+1}. ${esc(e.title)}</strong> <span class="lv lv-${esc(String(e.level).toLowerCase())}">${esc(e.level)}</span><ol>${(e.steps||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>${e.goal?`<p class="recap-goal">Risultato atteso: ${esc(e.goal)}</p>`:''}</div>`).join('')}`:'';
  return ex+pr+more;
}
function recap(l){return `<section class="recap-sheet"><p class="eyebrow">DA TENERE A PORTATA DI MANO</p><h2>Le cose da ricordare</h2><p class="intro">Gli stessi schemi visivi della lezione, con i passaggi e l’esercizio: da conservare o stampare.</p><ul>${l.recap.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>${recapExtra(l)}<div class="download-row"><a href="${esc(l.pdfUrl||'#')}" download class="btn btn-primary">${icon('download')} Scarica la scheda PDF</a><button class="btn btn-secondary" type="button" data-action="print">${icon('print')} Stampa questa pagina</button></div></section>`;}
function completion(l){let done=isDone(l.id);return `<div class="completion-box"><p>Quando hai finito, puoi segnare la lezione come completata. Puoi comunque riaprirla e riprovare.</p><button type="button" class="btn ${done?'completed-button':'btn-secondary'}" data-action="complete" aria-pressed="${done}">${icon('check')} ${done?'Completata · Annulla':'Ho completato questa lezione'}</button></div>`;}
function lesson(l){
  const tab=current.tab||'guida';
  return `<a class="breadcrumb" href="#home">${icon('back')} Torna alle lezioni</a><div class="lesson-head"><span class="lesson-icon ${l.color}">${icon(l.icon)}</span><div><p class="eyebrow">LEZIONE ${String(l.id).padStart(2,'0')} · PERCORSO PRATICO</p><h1>${esc(l.title)}</h1><p class="lesson-subtitle">${esc(l.description)}</p></div></div><div class="lesson-facts">${(look.lesson_facts||[]).map(f=>`<span>${icon(f.icon)} ${esc(f.text)}</span>`).join('')}</div><div class="tabs" role="tablist" aria-label="Contenuti della lezione">${[['guida','La lezione','book'],['pratica','Prova tu','pencil'],['scheda','Il promemoria','file'],['quiz','Ripasso','check']].map(([id,label,ic])=>`<button type="button" role="tab" id="tab-${id}" aria-controls="lesson-panel" aria-selected="${tab===id}" tabindex="${tab===id?0:-1}" data-tab="${id}" class="tab ${tab===id?'active':''}">${icon(ic)} ${label}</button>`).join('')}</div><div class="lesson-layout"><div><div role="tabpanel" id="lesson-panel" aria-labelledby="tab-${tab}">${tab==='pratica'?practice(l):tab==='scheda'?recap(l):tab==='quiz'?quizPage(l):guide(l)}</div>${completion(l)}</div>${wordBox(l)}</div><div class="review-launch"><span>${icon('check')} ${l.quiz.length} domande per ripassare, dalla più facile alla più difficile, senza blocchi.</span><a class="btn btn-secondary" href="#lezione-${l.id}/quiz">Vai al ripasso</a></div><div class="lesson-next">${availableLesson(l.id+1)?`<a href="#lezione-${l.id+1}">Vai alla lezione ${l.id+1} ${icon('arrow')}</a>`:`<a href="#home">Torna al tuo percorso ${icon('arrow')}</a>`}</div>`;
}


function help() {
  const faqs = look.faq || [];
  const mp = look.meeting_panel || {};
  const name = look.meeting_name || 'Zoom';
  return `<a class="breadcrumb" href="#home">${icon('back')} Torna al corso</a><div class="help-intro"><p class="eyebrow">UNA MANO, QUANDO SERVE</p><h1>Nessuna domanda<br>è troppo piccola.</h1><p>${esc(name)} per incontrarci, questo quaderno per esercitarti e ripassare.</p></div><div class="help-grid"><section aria-label="Domande frequenti">${faqs.map((f, i) => `<details class="faq" ${i === 0 ? 'open' : ''}><summary>${esc(f.q)}</summary><p>${esc(content.course.meetingUrl ? f.a : (f.a_nolink || f.a))}</p></details>`).join('')}</section><aside class="meeting-panel">${icon('video')}<h3>${esc(mp.title || 'Ci vediamo online.')}</h3><p>${esc(mp.text || '')}</p>${mp.strong ? `<p><strong>${esc(mp.strong)}</strong><br>${esc(mp.after || '')}</p>` : ''}${look.zoom_license_note ? `<p class="zoom-license-note">${esc(look.zoom_license_note)}</p>` : ''}${content.course.meetingUrl ? zoomEntry() : `<div class="connection-placeholder">Il collegamento ${esc(name)} sarà inserito dal docente.</div>`}<a class="btn btn-secondary help-download" href="#materiali">${icon('download')} Materiali e PDF</a>${A.hasLab ? `<a class="nav-link ${current.page === 'lab' ? 'active' : ''}" href="#laboratorio">${icon('computer')} Laboratorio PC</a>` : ''}</aside></div>`;
}

function materialsPage() {
  const extra = (content.raw.publicAssets || []).filter((a) => !/^(diagram-|logo-)/.test(a.name));
  return `<a class="breadcrumb" href="#home">${icon('back')} Torna al corso</a><div class="help-intro"><p class="eyebrow">MATERIALI DEL CORSO</p><h1>Le tue schede,<br>sempre a portata di mano.</h1><p>Scarica i PDF delle lezioni disponibili. Puoi conservarli sul computer, rileggerli senza Internet o stamparli.</p></div><div class="offline-instructions"><span>${icon('download')} <strong>1.</strong> Scarica il PDF.</span><span>${icon('folder')} <strong>2.</strong> Ritrovalo in Download.</span><span>${icon('book')} <strong>3.</strong> Aprilo o stampalo.</span></div><section class="material-list" aria-label="Materiali delle lezioni disponibili">${content.lessons.map((l) => `<article class="material-card"><span class="lesson-icon ${esc(l.color)}">${icon(l.icon)}</span><div><span class="lesson-meta">LEZIONE ${l.id}</span><h2>${esc(l.title)}</h2><p>Schemi visivi della lezione, passaggi guidati ed esercizi da ripetere.</p><div class="download-row">${l.pdfUrl ? `<a class="btn btn-primary" href="${esc(l.pdfUrl)}" download>${icon('download')} Scarica la scheda PDF</a>` : ''}<a class="btn btn-secondary" href="#lezione-${l.id}">${icon('book')} Rivedi la lezione</a></div></div></article>`).join('') || '<div class="objective-box">Le schede compariranno quando sarà aperta la prima lezione.</div>'}${extra.map((a) => `<article class="material-card"><span class="lesson-icon sage">${icon('file')}</span><div><h2>${esc(a.name)}</h2><div class="download-row"><a class="btn btn-secondary" href="${esc(A.apiUrl(a.url))}" download>${icon('download')} Scarica</a></div></div></article>`).join('')}</section>`;
}

// ---------- área docente ----------
function adminPage() {
  const msg = '<p id="admin-message" class="form-message" role="status"></p>';
  if (!content.canManage) {
    return `<div class="help-intro"><p class="eyebrow">AREA DOCENTE</p><h1>Uno spazio riservato.</h1><p>Il corso è pubblico e si può consultare senza registrazione. Inserisci il codice di Google Authenticator per gestire l’apertura delle lezioni e il collegamento alla lezione online.</p></div><section class="admin-section"><form id="login-form"><label class="form-label" for="otp">Codice di Google Authenticator (6 cifre)</label><input class="form-field" id="otp" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" maxlength="7" required placeholder="123 456"><button class="btn btn-primary" type="submit">Entra</button>${msg}</form></section><p><a class="btn btn-secondary" href="#home">Torna al corso</a></p>`;
  }
  const s = content.state, open = new Set(s.released || []);
  return `<a class="breadcrumb" href="#home">${icon('back')} Vedi il corso come partecipante</a><div class="help-intro"><p class="eyebrow">AREA DOCENTE</p><h1>Un incontro<br>alla volta.</h1><p>Decidi quali lezioni mostrare e inserisci il collegamento alla lezione online. Le modifiche valgono per tutti i partecipanti.</p><div class="teacher-session"><span>${icon('check')} Accesso docente attivo</span><a href="#docente" data-action="logout">Esci dall’area docente</a></div></div><section class="admin-section"><h2>Lezioni disponibili</h2><p class="intro">Puoi aprire e chiudere ogni lezione quando vuoi, anche non in ordine. I materiali delle lezioni chiuse rimangono nascosti ai partecipanti.</p><div class="admin-lessons">${content.lessons.map((l) => `<div class="admin-lesson"><span class="nav-num">${String(l.id).padStart(2, '0')}</span><div><strong>${esc(l.title)}</strong><span>${open.has(l.id) ? 'Aperta ai partecipanti' : 'Chiusa'}</span></div>${open.has(l.id) ? `<button class="btn btn-quiet" type="button" data-toggle="${l.id}" aria-label="Chiudi la lezione ${l.id}">Chiudi lezione ${l.id}</button>` : `<button class="btn btn-primary" type="button" data-toggle="${l.id}" aria-label="Apri la lezione ${l.id}">Apri lezione ${l.id}</button>`}</div>`).join('')}</div><p class="storage-note">Le pagine già aperte si aggiornano al ricaricamento. Chiudere una lezione non elimina le copie dei materiali già scaricate.</p></section><section class="admin-section"><h2>Il collegamento alla lezione online</h2><p class="intro">Incolla il link di partecipazione della riunione. Lo stesso pulsante sarà disponibile nella pagina iniziale e nell’aiuto.</p><form id="zoom-form"><label class="form-label" for="zoom-url">Collegamento della lezione</label><input type="url" class="form-field" id="zoom-url" maxlength="2048" placeholder="https://…" value="${esc(s.meetingUrl || '')}"><p class="field-hint">Puoi lasciare il campo vuoto finché la riunione non è pronta.</p><button class="btn btn-primary" type="submit">Salva collegamento</button></form></section>${msg}`;
}
async function saveAdmin(released, meetingUrl) {
  const buttons = main.querySelectorAll('button');
  buttons.forEach((b) => { b.disabled = true; });
  const say = (text, error) => { const m = document.getElementById('admin-message'); if (m) { m.textContent = text; m.classList.toggle('error', Boolean(error)); } };
  try {
    const res = await A.api(`/api/courses/${encodeURIComponent(A.slug)}/admin`, { method: 'PATCH', body: { released, meetingUrl: meetingUrl || '', revision: content.state.revision } });
    if (res.status === 409) { adapt(await A.reload()); route(true); say('I dati erano stati modificati altrove: ho ricaricato lo stato. Ripeti la modifica.', true); return; }
    if (!res.ok) throw new Error('Errore nel salvataggio.');
    A.setData(res.json); adapt(res.json); route(true); notify('Modifica salvata per tutti i partecipanti.');
  } catch (e) {
    buttons.forEach((b) => { b.disabled = false; });
    say(e.message, true);
  }
}

// ---------- ruteo ----------
function parseRoute() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash === 'aiuto') return { page: 'help' };
  if (hash === 'materiali') return { page: 'materials' };
  if (hash === 'laboratorio' && A.hasLab) return { page: 'lab' };
  if (hash === 'docente') return { page: 'admin' };
  const byKey = hash.match(/^lezione\/(.+)$/); // enlaces del motor básico: #lezione/<id>
  if (byKey) { const l = content.lessons.find((x) => x.key === byKey[1]); if (l) return { page: 'lesson', id: l.id, tab: 'guida' }; }
  const match = hash.match(/^lezione-(\d+)(?:\/(pratica|scheda|quiz))?$/);
  return match ? { page: 'lesson', id: Number(match[1]), tab: match[2] || 'guida' } : { page: 'home' };
}
function route(isFirst = false) {
  const previous = current;
  current = parseRoute();
  if (previous.id !== current.id) step = 0;
  renderNavigation();
  const lessonPage = () => (availableLesson(current.id) ? lesson(availableLesson(current.id)) : '<div class="objective-box"><h1>Un passo alla volta.</h1><p>Questa lezione non è ancora disponibile. Il docente la aprirà durante il corso.</p><a class="btn btn-primary" href="#home">Torna al corso</a></div>');
  main.innerHTML = current.page === 'lab' ? labPage() : current.page === 'help' ? help() : current.page === 'materials' ? materialsPage() : current.page === 'admin' ? adminPage() : current.page === 'lesson' ? lessonPage() : home();
  if (current.page === 'lab' && labKind === 'sheet') mountSheetLab(document.getElementById('sheet-root'), { storage, key: labKey + '-sheet', icon: { back: icon('back') } });
  const names = { lab: look.lab_nav || 'Laboratorio PC', help: 'Hai bisogno di aiuto?', materials: 'Materiali e PDF', admin: 'Area docente' };
  document.title = `${current.page === 'lesson' ? `Lezione ${current.id} · ${availableLesson(current.id)?.shortTitle || 'Lezione non disponibile'}` : names[current.page] || content.raw.course.title} · ${content.raw.course.organization || content.raw.course.title}`;
  if (!isFirst) {
    if (previous.page === 'lesson' && current.page === 'lesson' && previous.id === current.id && previous.tab !== current.tab) document.querySelector(`[data-tab="${current.tab}"]`)?.focus({ preventScroll: true });
    else { window.scrollTo({ top: 0, behavior: 'auto' }); main.focus({ preventScroll: true }); }
  }
}
function notify(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3500); }
function refreshGuide(focusSelector) {
  const l = availableLesson(current.id);
  document.getElementById('lesson-panel').innerHTML = guide(l);
  if (focusSelector) document.querySelector(focusSelector)?.focus({ preventScroll: true });
}

// ---------- laboratorio y repaso (del diseño original) ----------
function persistLab() { storage.set(labKey, lab); }
function refreshLab() { persistLab(); route(true); }
function quizPage(lesson){
  const questions=lesson.quiz||[];
  let a=attempts.get(lesson.id);
  if(!a){a={answers:[],checked:false};attempts.set(lesson.id,a);}
  const result=a.checked?gradeQuiz(questions,a.answers):null;
  return `<section class="quiz-intro"><span class="feature-kicker">RIPASSO INTERATTIVO</span><h2>Mettiamo a fuoco i concetti</h2><p>Alcune domande per ripassare. Puoi riprovare e continuare il corso qualunque sia il risultato.</p></section><form id="review-form" data-lesson="${lesson.id}" novalidate>${questions.map((q,i)=>{
    const item=result?.items[i];
    const selected=item?.selected;
    return `<fieldset class="quiz-question"><legend><span class="question-number">${i+1}</span><span>${esc(q.prompt)}</span></legend><div class="quiz-options">${q.options.map((o,n)=>`<label class="quiz-option ${item?.states[n]||''}"><input type="radio" name="question-${i}" value="${n}" ${a.answers[i]===n?'checked':''} ${a.checked?'disabled':''}><span class="option-letter">${'ABCD'[n]}</span><span class="option-text">${esc(o.label)}${a.checked&&n===q.correct?'<strong class="option-status">✓ Risposta da ricordare</strong>':a.checked&&selected===n&&!item.ok?'<strong class="option-status">La tua risposta</strong>':''}</span></label>`).join('')}</div>${a.checked?`<div class="quiz-feedback ${item.ok?'positive':'explain'}"><strong>${item.ok?'Il concetto è chiaro.':selected===null?'Rivediamo questo passaggio.':'Proviamo a ragionarci insieme.'}</strong><p>${esc(selected===null?q.options[q.correct].feedback:q.options[selected].feedback)}</p>${selected!==null&&!item.ok?`<p>${esc(q.options[q.correct].feedback)}</p>`:''}</div>`:`<details class="quiz-hint"><summary>Un piccolo aiuto</summary><p>${esc(q.hint)}</p></details>`}</fieldset>`;
  }).join('')}<div class="quiz-actions">${a.checked?`<div class="quiz-summary" role="status"><strong>Ripasso completato</strong><span>Concetti riconosciuti: ${result.score} su ${result.total}. Puoi rivedere le spiegazioni o riprovare.</span></div><button type="button" class="btn btn-primary" data-review-retry="${lesson.id}">Riprova il ripasso</button><a class="btn btn-secondary" href="#lezione-${lesson.id}">Torna alla lezione</a>`:'<button class="btn btn-primary" type="submit">Controlla le risposte</button><p>Il ripasso non blocca l’accesso alle altre lezioni.</p>'}</div></form>`;
}

function labPage(){
  if(labKind==='sheet')return '<div id="sheet-root"></div>';
  const progress=tasks(lab),next=progress.findIndex(t=>!t.done),count=progress.filter(t=>t.done).length;
 const selected=lab.nodes.find(n=>n.id===lab.selected),folder=lab.nodes.find(n=>n.id===lab.location);
 const visible=lab.nodes.filter(n=>n.parent===lab.location);
 return `<a class="breadcrumb" href="#home">${icon('back')} Torna al corso</a><div class="lab-heading"><div><p class="eyebrow">LABORATORIO PC</p><h1>Prova con file<br>e cartelle.</h1><p class="intro">Un ambiente di esercitazione: i documenti del tuo computer rimangono al loro posto.</p></div><div class="lab-view-switch" role="group" aria-label="Visualizzazione del laboratorio"><button type="button" data-lab-mode="guided" class="${labMode==='guided'?'active':''}" aria-pressed="${labMode==='guided'}">Passi guidati</button><button type="button" data-lab-mode="desktop" class="${labMode==='desktop'?'active':''}" aria-pressed="${labMode==='desktop'}">Vista PC</button></div></div><div class="lab-layout ${labMode==='desktop'?'pc-mode':'guided-mode'}"><section class="lab-task-panel"><h2>Il tuo obiettivo</h2><ol>${progress.map((t,i)=>`<li class="${t.done?'done':next===i?'current':''}"><span>${t.done?'✓':i+1}</span><div><strong>${esc(t.title)}</strong>${next===i?`<p>${esc(t.help)}</p>`:''}</div></li>`).join('')}</ol><p class="lab-count">${count} di ${progress.length} passaggi completati</p>${count===progress.length?'<div class="lab-success" role="status">Hai organizzato il documento: ora sai creare una cartella, rinominare un file e spostarlo.</div>':''}<button class="btn btn-quiet" type="button" data-lab-action="reset">Ricomincia l’esercizio</button></section><section class="lab-workspace" aria-label="Simulatore di file e cartelle"><div class="lab-window-bar"><span>${icon('folder')} File e cartelle</span><span class="window-decoration" aria-hidden="true">● ● ●</span></div><div class="lab-toolbar"><button type="button" data-lab-action="new">${icon('folder')} Nuova cartella</button><button type="button" data-lab-action="rename" ${!selected||selected.id==='documents'?'disabled':''}>Rinomina</button><button type="button" data-lab-action="cut" ${!selected||selected.id==='documents'?'disabled':''}>Taglia</button><button type="button" data-lab-action="paste" ${!lab.clipboard?'disabled':''}>Incolla</button><button type="button" data-lab-action="open" ${!selected?'disabled':''}>Apri</button></div><div class="lab-path"><button type="button" data-lab-action="up" ${lab.location===null?'disabled':''} aria-label="Vai alla cartella superiore">${icon('back')}</button><span>${lab.location===null?'Scrivania':folder?.name||'Cartella'}</span>${lab.location&&lab.location!=='documents'?'<button class="lab-documents" type="button" data-lab-action="documents">Vai a Documenti</button>':''}</div>${labForm?`<form class="lab-name-form" id="lab-name-form"><label for="lab-name">${labForm==='new'?'Nome della nuova cartella':'Nuovo nome del documento'}</label><div><input id="lab-name" name="name" class="form-field" value="${esc(labForm==='new'?'Corso PC':'Promemoria.txt')}" maxlength="60" required><button class="btn btn-primary" type="submit">Conferma</button><button class="btn btn-secondary" type="button" data-lab-action="cancel">Annulla</button></div></form>`:''}<div class="lab-items" role="group" aria-label="Elementi nella cartella">${visible.map(n=>`<button type="button" class="lab-item ${lab.selected===n.id?'selected':''} ${lab.clipboard===n.id?'cut-item':''}" data-lab-item="${esc(n.id)}" aria-pressed="${lab.selected===n.id}" aria-label="${n.kind==='folder'?'Cartella':'Documento'} ${esc(n.name)}">${icon(n.kind==='folder'?'folder':'file')}<span>${esc(n.name)}</span></button>`).join('')||'<p class="lab-empty">Questa cartella è vuota. Puoi incollare qui il documento.</p>'}</div><div class="lab-status"><span id="lab-selected">${selected?esc(selected.name)+' selezionato':'Seleziona un elemento e premi Apri.'}</span><span>${visible.length} ${visible.length===1?'elemento':'elementi'}</span></div>${labMessage?`<p class="lab-message" role="status">${esc(labMessage)}</p>`:''}${previewId?`<div class="lab-file-preview"><strong>${esc(lab.nodes.find(n=>n.id===previewId)?.name||'Documento')}</strong><p>${esc(lab.nodes.find(n=>n.id===previewId)?.text||'')}</p><button type="button" class="btn btn-quiet" data-lab-action="close-preview">Chiudi il documento</button></div>`:''}<p class="lab-device-tip">Da telefono seleziona un elemento e usa i pulsanti. Dal PC puoi anche aprire le cartelle con un doppio clic.</p></section></div>`;
}

function selectLab(id){
 lab.selected=id;persistLab();
 document.querySelectorAll('[data-lab-item]').forEach(b=>{b.classList.toggle('selected',b.dataset.labItem===id);b.setAttribute('aria-pressed',String(b.dataset.labItem===id));});
 const chosen=lab.nodes.find(n=>n.id===id);
 for(const action of ['open','rename','cut']){const b=document.querySelector(`[data-lab-action="${action}"]`);if(b)b.disabled=!chosen||(action!=='open'&&id==='documents');}
 const label=document.getElementById('lab-selected');if(label)label.textContent=chosen?chosen.name+' selezionato':'Seleziona un elemento.';
}

function openSelected(){
 const n=lab.nodes.find(n=>n.id===lab.selected);if(!n)throw new Error('Seleziona prima un elemento.');
 if(n.kind==='folder'){openFolder(lab,n.id);previewId=null;}else previewId=n.id;
 labMessage='';labForm=null;refreshLab();
}


function wire() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('#menu-toggle')) { const open = document.body.classList.toggle('nav-open'); document.getElementById('menu-toggle').setAttribute('aria-expanded', String(open)); return; }
    if (e.target.closest('.sidebar a')) { document.body.classList.remove('nav-open'); document.getElementById('menu-toggle')?.setAttribute('aria-expanded', 'false'); }
    const toggle = e.target.closest('[data-toggle]'); if (toggle && content.canManage) { const n = Number(toggle.dataset.toggle), cur = new Set(content.state.released || []); if (cur.has(n)) cur.delete(n); else cur.add(n); saveAdmin([...cur].sort((x, y) => x - y), content.state.meetingUrl); return; }
    if (e.target.closest('[data-action="logout"]')) { A.clearSession(); A.reload().then((d) => { adapt(d); route(true); }); return; }
    if (e.target.closest('.skip-link')) { e.preventDefault(); main.focus(); return; }
    const tab = e.target.closest('[data-tab]');
    if (tab) { location.hash = `lezione-${current.id}${tab.dataset.tab === 'guida' ? '' : '/' + tab.dataset.tab}`; return; }
    const dot = e.target.closest('[data-step]');
    if (dot) { step = Number(dot.dataset.step); refreshGuide(`[data-step="${step}"]`); return; }
    const button = e.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const last = (availableLesson(current.id)?.guide.length || 1) - 1;
    if (action === 'next-step') { step = Math.min(step + 1, last); refreshGuide(step === last ? '#lesson-panel a.btn-primary' : '[data-action="next-step"]'); }
    if (action === 'previous-step') { step = Math.max(step - 1, 0); refreshGuide(step === 0 ? '[data-action="next-step"]' : '[data-action="previous-step"]'); }
    if (action === 'print') window.print();
    if (action === 'complete') {
      const l = availableLesson(current.id); const p = A.progress();
      p.done[l.key] = !p.done[l.key]; A.saveProgress();
      main.querySelector('.completion-box').outerHTML = completion(l);
      renderNavigation();
      main.querySelector('[data-action="complete"]').focus({ preventScroll: true });
      notify(p.done[l.key] ? 'Un altro passo fatto. Puoi sempre tornare a ripassare.' : 'Lezione segnata come da completare.');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { document.body.classList.remove('nav-open'); document.getElementById('menu-toggle')?.setAttribute('aria-expanded', 'false'); }
    const tab = e.target.closest('[role="tab"]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const tabs = ['guida', 'pratica', 'scheda', 'quiz'];
    let i = tabs.indexOf(tab.dataset.tab);
    i = e.key === 'Home' ? 0 : e.key === 'End' ? 3 : (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4;
    location.hash = `lezione-${current.id}${i === 0 ? '' : '/' + tabs[i]}`;
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'memo-text') storage.set(memoKey, e.target.value); });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'zoom-form') { e.preventDefault(); saveAdmin(content.state.released || [], document.getElementById('zoom-url').value.trim()); return; }
    if (e.target.id === 'login-form') {
      e.preventDefault();
      const msg = document.getElementById('admin-message');
      const code = String(new FormData(e.target).get('code') || '').replace(/\s/g, '');
      const btn = e.target.querySelector('button'); btn.disabled = true; msg.textContent = '';
      A.api('/api/auth/login', { method: 'POST', auth: false, body: { code } }).catch(() => ({ ok: false })).then(async (auth) => {
        if (!auth.ok) { msg.textContent = auth.status === 401 ? 'Codice non corretto. Se era giusto, attendi il successivo.' : auth.status === 429 ? 'Troppi tentativi. Riprova tra qualche minuto.' : 'Non riesco a collegarmi. Riprova.'; msg.classList.add('error'); btn.disabled = false; return; }
        A.saveSession(auth.json);
        try { adapt(await A.reload()); route(true); } catch { msg.textContent = 'Non riesco a caricare l’area docente.'; msg.classList.add('error'); btn.disabled = false; }
      });
      return;
    }
    if (e.target.id !== 'memo-form') return;
    e.preventDefault();
    const text = document.getElementById('memo-text').value.trim();
    const message = document.getElementById('memo-message');
    if (!text) { message.textContent = 'Scrivi almeno una frase, poi riprova a salvare.'; message.className = 'form-message error'; document.getElementById('memo-text').focus(); return; }
    let filename = document.getElementById('memo-name').value.trim().replace(/[\\/:*?"<>|\x00-\x1F]/g, '').replace(/\.txt$/i, '').replace(/[. ]+$/, '') || 'Promemoria corso';
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(filename)) filename = 'Promemoria ' + filename;
    const blob = new Blob(['﻿' + text + '\r\n'], { type: 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename + '.txt'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    message.className = 'form-message'; message.textContent = 'Download avviato. Ora cerca “' + filename + '.txt” nella cartella scelta o in Download, poi aprilo per verificare il testo.';
  });
  document.getElementById('text-size').addEventListener('click', () => { largeText = !largeText; storage.set(textKey, largeText); applyTextSize(); notify(largeText ? 'Testo ingrandito.' : 'Dimensione del testo ripristinata.'); });
 document.addEventListener('change',e=>{
  const form=e.target.closest('#review-form');if(form&&e.target.matches('input[type="radio"]')){
   const attempt=attempts.get(Number(form.dataset.lesson));attempt.answers[Number(e.target.name.split('-')[1])]=Number(e.target.value);
  }
 });
 document.addEventListener('submit',e=>{
  if(e.target.id==='review-form'){
   e.preventDefault();const id=Number(e.target.dataset.lesson);const a=attempts.get(id);a.checked=true;
   const lesson=content.lessons.find(l=>l.id===id);document.getElementById('lesson-panel').innerHTML=quizPage(lesson);
   document.querySelector('.quiz-summary')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  if(e.target.id==='lab-name-form'){
   e.preventDefault();try{const name=document.getElementById('lab-name').value;if(labForm==='new')addFolder(lab,name);else rename(lab,lab.selected,name);labForm=null;labMessage='Operazione completata. Osserva il nome nell’elenco.';}catch(error){labMessage=error.message;}refreshLab();
  }
 });
 document.addEventListener('click',e=>{
  const retry=e.target.closest('[data-review-retry]');if(retry){const id=Number(retry.dataset.reviewRetry);attempts.set(id,{answers:[],checked:false});const l=content.lessons.find(l=>l.id===id);document.getElementById('lesson-panel').innerHTML=quizPage(l);document.querySelector('.quiz-question input')?.focus();return;}
  const mode=e.target.closest('[data-lab-mode]');if(mode){labMode=mode.dataset.labMode;refreshLab();return;}
  const item=e.target.closest('[data-lab-item]');if(item){selectLab(item.dataset.labItem);return;}
  const action=e.target.closest('[data-lab-action]')?.dataset.labAction;if(!action)return;
  try{
   labMessage='';
   if(action==='new'||action==='rename'){labForm=action;refreshLab();document.getElementById('lab-name')?.focus();document.getElementById('lab-name')?.select();return;}
   if(action==='open'){openSelected();return;}
   if(action==='cut'){cut(lab,lab.selected);labMessage='Documento pronto da spostare. Apri la cartella di destinazione e premi Incolla.';}
   if(action==='paste'){paste(lab);labMessage='Documento spostato nella cartella che hai aperto.';}
   if(action==='up'){goUp(lab);previewId=null;}
   if(action==='documents'){openFolder(lab,'documents');previewId=null;}
   if(action==='cancel')labForm=null;
   if(action==='reset'){lab=newLab();labForm=null;previewId=null;}
   if(action==='close-preview')previewId=null;
  }catch(error){labMessage=error.message;}
  refreshLab();
 });
 document.addEventListener('dblclick',e=>{const item=e.target.closest('[data-lab-item]');if(item){lab.selected=item.dataset.labItem;try{openSelected();}catch(error){labMessage=error.message;refreshLab();}}});
  window.addEventListener('hashchange', () => { if (content) route(); });
}

function boot(api) {
  A = api;
  A.hasLab = true;
  const k = (n) => `pdf2course:${A.slug}:${n}`;
  labKey = k('lab'); memoKey = k('memo'); textKey = k('large-text');
  labKind = storage.get(k('lab-kind'), 'files') === 'sheet' ? 'sheet' : 'files';
  lab = restoreLab(storage.get(labKey, null) ?? storage.get('ppd-lab', null));
  largeText = (storage.get(textKey, null) ?? storage.get('ppd-large-text', false)) === true;
  if (!storage.get(labKey, null) && localStorage.getItem('ppd-memo') !== null && localStorage.getItem(memoKey) === null) storage.set(memoKey, storage.get('ppd-memo', ''));
  labMode = window.matchMedia('(min-width: 1000px)').matches ? 'desktop' : 'guided';
  document.documentElement.dataset.font = 'source';
  for (const l of document.querySelectorAll('link[rel="stylesheet"]')) if (/\/engine\.css(\?|$)/.test(l.getAttribute('href') || '')) l.disabled = true;
  if (!document.getElementById('classic-css')) {
    const link = document.createElement('link');
    link.id = 'classic-css'; link.rel = 'stylesheet'; link.href = new URL(`./classic.css${V}`, import.meta.url).href;
    document.head.append(link);
  }
  if (!document.getElementById('sheet-lab-css')) {
    const link = document.createElement('link');
    link.id = 'sheet-lab-css'; link.rel = 'stylesheet'; link.href = new URL(`./sheet-lab.css${V}`, import.meta.url).href;
    document.head.append(link);
  }
}

let wired = false;
export async function mount(api) {
  boot(api);
  adapt(api.data);
  shell();
  if (!wired) { wired = true; wire(); }
  route(true);
}
export async function mountOffline(api, retry) {
  boot(api);
  look = {}; content = { course: { meetingUrl: null }, lessons: [], upcoming: [], total: 0, canManage: false, state: null, raw: { course: { title: 'Corso', organization: '' }, publicAssets: [] } };
  shell();
  if (!wired) { wired = true; wire(); }
  route = (isFirst) => {
    current = parseRoute(); renderNavigation();
    main.innerHTML = current.page === 'lab' ? labPage() : '<div class="objective-box"><h1>Le lezioni torneranno tra poco.</h1><p>Il collegamento ai materiali non risponde. Puoi intanto esercitarti nel laboratorio PC.</p><a class="btn btn-primary" href="#laboratorio">Apri il laboratorio PC</a> <button class="btn btn-secondary" id="reload" type="button">Riprova</button></div>';
    if (current.page === 'lab' && labKind === 'sheet') mountSheetLab(document.getElementById('sheet-root'), { storage, key: labKey + '-sheet', icon: { back: icon('back') } });
    document.getElementById('reload')?.addEventListener('click', () => location.reload());
  };
  route(true);
}
