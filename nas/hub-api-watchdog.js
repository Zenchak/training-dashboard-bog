'use strict';
// Zenchak Hub local API watchdog: runs on Synology Docker, independent of GitHub schedules.
// Monitors only bogdan-sites-house-api. No credential or personal data access.
const http=require('node:http');
const API='bogdan-sites-house-api';
const SOCKET='/var/run/docker.sock';
const INTERVAL=30000;
const COOLDOWN=15*60*1000;
let lastRepair=0;
let failures=0;
let busy=false;

function request(opts,timeout=5000){
 return new Promise((resolve,reject)=>{
  const req=http.request(opts,res=>{
   let body='';
   res.setEncoding('utf8');
   res.on('data',chunk=>{if(body.length<200000)body+=chunk;});
   res.on('end',()=>resolve({code:res.statusCode,body}));
  });
  req.setTimeout(timeout,()=>req.destroy(new Error('request timeout')));
  req.on('error',reject);
  req.end();
 });
}
async function docker(path,method='GET'){
 return request({socketPath:SOCKET,path,method},7000);
}
async function active(){
 const response=await docker('/containers/'+API+'/json');
 if(response.code!==200)throw Error('Docker inspect HTTP '+response.code);
 const obj=JSON.parse(response.body);
 return Boolean(obj.State?.Running);
}
async function apiHealthy(){
 try{
  const r=await request({hostname:'house-api',port:3000,path:'/health',method:'GET'},4500);
  return r.code===200;
 }catch{return false;}
}
function log(message){console.log(new Date().toISOString()+' '+message);}
async function repair(action){
 if(Date.now()-lastRepair<COOLDOWN){
  log('Cooldown in corso; non ripeto '+action+' per evitare riavvii continui');
  return;
 }
 lastRepair=Date.now();
 try{
  const resp=await docker('/containers/'+API+'/'+action,'POST');
  if(resp.code!==204 && !(action==='start'&&resp.code===304))throw Error('Docker HTTP '+resp.code+' '+resp.body.slice(0,180));
  log('Docker '+action+' eseguito (HTTP '+resp.code+').');
 }catch(e){log('ERRORE ripristino '+action+': '+e.message);}
}
async function check(){
 if(busy)return;
 busy=true;
 try{
  const running=await active();
  if(!running){
   failures=0;
   log(API+' risulta spento: avvio automatico.');
   await repair('start');
   return;
  }
  if(await apiHealthy()){
   if(failures)log('API nuovamente sana dopo '+failures+' controlli falliti.');
   failures=0;
   return;
  }
  failures++;
  log('API non risponde (controllo fallito '+failures+'/3).');
  if(failures>=3){failures=0;await repair('restart?t=10');}
 }catch(e){log('ERRORE controllo Docker: '+e.message);}
 finally{busy=false;}
}
log('Watchdog locale avviato: API='+API+', intervallo='+INTERVAL/1000+'s, cooldown='+COOLDOWN/60000+'m');
setTimeout(check,3000);
setInterval(check,INTERVAL);
