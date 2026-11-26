// Extensión «large-text»: botón para agrandar el texto. Preferencia guardada en este dispositivo.
// Migra la preferencia del curso antiguo (clave localStorage «ppd-large-text»).
let key;
const isOn = (api) => api.store.get(key, false) === true;
const apply = (api) => document.documentElement.classList.toggle('large-text', isOn(api));

export function init(api) {
  key = `pdf2course:${api.slug}:large-text`;
  if (api.store.get(key, null) === null && api.store.get('ppd-large-text', false) === true) api.store.set(key, true);
  apply(api);
}

export function footActions(api) {
  const on = isOn(api);
  return api.h('button', {
    type: 'button', class: 'btn btn-ghost text-size-btn', 'aria-pressed': String(on),
    onclick: () => { api.store.set(key, !isOn(api)); apply(api); api.refresh(); },
  }, on ? 'Testo standard' : 'Testo più grande');
}
