// Extensión «attestato» (usada por «classic»): certificado de finalización en PDF.
// Se desbloquea cuando el alumno respondió todos los quiz y completó todos los laboratorios.
// Todo ocurre en el navegador (el progreso vive en este dispositivo, sin registro): el alumno
// escribe su nombre, se dibuja el certificado en un canvas A4 con Source Sans 3 y se empaqueta en un PDF.
// Las funciones puras (isComplete, buildPdf, wrap, cleanName, bulletsOf) no tocan el DOM y se prueban con node --test.

export const PAGE = { w: 2480, h: 1754 }; // A4 apaisado a ~212 dpi
const PT = { w: 842, h: 595 };            // A4 apaisado en puntos PDF

export const cleanName = (v) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);

/** Quiz respondido = todas las preguntas contestadas y comprobadas. Un quiz sin preguntas no bloquea. */
export function isComplete({ lessons, total, quizDone, labDone }) {
  const missingQuiz = lessons.filter((l) => (l.quizCount ?? 0) > 0 && !quizDone(l)).map((l) => l.key);
  const lessonsOpen = Math.max(0, (total ?? lessons.length) - lessons.length);
  const labMissing = !labDone();
  return { ok: missingQuiz.length === 0 && !labMissing && lessonsOpen === 0, missingQuiz, labMissing, lessonsOpen };
}

/** Cinco contenidos: `look.attestato.bullets` del course.yaml; si faltan, los títulos de las lecciones. */
export function bulletsOf(look, lessons) {
  const own = Array.isArray(look?.attestato?.bullets) ? look.attestato.bullets.map((b) => String(b).trim()).filter(Boolean) : [];
  const list = own.length ? own : lessons.map((l) => l.title);
  return list.slice(0, 5);
}

