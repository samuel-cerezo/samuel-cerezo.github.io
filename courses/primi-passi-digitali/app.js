'use strict';

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
  get(key, fallback) { try { const value=localStorage.getItem(key); return value===null?fallback:JSON.parse(value); } catch { return fallback; } },
  set(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
};
let content, current={page:'home'}, step=0, toastTimer, adminData=null, features;
function availableLesson(id){return content.lessons.find(l=>l.id===id);}
function zoomEntry(cls='btn btn-primary'){return content.course.meetingUrl?`<a class="${cls}" href="${esc(content.course.meetingUrl)}" target="_blank" rel="noopener noreferrer">${icon('video')} Entra nella lezione su Zoom ${icon('arrow')}</a>`:`<a class="${cls}" href="#aiuto">${icon('video')} Come entrare su Zoom ${icon('arrow')}</a>`;}

let completed = storage.get('ppd-completed',[]);
if (!Array.isArray(completed)) completed=[];
completed = completed.filter(n => Number.isInteger(n) && n>=1 && n<=4);
let largeText=storage.get('ppd-large-text',false)===true;
const main=document.getElementById('main');

function applyTextSize(){
  document.body.classList.toggle('large-text',largeText);
  const b=document.getElementById('text-size');
  b.setAttribute('aria-pressed',String(largeText));
  b.setAttribute('title',largeText?'Ripristina la dimensione del testo':'Ingrandisci il testo');
  b.setAttribute('aria-label',largeText?'Ripristina la dimensione del testo':'Ingrandisci il testo');
  b.querySelector('.text-size-label').textContent=largeText?'Testo standard':'Testo più grande';
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

function renderNavigation(){
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
  document.getElementById('lesson-navigation').innerHTML=content.lessons.map(l=>`<a class="nav-link ${current.page==='lesson'&&current.id===l.id?'active':''}" href="#lezione-${l.id}" ${current.page==='lesson'&&current.id===l.id?'aria-current="page"':''}><span class="nav-num">${String(l.id).padStart(2,'0')}</span><span>${esc(l.shortTitle)}</span>${completed.includes(l.id)?`<span class="nav-done" aria-label="Completata">${icon('check')}</span>`:''}</a>`).join('');
  let tools=document.getElementById('course-tools');
  if(!tools){tools=document.createElement('div');tools.id='course-tools';document.querySelector('nav').append(tools);}
  tools.innerHTML=`<a class="nav-link ${current.page==='materials'?'active':''}" href="#materiali">${icon('download')} Materiali e PDF</a>${(availableLesson(1)||content.practiceAvailable)?`<a class="nav-link ${current.page==='lab'?'active':''}" href="#laboratorio">${icon('computer')} Laboratorio PC</a>`:''}<a class="nav-link teacher-link ${current.page==='admin'?'active':''}" href="#docente">${icon('pencil')} ${content.canManage?'Area docente':'Accesso docente'}</a>`;
  document.querySelector('.home-link').classList.toggle('active',current.page==='home');
  document.querySelector('.help-link').classList.toggle('active',current.page==='help');
  for (const [selector,active] of [['.home-link',current.page==='home'],['.help-link',current.page==='help']]) {
    const link=document.querySelector(selector);
    if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
}

function home(){
 const n=completed.filter(id=>availableLesson(id)).length;
 return `<section class="hero" aria-labelledby="home-title"><div><p class="eyebrow">IL TUO PERCORSO COMINCIA QUI</p><h1 id="home-title">Il tuo percorso<br>con il PC.</h1><p class="intro">Il PC e i suoi strumenti, per le cose di ogni giorno. Finestre, file, cartelle e attività pratiche: impariamo un argomento alla volta.</p>${zoomEntry('hero-join')}<div class="course-facts"><span>${icon('calendar')} 4 mercoledì</span><span>${icon('clock')} 2 ore a incontro</span><span>${icon('coffee')} Pausa di 5 minuti</span></div></div>${heroArt()}</section>
 <section class="progress-panel" aria-label="I tuoi progressi"><div class="progress-copy"><strong>${n===0?'Ogni passo conta.':n===4?'Hai completato il percorso!':'Stai facendo progressi.'}</strong><span>${content.lessons.length} ${content.lessons.length===1?'lezione disponibile':'lezioni disponibili'} di 4</span></div><div class="progress-right"><div class="progress-track" role="progressbar" aria-label="Lezioni segnate come completate" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="4"><div class="progress-fill" style="width:${n*25}%"></div></div><span class="progress-amount">${n} di 4 completate</span></div></section>
 <section aria-labelledby="lessons-title"><div class="section-heading"><h2 id="lessons-title">Le lezioni, in ordine</h2><span>Un argomento alla volta</span></div>${roadmap()}<div class="lessons-grid ${content.lessons.length===1?'single':''}">${content.lessons.map(l=>`<article class="lesson-card lesson-theme-${l.id} ${l.id===1?'featured':''}"><div class="card-top"><span class="lesson-icon ${l.color}">${icon(l.icon)}</span><div class="lesson-meta">LEZIONE ${String(l.id).padStart(2,'0')} <span></span> 2 ORE</div></div><h3><span class="lesson-title-number">${l.id}.</span> ${esc(l.title)}</h3><p>${esc(l.description)}</p><div class="card-bottom"><span class="card-state">${completed.includes(l.id)?icon('check')+' Completata':'Disponibile'}</span><a class="card-action" href="#lezione-${l.id}" aria-label="Apri la lezione ${l.id}: ${esc(l.title)}">Apri la lezione ${icon('arrow')}</a></div></article>`).join('')}</div>${content.lessons.length===0?'<div class="objective-box"><p>Le lezioni compariranno qui quando il docente le renderà disponibili.</p></div>':''}${content.lessons.length<4?'<p class="release-note">Le altre lezioni appariranno qui quando le affronteremo insieme. Quelle già aperte restano disponibili per ripassare.</p>':''}</section>
 <aside class="bottom-note">${icon('folder')}<div><strong>Porta i materiali con te.</strong><p>Scarica le schede PDF sul PC per rileggerle o stamparle quando vuoi.</p></div><a href="#materiali">Apri i materiali</a></aside>
`;
}

function roadmap(){const labels=['Il PC','Internet','Email','Sicurezza'];return `<nav class="course-roadmap" aria-label="Ordine delle quattro lezioni">${[1,2,3,4].map(id=>{const l=availableLesson(id);return l?`<a href="#lezione-${id}" class="roadmap-step available lesson-theme-${id}"><span class="roadmap-circle">${completed.includes(id)?icon('check'):id}</span><span><strong>Lezione ${id}</strong><small>${labels[id-1]}</small></span></a>`:`<span class="roadmap-step locked"><span class="roadmap-circle">${id}</span><span><strong>Lezione ${id}</strong><small>Da aprire</small></span></span>`;}).join('')}</nav>`;}
function visual(type){const labels={bookmark:'La stella conserva il sito tra i preferiti',mouse:'Un clic seleziona, due clic aprono',keyboard:'Invio va a capo; Backspace cancella a sinistra',file:'Un nome descrittivo aiuta a riconoscere il documento',folder:'Una cartella raccoglie i documenti',browser:'La barra degli indirizzi e il comando indietro',search:'Una ricerca precisa indica servizio, luogo e informazione',mail:'Destinatario, oggetto, testo e allegato',shield:'Fermati, controlla e verifica da un canale conosciuto'};return `<figure class="lesson-diagram"><a href="/courses/primi-passi-digitali/assets/diagrams/${type}.svg" target="_blank" rel="noopener noreferrer" aria-label="Ingrandisci lo schema: ${labels[type]}"><img src="/courses/primi-passi-digitali/assets/diagrams/${type}.svg" alt="${labels[type]}" width="760" height="340"></a><figcaption>Schema della lezione · Tocca per ingrandire</figcaption></figure>`;}

function wordBox(l){return `<aside><div class="word-box"><h3>Parole, in parole semplici.</h3><dl>${l.words.map(w=>`<div class="word-pair"><dt>${esc(w.term)}</dt><dd>${esc(w.meaning)}</dd></div>`).join('')}</dl></div><p class="side-tip">${icon('help')} Un passaggio non è chiaro? Fermati e chiedi al docente. Qui le domande sono benvenute.</p></aside>`;}
function guide(l){
  const s=l.guide[step];
  return `<div class="objective-box"><h2>Alla fine saprai…</h2><ul class="check-list">${l.objectives.map(o=>`<li>${icon('check')}<span>${esc(o)}</span></li>`).join('')}</ul></div><section class="guide-card" aria-label="Guida passo a passo"><div class="guide-controls" role="group" aria-label="Scegli un passaggio">${l.guide.map((g,i)=>`<button class="step-dot ${step===i?'active':''}" type="button" data-step="${i}" aria-label="Passaggio ${i+1}: ${esc(g.title)}" ${step===i?'aria-current="step"':''}>${i+1}</button>`).join('')}</div><div class="guide-inner" id="guide-step" aria-live="polite"><p class="guide-kicker">PASSAGGIO ${step+1} DI ${l.guide.length}</p><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${visual(s.visual)}<div class="tip">${icon('light')}<span>${esc(s.tip)}</span></div></div><div class="guide-footer"><button class="btn btn-quiet" data-action="previous-step" type="button" ${step===0?'disabled':''}>${icon('back')} Indietro</button>${step===l.guide.length-1?`<a class="btn btn-primary" href="#lezione-${l.id}/pratica">Ora prova tu ${icon('arrow')}</a>`:`<button class="btn btn-primary" data-action="next-step" type="button">Avanti ${icon('arrow')}</button>`}</div></section>`;
}
function practice(l){return `<section class="practice-card"><p class="eyebrow">ESERCIZIO GUIDATO · CIRCA 15 MINUTI</p><h2>${esc(l.activity.title)}</h2><p>${esc(l.activity.intro)}</p><ol class="numbered-steps">${l.activity.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>${l.id===1?`<form class="editor-box" id="memo-form"><label class="form-label" for="memo-text">Il tuo promemoria</label><textarea class="form-field" id="memo-text" name="memo" placeholder="Per esempio: Mercoledì partecipo al corso di informatica. Voglio imparare a organizzare le mie foto." maxlength="10000" required>${esc(storage.get('ppd-memo',''))}</textarea><div class="input-row"><label class="form-label" for="memo-name">Come vuoi chiamare il documento?</label><input class="form-field" id="memo-name" name="filename" value="Promemoria corso" maxlength="70" required><p class="field-hint">Il documento sarà un file di testo (.txt). La posizione dipende dalle impostazioni del tuo browser.</p></div><button class="btn btn-primary" type="submit">${icon('download')} Salva il promemoria</button><p class="form-message" id="memo-message" role="status" aria-live="polite"></p></form>`:''}${l.id===1?`<div class="lab-launch"><strong>Prima di provare sul tuo PC</strong><p>Esercitati con cartelle e documenti in uno spazio guidato.</p><a class="btn btn-secondary" href="#laboratorio">${icon('computer')} Apri il laboratorio PC</a></div>`:''}<div class="success-box">${icon('check')}<p><strong>Come sai di aver fatto bene?</strong>${esc(l.activity.success)}</p></div></section>`;}
function recap(l){return `<section class="recap-sheet"><p class="eyebrow">DA TENERE A PORTATA DI MANO</p><h2>Le cose da ricordare</h2><p class="intro">Gli stessi schemi visivi della lezione, con i passaggi e l’esercizio: da conservare o stampare.</p><ul>${l.recap.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><div class="download-row"><a href="https://primi-passi-digitali-lucca.samueladriancerezo.chatgpt.site/assets/promemoria-lezione-${l.id}.pdf" download class="btn btn-primary">${icon('download')} Scarica la scheda PDF</a><button class="btn btn-secondary" type="button" data-action="print">${icon('print')} Stampa questa pagina</button></div></section>`;}
function completion(l){let done=completed.includes(l.id);return `<div class="completion-box"><p>Quando hai finito, puoi segnare la lezione come completata. Puoi comunque riaprirla e riprovare.</p><button type="button" class="btn ${done?'completed-button':'btn-secondary'}" data-action="complete" aria-pressed="${done}">${icon('check')} ${done?'Completata · Annulla':'Ho completato questa lezione'}</button></div>`;}
function lesson(l){
  const tab=current.tab||'guida';
  return `<a class="breadcrumb" href="#home">${icon('back')} Torna alle lezioni</a><div class="lesson-head"><span class="lesson-icon ${l.color}">${icon(l.icon)}</span><div><p class="eyebrow">LEZIONE ${String(l.id).padStart(2,'0')} · PERCORSO PRATICO</p><h1>${esc(l.title)}</h1><p class="lesson-subtitle">${esc(l.description)}</p></div></div><div class="lesson-facts"><span>${icon('video')} Su Zoom, insieme al docente</span><span>${icon('clock')} 2 ore</span><span>${icon('coffee')} Pausa di 5 minuti</span></div><div class="tabs" role="tablist" aria-label="Contenuti della lezione">${[['guida','La lezione','book'],['pratica','Prova tu','pencil'],['scheda','Il promemoria','file'],['quiz','Ripasso','check']].map(([id,label,ic])=>`<button type="button" role="tab" id="tab-${id}" aria-controls="lesson-panel" aria-selected="${tab===id}" tabindex="${tab===id?0:-1}" data-tab="${id}" class="tab ${tab===id?'active':''}">${icon(ic)} ${label}</button>`).join('')}</div><div class="lesson-layout"><div><div role="tabpanel" id="lesson-panel" aria-labelledby="tab-${tab}">${tab==='pratica'?practice(l):tab==='scheda'?recap(l):tab==='quiz'?features.quizPage(l):guide(l)}</div>${completion(l)}</div>${wordBox(l)}</div><div class="review-launch"><span>${icon('check')} Tre domande per ripassare, senza blocchi.</span><a class="btn btn-secondary" href="#lezione-${l.id}/quiz">Vai al ripasso</a></div><div class="lesson-next">${availableLesson(l.id+1)?`<a href="#lezione-${l.id+1}">Vai alla lezione ${l.id+1} ${icon('arrow')}</a>`:`<a href="#home">Torna al tuo percorso ${icon('arrow')}</a>`}</div>`;
}

function help(){const faqs=[
 ['Come partecipo alla lezione su Zoom?', content.course.meetingUrl?'Premi Entra nella lezione su Zoom. Si aprirà Zoom in una nuova finestra o nell’app, mentre il corso rimane aperto. Collegati qualche minuto prima e segui le indicazioni del docente.':'Il docente inserirà qui il collegamento alla riunione Zoom. Quando sarà pronto, nella pagina iniziale comparirà il pulsante Entra nella lezione su Zoom.'],
 ['Come passo da Zoom all’esercizio?', 'Tieni aperti Zoom e il corso. Usa la barra delle applicazioni su Windows o il Dock su Mac per passare da una finestra all’altra. Durante la pratica il docente interromperà la condivisione dello schermo quando serve.'],
 ['Non sento la voce del docente. Che cosa controllo?', 'Controlla il volume del computer e delle cuffie. In Zoom scegli il collegamento all’audio del computer e verifica l’altoparlante selezionato. Se serve, scrivi nella chat di Zoom: Non sento l’audio.'],
 ['Perché non vedo tutte e quattro le lezioni?', 'Il docente rende disponibili le lezioni una alla volta, seguendo il corso. Quelle già aperte rimangono consultabili. Se una lezione è appena stata aperta, attendi qualche secondo oppure aggiorna la pagina.'],
 ['Come studio senza Internet?', 'Apri Materiali e PDF mentre sei connesso e scarica la scheda della lezione. Ritrovala nella cartella Download o nella posizione che hai scelto: potrai leggerla e stamparla senza Internet. Per Zoom, ricerche sul web e invio di email serve una connessione.'],
 ['Dove trovo un documento scaricato?', 'Apri la cartella Download del computer, oppure la cartella che hai scelto al momento del salvataggio. Puoi spostare i materiali in Documenti, dentro una cartella chiamata Corso PC.'],
 ['Come si accede alla piattaforma?', 'Il corso è pubblico: basta aprire il collegamento, senza registrarsi. Solo il docente accede alla propria area riservata per modificare il collegamento Zoom e aprire le lezioni. I PDF scaricati rimangono consultabili sul PC anche senza Internet.'],
 ['Le lezioni hanno già una data?', 'Sono previsti quattro mercoledì, con incontri di due ore e una pausa di cinque minuti. Date e orari saranno comunicati dal docente.'],
 ['I miei progressi sono visibili al docente?', 'I segni di completamento e il testo del promemoria restano in questo browser. Non vengono inviati al docente. Per un riscontro, segui le indicazioni ricevute durante il corso.']
 ];return `<a class="breadcrumb" href="#home">${icon('back')} Torna al corso</a><div class="help-intro"><p class="eyebrow">UNA MANO, QUANDO SERVE</p><h1>Nessuna domanda<br>è troppo piccola.</h1><p>Zoom per incontrarci, questo quaderno per esercitarti e ripassare.</p></div><div class="help-grid"><section aria-label="Domande frequenti">${faqs.map(([q,a],i)=>`<details class="faq" ${i===0?'open':''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section><aside class="meeting-panel">${icon('video')}<h3>Ci vediamo su Zoom.</h3><p>Quattro mercoledì per imparare insieme, con il computer davanti e il tempo per provare.</p><p><strong>2 ore a incontro</strong><br>con una pausa di 5 minuti</p><p class="zoom-license-note">La licenza Zoom del corso è fornita da UIL.</p>${content.course.meetingUrl?zoomEntry():'<div class="connection-placeholder">Il collegamento Zoom sarà inserito dal docente.</div>'}<a class="btn btn-secondary help-download" href="#materiali">${icon('download')} Materiali e PDF</a>${(availableLesson(1)||content.practiceAvailable)?`<a class="nav-link ${current.page==='lab'?'active':''}" href="#laboratorio">${icon('computer')} Laboratorio PC</a>`:''}</aside></div>`;}

function materialsPage(){return `<a class="breadcrumb" href="#home">${icon('back')} Torna al corso</a><div class="help-intro"><p class="eyebrow">MATERIALI DEL CORSO</p><h1>Le tue schede,<br>sempre a portata di mano.</h1><p>Scarica i PDF delle lezioni disponibili. Puoi conservarli sul computer, rileggerli senza Internet o stamparli.</p></div><div class="offline-instructions"><span>${icon('download')} <strong>1.</strong> Scarica il PDF.</span><span>${icon('folder')} <strong>2.</strong> Ritrovalo in Download.</span><span>${icon('book')} <strong>3.</strong> Aprilo o stampalo.</span></div><section class="material-list" aria-label="Materiali delle lezioni disponibili">${content.lessons.map(l=>`<article class="material-card"><span class="lesson-icon ${l.color}">${icon(l.icon)}</span><div><span class="lesson-meta">LEZIONE ${l.id}</span><h2>${esc(l.title)}</h2><p>Schemi visivi della lezione, passaggi guidati ed esercizi da ripetere.</p><div class="download-row"><a class="btn btn-primary" href="https://primi-passi-digitali-lucca.samueladriancerezo.chatgpt.site/assets/promemoria-lezione-${l.id}.pdf" download>${icon('download')} Scarica la scheda PDF</a><a class="btn btn-secondary" href="#lezione-${l.id}">${icon('book')} Rivedi la lezione</a></div></div></article>`).join('')||'<div class="objective-box">Le schede compariranno quando sarà aperta la prima lezione.</div>'}</section>`;}

function adminPage(){
 if(true)return `<div class="help-intro"><p class="eyebrow">AREA DOCENTE</p><h1>Uno spazio riservato.</h1><p>Il corso è pubblico e si può consultare senza registrazione. Apri l’area riservata con il tuo account docente autorizzato per gestire l’apertura delle lezioni e il collegamento Zoom.</p><a class="btn btn-primary" href="https://primi-passi-digitali-lucca.samueladriancerezo.chatgpt.site/#docente" target="_top">Accedi come docente</a> <a class="btn btn-secondary" href="#home">Torna al corso</a></div>`;
 if(!adminData){loadAdmin();return '<div class="loading-state">Apriamo l’area docente…</div>';}
 return `<a class="breadcrumb" href="#home">${icon('back')} Vedi il corso come partecipante</a><div class="help-intro"><p class="eyebrow">AREA DOCENTE</p><h1>Un incontro<br>alla volta.</h1><p>Decidi quali lezioni mostrare e inserisci il collegamento Zoom. Le modifiche valgono per tutti i partecipanti.</p><div class="teacher-session"><span>${icon('check')} Accesso docente attivo</span><a href="/signout-with-chatgpt?return_to=%2F" target="_top">Esci dall’account docente</a></div></div><section class="admin-section"><h2>Lezioni disponibili</h2><p class="intro">Sono visibili le prime ${adminData.releasedThrough} lezioni. I materiali delle altre rimangono nascosti.</p><div class="admin-lessons">${adminData.lessons.map(l=>`<div class="admin-lesson"><span class="nav-num">${String(l.id).padStart(2,'0')}</span><div><strong>${esc(l.title)}</strong><span>${l.id<=adminData.releasedThrough?'Disponibile ai partecipanti':'Non ancora disponibile'}</span></div>${l.id===adminData.releasedThrough+1?`<button class="btn btn-primary" type="button" data-release="${l.id}">Apri lezione ${l.id}</button>`:l.id<=adminData.releasedThrough?icon('check'):''}</div>`).join('')}</div>${adminData.releasedThrough>0?`<button class="btn btn-quiet" type="button" data-release="${adminData.releasedThrough-1}">Nascondi l’ultima lezione aperta</button>`:''}<p class="storage-note">Le pagine già aperte si aggiornano entro circa 30 secondi, oppure al ricaricamento. Nascondere una lezione non elimina le copie dei materiali già scaricate.</p></section><section class="admin-section"><h2>Il collegamento Zoom</h2><p class="intro">Incolla il link di partecipazione della riunione. Lo stesso pulsante sarà disponibile nella pagina iniziale e nell’aiuto.</p><form id="zoom-form"><label class="form-label" for="zoom-url">Collegamento della lezione su Zoom</label><input type="url" class="form-field" id="zoom-url" maxlength="2048" placeholder="https://…zoom.us/j/…" value="${esc(adminData.zoomUrl||'')}"><p class="field-hint">Puoi lasciare il campo vuoto finché la riunione non è pronta.</p><button class="btn btn-primary" type="submit">Salva collegamento Zoom</button></form></section><p><a href="#caratteri">Confronta tre varianti dei caratteri</a></p><p id="admin-message" class="form-message" role="status"></p>`;
}
async function loadAdmin(){try{const r=await fetch('/api/admin',{cache:'no-store'}),d=await r.json();if(!r.ok)throw new Error(d.error);adminData=d;if(current.page==='admin')main.innerHTML=adminPage();}catch(e){if(current.page==='admin')main.innerHTML=`<div class="objective-box"><h1>Riproviamo.</h1><p>${esc(e.message)}</p><a href="#home">Torna al corso</a></div>`;}}
async function saveAdmin(releasedThrough,zoomUrl){
 const buttons=main.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
 try{const r=await fetch('/api/admin',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({releasedThrough,zoomUrl,revision:adminData.revision})});const data=await r.json();if(!r.ok)throw new Error(data.error);adminData=null;content=await fetch('https://primi-passi-digitali-lucca.samueladriancerezo.chatgpt.site/api/course',{cache:'no-store'}).then(r=>r.json());await loadAdmin();renderNavigation();notify('Modifica salvata per tutti i partecipanti.');}
 catch(e){const message=document.getElementById('admin-message');if(message){message.textContent=e.message;message.classList.add('error');}buttons.forEach(b=>b.disabled=false);}
}

function parseRoute(){
  const hash=location.hash.slice(1);
  if(hash==='aiuto')return {page:'help'};
  if(hash==='materiali')return {page:'materials'};
  if(hash==='laboratorio')return {page:'lab'};
  if(hash==='caratteri')return {page:'fonts'};
  if(hash==='docente')return {page:'admin'};
  const match=hash.match(/^lezione-([1-4])(?:\/(pratica|scheda|quiz))?$/);
  return match?{page:'lesson',id:Number(match[1]),tab:match[2]||'guida'}:{page:'home'};
}
function route(isFirst=false){
  const previous=current;
  current=parseRoute();
  if(previous.id!==current.id)step=0;
  renderNavigation();
  main.innerHTML=current.page==='lab'?features.labPage():current.page==='fonts'?features.fontPage():current.page==='help'?help():current.page==='materials'?materialsPage():current.page==='admin'?adminPage():current.page==='lesson'?(availableLesson(current.id)?lesson(availableLesson(current.id)):'<div class="objective-box"><h1>Un passo alla volta.</h1><p>Questa lezione non è ancora disponibile. Il docente la aprirà quando la affronteremo insieme.</p><a class="btn btn-primary" href="#home">Torna alle lezioni disponibili</a></div>'):home();
  document.title=(current.page==='lesson'?`Lezione ${current.id} · ${(availableLesson(current.id)?.shortTitle||'Lezione non disponibile')}`:current.page==='lab'?'Laboratorio PC':current.page==='fonts'?'Varianti dei caratteri':current.page==='help'?'Hai bisogno di aiuto?':current.page==='materials'?'Materiali e PDF':current.page==='admin'?'Area docente':'Primi passi digitali')+' · ASL UIL Lucca';
  if(!isFirst){
    if(previous.page==='lesson'&&current.page==='lesson'&&previous.id===current.id&&previous.tab!==current.tab)document.querySelector(`[data-tab="${current.tab}"]`)?.focus({preventScroll:true});
    else{window.scrollTo({top:0,behavior:'auto'});main.focus({preventScroll:true});}
  }
}
function notify(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
function refreshGuide(focusSelector){
  const l=content.lessons[current.id-1];
  document.getElementById('lesson-panel').innerHTML=guide(l);
  if(focusSelector)document.querySelector(focusSelector)?.focus({preventScroll:true});
}

document.addEventListener('click',e=>{
  if(e.target.closest('#menu-toggle')){const open=document.body.classList.toggle('nav-open');document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));return;}
  if(e.target.closest('.sidebar a')){document.body.classList.remove('nav-open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');}

  const release=e.target.closest('[data-release]');if(release&&adminData){saveAdmin(Number(release.dataset.release),adminData.zoomUrl);return;}
  if(e.target.closest('.skip-link')){e.preventDefault();main.focus();return;}
  const tab=e.target.closest('[data-tab]');
  if(tab){location.hash=`lezione-${current.id}${tab.dataset.tab==='guida'?'':'/'+tab.dataset.tab}`;return;}
  const dot=e.target.closest('[data-step]');
  if(dot){step=Number(dot.dataset.step);refreshGuide(`[data-step="${step}"]`);return;}
  const button=e.target.closest('[data-action]');
  if(!button)return;
  const action=button.dataset.action;
  if(action==='next-step'){step=Math.min(step+1,3);refreshGuide(step===3?'#lesson-panel a.btn-primary':'[data-action="next-step"]');}
  if(action==='previous-step'){step=Math.max(step-1,0);refreshGuide(step===0?'[data-action="next-step"]':'[data-action="previous-step"]');}
  if(action==='print')window.print();
  if(action==='complete'){
    const id=current.id;
    completed=completed.includes(id)?completed.filter(n=>n!==id):[...completed,id];
    const saved=storage.set('ppd-completed',completed);
    main.querySelector('.completion-box').outerHTML=completion(content.lessons[id-1]);
    renderNavigation();
    main.querySelector('[data-action="complete"]').focus({preventScroll:true});
    notify(saved?(completed.includes(id)?'Un altro passo fatto. Puoi sempre tornare a ripassare.':'Lezione segnata come da completare.'):'Il segno è aggiornato, ma questo browser non può conservarlo.');
  }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){document.body.classList.remove('nav-open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');}

  const tab=e.target.closest('[role="tab"]');
  if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();
  const tabs=['guida','pratica','scheda','quiz'];
  let i=tabs.indexOf(tab.dataset.tab);
  i=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;
  location.hash=`lezione-${current.id}${i===0?'':'/'+tabs[i]}`;
});
document.addEventListener('input',e=>{if(e.target.id==='memo-text')storage.set('ppd-memo',e.target.value);});
document.addEventListener('submit',e=>{
  if(e.target.id==='zoom-form'){e.preventDefault();saveAdmin(adminData.releasedThrough,document.getElementById('zoom-url').value.trim());return;}
  if(e.target.id!=='memo-form')return;
  e.preventDefault();
  const text=document.getElementById('memo-text').value.trim();
  const message=document.getElementById('memo-message');
  if(!text){message.textContent='Scrivi almeno una frase, poi riprova a salvare.';message.className='form-message error';document.getElementById('memo-text').focus();return;}
  let filename=document.getElementById('memo-name').value.trim().replace(/[\\/:*?"<>|\x00-\x1F]/g,'').replace(/\.txt$/i,'').replace(/[. ]+$/,'')||'Promemoria corso';
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(filename))filename='Promemoria '+filename;
  const blob=new Blob(['\uFEFF'+text+'\r\n'],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  message.className='form-message';message.textContent='Download avviato. Ora cerca “'+filename+'.txt” nella cartella scelta o in Download, poi aprilo per verificare il testo.';
});
document.getElementById('text-size').addEventListener('click',()=>{largeText=!largeText;storage.set('ppd-large-text',largeText);applyTextSize();notify(largeText?'Testo ingrandito.':'Dimensione del testo ripristinata.');});
window.addEventListener('hashchange',()=>{if(content)route();});
applyTextSize();
const initialCourse={course:{meetingUrl:null,totalLessons:4},lessons:[],releasedThrough:0,canManage:false,practiceAvailable:true,revision:-1};
const courseRequest=fetch("https://primi-passi-digitali-lucca.samueladriancerezo.chatgpt.site/api/course",{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(12000)}).then(r=>{if(!r.ok)throw new Error('Contenuti non disponibili');return r.json();});
// Attach rejection handling immediately while the local module loads.
const courseResult=courseRequest.then(data=>({data}),error=>({error}));
import('./features.mjs').then(async module=>{
 features=module;content=initialCourse;
 features.init({icon,esc,storage,notify,readContent:()=>content,render:()=>route(true)});
 if(parseRoute().page==='lab')route(true);
 const result=await courseResult;
 if(result.data){content={...result.data,canManage:false,practiceAvailable:true};route(true);}
 else if(parseRoute().page!=='lab'){
  renderNavigation();main.innerHTML='<div class="objective-box"><h1>Le lezioni torneranno tra poco.</h1><p>Il collegamento ai materiali non risponde. Puoi intanto esercitarti nel laboratorio PC.</p><a class="btn btn-primary" href="#laboratorio">Apri il laboratorio PC</a> <button class="btn btn-secondary" id="reload">Riprova</button></div>';document.getElementById('reload').onclick=()=>location.reload();
 }
}).catch(()=>{main.innerHTML='<div class="objective-box"><h1>Ricarica la pagina per riprovare.</h1><a href="/courses/">Torna ai corsi</a></div>';});

setInterval(async()=>{if(!content||document.hidden||current.page==='admin')return;try{const r=await fetch('https://primi-passi-digitali-lucca.samueladriancerezo.chatgpt.site/api/course',{cache:'no-store'});if(!r.ok)return;const next=await r.json();if(next.revision===content.revision)return;content=next;renderNavigation();if(['home','materials','help'].includes(current.page)||(current.page==='lesson'&&!availableLesson(current.id)))route(true);notify('Le lezioni disponibili sono state aggiornate.');}catch{}},30000);
