// Extensión «attestato» (usada por «classic»): lógica del lado del navegador para pedir el attestato.
// El attestato lo dibuja y firma el Worker (worker/src/certificates.js) cuando el docente confirma por mail;
// aquí solo se comprueba el progreso local y se limpia el nombre. Funciones puras, probadas con node --test.

export const cleanName = (v) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);

/** Pide: todos los quiz con preguntas contestadas, el laboratorio completo y todas las lecciones abiertas. */
export function isComplete({ lessons, total, quizDone, labDone }) {
  const missingQuiz = lessons.filter((l) => (l.quizCount ?? 0) > 0 && !quizDone(l)).map((l) => l.key);
  const lessonsOpen = Math.max(0, (total ?? lessons.length) - lessons.length);
  const labMissing = !labDone();
  return { ok: missingQuiz.length === 0 && !labMissing && lessonsOpen === 0, missingQuiz, labMissing, lessonsOpen };
}
