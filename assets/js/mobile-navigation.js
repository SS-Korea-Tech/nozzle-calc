function closeSidebar(restoreFocus=true){
 document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');
 const b=document.getElementById('menuBtn');b.textContent='☰';b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','메뉴 열기');
 document.querySelector('.main-wrap').inert=false;document.body.classList.remove('nav-open');if(restoreFocus)b.focus();
}
function toggleSidebar(){
 const sb=document.getElementById('sidebar');if(sb.classList.contains('open')){closeSidebar();return;}
 sb.classList.add('open');document.getElementById('sidebarOverlay').classList.add('open');const b=document.getElementById('menuBtn');b.textContent='✕';b.setAttribute('aria-expanded','true');b.setAttribute('aria-label','메뉴 닫기');
 document.querySelector('.main-wrap').inert=true;document.body.classList.add('nav-open');sb.querySelector('.ux-search')?.focus();
}
const _origShowPanelMobile=window.showPanel;
window.showPanel=function(id,element){_origShowPanelMobile(id,element);if(window.innerWidth<=768)closeSidebar(false);};
window.addEventListener('resize',()=>{if(window.innerWidth>768)closeSidebar(false);});
function toggleMobileRecent(b){const closed=document.getElementById('mobileRecentBody').classList.toggle('collapsed');b.textContent=closed?'▼':'▲';b.setAttribute('aria-expanded',String(!closed));}
window.addEventListener('DOMContentLoaded',()=>{
 const b=document.getElementById('menuBtn');b.setAttribute('aria-controls','sidebar');b.setAttribute('aria-expanded','false');const sb=document.getElementById('sidebar');sb.setAttribute('aria-label','계산기 메뉴');
 sb.addEventListener('keydown',e=>{if(window.innerWidth>768||!sb.classList.contains('open'))return;if(e.key==='Escape'){e.preventDefault();closeSidebar();}if(e.key==='Tab')trapFocus(e,sb);});
});
