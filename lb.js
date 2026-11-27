/* The Gluten Conflict: shared top-10 scoreboard (Supabase), used by the game and the kitchen.
   The page calls LB.init({host, felt, btn}) once, then LB.check / LB.openEntry / LB.openBoard. */
(function(){
const URL='https://fnwzxpdidmhxsbovwmrs.supabase.co/rest/v1/rpc/',KEY='sb_publishable_ZiYIop7JkAgV9u27GTML7g_4gP9RZmd';
const MIN_MS=20000,FLAV=['korean','chicken','pho','multigrain','lite'];
let H=null,felt=null,cache=null,cacheT=0,ov=null;

function rpc(name,body){
  return fetch(URL+name,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body||{})})
    .then(async r=>{if(!r.ok){let m='';try{m=(await r.json()).message||'';}catch(e){}throw new Error(m||('HTTP '+r.status));}return r.status===204?null:r.json();});
}
function top(fresh){
  if(!fresh&&cache&&performance.now()-cacheT<15000)return Promise.resolve(cache);
  return rpc('top_scores').then(rows=>{cache=Array.isArray(rows)?rows:[];cacheT=performance.now();return cache;});
}
/* resolves {ok, qualifies, rows} and never throws, so callers can carry on if the board is unreachable */
function check(score,playMs){
  return top(true).then(rows=>({ok:true,rows,qualifies:score>0&&playMs>=MIN_MS&&(rows.length<10||score>rows[rows.length-1].score)}))
    .catch(()=>({ok:false,rows:[],qualifies:false}));
}

const CSS=`
.lbx{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;box-sizing:border-box;
  background:rgba(18,12,8,0);transition:background .4s ease;-webkit-tap-highlight-color:transparent}
.lbx.open{background:rgba(18,12,8,.9)}
.lbx .lbp,.lbx .lbrow{transform:translateY(calc(50vh + 120%));transition:transform .36s cubic-bezier(.55,0,.75,.2)}
.lbx.open .lbp,.lbx.open .lbrow{transform:none;transition:transform .55s cubic-bezier(.16,1,.3,1)}
.lbx.open .lbrow{transition-delay:.05s}
@media (prefers-reduced-motion:reduce){.lbx .lbp,.lbx .lbrow{transition:none!important;transform:none!important}}
.lbp{width:min(92%,340px);box-sizing:border-box;border:0;border-image:url(art/ui/panel.webp) 92 fill / 34px stretch;padding:30px 38px 34px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.5));color:#fff6e8;font-family:Figtree,system-ui,sans-serif}
.lbp h3{margin:0 0 8px;display:flex;justify-content:center;min-height:24px}
.lbp h3 img{margin:0!important}
.lbp ol{list-style:none;margin:0;padding:0;font:700 13px/1 Figtree,system-ui,sans-serif}
.lbp li{display:grid;grid-template-columns:20px 30px 1fr auto;align-items:center;height:30px;border-bottom:1px dashed rgba(255,246,232,.25)}
.lbp li:last-child{border-bottom:0}
.lbp li .n{opacity:.6;font-weight:600}
.lbp li .av{width:24px;height:24px;border-radius:6px;background:#3b2a1e;box-shadow:inset 0 0 0 1.5px rgba(255,246,232,.35);display:flex;align-items:center;justify-content:center;overflow:hidden}
.lbp li .av img{height:22px;width:auto}
.lbp li .i{letter-spacing:.12em}
.lbp li .s{font-variant-numeric:tabular-nums}
.lbp li.me{color:#ffd76a}
.lbp .msg{margin:6px 0 2px;text-align:center;font:600 12.5px/1.4 Figtree,system-ui,sans-serif;opacity:.85}
.lbp .err{color:#ffc9b8;opacity:1}
.lbp .ini{position:relative;display:flex;gap:9px;justify-content:center;margin:10px 0 14px}
.lbp .ini span{width:46px;height:56px;border-radius:10px;background:rgba(0,0,0,.35);box-shadow:inset 0 0 0 2px #e8c27a;display:flex;align-items:center;justify-content:center}
.lbp .ini span.cur{box-shadow:inset 0 0 0 3px #ffd76a,0 0 12px rgba(255,215,106,.5);animation:lbblink 1s steps(2) infinite}
.lbp .ini span img{margin:0!important}
@keyframes lbblink{50%{box-shadow:inset 0 0 0 2px #e8c27a}}
.lbp .ini input{position:absolute;inset:0;width:100%;height:100%;opacity:0;font-size:16px;border:0;padding:0;margin:0;text-transform:uppercase;caret-color:transparent;cursor:pointer}
.lbb{display:flex;align-items:center;justify-content:center;height:48px;width:100%;box-sizing:border-box;padding:0 18px 3px;border:0;background:none;
  border-image:url(art/ui/btn-brown.webp) 50% 31% fill / 50% 26px round;cursor:pointer;-webkit-tap-highlight-color:transparent;font:inherit;color:#fff}
.lbb:active{border-image-source:url(art/ui/btn-brown-down.webp)}
.lbb.red{border-image-source:url(art/ui/btn-red.webp)}.lbb.red:active{border-image-source:url(art/ui/btn-red-down.webp)}
.lbb:disabled{filter:grayscale(.6) brightness(.8);cursor:default}
.lbb img{margin:0!important;max-width:100%}
.lbb:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:999px}
.lbrow{width:min(92%,340px);display:flex;flex-direction:column;gap:6px}
.lbskip{background:none;border:0;color:#fff6e8;opacity:.7;font:600 12.5px Figtree,system-ui,sans-serif;text-decoration:underline;text-underline-offset:2px;cursor:pointer;padding:4px}
@media (max-width:360px),(max-height:620px){.lbp{padding:26px 32px 30px}.lbp li{height:26px}}
`;

