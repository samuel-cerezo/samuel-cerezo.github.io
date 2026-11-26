// Extensión «legacy-progress»: recupera las lecciones completadas del curso antiguo
// (localStorage «ppd-completed», lista de números de lección) una sola vez.
export function init(api) {
  const doneKey = `pdf2course:${api.slug}:legacy-progress-imported`;
  if (api.store.get(doneKey, false)) return;
  api.store.set(doneKey, true);
  const old = api.store.get('ppd-completed', []);
  if (!Array.isArray(old) || !api.data) return;
  const p = api.progress();
  let changed = false;
  for (const n of old) {
    const lesson = api.data.lessons.find((l) => l.number === n);
    if (Number.isInteger(n) && lesson && !p.done[lesson.id]) { p.done[lesson.id] = true; changed = true; }
  }
  if (changed) api.saveProgress();
}
