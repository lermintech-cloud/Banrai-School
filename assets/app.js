/* ====== ตั้งค่าโรงเรียน (แก้ตรงนี้ได้) ====== */
const CONFIG = {
  schoolName: 'โรงเรียนบ้านไร่',
  pageUrl: '',            // ใส่ลิงก์เพจเฟซบุ๊ก เช่น https://www.facebook.com/xxxx (ถ้าเว้นว่าง จะใช้ลิงก์จากข้อมูลที่ดึงมา)
  phone: '',              // เช่น 053-000000
  mapQuery: 'โรงเรียนบ้านไร่ ดอยเต่า เชียงใหม่'
};
/* ========================================== */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const P = {
  home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>', news:'<path d="M4 5h13v14H6a2 2 0 0 1-2-2V5zM17 9h3v8a2 2 0 0 1-2 2M8 9h6M8 13h6"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>', img:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  bell:'<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0"/>', search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>', chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>', pin:'<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  leaf:'<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19c3-4 6-6 10-8"/>'
};
const ic = (n, cls='') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

const state = { posts:[], view:'home', cat:'ทั้งหมด', q:'', meta:{} };
const CATS = ['ทั้งหมด','ประกาศ','กิจกรรม','ข่าวสาร','ภาพ'];
const TABS = [['home','หน้าแรก','home'],['news','ข่าวสาร','news'],['gallery','ภาพกิจกรรม','img'],['contact','ติดต่อ','phone']];

function categorize(p){
  const t = p.message || '';
  if(/ประกาศ|แจ้ง|หยุด|ปิดภาคเรียน|เปิดภาคเรียน|รับสมัคร|ประชุม|ผู้ปกครอง/.test(t)) return 'ประกาศ';
  if(/กิจกรรม|แข่งขัน|วัน|งาน|อบรม|ทัศนศึกษา|ค่าย|ประกวด|เข้าร่วม/.test(t)) return 'กิจกรรม';
  return 'ข่าวสาร';
}
const fmtDate = iso => new Date(iso).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});
function ago(iso){
  const m = (Date.now()-new Date(iso))/60000;
  if(m<60) return `${Math.max(1,Math.round(m))} นาทีที่แล้ว`;
  if(m<1440) return `${Math.round(m/60)} ชั่วโมงที่แล้ว`;
  if(m<10080) return `${Math.round(m/1440)} วันที่แล้ว`;
  return fmtDate(iso);
}
const title = p => { const l=(p.message||'').trim().split('\n')[0]; return l.length>70 ? l.slice(0,68)+'…' : (l||'ภาพกิจกรรมจากโรงเรียน'); };
const fbUrl = () => CONFIG.pageUrl || state.meta.pageUrl || 'https://www.facebook.com/';

function media(p,i){
  const img = p.images?.[0];
  return `<div class="media t${i%4}">${img?`<img src="${esc(img)}" alt="" loading="lazy" onerror="this.remove()">`:''}
    <span class="ph">${ic('leaf')}</span><span class="badge">${p.cat}</span>${p.images?.length>1?`<span class="count">${p.images.length} ภาพ</span>`:''}</div>`;
}
function card(p,i){
  return `<button class="card" data-id="${esc(p.id)}">${media(p,i)}<div class="body"><h3 style="margin:0;font-size:17px;line-height:1.4">${esc(title(p))}</h3>
    <p>${esc((p.message||'').split('\n').slice(1).join(' ')||p.message||'')}</p>
    <div class="meta"><span>${ic('cal')}${esc(ago(p.created))}</span>${p.reactions?`<span>${ic('heart')}${p.reactions}</span>`:''}${p.comments?`<span>${ic('chat')}${p.comments}</span>`:''}</div></div></button>`;
}
const skeleton = () => `<div class="feed">${'<div class="sk skc"></div>'.repeat(6)}</div>`;

function filtered(){
  const q = state.q.trim().toLowerCase();
  return state.posts.filter(p =>
    (state.cat==='ทั้งหมด' || (state.cat==='ภาพ' ? p.images?.length : p.cat===state.cat)) &&
    (!q || (p.message||'').toLowerCase().includes(q)));
}

