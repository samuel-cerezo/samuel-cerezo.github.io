// pdf2course · motor común de las páginas de curso.
// Cada curso tiene una página mínima (courses/<slug>/index.html) con:
//   <div id="course-app" data-course-slug="<slug>" data-api-base="https://…workers.dev"></div>
// y carga este módulo. Un cambio de diseño aquí vale para todos los cursos.
//
// Seguridad: todo el contenido del curso se inserta con textContent (nunca innerHTML) y solo se
// enlazan URLs https. Tras el login (solo código de Google Authenticator)
// solo se conserva la sesión firmada de 12 h en sessionStorage (se borra al cerrar la pestaña).

const ENGINE_VERSION = '1';

const I18N = {
  it: {
    skip: 'Vai al contenuto', menu: 'Menu corso', home: 'Il mio corso', lessons: 'Le lezioni', upcoming: 'Prossimamente',
    allCourses: '← Tutti i corsi', teacher: 'Accesso docente', loading: 'Caricamento del corso…',
    loadError: 'Non riesco a caricare il corso. Controlla la connessione e riprova.', retry: 'Riprova',
    notFound: 'Questo corso non esiste o non è ancora pubblicato.', progress: (a, b) => `${a} di ${b} lezioni completate`,
    join: 'Entra nella lezione online', lesson: 'Lezione', objectives: 'Obiettivi', words: 'Parole da ricordare',
    activity: 'Attività pratica', recap: 'Per ricordare', quiz: 'Mettiti alla prova', check: 'Controlla',
    correct: 'Giusto!', wrong: 'Non proprio. Riprova.', hint: 'Suggerimento', pdf: 'Scarica il PDF della lezione',
    done: 'Segna come completata', undone: 'Completata ✓', prev: '← Precedente', next: 'Successiva →',
    locked: 'Non ancora disponibile', materials: 'Materiali', links: 'Link utili', start: 'Inizia',
    pages: (n) => (n === 1 ? '1 pagina' : `${n} pagine`), teacherTitle: 'Area docente', signIn: 'Entra',
    signOut: 'Esci', code: 'Codice di Google Authenticator (6 cifre)', badLogin: 'Codice non corretto. Se il codice era giusto, attendi il successivo.', tooMany: 'Troppi tentativi. Riprova tra 15 minuti.', loginOff: 'Accesso docente non configurato sul server.', released: 'Lezioni disponibili agli studenti',
    releasedNone: 'Nessuna', meeting: 'Link della lezione online (https://…)', save: 'Salva', saved: 'Salvato.',
    conflict: 'I dati sono stati modificati altrove: ho ricaricato lo stato. Ripeti la modifica.', saveError: 'Errore nel salvataggio.',
    notReleased: 'non visibile agli studenti', teacherMode: 'Modalità docente: vedi tutte le lezioni.', noLessons: 'Le lezioni saranno disponibili a breve.',
  },
  es: {
    skip: 'Ir al contenido', menu: 'Menú del curso', home: 'Mi curso', lessons: 'Las lecciones', upcoming: 'Próximamente',
    allCourses: '← Todos los cursos', teacher: 'Acceso docente', loading: 'Cargando el curso…',
    loadError: 'No puedo cargar el curso. Revisa la conexión e inténtalo de nuevo.', retry: 'Reintentar',
    notFound: 'Este curso no existe o aún no está publicado.', progress: (a, b) => `${a} de ${b} lecciones completadas`,
    join: 'Entrar en la clase en línea', lesson: 'Lección', objectives: 'Objetivos', words: 'Palabras clave',
    activity: 'Actividad práctica', recap: 'Para recordar', quiz: 'Ponte a prueba', check: 'Comprobar',
    correct: '¡Correcto!', wrong: 'No exactamente. Inténtalo otra vez.', hint: 'Pista', pdf: 'Descargar el PDF de la lección',
    done: 'Marcar como completada', undone: 'Completada ✓', prev: '← Anterior', next: 'Siguiente →',
    locked: 'Aún no disponible', materials: 'Materiales', links: 'Enlaces útiles', start: 'Empezar',
    pages: (n) => (n === 1 ? '1 página' : `${n} páginas`), teacherTitle: 'Área docente', signIn: 'Entrar',
    signOut: 'Salir', code: 'Código de Google Authenticator (6 cifras)', badLogin: 'Código incorrecto. Si el código era correcto, espera al siguiente.', tooMany: 'Demasiados intentos. Vuelve a probar en 15 minutos.', loginOff: 'El acceso docente no está configurado en el servidor.', released: 'Lecciones visibles para el alumnado',
    releasedNone: 'Ninguna', meeting: 'Enlace de la clase en línea (https://…)', save: 'Guardar', saved: 'Guardado.',
    conflict: 'Los datos cambiaron en otro sitio: he recargado el estado. Repite el cambio.', saveError: 'Error al guardar.',
    notReleased: 'no visible para el alumnado', teacherMode: 'Modo docente: ves todas las lecciones.', noLessons: 'Las lecciones estarán disponibles pronto.',
  },
  en: {
    skip: 'Skip to content', menu: 'Course menu', home: 'My course', lessons: 'Lessons', upcoming: 'Coming soon',
    allCourses: '← All courses', teacher: 'Teacher access', loading: 'Loading the course…',
    loadError: 'The course could not be loaded. Check your connection and try again.', retry: 'Try again',
    notFound: 'This course does not exist or is not published yet.', progress: (a, b) => `${a} of ${b} lessons completed`,
    join: 'Join the online lesson', lesson: 'Lesson', objectives: 'Objectives', words: 'Key words',
    activity: 'Hands-on activity', recap: 'Remember', quiz: 'Test yourself', check: 'Check',
    correct: 'Correct!', wrong: 'Not quite. Try again.', hint: 'Hint', pdf: 'Download the lesson PDF',
    done: 'Mark as completed', undone: 'Completed ✓', prev: '← Previous', next: 'Next →',
    locked: 'Not available yet', materials: 'Materials', links: 'Useful links', start: 'Start',
    pages: (n) => (n === 1 ? '1 page' : `${n} pages`), teacherTitle: 'Teacher area', signIn: 'Sign in',
    signOut: 'Sign out', code: 'Google Authenticator code (6 digits)', badLogin: 'Wrong code. If the code was right, wait for the next one.', tooMany: 'Too many attempts. Try again in 15 minutes.', loginOff: 'Teacher sign-in is not configured on the server.', released: 'Lessons visible to students',
    releasedNone: 'None', meeting: 'Online lesson link (https://…)', save: 'Save', saved: 'Saved.',
    conflict: 'The data changed elsewhere; the state was reloaded. Please repeat the change.', saveError: 'Could not save.',
    notReleased: 'hidden from students', teacherMode: 'Teacher mode: you see every lesson.', noLessons: 'Lessons will be available soon.',
  },
};

