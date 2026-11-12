import { newLab,openFolder,addFolder,rename,cut,paste,tasks,restoreLab,goUp } from './lab-model.mjs';
import { gradeQuiz } from './review-model.mjs';

let ctx,lab,labForm=null,labMessage='',previewId=null,labMode='guided';
const attempts=new Map();
const fonts=[
 {id:'open',name:'Open Sans',label:'A · Chiaro e familiare',description:'Una proposta sobria, con titoli netti e testo aperto.'},
 {id:'noto',name:'Noto Sans',label:'B · Regolare e ordinato',description:'Una proposta uniforme, vicina a un ambiente didattico essenziale.'},
 {id:'source',name:'Source Sans 3',label:'C · Leggero e arioso',description:'Una proposta con forme morbide e un ritmo di lettura disteso.'}
];
const esc=v=>ctx.esc(v);
const icon=n=>ctx.icon(n);
function persistLab(){ctx.storage.set('ppd-lab',lab);}
function refreshLab(){persistLab();ctx.render();}

export function quizPage(lesson){
  const questions=lesson.quiz||[];
  let a=attempts.get(lesson.id);
  if(!a){a={answers:[],checked:false};attempts.set(lesson.id,a);}
  const result=a.checked?gradeQuiz(questions,a.answers):null;
  return `<section class="quiz-intro"><span class="feature-kicker">RIPASSO INTERATTIVO</span><h2>Mettiamo a fuoco i concetti</h2><p>Tre domande per ripassare. Puoi riprovare e continuare il corso qualunque sia il risultato.</p></section><form id="review-form" data-lesson="${lesson.id}" novalidate>${questions.map((q,i)=>{
    const item=result?.items[i];
    const selected=item?.selected;
    return `<fieldset class="quiz-question"><legend><span class="question-number">${i+1}</span><span>${esc(q.prompt)}</span></legend><div class="quiz-options">${q.options.map((o,n)=>`<label class="quiz-option ${item?.states[n]||''}"><input type="radio" name="question-${i}" value="${n}" ${a.answers[i]===n?'checked':''} ${a.checked?'disabled':''}><span class="option-letter">${'ABCD'[n]}</span><span class="option-text">${esc(o.label)}${a.checked&&n===q.correct?'<strong class="option-status">✓ Risposta da ricordare</strong>':a.checked&&selected===n&&!item.ok?'<strong class="option-status">La tua risposta</strong>':''}</span></label>`).join('')}</div>${a.checked?`<div class="quiz-feedback ${item.ok?'positive':'explain'}"><strong>${item.ok?'Il concetto è chiaro.':selected===null?'Rivediamo questo passaggio.':'Proviamo a ragionarci insieme.'}</strong><p>${esc(selected===null?q.options[q.correct].feedback:q.options[selected].feedback)}</p>${selected!==null&&!item.ok?`<p>${esc(q.options[q.correct].feedback)}</p>`:''}</div>`:`<details class="quiz-hint"><summary>Un piccolo aiuto</summary><p>${esc(q.hint)}</p></details>`}</fieldset>`;
  }).join('')}<div class="quiz-actions">${a.checked?`<div class="quiz-summary" role="status"><strong>Ripasso completato</strong><span>Concetti riconosciuti: ${result.score} su ${result.total}. Puoi rivedere le spiegazioni o riprovare.</span></div><button type="button" class="btn btn-primary" data-review-retry="${lesson.id}">Riprova il ripasso</button><a class="btn btn-secondary" href="#lezione-${lesson.id}">Torna alla lezione</a>`:'<button class="btn btn-primary" type="submit">Controlla le risposte</button><p>Il ripasso non blocca l’accesso alle altre lezioni.</p>'}</div></form>`;
}