function render(){
  const v = state.view, view = $('#view');
  $('#tools').style.display = (v==='home'||v==='news') ? '' : 'none';
  $('#quick').style.display = v==='home' ? '' : 'none';
  $('#notice').style.display = v==='home' ? '' : 'none';
  $('#chips').innerHTML = CATS.map(c=>`<button class="chip" role="tab" aria-selected="${c===state.cat}" data-cat="${c}">${c}</button>`).join('');
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-selected', b.dataset.view===v));
  if(v==='gallery'){
    const imgs = state.posts.flatMap(p=>(p.images||[]).map(src=>({src,id:p.id})));
    view.innerHTML = imgs.length ? `<div class="gal">${imgs.map(m=>`<button data-id="${esc(m.id)}" aria-label="เปิดโพสต์"><img src="${esc(m.src)}" alt="" loading="lazy" onerror="this.closest('button').remove()"></button>`).join('')}</div>`
      : `<div class="empty">ยังไม่มีภาพจากเฟซบุ๊ก<br>เมื่อเชื่อมต่อเพจแล้วภาพจะแสดงที่นี่</div>`;
  } else if(v==='contact'){
    view.innerHTML = `<div class="panel"><h3>${esc(CONFIG.schoolName)}</h3><p>อำเภอดอยเต่า จังหวัดเชียงใหม่</p>
      <a class="btn" target="_blank" rel="noopener" href="${esc(fbUrl())}">เปิดเพจเฟซบุ๊ก</a>
      <a class="btn soft" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(CONFIG.mapQuery)}">${ic('pin')} ดูแผนที่</a>
      ${CONFIG.phone?`<a class="btn soft" href="tel:${esc(CONFIG.phone.replace(/[^\d+]/g,''))}">${ic('phone')} โทร ${esc(CONFIG.phone)}</a>`:''}</div>`;
  } else {
    const list = filtered();
    view.innerHTML = list.length ? `<div class="feed">${list.map(card).join('')}</div>`
      : `<div class="empty">ไม่พบโพสต์ที่ตรงกับคำค้น<br>ลองเปลี่ยนคำค้นหรือเลือกหมวดอื่น</div>`;
  }
}

function renderChrome(){
  $('#greet').textContent = (h=>h<11?'อรุณสวัสดิ์ 🌤️':h<17?'สวัสดีตอนบ่าย ☀️':'สวัสดีตอนเย็น 🌙')(new Date().getHours());
  $('#fbTop').href = fbUrl();
  $('#searchIcon').innerHTML = ic('search');
  $('#tabbar').innerHTML = TABS.map(([k,l,i])=>`<button class="tab" role="tab" data-view="${k}" aria-selected="false">${ic(i)}<b>${l}</b></button>`).join('');
  $('#deskNav').innerHTML = TABS.map(([k,l])=>`<button role="tab" data-view="${k}" aria-selected="false">${l}</button>`).join('');
  const Q = [['news','ข่าวสาร','news',0,'ทั้งหมด'],['cal','กิจกรรม','cal',1,'กิจกรรม'],['gal','ภาพ','img',2,null],['bell','ประกาศ','bell',3,'ประกาศ']];
  $('#quick').innerHTML = Q.map(([k,l,i,c,cat])=>`<button class="qi" data-q="${k}" data-cat="${cat||''}"><span class="ico c${c}">${ic(i)}</span>${l}</button>`).join('');
  $('#side').innerHTML = `<div class="panel"><h3>ติดตามโรงเรียน</h3><p>ข่าวสารล่าสุดจากเพจเฟซบุ๊กของโรงเรียน อัปเดตอัตโนมัติ</p>
    <a class="btn" target="_blank" rel="noopener" href="${esc(fbUrl())}">เปิดเพจเฟซบุ๊ก</a></div>
    <div class="panel"><h3>ที่ตั้ง</h3><p>อำเภอดอยเต่า จังหวัดเชียงใหม่</p>
    <a class="btn soft" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(CONFIG.mapQuery)}">${ic('pin')} ดูแผนที่</a></div>`;
}

