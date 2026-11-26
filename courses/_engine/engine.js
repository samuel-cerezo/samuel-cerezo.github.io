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
    route();
  } catch {
    render(h('div', { class: 'status' }, h('p', {}, t.loadError), h('button', { class: 'btn', type: 'button', onclick: load }, t.retry)));
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
      h('a', { href: '/courses/' }, t.allCourses),
      h('a', { href: '#docente' }, data.teacher ? `${t.teacherTitle} ●` : t.teacher)),
  );
}

// ---------- rutas ----------
function route() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash === 'docente') render(teacherView());
  else if (hash.startsWith('lezione/')) {
    const lesson = data.lessons.find((l) => l.id === hash.slice(8));
    render(lesson ? lessonView(lesson) : homeView());
  } else render(homeView());
  document.getElementById('main')?.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
addEventListener('hashchange', () => data && route());

function homeView() {
  const c = data.course;
  const done = data.lessons.filter((l) => progress().done[l.id]).length;
  return h('div', { class: 'home' },
    data.teacher ? h('p', { class: 'notice' }, t.teacherMode) : null,
    h('header', { class: 'hero' },
      h('h1', {}, c.title),
      c.subtitle ? h('p', { class: 'subtitle' }, c.subtitle) : null,
      c.description ? h('p', { class: 'lead' }, c.description) : null,
      h('div', { class: 'meta' }, [c.format, c.duration, c.level, c.languageLabel].filter(Boolean).map((m) => h('span', { class: 'tag' }, m))),
      c.meetingUrl ? h('a', { class: 'btn btn-primary', href: c.meetingUrl, target: '_blank', rel: 'noopener noreferrer' }, t.join) : null,
    ),
    data.lessons.length
      ? h('section', { 'aria-labelledby': 'h-lessons' },
          h('h2', { id: 'h-lessons' }, t.lessons),
          h('p', { class: 'progress-text' }, t.progress(done, data.lessons.length)),
          h('progress', { max: String(data.lessons.length), value: String(done), 'aria-hidden': 'true' }),
          h('ol', { class: 'cards' }, data.lessons.map((l) =>
            h('li', { class: 'card' },
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