export function fontPage(){
 const chosen=document.documentElement.dataset.font||'source';
 return `<a class="breadcrumb" href="#home">${icon('back')} Torna al corso</a><p class="eyebrow">CONFRONTO TIPOGRAFICO</p><h1>Tre modi di leggere<br>lo stesso corso.</h1><p class="intro">Stesso contenuto e stessa dimensione: cambia soltanto il carattere. Scegli una variante per provarla su questa pagina e nel corso, su questo dispositivo.</p><div class="font-variants">${fonts.map(f=>`<article class="font-variant" style="--preview-font:'${f.name}'"><span class="feature-kicker">${esc(f.label)}</span><h2>${esc(f.name)}</h2><p>${esc(f.description)}</p><div class="font-sample"><span class="sample-number">01</span><h3>Facciamo amicizia con il computer</h3><p>Apri una cartella, scrivi un promemoria e ritrova il documento. Un passaggio alla volta.</p><span>File · Finestre · Cartelle · Word · Excel</span></div><button type="button" class="btn ${chosen===f.id?'btn-primary':'btn-secondary'}" data-font="${f.id}" aria-pressed="${chosen===f.id}">${chosen===f.id?'Variante in uso':'Prova questa variante'}</button></article>`).join('')}</div>`;
}

export function labPage(){
 if(!ctx.readContent().practiceAvailable&&!ctx.readContent().lessons.some(l=>l.id===1))return '<div class="objective-box"><h1>Laboratorio non ancora disponibile</h1><p>Il docente lo renderà disponibile insieme alla prima lezione.</p><a href="#home">Torna al corso</a></div>';
 const progress=tasks(lab),next=progress.findIndex(t=>!t.done),count=progress.filter(t=>t.done).length;
 const selected=lab.nodes.find(n=>n.id===lab.selected),folder=lab.nodes.find(n=>n.id===lab.location);
 const visible=lab.nodes.filter(n=>n.parent===lab.location);
 return `<a class="breadcrumb" href="#lezione-1/pratica">${icon('back')} Torna alla prima lezione</a><div class="lab-heading"><div><p class="eyebrow">LABORATORIO PC</p><h1>Prova con file<br>e cartelle.</h1><p class="intro">Un ambiente di esercitazione: i documenti del tuo computer rimangono al loro posto.</p></div><div class="lab-view-switch" role="group" aria-label="Visualizzazione del laboratorio"><button type="button" data-lab-mode="guided" class="${labMode==='guided'?'active':''}" aria-pressed="${labMode==='guided'}">Passi guidati</button><button type="button" data-lab-mode="desktop" class="${labMode==='desktop'?'active':''}" aria-pressed="${labMode==='desktop'}">Vista PC</button></div></div><div class="lab-layout ${labMode==='desktop'?'pc-mode':'guided-mode'}"><section class="lab-task-panel"><h2>Il tuo obiettivo</h2><ol>${progress.map((t,i)=>`<li class="${t.done?'done':next===i?'current':''}"><span>${t.done?'✓':i+1}</span><div><strong>${esc(t.title)}</strong>${next===i?`<p>${esc(t.help)}</p>`:''}</div></li>`).join('')}</ol><p class="lab-count">${count} di 4 passaggi completati</p>${count===4?'<div class="lab-success" role="status">Hai organizzato il documento: ora sai creare una cartella, rinominare un file e spostarlo.</div>':''}<button class="btn btn-quiet" type="button" data-lab-action="reset">Ricomincia l’esercizio</button></section><section class="lab-workspace" aria-label="Simulatore di file e cartelle"><div class="lab-window-bar"><span>${icon('folder')} File e cartelle</span><span class="window-decoration" aria-hidden="true">● ● ●</span></div><div class="lab-toolbar"><button type="button" data-lab-action="new">${icon('folder')} Nuova cartella</button><button type="button" data-lab-action="rename" ${!selected||selected.id==='documents'?'disabled':''}>Rinomina</button><button type="button" data-lab-action="cut" ${!selected||selected.id==='documents'?'disabled':''}>Taglia</button><button type="button" data-lab-action="paste" ${!lab.clipboard?'disabled':''}>Incolla</button><button type="button" data-lab-action="open" ${!selected?'disabled':''}>Apri</button></div><div class="lab-path"><button type="button" data-lab-action="up" ${lab.location===null?'disabled':''} aria-label="Vai alla cartella superiore">${icon('back')}</button><span>${lab.location===null?'Scrivania':folder?.name||'Cartella'}</span>${lab.location&&lab.location!=='documents'?'<button class="lab-documents" type="button" data-lab-action="documents">Vai a Documenti</button>':''}</div>${labForm?`<form class="lab-name-form" id="lab-name-form"><label for="lab-name">${labForm==='new'?'Nome della nuova cartella':'Nuovo nome del documento'}</label><div><input id="lab-name" name="name" class="form-field" value="${esc(labForm==='new'?'Corso PC':'Promemoria.txt')}" maxlength="60" required><button class="btn btn-primary" type="submit">Conferma</button><button class="btn btn-secondary" type="button" data-lab-action="cancel">Annulla</button></div></form>`:''}<div class="lab-items" role="group" aria-label="Elementi nella cartella">${visible.map(n=>`<button type="button" class="lab-item ${lab.selected===n.id?'selected':''} ${lab.clipboard===n.id?'cut-item':''}" data-lab-item="${esc(n.id)}" aria-pressed="${lab.selected===n.id}" aria-label="${n.kind==='folder'?'Cartella':'Documento'} ${esc(n.name)}">${icon(n.kind==='folder'?'folder':'file')}<span>${esc(n.name)}</span></button>`).join('')||'<p class="lab-empty">Questa cartella è vuota. Puoi incollare qui il documento.</p>'}</div><div class="lab-status"><span id="lab-selected">${selected?esc(selected.name)+' selezionato':'Seleziona un elemento e premi Apri.'}</span><span>${visible.length} ${visible.length===1?'elemento':'elementi'}</span></div>${labMessage?`<p class="lab-message" role="status">${esc(labMessage)}</p>`:''}${previewId?`<div class="lab-file-preview"><strong>${esc(lab.nodes.find(n=>n.id===previewId)?.name||'Documento')}</strong><p>${esc(lab.nodes.find(n=>n.id===previewId)?.text||'')}</p><button type="button" class="btn btn-quiet" data-lab-action="close-preview">Chiudi il documento</button></div>`:''}<p class="lab-device-tip">Da telefono seleziona un elemento e usa i pulsanti. Dal PC puoi anche aprire le cartelle con un doppio clic.</p></section></div>`;
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

export function init(context){
 ctx=context;lab=restoreLab(ctx.storage.get('ppd-lab',null));
 labMode=window.matchMedia('(min-width: 1000px)').matches?'desktop':'guided';
 const font=ctx.storage.get('ppd-font-v5','source');document.documentElement.dataset.font=fonts.some(f=>f.id===font)?font:'source';
 document.addEventListener('change',e=>{
  const form=e.target.closest('#review-form');if(form&&e.target.matches('input[type="radio"]')){
   const attempt=attempts.get(Number(form.dataset.lesson));attempt.answers[Number(e.target.name.split('-')[1])]=Number(e.target.value);
  }
 });
 document.addEventListener('submit',e=>{
  if(e.target.id==='review-form'){
   e.preventDefault();const id=Number(e.target.dataset.lesson);const a=attempts.get(id);a.checked=true;
   const lesson=ctx.readContent().lessons.find(l=>l.id===id);document.getElementById('lesson-panel').innerHTML=quizPage(lesson);
   document.querySelector('.quiz-summary')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  if(e.target.id==='lab-name-form'){
   e.preventDefault();try{const name=document.getElementById('lab-name').value;if(labForm==='new')addFolder(lab,name);else rename(lab,lab.selected,name);labForm=null;labMessage='Operazione completata. Osserva il nome nell’elenco.';}catch(error){labMessage=error.message;}refreshLab();
  }
 });
 document.addEventListener('click',e=>{
  const retry=e.target.closest('[data-review-retry]');if(retry){const id=Number(retry.dataset.reviewRetry);attempts.set(id,{answers:[],checked:false});const l=ctx.readContent().lessons.find(l=>l.id===id);document.getElementById('lesson-panel').innerHTML=quizPage(l);document.querySelector('.quiz-question input')?.focus();return;}
  const font=e.target.closest('button[data-font]');if(font){document.documentElement.dataset.font=font.dataset.font;ctx.storage.set('ppd-font-v5',font.dataset.font);ctx.render();ctx.notify('Variante applicata all’anteprima su questo dispositivo.');return;}
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
}
