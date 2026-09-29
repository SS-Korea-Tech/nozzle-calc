// Membership management. Firebase Auth owns passwords and login sessions.
const mg = {accounts:[],pending:[],busy:false,returnFocus:null};
const mgEl=id=>document.getElementById(id);
function mgMessage(text, error=false){const el=mgEl('mg-status');el.textContent=text;el.className=error?'mg-status error':'mg-status';}
function mgNode(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function mgButton(text,fn){const b=mgNode('button',text,'mg-button');b.type='button';b.onclick=fn;return b;}
function mgAdmin(){if(!window._currentUser||window._currentUser.role!=='admin')throw Error('관리자 계정으로 로그인해 주세요.');return window._currentUser;}
async function mgAuthority(tx,user){const snap=await tx.get(db.collection('accounts').doc(user.email));if(window._currentUser!==user||!snap.exists||snap.data().disabled===true||snap.data().role!=='admin'||snap.data().uid!==user.uid)throw Error('관리 권한을 확인할 수 없습니다. 다시 로그인해 주세요.');}
async function mgAction(work){if(mg.busy)return;let user;try{user=mgAdmin();}catch(e){return mgMessage(e.message,true);}mg.busy=true;mgEl('admin-overlay').querySelectorAll('button,input,select').forEach(e=>e.disabled=true);mgMessage('처리 중…');try{await work(user);if(window._currentUser!==user)return;await adminRenderList();await adminRenderPending();}catch(e){mgMessage(liMessage(e),true);}finally{mg.busy=false;mgEl('admin-overlay').querySelectorAll('button,input,select').forEach(e=>e.disabled=false);}}
function mgRenderAccounts(){const list=mgEl('admin-user-list');list.replaceChildren();const q=mgEl('mg-search').value.trim().toLowerCase(),role=mgEl('mg-role').value,state=mgEl('mg-state').value;const rows=mg.accounts.filter(a=>(!role||a.role===role)&&(!state||(state==='disabled')===a.disabled)&&[a.email,a.name,a.dept].join(' ').toLowerCase().includes(q));mgEl('mg-counts').textContent=`전체 ${mg.accounts.length}명 · 관리자 ${mg.accounts.filter(a=>a.role==='admin').length}명 · 표시 ${rows.length}명`;if(!rows.length){list.append(mgNode('p','조건에 맞는 계정이 없습니다.','mg-empty'));return;}for(const a of rows){const row=mgNode('div',undefined,'mg-row'),info=mgNode('div',undefined,'mg-info');info.append(mgNode('strong',a.name||'이름 없음'),mgNode('div',a.email),mgNode('small',a.dept||'부서 미등록'));row.append(info,mgNode('span',a.role==='admin'?'관리자':'사용자','mg-pill'));if(a.email===PRIMARY_ADMIN_EMAIL||a.email===window._currentUser?.email)row.append(mgNode('span',a.email===window._currentUser?.email?'내 계정':'기본 계정','mg-pill'));else row.append(mgButton(a.disabled?'이용 재개':'이용 중지',()=>adminSetDisabled(a.email,!a.disabled)),mgButton(a.role==='admin'?'사용자로 변경':'관리자로 변경',()=>adminSetRole(a.email,a.role==='admin'?'user':'admin')),mgButton('권한 삭제',()=>adminDelUser(a.email)));if(a.disabled)row.append(mgNode('span','이용 중지','mg-pill mg-disabled'));list.append(row);}}
async function adminRenderList(){const session=window._currentUser;try{mgAdmin();mgEl('admin-user-list').textContent='계정을 불러오는 중…';const all=await liGetAllAccounts();if(window._currentUser!==session)return;mg.accounts=Object.entries(all).map(([email,a])=>({email,name:a.name||'',dept:a.dept||'',role:a.role==='admin'?'admin':'user',disabled:a.disabled===true})).sort((a,b)=>a.name.localeCompare(b.name,'ko'));mgRenderAccounts();}catch(e){mgEl('admin-user-list').textContent='계정을 불러오지 못했습니다. 새로고침을 눌러 주세요.';mgMessage(e.message,true);}}
async function adminRenderPending(){const session=window._currentUser;const list=mgEl('admin-pending-list');mgEl('admin-pending-wrap').style.display='block';try{mgAdmin();const all=await liGetPending();if(window._currentUser!==session)return;mg.pending=Object.entries(all).map(([email,r])=>({email,name:r.name,dept:r.dept,date:r.requestedAt,ts:r.requestedAtMs||0})).sort((a,b)=>a.ts-b.ts);list.replaceChildren();mgEl('mg-pending-count').textContent=`승인 대기 ${mg.pending.length}건`;if(!mg.pending.length)list.append(mgNode('p','승인 대기 중인 요청이 없습니다.','mg-empty'));for(const r of mg.pending){const row=mgNode('div',undefined,'mg-row'),info=mgNode('div',undefined,'mg-info');info.append(mgNode('strong',r.name),mgNode('div',r.email),mgNode('small',`${r.dept||'부서 미등록'} · 요청일 ${r.date||'미등록'}`));row.append(info,mgButton('승인',()=>adminApprove(r.email)),mgButton('거절',()=>adminReject(r.email)));list.append(row);}}catch(e){list.textContent='요청을 불러오지 못했습니다. 새로고침을 눌러 주세요.';mgMessage(e.message,true);}}
function adminOpen(){try{mgAdmin();}catch{return;}mg.returnFocus=document.activeElement;mgEl('admin-overlay').classList.remove('hidden');mgMessage('');adminRenderList();adminRenderPending();mgEl('mg-search').focus();}
function adminClose(){if(mg.busy)return;mgEl('admin-overlay').classList.add('hidden');mgEl('adm-pw').value='';mg.returnFocus?.focus();}
async function adminAddUser(){
 const email=mgEl('adm-email').value.trim().toLowerCase(),name=mgEl('adm-name').value.trim(),pw=mgEl('adm-pw').value,role=mgEl('adm-role').value,dept=mgEl('adm-dept').value.trim();
 try{liEmail(email);}catch(e){mgMessage(e.message,true);return;}
 if(!name||name.length>80||pw.length<8||pw.length>128||dept.length>100||!['admin','user'].includes(role)){mgMessage('이름·권한을 확인하고 초기 비밀번호를 8~128자로 입력해 주세요.',true);return;}
 if(role==='admin'&&!confirm(`${name} (${email})에게 관리자 권한을 부여할까요?`))return;
 await mgAction(async user=>{
  const ref=liAccountRef(email),pending=db.collection('pendingRequests').doc(email);
  const existing=await ref.get(),request=await pending.get();
  if(existing.exists)throw Error('이미 등록된 이메일입니다.');if(request.exists)throw Error('승인 대기 목록에서 승인해 주세요.');
  await liWithSecondary(email,pw,async identity=>{
   await db.runTransaction(async tx=>{
    await mgAuthority(tx,user);const account=await tx.get(ref),waiting=await tx.get(pending);
    if(account.exists||waiting.exists)throw Error('이미 등록되었거나 승인 대기 중입니다. 목록을 새로고침해 주세요.');
    tx.set(ref,{uid:identity.uid,name,dept,role,disabled:false,createdAt:new Date().toISOString()});
   });
  });
  ['adm-email','adm-name','adm-pw','adm-dept'].forEach(id=>mgEl(id).value='');mgEl('adm-role').value='user';mgMessage(`${name} 계정을 추가했습니다.`);
 });
}
async function adminDelUser(email){if(email===PRIMARY_ADMIN_EMAIL||email===window._currentUser?.email){mgMessage('기본 관리자와 본인 계정은 삭제할 수 없습니다.',true);return;}if(!confirm(`${email} 이용 권한을 삭제할까요? 인증 계정과 계산 기록은 별도로 남습니다.`))return;await mgAction(async user=>{await db.runTransaction(async tx=>{await mgAuthority(tx,user);const ref=db.collection('accounts').doc(email);if(!(await tx.get(ref)).exists)throw Error('이미 삭제된 계정입니다.');tx.delete(ref);});mgMessage('이용 권한을 삭제했습니다.');});}
async function adminApprove(email){
 if(!confirm(`${email} 요청을 일반 사용자로 승인할까요?`))return;
 await mgAction(async user=>{
  await db.runTransaction(async tx=>{
   await mgAuthority(tx,user);const pending=db.collection('pendingRequests').doc(email),account=liAccountRef(email);
   const request=await tx.get(pending),existing=await tx.get(account);
   if(!request.exists)throw Error('이미 처리된 요청입니다.');if(existing.exists)throw Error('이미 계정이 있습니다.');
   const r=request.data();if(typeof r.uid!=='string'||!r.uid||!r.name||'pw' in r)throw Error('가입 요청의 인증 이전 설정을 확인해 주세요.');
   tx.set(account,{uid:r.uid,name:r.name,dept:r.dept||'',role:'user',disabled:false,createdAt:new Date().toISOString()});tx.delete(pending);
  });mgMessage('승인했습니다. 신청 시 설정한 비밀번호로 로그인할 수 있습니다.');
 });
}
async function adminReject(email){if(!confirm(`${email} 가입 요청을 거절할까요? 요청은 삭제되며 다시 신청할 수 있습니다.`))return;await mgAction(async user=>{await db.runTransaction(async tx=>{await mgAuthority(tx,user);const pending=db.collection('pendingRequests').doc(email);if(!(await tx.get(pending)).exists)throw Error('이미 처리된 요청입니다.');tx.delete(pending);});mgMessage('가입 요청을 거절했습니다.');});}
function exportMyHistory(){if(!window._currentUser)return;const rows=rpRecent.map(r=>({date:r.date,time:r.time,title:r.title,value:r.value,unit:r.unit,panel:r.panel,inputs:r.snapshot}));const blob=new Blob([JSON.stringify({format:'nozzle-history-v1',exportedAt:new Date().toISOString(),records:rows},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nozzle-history-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function profileOpen(){const user=window._currentUser;if(!user)return;userMenuClose();mgEl('profile-dialog').showModal();mgEl('profile-email').textContent=user.email;mgEl('profile-name').value=user.name||'';mgEl('profile-dept').value='';mgEl('profile-save').disabled=true;mgEl('profile-msg').textContent='정보를 불러오는 중…';try{const snap=await db.collection('accounts').doc(user.email).get();if(window._currentUser!==user)return;if(!snap.exists)throw Error('계정을 찾을 수 없습니다.');mgEl('profile-name').value=snap.data().name||'';mgEl('profile-dept').value=snap.data().dept||'';mgEl('profile-msg').textContent='이메일과 권한은 이 화면에서 변경할 수 없습니다.';mgEl('profile-save').disabled=false;}catch(e){mgEl('profile-msg').textContent='정보를 불러오지 못했습니다. 창을 닫고 다시 시도해 주세요.';}}
async function profileSave(){const user=window._currentUser;if(!user||mgEl('profile-save').disabled)return;const name=mgEl('profile-name').value.trim(),dept=mgEl('profile-dept').value.trim();if(!name||name.length>80||dept.length>100){mgEl('profile-msg').textContent='이름은 1~80자, 부서는 100자 이하로 입력해 주세요.';return;}mgEl('profile-save').disabled=true;try{await db.runTransaction(async tx=>{const ref=db.collection('accounts').doc(user.email),snap=await tx.get(ref);if(window._currentUser!==user||!snap.exists||snap.data().disabled===true||snap.data().uid!==user.uid)throw Error('계정 확인 실패');tx.update(ref,{name,dept});});if(window._currentUser!==user)return;user.name=name;user.dept=dept;liClearSavedCredentials();document.querySelector('.user-menu-name').textContent=name;document.querySelector('.user-menu-avatar').textContent=name.charAt(0);mgEl('profile-msg').textContent='내 정보를 저장했습니다.';}catch(e){mgEl('profile-msg').textContent='저장하지 못했습니다. 연결 상태와 로그인 상태를 확인해 주세요.';}finally{mgEl('profile-save').disabled=false;}}
window.addEventListener('DOMContentLoaded',()=>{
 const search=mgEl('mg-search'),filter=mgEl('mg-role');search.oninput=mgRenderAccounts;filter.onchange=mgRenderAccounts;mgEl('mg-state').onchange=mgRenderAccounts;
 document.querySelectorAll('.admin-field').forEach(f=>{const input=f.querySelector('input,select');if(input)f.querySelector('label')?.setAttribute('for',input.id);});
 const overlay=mgEl('admin-overlay');overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','계정 관리');overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();adminClose();}if(e.key==='Tab'){const items=[...overlay.querySelectorAll('button,input,select')].filter(x=>!x.disabled&&x.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
 for(const [name,id,container] of [['reqSubmit','req-msg','req-overlay'],['pwSubmit','pw-msg','pw-overlay']]){const original=window[name];let busy=false;window[name]=async function(){if(busy)return;busy=true;const buttons=mgEl(container).querySelectorAll('button');buttons.forEach(b=>b.disabled=true);try{await original();}catch(e){mgEl(id).textContent=liMessage(e);}finally{busy=false;buttons.forEach(b=>b.disabled=false);}};}
});

function mgEditable(email){if(email===PRIMARY_ADMIN_EMAIL||email===window._currentUser?.email)throw Error('기본 관리자와 본인 계정의 권한·이용 상태는 변경할 수 없습니다.');}
async function adminSetDisabled(email,disabled){
  try{mgAdmin();mgEditable(email);if(typeof disabled!=='boolean')throw Error('이용 상태를 확인하세요.');}catch(e){mgMessage(e.message,true);return;}
  if(!confirm(email+' 계정의 이용을 '+(disabled?'중지':'재개')+'할까요?'))return;
  await mgAction(async user=>{await db.runTransaction(async tx=>{await mgAuthority(tx,user);const ref=liAccountRef(email),snap=await tx.get(ref);if(!snap.exists)throw Error('계정을 찾을 수 없습니다.');tx.update(ref,{disabled,updatedAt:new Date().toISOString()});});mgMessage(disabled?'이용을 중지했습니다. 로그인과 서버 데이터 접근이 차단됩니다.':'이용을 재개했습니다.');});
}
async function adminSetRole(email,role){
  try{mgAdmin();mgEditable(email);if(!['user','admin'].includes(role))throw Error('권한을 확인하세요.');}catch(e){mgMessage(e.message,true);return;}
  if(!confirm(email+' 계정을 '+(role==='admin'?'관리자':'일반 사용자')+'로 변경할까요?'))return;
  await mgAction(async user=>{await db.runTransaction(async tx=>{await mgAuthority(tx,user);const ref=liAccountRef(email),snap=await tx.get(ref);if(!snap.exists)throw Error('계정을 찾을 수 없습니다.');tx.update(ref,{role,updatedAt:new Date().toISOString()});});mgMessage('계정 권한을 변경했습니다.');});
}