const root = document.getElementById('course-app');
const SLUG = root?.dataset.courseSlug;
const API = (root?.dataset.apiBase || '').replace(/\/+$/, '');
const TOKEN_KEY = 'pdf2course:teacher-session'; // una sesión vale para todos los cursos
const PROGRESS_KEY = `pdf2course:${SLUG}:progress`;
let t = I18N[(document.documentElement.lang || 'it').slice(0, 2)] ?? I18N.it;
let data = null;

// Ilustración decorativa fija (no contiene datos del curso).
const HERO_ART = `<svg xmlns="http://www.w3.org/2000/svg" class="hero-art" viewBox="0 0 350 275" fill="none" aria-hidden="true">
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
  </svg>`;
const heroArt = () => document.importNode(new DOMParser().parseFromString(HERO_ART, 'image/svg+xml').documentElement, true);
const themeClass = (l) => `lesson-theme-${((l.number - 1) % 4) + 1}`;

// ---------- utilidades ----------
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'href') {
      const safe = safeUrl(v);
      if (safe) el.setAttribute('href', safe);
    } else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
function safeUrl(u) {
  if (typeof u !== 'string') return null;
  if (u.startsWith('#') || (u.startsWith('/') && !u.startsWith('//'))) return u;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
const apiUrl = (p) => (p && p.startsWith('/') ? API + p : p);
const store = {
  get(k, fallback, s = localStorage) {
    try {
      return JSON.parse(s.getItem(k)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(k, v, s = localStorage) {
    try {
      s.setItem(k, JSON.stringify(v));
    } catch {
      /* almacenamiento no disponible: el progreso dura solo esta sesión */
    }
  },
  del(k, s = localStorage) {
    try {
      s.removeItem(k);
    } catch {}
  },
};
const token = () => {
  const s = store.get(TOKEN_KEY, null, sessionStorage);
  return s?.token && new Date(s.expiresAt) > new Date() ? s.token : null;
};
let memoryProgress = null;
const progress = () => memoryProgress ?? (memoryProgress = store.get(PROGRESS_KEY, { done: {}, activities: {} }));
const saveProgress = () => store.set(PROGRESS_KEY, progress());

async function api(path, { method = 'GET', body, auth = Boolean(token()) } = {}) {
  const headers = {};
  if (auth && token()) headers.Authorization = `Bearer ${token()}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(15000) });
  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, json };
}

// ---------- extensiones ----------
// Un curso puede declarar `extensions: [nombre, …]` en course.yaml. Cada una es un módulo
// extensions/<nombre>.js que puede exportar: init(api), navLinks(api), footActions(api), route(hash, api).
// Una extensión que falla nunca debe romper el curso.
const EXT_CACHE_KEY = `pdf2course:${SLUG}:extensions`;
let extensions = [];
const extApi = {
  h, store, safeUrl, progress, saveProgress, slug: SLUG,
  get data() { return data; },
  get t() { return t; },
  refresh: () => route({ keepScroll: true }),
};
async function loadExtensions(names) {
  extensions = [];
  for (const name of names) {
    if (typeof name !== 'string' || !/^[a-z0-9-]+$/.test(name)) continue;
    try {
      const m = await import(new URL(`./extensions/${name}.js`, import.meta.url));
      await m.init?.(extApi);
      extensions.push(m);
    } catch {
      /* ignorar */
    }
  }
}
function extNodes(hook) {
  return extensions.flatMap((m) => {
    try {
      return [m[hook]?.(extApi)].flat();
    } catch {
      return [];
    }
  }).filter(Boolean);
}
function routeExtension(hash, opts = {}) {
  for (const m of extensions) {
    let node = null;
    try {
      node = m.route?.(hash, extApi);
    } catch {}
    if (node) {
      render(node);
      if (!opts.keepScroll) {
        document.getElementById('main')?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      }
      return true;
    }
  }
  return false;
}

// ---------- carga ----------
async function load() {
  render(h('p', { class: 'status', role: 'status' }, t.loading));
  try {
    let res = await api(`/api/courses/${encodeURIComponent(SLUG)}`);
    if (res.status === 401 || (token() && res.ok && !res.json.teacher)) {
      store.del(TOKEN_KEY, sessionStorage);
      res = await api(`/api/courses/${encodeURIComponent(SLUG)}`, { auth: false });
    }
    if (res.status === 404) return render(h('p', { class: 'status' }, t.notFound));
    if (!res.ok) throw new Error(String(res.status));
    data = res.json;
    t = I18N[data.course.language?.slice(0, 2)] ?? t;
    applyTheme(data.course);
    store.set(EXT_CACHE_KEY, data.course.extensions ?? []);
    await loadExtensions(data.course.extensions ?? []);
    route();
  } catch {
    // Sin conexión con el Worker: las extensiones que funcionan sin datos (p. ej. el laboratorio) siguen disponibles.
    await loadExtensions(store.get(EXT_CACHE_KEY, []));
    if (routeExtension(decodeURIComponent(location.hash.slice(1)))) return;
    render(h('div', { class: 'status' }, h('p', {}, t.loadError), h('button', { class: 'btn', type: 'button', onclick: load }, t.retry), extNodes('offlineLinks')));
  }
}

function applyTheme(course) {
  const s = document.documentElement.style;
  if (course.theme?.primary) s.setProperty('--c-primary', course.theme.primary);
  if (course.theme?.accent) s.setProperty('--c-accent', course.theme.accent);
  if (course.theme?.background) s.setProperty('--c-bg', course.theme.background);
  document.title = `${course.title}${course.organization ? ` · ${course.organization}` : ''}`;
}

// ---------- layout ----------
function render(main) {
  root.replaceChildren(
    h('a', { class: 'skip-link', href: '#main' }, t.skip),
    data ? sidebar() : null,
    h('main', { id: 'main', class: 'main', tabindex: '-1' }, main),
  );
}

function sidebar() {
  const c = data.course;
  const current = location.hash || '#home';
  const nav = h('nav', { id: 'course-nav', class: 'nav', 'aria-label': t.menu },
    h('a', { href: '#home', class: 'nav-link', 'aria-current': current === '#home' ? 'page' : null }, t.home),
    h('p', { class: 'nav-caption' }, t.lessons),
    data.lessons.map((l) =>
      h('a', { href: `#lezione/${l.id}`, class: 'nav-link', 'aria-current': current === `#lezione/${l.id}` ? 'page' : null },
        h('span', { class: 'nav-num' }, l.number), ' ', l.shortTitle, progress().done[l.id] ? h('span', { class: 'nav-done', 'aria-label': t.undone }, ' ✓') : null)),
    data.upcoming.length ? h('p', { class: 'nav-caption' }, t.upcoming) : null,
    data.upcoming.map((u) => h('span', { class: 'nav-link is-locked', 'aria-disabled': 'true' }, h('span', { class: 'nav-num' }, u.number), ' ', u.title)),
    extNodes('navLinks'),
  );
  const toggle = h('button', { type: 'button', class: 'menu-toggle', 'aria-expanded': 'false', 'aria-controls': 'course-nav',
    onclick: (e) => {
      const open = e.currentTarget.getAttribute('aria-expanded') !== 'true';
      e.currentTarget.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    } }, '☰ ', t.menu);
  return h('aside', { class: 'sidebar' },
    c.imageUrl ? h('img', { class: 'logo', src: apiUrl(c.imageUrl), alt: c.image?.alt ?? '', loading: 'lazy', onerror: (e) => e.currentTarget.remove() }) : null,
    h('a', { class: 'brand', href: '#home' }, c.title),
    c.organization ? h('p', { class: 'org' }, c.organization) : null,
    toggle,
    nav,
    h('div', { class: 'sidebar-foot' },
      extNodes('footActions'),
      h('a', { href: '/courses/' }, t.allCourses),
      h('a', { href: '#docente' }, data.teacher ? `${t.teacherTitle} ●` : t.teacher)),
  );
}

// ---------- rutas ----------
function route(opts = {}) {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (routeExtension(hash, opts)) return;
  if (hash === 'docente') render(teacherView());
  else if (hash.startsWith('lezione/')) {
    const lesson = data.lessons.find((l) => l.id === hash.slice(8));
    render(lesson ? lessonView(lesson) : homeView());
  } else render(homeView());
  document.getElementById('main')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
addEventListener('hashchange', () => (data ? route() : load()));

function homeView() {
  const c = data.course;
  const done = data.lessons.filter((l) => progress().done[l.id]).length;
  return h('div', { class: 'home' },
    data.teacher ? h('p', { class: 'notice' }, t.teacherMode) : null,
    h('div', { class: 'hero-grid' }, h('header', { class: 'hero' },
      h('h1', {}, c.title),
      c.subtitle ? h('p', { class: 'subtitle' }, c.subtitle) : null,
      c.description ? h('p', { class: 'lead' }, c.description) : null,
      h('div', { class: 'meta' }, [c.format, c.duration, c.level, c.languageLabel].filter(Boolean).map((m) => h('span', { class: 'tag' }, m))),
      c.meetingUrl ? h('a', { class: 'btn btn-primary', href: c.meetingUrl, target: '_blank', rel: 'noopener noreferrer' }, t.join) : null,
    ), heroArt()),
    data.lessons.length
      ? h('section', { 'aria-labelledby': 'h-lessons' },
          h('h2', { id: 'h-lessons' }, t.lessons),
          h('div', { class: 'progress-panel' },
            h('p', { class: 'progress-text' }, t.progress(done, data.lessons.length)),
            h('progress', { max: String(data.lessons.length), value: String(done), 'aria-hidden': 'true' })),
          data.lessons.length + data.upcoming.length > 1 ? h('ol', { class: 'course-roadmap', 'aria-label': t.lessons }, [...data.lessons.map((l) =>
            h('li', {}, h('a', { class: `roadmap-step ${themeClass(l)}`, href: `#lezione/${l.id}` },
              h('span', { class: 'roadmap-circle' }, progress().done[l.id] ? '✓' : l.number), h('span', {}, h('strong', {}, l.shortTitle))))),
            ...data.upcoming.map((u) => h('li', {}, h('span', { class: 'roadmap-step' }, h('span', { class: 'roadmap-circle' }, u.number), h('span', {}, h('strong', {}, u.title), h('small', {}, t.locked)))))]) : null,
          h('ol', { class: 'cards' }, data.lessons.map((l) =>
            h('li', { class: `card ${themeClass(l)}` },
              h('a', { href: `#lezione/${l.id}` },
                h('span', { class: 'card-num' }, `${t.lesson} ${l.number}`),
                h('strong', { class: 'card-title' }, l.title),
                l.description ? h('span', { class: 'card-desc' }, l.description) : null,
                h('span', { class: 'card-foot' }, progress().done[l.id] ? t.undone : t.start),
                data.teacher && l.number > data.state.releasedThrough ? h('span', { class: 'badge' }, t.notReleased) : null)))),
          data.upcoming.length ? h('ul', { class: 'cards upcoming' }, data.upcoming.map((u) =>
            h('li', { class: 'card is-locked' }, h('span', { class: 'card-num' }, `${t.lesson} ${u.number}`), h('strong', { class: 'card-title' }, u.title), h('span', { class: 'card-foot' }, t.locked)))) : null)
      : h('p', { class: 'notice' }, t.noLessons),
    data.publicAssets?.length ? h('section', {}, h('h2', {}, t.materials), h('ul', { class: 'list' }, data.publicAssets.map((a) => h('li', {}, h('a', { href: apiUrl(a.url), target: '_blank', rel: 'noopener' }, a.name))))) : null,
    c.links?.length ? h('section', {}, h('h2', {}, t.links), h('ul', { class: 'list' }, c.links.map((l) => h('li', {}, h('a', { href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.label))))) : null,
  );
}

function lessonView(l) {
  const i = data.lessons.indexOf(l);
  const prev = data.lessons[i - 1];
  const next = data.lessons[i + 1];
  const p = progress();
  return h('article', { class: 'lesson' },
    h('p', { class: 'eyebrow' }, `${t.lesson} ${l.number}`),
    h('h1', {}, l.title),
    data.teacher && l.number > data.state.releasedThrough ? h('p', { class: 'notice' }, t.notReleased) : null,
    l.description ? h('p', { class: 'lead' }, l.description) : null,
    l.objectives.length ? box(t.objectives, h('ul', {}, l.objectives.map((o) => h('li', {}, o)))) : null,
    l.sections.map((s) => h('section', { class: 'content' }, s.heading ? h('h2', {}, s.heading) : null, s.paragraphs.map((x) => h('p', {}, x)))),
    l.words.length ? box(t.words, h('dl', { class: 'words' }, l.words.map((w) => [h('dt', {}, w.term), h('dd', {}, w.definition)]))) : null,
    l.activity ? box(`${t.activity}: ${l.activity.title}`, h('ol', { class: 'steps' }, l.activity.steps.map((s, k) => {
      const key = `${l.id}:${k}`;
      return h('li', {}, h('label', {}, h('input', { type: 'checkbox', checked: Boolean(p.activities[key]), onchange: (e) => { p.activities[key] = e.target.checked; saveProgress(); } }), ' ', s));
    }))) : null,
    l.recap.length ? box(t.recap, h('ul', {}, l.recap.map((r) => h('li', {}, r)))) : null,
    l.quiz.length ? quizView(l) : null,
    h('div', { class: 'actions' },
      l.pdfUrl ? pdfButton(l) : null,
      h('button', { type: 'button', class: `btn ${p.done[l.id] ? 'is-done' : 'btn-primary'}`, 'aria-pressed': String(Boolean(p.done[l.id])),
        onclick: () => { p.done[l.id] = !p.done[l.id]; saveProgress(); route(); } }, p.done[l.id] ? t.undone : t.done)),
    h('nav', { class: 'pager', 'aria-label': t.lessons },
      prev ? h('a', { class: 'btn', href: `#lezione/${prev.id}` }, t.prev) : h('span'),
      next ? h('a', { class: 'btn', href: `#lezione/${next.id}` }, t.next) : null),
  );
}

function box(title, body) {
  return h('section', { class: 'box' }, h('h2', {}, title), body);
}

function pdfButton(l) {
  const label = `${t.pdf}${l.pageCount ? ` (${t.pages(l.pageCount)})` : ''}`;
  if (!data.teacher) return h('a', { class: 'btn', href: apiUrl(l.pdfUrl), target: '_blank', rel: 'noopener' }, label);
  // El docente puede descargar PDFs aún no liberados: hace falta la cabecera Authorization.
  return h('button', { type: 'button', class: 'btn', onclick: async () => {
    const res = await fetch(apiUrl(l.pdfUrl), { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) return;
    const url = URL.createObjectURL(await res.blob());
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } }, label);
}

function quizView(l) {
  return box(t.quiz, h('div', { class: 'quiz' }, l.quiz.map((q, qi) => {
    const name = `q-${l.id}-${qi}`;
    const feedback = h('p', { class: 'feedback', role: 'status' });
    const form = h('form', { class: 'question', onsubmit: (e) => {
      e.preventDefault();
      const chosen = new FormData(e.currentTarget).get(name);
      if (chosen === null) return;
      const ok = Number(chosen) === q.correct;
      feedback.className = `feedback ${ok ? 'ok' : 'ko'}`;
      feedback.replaceChildren(ok ? t.correct : t.wrong);
      if (!ok && q.hint) feedback.append(h('span', { class: 'hint' }, ` ${t.hint}: ${q.hint}`));
    } },
      h('fieldset', {}, h('legend', {}, `${qi + 1}. ${q.prompt}`),
        q.options.map((o, oi) => h('label', { class: 'option' }, h('input', { type: 'radio', name, value: String(oi) }), ' ', o))),
      h('button', { type: 'submit', class: 'btn' }, t.check),
      feedback);
    return form;
  })));
}

// ---------- docente ----------
function teacherView() {
  if (!data.teacher) {
    const msg = h('p', { class: 'feedback ko', role: 'alert' });
    return h('section', { class: 'teacher' }, h('h1', {}, t.teacherTitle),
      h('form', { class: 'box', onsubmit: async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const button = e.currentTarget.querySelector('button');
        button.disabled = true;
        msg.textContent = '';
        try {
          const auth = await api('/api/auth/login', {
            method: 'POST',
            auth: false,
            body: { code: String(form.get('code') ?? '').replace(/\s/g, '') },
          }).catch(() => ({ ok: false }));
          if (!auth.ok) {
            msg.textContent = auth.status === 401 ? t.badLogin : auth.status === 429 ? t.tooMany : auth.status === 503 ? t.loginOff : t.loadError;
            return;
          }
          store.set(TOKEN_KEY, auth.json, sessionStorage);
          const res = await api(`/api/courses/${encodeURIComponent(SLUG)}/admin`).catch(() => ({ ok: false }));
          if (!res.ok) {
            msg.textContent = t.loadError;
            return;
          }
          data = res.json;
          route();
        } finally {
          button.disabled = false;
        }
      } },
        h('label', { for: 'otp' }, t.code),
        h('input', { id: 'otp', name: 'code', type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', pattern: '[0-9 ]{6,7}', maxlength: '7', required: true, placeholder: '123 456' }),
        h('button', { type: 'submit', class: 'btn btn-primary' }, t.signIn), msg));
  }
  const s = data.state;
  const msg = h('p', { class: 'feedback', role: 'status' });
  const select = h('select', { id: 'released', name: 'released' },
    h('option', { value: '0', selected: s.releasedThrough === 0 }, t.releasedNone),
    data.lessons.map((l) => h('option', { value: String(l.number), selected: s.releasedThrough === l.number }, `1–${l.number} · ${l.shortTitle}`)));
  const meeting = h('input', { id: 'meeting', type: 'url', inputmode: 'url', pattern: 'https://.*', value: s.meetingUrl ?? '' });
  return h('section', { class: 'teacher' }, h('h1', {}, t.teacherTitle),
    h('form', { class: 'box', onsubmit: async (e) => {
      e.preventDefault();
      const res = await api(`/api/courses/${encodeURIComponent(SLUG)}/admin`, {
        method: 'PATCH',
        body: { releasedThrough: Number(select.value), meetingUrl: meeting.value.trim(), revision: s.revision },
      }).catch(() => ({ ok: false }));
      if (res.status === 409) {
        data.state = res.json.state;
        msg.textContent = t.conflict;
        return;
      }
      if (!res.ok) {
        msg.textContent = t.saveError;
        return;
      }
      data = res.json;
      route();
      document.querySelector('.teacher .feedback')?.replaceChildren(t.saved);
    } },
      h('label', { for: 'released' }, t.released), select,
      h('label', { for: 'meeting' }, t.meeting), meeting,
      h('div', { class: 'actions' },
        h('button', { type: 'submit', class: 'btn btn-primary' }, t.save),
        h('button', { type: 'button', class: 'btn', onclick: () => { store.del(TOKEN_KEY, sessionStorage); load(); location.hash = '#home'; } }, t.signOut)),
      msg));
}

if (root && SLUG && API) {
  root.dataset.engineVersion = ENGINE_VERSION;
  load();
}
