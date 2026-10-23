(function(){
'use strict';
var EPS=window.NF_EPISODES||[];
function $(s,r){return (r||document).querySelector(s);}
function el(t,a,h){var e=document.createElement(t);if(a)for(var k in a)e.setAttribute(k,a[k]);if(h!=null)e.innerHTML=h;return e;}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmtT(s){s=Math.floor(s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;function p(n){return (n<10?'0':'')+n;}return h?h+':'+p(m)+':'+p(x):p(m)+':'+p(x);}
function fmtDur(s){var h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+'小时'+m+'分':m+'分钟';}
function hashParams(){var o={};location.hash.replace(/^#/,'').split('&').forEach(function(kv){if(!kv)return;var i=kv.indexOf('=');o[decodeURIComponent(i<0?kv:kv.slice(0,i))]=i<0?'':decodeURIComponent(kv.slice(i+1));});return o;}
window.NF={fmtT:fmtT,hashParams:hashParams};

/* ---------- home ---------- */
function home(){
  var tb=$('#eplist tbody'),q=$('#q'),fg=$('#fg'),ft=$('#ft'),fs=$('#fs'),cnt=$('#count');
  var sortK='d',dir=-1;
  var gc={};EPS.forEach(function(e){e.g.forEach(function(g){gc[g]=(gc[g]||0)+1;});});
  Object.keys(gc).sort(function(a,b){return gc[b]-gc[a]||a.localeCompare(b,'zh');}).forEach(function(g){fg.appendChild(el('option',{value:g},esc(g)+' ('+gc[g]+')'));});
  (window.NF_TAGS||[]).forEach(function(t){var n=EPS.filter(function(e){return e.tg.indexOf(t)>=0;}).length;if(n)ft.appendChild(el('option',{value:t},esc(t)+' ('+n+')'));});
  var hp=hashParams();if(hp.tag)ft.value=hp.tag;if(hp.guest)fg.value=hp.guest;
  function render(){
    var s=q.value.trim().toLowerCase();
    var rows=EPS.filter(function(e){
      if(fg.value&&e.g.indexOf(fg.value)<0)return false;
      if(ft.value&&e.tg.indexOf(ft.value)<0)return false;
      if(fs.value!==''&&String(+e.done)!==fs.value)return false;
      if(s){var hay=(e.vl+' '+e.t+' '+e.g.join(' ')+' '+e.tg.join(' ')+' '+e.d).toLowerCase();if(hay.indexOf(s)<0)return false;}
      return true;});
    rows.sort(function(a,b){var x=a[sortK],y=b[sortK];
      if(sortK==='v'){x=x==null?-1:x;y=y==null?-1:y;if(x===y){x=a.d;y=b.d;}}
      if(sortK==='g'){x=a.g.length;y=b.g.length;}
      if(sortK==='done'){x=+a.done;y=+b.done;}
      return (x<y?-1:x>y?1:0)*dir;});
    tb.innerHTML=rows.map(function(e){
      return '<tr><td class="nowrap">'+esc(e.vl)+'</td><td><a href="ep/'+e.s+'.html">'+esc(e.t)+'</a><div>'+e.tg.map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join('')+'</div></td>'+
      '<td class="nowrap">'+e.d+'</td><td class="nowrap">'+fmtDur(e.dur)+'</td><td>'+(e.g.length?e.g.map(esc).join('、'):'<span class="muted">—</span>')+'</td>'+
      '<td><span class="st '+(e.done?'done':'pend')+'">'+(e.done?'已完成':'转写中')+'</span></td></tr>';}).join('');
    cnt.textContent='显示 '+rows.length+' / '+EPS.length+' 集';
  }
  [q,fg,ft,fs].forEach(function(x){x.addEventListener('input',render);});
  Array.prototype.forEach.call(document.querySelectorAll('#eplist th'),function(th){th.addEventListener('click',function(){
    var k=th.getAttribute('data-k');if(k===sortK)dir=-dir;else{sortK=k;dir=(k==='t'?1:-1);}
    Array.prototype.forEach.call(document.querySelectorAll('#eplist th'),function(o){o.className='';});th.className='sorted '+(dir>0?'asc':'desc');render();});});
  render();
}

/* ---------- episode ---------- */
function episode(){
  var audio=$('#audio'),tr=$('#transcript');
  function seek(t,play){if(!audio)return;
    var go=function(){try{audio.currentTime=t;}catch(e){}if(play){var p=audio.play();if(p&&p.catch)p.catch(function(){});}};
    if(audio.readyState>=1)go();else{audio.preload='metadata';audio.addEventListener('loadedmetadata',function f(){audio.removeEventListener('loadedmetadata',f);go();});audio.load();}
  }
  window.NF.seek=seek;
  function scrollTo(t){if(!tr)return;var ps=tr.querySelectorAll('.p'),best=null;
    for(var i=0;i<ps.length;i++){if(+ps[i].id.slice(1)<=t)best=ps[i];else break;}
    if(best){best.classList.add('hit');best.scrollIntoView({block:'center'});setTimeout(function(){best.classList.remove('hit');},4000);}}
  document.addEventListener('click',function(ev){
    var a=ev.target.closest('[data-t]');if(!a)return;
    if(!a.closest('#transcript')&&!a.classList.contains('ts'))return;
    ev.preventDefault();var t=+a.getAttribute('data-t');seek(t,true);history.replaceState(null,'','#t='+t);});
  var hp=hashParams();
  if(hp.t){var t=+hp.t;scrollTo(t);seek(t,false);
    if(hp.q&&tr){var re=new RegExp(hp.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
      Array.prototype.forEach.call(tr.querySelectorAll('span[data-t="'+t+'"]'),function(s){s.innerHTML=esc(s.textContent).replace(re,function(m){return '<mark>'+m+'</mark>';});});}}
  // highlight current sentence while playing
  if(tr&&audio){var spans=tr.querySelectorAll('.tx span'),times=[],last=null;
    for(var i=0;i<spans.length;i++)times.push(+spans[i].getAttribute('data-t'));
    audio.addEventListener('timeupdate',function(){var ct=audio.currentTime,lo=0,hi=times.length-1,k=-1;
      while(lo<=hi){var m=(lo+hi)>>1;if(times[m]<=ct){k=m;lo=m+1;}else hi=m-1;}
      if(k>=0&&spans[k]!==last){if(last)last.classList.remove('now');last=spans[k];last.classList.add('now');}});}
  // in-episode find
  var tq=$('#tq');if(tq&&tr){var timer;tq.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(function(){
    var s=tq.value.trim(),ps=tr.querySelectorAll('.p'),first=null;
    for(var i=0;i<ps.length;i++){var show=!s||ps[i].textContent.indexOf(s)>=0;ps[i].style.display=show?'':'none';if(show&&s&&!first)first=ps[i];}
  },200);});}
}

/* ---------- global search ---------- */
function search(){
  var files=window.NF_SEARCH_FILES||[],idx=[],loaded=0,loading=false,waiters=[];
  var byId={};EPS.forEach(function(e){byId[e.id]=e;});
  window.NF_SEARCH_ADD=function(d){idx.push(d);};var encP=[];window.NF_SEARCH_ENC=function(b){encP.push(window.NF_DECRYPT(b).then(function(t){idx.push(JSON.parse(t));}));};
  var st=$('#sstatus'),out=$('#sresults'),q=$('#sq'),spk=$('#sspk');
  function load(cb){if(loaded===files.length&&files.length){cb();return;}waiters.push(cb);if(loading)return;loading=true;
    var i=0,par=6,active=0;
    function next(){while(active<par&&i<files.length){(function(f){active++;var s=document.createElement('script');s.src='search/'+f+'.js';
      s.onload=s.onerror=function(){active--;loaded++;st.textContent='正在加载索引 '+loaded+' / '+files.length+' …';
        if(loaded===files.length){Promise.all(encP).then(function(){waiters.forEach(function(w){w();});waiters=[];});}else next();};document.body.appendChild(s);})(files[i++]);}}
    next();}
  function run(){var s=q.value.trim();var sp=spk.value;history.replaceState(null,'','#q='+encodeURIComponent(s));
    if(!s){out.innerHTML='';st.textContent='';return;}
    load(function(){var res=[],total=0;var re=new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
      idx.forEach(function(d){var hits=[];d.rows.forEach(function(r,j){
        if(sp){if(sp==='__guest'){if(r[1]==='Thomas'||r[1]==='Nixon')return;}else if(r[1]!==sp)return;}
        if(r[2].toLowerCase().indexOf(s.toLowerCase())>=0){var ctx=(d.rows[j-1]&&d.rows[j-1][1]===r[1]?d.rows[j-1][2]:'')+'【'+j+'】'+(d.rows[j+1]&&d.rows[j+1][1]===r[1]?d.rows[j+1][2]:'');hits.push([r,ctx]);}});
        if(hits.length){total+=hits.length;res.push({e:byId[d.id],hits:hits});}});
      res.sort(function(a,b){return b.hits.length-a.hits.length;});
      st.textContent='共 '+total+' 处匹配，涉及 '+res.length+' 集';
      out.innerHTML=res.slice(0,80).map(function(r){var e=r.e;if(!e)return '';
        return '<div class="res"><h3><a href="ep/'+e.s+'.html">'+esc(e.vl)+' · '+esc(e.t)+'</a> <span class="muted small">'+r.hits.length+' 处</span></h3>'+
        r.hits.slice(0,6).map(function(h){var parts=h[1].split(/【\d+】/);var mid=esc(h[0][2]).replace(re,function(m){return '<mark>'+m+'</mark>';});
          return '<div class="hitline"><a href="ep/'+e.s+'.html#t='+h[0][0]+'&q='+encodeURIComponent(s)+'">'+fmtT(h[0][0])+'</a><b>'+esc(h[0][1])+'：</b><span class="muted">'+esc(parts[0].slice(-30))+'</span>'+mid+'<span class="muted">'+esc((parts[1]||'').slice(0,30))+'</span></div>';}).join('')+
        (r.hits.length>6?'<div class="muted small">…还有 '+(r.hits.length-6)+' 处</div>':'')+'</div>';}).join('');});}
  $('#sgo').addEventListener('click',run);q.addEventListener('keydown',function(e){if(e.key==='Enter')run();});spk.addEventListener('change',run);
  var hp=hashParams();if(hp.q){q.value=hp.q;run();}
}
var p=document.body.getAttribute('data-page');
if(p==='home')home();else if(p==='episode')episode();else if(p==='search')search();
})();