/** Parte `text` en líneas que quepan en `maxWidth`; `measure(str)` devuelve el ancho. */
export function wrap(text, maxWidth, measure) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const enc = new TextEncoder();
/** PDF mínimo de una página A4 apaisada con una imagen JPEG a pantalla completa. */
export function buildPdf(jpeg, width, height, title = 'Attestato') {
  const safeTitle = String(title).replace(/[^\x20-\x7e]/g, '?').replace(/[()\\]/g, ' ');
  const parts = [];
  const offsets = [];
  let size = 0;
  const push = (chunk) => { const b = typeof chunk === 'string' ? enc.encode(chunk) : chunk; parts.push(b); size += b.length; };
  const obj = (n, body) => { offsets[n] = size; push(`${n} 0 obj\n`); for (const c of [].concat(body)) push(c); push('\nendobj\n'); };
  const content = `q ${PT.w} 0 0 ${PT.h} 0 0 cm /Im0 Do Q`;
  push('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PT.w} ${PT.h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, [`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream']);
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  obj(6, `<< /Title (${safeTitle}) /Producer (pdf2course) >>`);
  const xref = size;
  push(`xref\n0 7\n0000000000 65535 f \n${[1, 2, 3, 4, 5, 6].map((n) => `${String(offsets[n]).padStart(10, '0')} 00000 n \n`).join('')}`);
  push(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

// ---------- dibujo del certificado (navegador) ----------
const FONT = '"Source Sans 3", system-ui, "Segoe UI", sans-serif';
const C = { paper: '#fcfaf3', ink: '#27332b', soft: '#5d6b61', green: '#4f7a5a', gold: '#b48a3a', line: '#d9d2bd' };

/** Dibuja el certificado en `canvas`. `logos` = imágenes ya cargadas (ImageBitmap o HTMLImageElement). */
export function drawCertificate(canvas, { name, courseTitle, subtitle, organization, bullets, meta, dateText, logos = [] }) {
  const { w, h } = PAGE;
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d');
  const center = (txt, y, font, color, spacing = 0) => {
    g.font = font; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = `${spacing}px`;
    g.fillText(txt, w / 2, y);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  };
  g.fillStyle = C.paper; g.fillRect(0, 0, w, h);
  g.strokeStyle = C.green; g.lineWidth = 14; g.strokeRect(70, 70, w - 140, h - 140);
  g.strokeStyle = C.gold; g.lineWidth = 4; g.strokeRect(100, 100, w - 200, h - 200);

  // logos
  let y = 200;
  if (logos.length) {
    const maxH = 120;
    const sized = logos.map((im) => { const k = Math.min(maxH / im.height, 1); return { im, w: im.width * k, h: im.height * k }; });
    const gap = 60;
    let x = (w - (sized.reduce((s, l) => s + l.w, 0) + gap * (sized.length - 1))) / 2;
    for (const l of sized) { g.drawImage(l.im, x, y + (maxH - l.h) / 2, l.w, l.h); x += l.w + gap; }
    y += maxH + 60;
  } else y += 40;

  if (organization) center(organization.toUpperCase(), y + 20, `600 34px ${FONT}`, C.soft, 6);
  center('ATTESTATO DI PARTECIPAZIONE', y + 100, `700 66px ${FONT}`, C.green, 8);
  g.fillStyle = C.gold; g.fillRect(w / 2 - 90, y + 130, 180, 5);
  center('Si attesta che', y + 205, `400 38px ${FONT}`, C.soft);
  let nameSize = 112;
  g.font = `700 ${nameSize}px ${FONT}`;
  while (g.measureText(name).width > w - 520 && nameSize > 50) { nameSize -= 4; g.font = `700 ${nameSize}px ${FONT}`; }
  center(name, y + 325, `700 ${nameSize}px ${FONT}`, C.ink);
  g.fillStyle = C.line; g.fillRect(w / 2 - 560, y + 352, 1120, 3);
  center('ha completato il corso', y + 412, `400 38px ${FONT}`, C.soft);
  center(courseTitle, y + 495, `700 72px ${FONT}`, C.green);
  let by = y + 528;
  if (subtitle) { center(subtitle, by + 40, `400 36px ${FONT}`, C.soft); by += 50; }
  if (meta) { center(meta, by + 44, `600 32px ${FONT}`, C.soft, 1); by += 54; }

  // contenidos (5 bullets)
  const colX = 520, maxW = w - 2 * colX;
  g.textAlign = 'left';
  g.font = `700 34px ${FONT}`; g.fillStyle = C.gold;
  if ('letterSpacing' in g) g.letterSpacing = '4px';
  g.fillText('CONTENUTI DEL CORSO', colX, by + 80);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  let ly = by + 135;
  g.font = `400 36px ${FONT}`;
  for (const b of bullets.slice(0, 5)) {
    const lines = wrap(b, maxW - 50, (s) => g.measureText(s).width);
    g.fillStyle = C.green; g.beginPath(); g.arc(colX + 10, ly - 12, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.ink;
    for (const [i, line] of lines.entries()) g.fillText(line, colX + 50, ly + i * 46);
    ly += lines.length * 46 + 14;
  }

  // pie
  const fy = h - 215;
  g.fillStyle = C.line; g.fillRect(260, fy, 520, 3); g.fillRect(w - 780, fy, 520, 3);
  g.textAlign = 'center'; g.fillStyle = C.ink; g.font = `600 34px ${FONT}`;
  g.fillText(dateText, 520, fy - 14);
  g.fillStyle = C.soft; g.font = `400 28px ${FONT}`;
  g.fillText('Data', 520, fy + 40); g.fillText('Il docente', w - 520, fy + 40);
  g.textAlign = 'center'; g.fillStyle = C.soft; g.font = `400 26px ${FONT}`;
  g.fillText('Quiz di ripasso e laboratori del corso completati.', w / 2, h - 135);
}

export async function certificatePdf(canvas, title) {
  const blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), 'image/jpeg', 0.92));
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  return buildPdf(jpeg, canvas.width, canvas.height, title);
}

/** Carga imágenes sin «ensuciar» el canvas (fetch → blob). Las que fallan se omiten. */
export async function loadLogos(urls) {
  const out = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) continue;
      out.push(await createImageBitmap(await res.blob()));
    } catch { /* sin logo: el certificado sigue siendo válido */ }
  }
  return out;
}

export async function ensureFonts() {
  try { await Promise.all([document.fonts.load(`700 60px ${FONT}`), document.fonts.load(`400 36px ${FONT}`), document.fonts.load(`600 34px ${FONT}`)]); } catch { /* usa la fuente de reserva */ }
}
