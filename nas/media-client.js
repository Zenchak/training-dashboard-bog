/* Zenchak Hub · runtime media overrides on the NAS persistent data volume.
 * Static repository pictures remain as a reliable fallback.
 */
(function(){
'use strict';
let items={};
let pending=null;
function src(slot,fallback){
 return items[slot]?.url||fallback;
}
function apply(root){
 const parent=root||document;
 for(const img of parent.querySelectorAll('img[data-media-slot]')){
  const slot=img.getAttribute('data-media-slot');
  const next=items[slot]?.url;
  if(next&&img.getAttribute('src')!==next)img.setAttribute('src',next);
 }
}
function load(){
 if(pending)return pending;
 pending=fetch('/api/media/',{credentials:'same-origin',cache:'no-store'}).then(r=>{
  if(!r.ok)throw Error('Media API '+r.status);
  return r.json();
 }).then(d=>{
  items=d?.items||{};
  apply(document);
  window.dispatchEvent(new Event('zenchak-media-loaded'));
  return items;
 }).catch(e=>{
  console.warn('Zenchak media: uso immagini originali',e.message);
  return items;
 });
 return pending;
}
window.ZenchakMedia={src,apply,load,items:()=>items};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
else load();
})();
