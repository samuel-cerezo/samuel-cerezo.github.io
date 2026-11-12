export function newLab() {
  return { version:1, location:null, selected:null, clipboard:null, visitedDocuments:false, nextId:1, nodes:[
    {id:'documents',name:'Documenti',kind:'folder',parent:null},
    {id:'notes',name:'Note.txt',kind:'file',parent:'documents',text:'Mercoledì partecipo al corso PC.\nVoglio imparare a organizzare i miei documenti.'}
  ]};
}
function node(s,id){const n=s.nodes.find(n=>n.id===id);if(!n)throw new Error('Seleziona un elemento dell’esercitazione.');return n;}
function validName(s,name,parent,exclude){
  name=String(name).trim();
  if(!name||name.length>60||/[<>:"/\\|?*\x00-\x1f]/.test(name)||/[. ]$/.test(name))throw new Error('Scegli un nome breve, senza barre o caratteri speciali.');
  if(s.nodes.some(n=>n.id!==exclude&&n.parent===parent&&n.name.toLowerCase()===name.toLowerCase()))throw new Error('In questa cartella esiste già un elemento con questo nome. Scegline un altro.');
  return name;
}
export function openFolder(s,id){const n=node(s,id);if(n.kind!=='folder')throw new Error('Questo elemento è un documento.');s.location=id;s.selected=null;if(id==='documents')s.visitedDocuments=true;}
export function goUp(s){if(s.location!==null){s.location=node(s,s.location).parent;s.selected=null;}}
export function addFolder(s,name){
  const clean=validName(s,name,s.location);const id='folder-'+s.nextId++;
  s.nodes.push({id,name:clean,kind:'folder',parent:s.location});s.selected=id;return id;
}
export function rename(s,id,name){const n=node(s,id);if(id==='documents')throw new Error('Per questa attività manteniamo la cartella Documenti.');n.name=validName(s,name,n.parent,id);}
export function cut(s,id){if(id==='documents')throw new Error('Scegli il documento da spostare.');node(s,id);s.clipboard=id;}
export function paste(s){
  if(!s.clipboard)throw new Error('Seleziona un elemento e premi prima Taglia.');
  const n=node(s,s.clipboard);
  if(n.parent===s.location)throw new Error('Sei ancora nella cartella di partenza. Apri la cartella di destinazione, poi premi Incolla.');
  let ancestor=s.location;
  while(ancestor!==null){if(ancestor===n.id)throw new Error('Una cartella non può essere spostata dentro sé stessa.');ancestor=node(s,ancestor).parent;}
  validName(s,n.name,s.location,n.id);n.parent=s.location;s.selected=n.id;s.clipboard=null;
}
export function tasks(s){
  const folder=s.nodes.find(n=>n.kind==='folder'&&n.parent==='documents'&&n.name.toLowerCase()==='corso pc');
  const file=s.nodes.find(n=>n.id==='notes');
  return [
    {done:s.visitedDocuments,title:'Apri Documenti',help:'Seleziona la cartella Documenti e premi Apri. Dal PC puoi anche fare doppio clic.'},
    {done:!!folder,title:'Crea la cartella Corso PC',help:'Dentro Documenti premi Nuova cartella, scrivi Corso PC e conferma.'},
    {done:file?.name==='Promemoria.txt',title:'Rinomina Note.txt',help:'Seleziona Note.txt, premi Rinomina e scrivi Promemoria.txt.'},
    {done:!!folder&&file?.parent===folder.id,title:'Sposta il documento nella cartella',help:'Seleziona il documento, premi Taglia, apri Corso PC e premi Incolla.'}
  ];
}
export function restoreLab(value){
  // Accept only the bounded shape created by this exercise, not arbitrary files.
  if(!value||value.version!==1||!Array.isArray(value.nodes)||value.nodes.length>100)return newLab();
  const s=structuredClone(value);
  if(!s.nodes.some(n=>n.id==='documents'&&n.kind==='folder'&&n.parent===null)||!s.nodes.some(n=>n.id==='notes'&&n.kind==='file'))return newLab();
  const ids=new Set(s.nodes.map(n=>n.id));
  if(ids.size!==s.nodes.length||!Number.isInteger(s.nextId)||s.nextId<1)return newLab();
  for(const n of s.nodes){
    if(typeof n.id!=='string'||typeof n.name!=='string'||!['file','folder'].includes(n.kind)||(n.parent!==null&&!s.nodes.some(p=>p.id===n.parent&&p.kind==='folder')))return newLab();
    let p=n.parent,seen=new Set([n.id]);
    while(p!==null){if(seen.has(p))return newLab();seen.add(p);p=s.nodes.find(k=>k.id===p).parent;}
  }
  if(s.location!==null&&!s.nodes.some(n=>n.id===s.location&&n.kind==='folder'))s.location=null;
  if(s.selected&&!ids.has(s.selected))s.selected=null;
  if(s.clipboard&&!ids.has(s.clipboard))s.clipboard=null;
  return s;
}