function init(o){H=o.host;felt=o.felt;
  if(!document.getElementById('lb-css')){const s=document.createElement('style');s.id='lb-css';s.textContent=CSS;document.head.appendChild(s);}
  for(const k of FLAV)new Image().src='art/ui/fl-'+k+'.webp';}
function label(el,txt,col,h){felt(el,txt,col,h);el.setAttribute('aria-label',txt);}
function shell(){close(true);ov=document.createElement('div');ov.className='lbx';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
  ov.addEventListener('pointerdown',e=>e.stopPropagation());(typeof H==='function'?H():H).appendChild(ov);return ov;}
function show(){void ov.offsetWidth;ov.classList.add('open');}
function close(now){const o=ov;if(!o)return;ov=null;if(now){o.remove();return;}o.classList.remove('open');setTimeout(()=>o.remove(),420);}
const isOpen=()=>!!ov;

function rowsHTML(rows,me){
  if(!rows.length)return '<p class="msg">No scores yet. Be the first!</p>';
  return '<ol>'+rows.map((r,i)=>{const f=FLAV.includes(r.flavor)?r.flavor:'korean';
    return `<li class="${i===me?'me':''}"><span class="n">${i+1}</span><span class="av"><img src="art/ui/fl-${f}.webp" alt="${f}"></span><span class="i">${r.initials}</span><span class="s">${Number(r.score).toLocaleString('en-US')}</span></li>`;}).join('')+'</ol>';
}

/* the top 10. o.me = {initials, score} to highlight; o.onClose */
function openBoard(o={}){
  const el=shell();
  el.innerHTML='<div class="lbp"><h3></h3><div class="body"><p class="msg">Loading…</p></div></div><div class="lbrow"><button class="lbb" data-k="back"></button></div>';
  felt(el.querySelector('h3'),'Top scores','r',22);label(el.querySelector('[data-k=back]'),'Back','k',16);
  const done=()=>{close();o.onClose&&o.onClose();};
  el.querySelector('[data-k=back]').onclick=done;el.addEventListener('click',e=>{if(e.target===el)done();});
  el.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')done();});el.addEventListener('keyup',e=>e.stopPropagation());
  show();el.querySelector('[data-k=back]').focus({preventScroll:true});
  const body=el.querySelector('.body');
  top(o.fresh).then(rows=>{let me=-1;if(o.me)me=rows.findIndex(r=>r.initials===o.me.initials&&Number(r.score)===Number(o.me.score));body.innerHTML=rowsHTML(rows,me);})
    .catch(()=>{body.innerHTML='<p class="msg err">Couldn’t reach the scoreboard. Check your connection and try again.</p>';});
}

/* initials entry. o = {score, flavor, playMs, onDone(result)} where result is {rank, initials} or null when skipped */
function openEntry(o){
  const el=shell();let saved=false;
  el.innerHTML=`<div class="lbp"><h3></h3><p class="msg">You made the top 10! Enter your initials.</p>
    <div class="ini"><span></span><span></span><span></span><input maxlength="3" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" inputmode="text" aria-label="Your initials, three letters"></div>
    <div class="lbrow" style="transform:none;width:100%"><button class="lbb red" data-k="save" disabled></button></div></div>
    <div class="lbrow"><button class="lbskip" data-k="skip">Skip</button></div>`;
  felt(el.querySelector('h3'),'New high score','r',22);label(el.querySelector('[data-k=save]'),'Save','k',16);
  const inp=el.querySelector('input'),slots=[...el.querySelectorAll('.ini span')],save=el.querySelector('[data-k=save]'),msg=el.querySelector('.msg');
  let last='';try{last=localStorage.getItem('gw-initials')||'';}catch(e){}
  const paint=()=>{const v=inp.value;slots.forEach((s,i)=>{s.innerHTML='';if(v[i])felt(s,v[i],'k',30);s.classList.toggle('cur',document.activeElement===inp&&i===Math.min(v.length,2)&&!(v.length===3&&i===2&&false));});save.disabled=v.length!==3||saved;};
  inp.addEventListener('input',()=>{inp.value=inp.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);paint();});
  inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&!save.disabled){e.preventDefault();save.click();}if(e.key==='Escape'){e.preventDefault();skip();}});
  inp.addEventListener('keyup',e=>e.stopPropagation());
  inp.addEventListener('focus',paint);inp.addEventListener('blur',paint);
  inp.value=last.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);paint();
  const skip=()=>{if(saved)return;close();o.onDone&&o.onDone(null);};
  el.querySelector('[data-k=skip]').onclick=skip;
  save.onclick=()=>{if(save.disabled)return;const ini=inp.value;saved=true;paint();msg.classList.remove('err');msg.textContent='Saving…';
    try{localStorage.setItem('gw-initials',ini);}catch(e){}
    rpc('submit_score',{p_initials:ini,p_score:Math.round(o.score),p_flavor:o.flavor,p_play_ms:Math.round(o.playMs)})
      .then(()=>top(true)).then(rows=>{const rank=rows.findIndex(r=>r.initials===ini&&Number(r.score)===Math.round(o.score));
        o.onDone&&o.onDone({rank,initials:ini});openBoard({me:{initials:ini,score:Math.round(o.score)},onClose:o.onBoardClose});})
      .catch(err=>{saved=false;paint();msg.classList.add('err');
        msg.textContent=/slow down/i.test(err.message)?'Hang on a few seconds, then try again.':'Couldn’t save your score. Check your connection and try again.';});};
  show();setTimeout(()=>{try{inp.focus({preventScroll:true});}catch(e){}},350);
}

window.LB={init,check,top,openEntry,openBoard,close,isOpen,MIN_MS};
})();