function renderNotice(){
  const p = state.posts[0], n = $('#notice');
  if(!p){ n.innerHTML = `<div class="nc"><span class="tag">ยินดีต้อนรับ</span><h2>${esc(CONFIG.schoolName)}</h2><p>กำลังเตรียมข่าวสารล่าสุดให้คุณ</p></div>`; return; }
  n.innerHTML = `<button class="nc" data-id="${esc(p.id)}"><div style="display:grid;gap:10px"><span class="tag">ล่าสุด · ${p.cat}</span>
    <h2>${esc(title(p))}</h2><p>${esc(p.message||'')}</p><span class="more">อ่านเพิ่มเติม</span></div>
    ${p.images?.[0]?`<div class="thumb"><img src="${esc(p.images[0])}" alt="" onerror="this.parentNode.remove()"></div>`:''}</button>`;
}

function openPost(id){
  const p = state.posts.find(x=>x.id===id); if(!p) return;
  const d = $('#sheet');
  d.innerHTML = `<div class="sh-head"><span class="grab"></span><button class="sh-x" aria-label="ปิด" data-close>${ic('x')}</button></div>
    ${p.images?.length?`<div class="pics">${p.images.map(s=>`<img src="${esc(s)}" alt="" loading="lazy" onerror="this.remove()">`).join('')}</div>`:''}
    <div class="sh-body"><span class="chip" aria-selected="true" style="display:inline-block">${p.cat}</span>
    <div class="txt">${esc(p.message||'')}</div>
    <div class="meta" style="margin-bottom:16px"><span>${ic('cal')}${esc(fmtDate(p.created))}</span>${p.reactions?`<span>${ic('heart')}${p.reactions}</span>`:''}</div>
    ${p.url?`<a class="btn" target="_blank" rel="noopener" href="${esc(p.url)}">ดูโพสต์บนเฟซบุ๊ก</a>`:''}</div>`;
  d.showModal();
}

function go(view,cat){
  if(view) state.view = view;
  if(cat!==undefined) state.cat = cat || state.cat;
  render(); window.scrollTo({top:0,behavior:'smooth'});
}

document.addEventListener('click',e=>{
  const t = e.target.closest('[data-id],[data-view],[data-cat],[data-q],[data-close]');
  if(e.target.id==='sheet') return $('#sheet').close();
  if(!t) return;
  if(t.dataset.close!==undefined) return $('#sheet').close();
  if(t.dataset.q){ if(t.dataset.q==='gal') return go('gallery'); state.view='home'; state.cat=t.dataset.cat||'ทั้งหมด'; render(); return $('.tools').scrollIntoView({behavior:'smooth'}); }
  if(t.dataset.view) return go(t.dataset.view, t.dataset.view==='news'?'ทั้งหมด':undefined);
  if(t.classList.contains('chip')){ state.cat = t.dataset.cat; return render(); }
  if(t.dataset.id) openPost(t.dataset.id);
});
$('#q').addEventListener('input',e=>{ state.q = e.target.value; render(); $('#q').focus(); });

/* ดึงข้อมูล + ดึงลงเพื่อรีเฟรช */
async function load(){
  $('#view').innerHTML = skeleton();
  try{
    const r = await fetch('data/posts.json?t='+Date.now(),{cache:'no-store'});
    const j = await r.json();
    state.meta = j.page || {};
    state.posts = (j.posts||[]).map(p=>({...p,cat:categorize(p)}));
    $('#updated').textContent = j.updated ? 'อัปเดตล่าสุด '+new Date(j.updated).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'}) : '';
  }catch{ state.posts=[]; }
  renderChrome(); renderNotice(); render();
}
let y0=null; const ptr=$('#ptr');
addEventListener('touchstart',e=>{ y0 = scrollY===0 ? e.touches[0].clientY : null; },{passive:true});
addEventListener('touchmove',e=>{ if(y0!==null) ptr.classList.toggle('on', e.touches[0].clientY-y0>90); },{passive:true});
addEventListener('touchend',()=>{ if(ptr.classList.contains('on')){ ptr.classList.remove('on'); load(); } y0=null; });

load();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
