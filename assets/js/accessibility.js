function trapFocus(e,box){
 const items=[...box.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(x=>!x.disabled&&!x.hidden&&x.getClientRects().length);
 const first=items[0],last=items.at(-1);if(!first)return;
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
}
window.addEventListener('DOMContentLoaded',()=>{
 const dialogs=[['login-overlay','로그인'],['admin-overlay','계정 관리'],['req-overlay','가입 요청'],['pw-overlay','비밀번호 변경']].map(([id,label])=>{
  const box=document.getElementById(id);box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label',label);
  box.addEventListener('keydown',e=>{if(e.key==='Tab')trapFocus(e,box);if(e.key==='Escape'&&!box.querySelector('button[disabled]')){if(id==='req-overlay')reqClose();if(id==='pw-overlay')pwClose();}});return box;
 });
 const sync=()=>{const active=dialogs.filter(e=>!e.classList.contains('hidden')).at(-1);dialogs.forEach(e=>e.inert=!!active&&e!==active);document.querySelector('.layout').inert=!!active;document.querySelector('header').inert=!!active;document.body.classList.toggle('modal-open',!!active);};
 dialogs.forEach(box=>new MutationObserver(sync).observe(box,{attributes:true,attributeFilter:['class']}));sync();
 for(const id of ['req-msg','pw-msg','profile-msg','mg-status']){const e=document.getElementById(id);e.setAttribute('role','status');e.setAttribute('aria-live','polite');}
 for(const id of ['req-name','req-email','req-dept','req-pw1','req-pw2','pw-old','pw-new1','pw-new2']){const e=document.getElementById(id);e.parentElement.querySelector('label')?.setAttribute('for',id);}
 for(const e of document.querySelectorAll('input[type="number"]')){e.inputMode='decimal';e.step='any';}
 for(const id of ['fc_count','ds_count']){const e=document.getElementById(id);e.step='1';e.inputMode='numeric';}
 document.getElementById('req-name').maxLength=80;document.getElementById('req-dept').maxLength=100;
 for(const e of document.querySelectorAll('input[autocomplete="new-password"]')){e.minLength=8;e.maxLength=128;}
 for(const e of document.querySelectorAll('input[type="email"]')){e.autocapitalize='none';e.spellcheck=false;e.maxLength=254;}
 document.addEventListener('keydown',e=>{if(e.key==='Escape')userMenuClose();});
 for(const b of document.querySelectorAll('.tab-btn')){b.setAttribute('role','tab');b.setAttribute('aria-selected',String(b.classList.contains('active')));b.closest('.tabs').setAttribute('role','tablist');}
 document.querySelectorAll('.tabs').forEach(tabs=>tabs.addEventListener('keydown',e=>{const buttons=[...tabs.querySelectorAll('.tab-btn')],i=buttons.indexOf(document.activeElement);if(i<0)return;let next;if(e.key==='ArrowRight')next=(i+1)%buttons.length;if(e.key==='ArrowLeft')next=(i-1+buttons.length)%buttons.length;if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;if(next!==undefined){e.preventDefault();buttons[next].click();buttons[next].focus();}}));
 document.querySelectorAll('.scroll-x').forEach(e=>{e.tabIndex=0;e.setAttribute('role','region');e.setAttribute('aria-label','좌우로 스크롤할 수 있는 표');});
});
