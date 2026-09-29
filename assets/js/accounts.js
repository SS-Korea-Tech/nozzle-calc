// ══════════ Firebase 초기화 ══════════
const firebaseConfig = {
  apiKey: "AIzaSyA0FW5bjWOtm3kZESpFGXTLosOa1UCjO4s",
  authDomain: "nozzle-calc.firebaseapp.com",
  projectId: "nozzle-calc",
  storageBucket: "nozzle-calc.firebasestorage.app",
  messagingSenderId: "823973346627",
  appId: "1:823973346627:web:f81b71f84f7be4b82c43f6"
};
let db=null,auth=null;
try{firebase.initializeApp(firebaseConfig);db=firebase.firestore();auth=firebase.auth();}catch(e){/* liInit displays a recoverable connection error. */}
const PRIMARY_ADMIN_EMAIL='ycjung@spray.co.kr';
let liBusy=false,liEpoch=0,liCheckedAt=0,liManual=0,liUnwatch=null;
function liStorage(area,action,key,value){try{return window[area+'Storage'][action](key,value);}catch{return null;}}
function liClearSavedCredentials(){for(const area of ['local','session'])for(const key of ['li_auto','li_user','li_autologin'])liStorage(area,'removeItem',key);}
function liEmail(value){const email=String(value||'').trim().toLowerCase();if(email.length>254||!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email))throw Error('이메일 주소를 확인해 주세요.');return email;}
function liError(message){document.getElementById('li-error').textContent=message;}
function liClear(){liError('');}
function liMessage(error){
 const messages={
  'auth/invalid-login-credentials':'이메일 또는 비밀번호를 확인해 주세요.',
  'auth/invalid-credential':'이메일 또는 비밀번호를 확인해 주세요.',
  'auth/wrong-password':'이메일 또는 비밀번호를 확인해 주세요.',
  'auth/user-not-found':'이메일 또는 비밀번호를 확인해 주세요.',
  'auth/user-disabled':'이용이 중지된 계정입니다. 관리자에게 문의해 주세요.',
  'auth/network-request-failed':'연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.',
  'auth/too-many-requests':'요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  'auth/operation-not-allowed':'로그인 서비스 설정이 필요합니다. 관리자에게 문의해 주세요.',
  'auth/configuration-not-found':'로그인 서비스 설정이 필요합니다. 관리자에게 문의해 주세요.',
  'auth/web-storage-unsupported':'브라우저의 저장 공간을 허용한 뒤 다시 로그인해 주세요.',
  'auth/requires-recent-login':'현재 비밀번호를 다시 확인한 뒤 시도해 주세요.',
  'auth/weak-password':'비밀번호 정책을 확인하고 더 긴 비밀번호를 입력해 주세요.',
  'auth/invalid-email':'이메일 주소를 확인해 주세요.',
  'auth/email-already-in-use':'이미 등록된 이메일입니다. 기존 비밀번호를 확인하거나 비밀번호 재설정을 이용하세요.',
  'permission-denied':'접근 권한을 확인하지 못했습니다. 관리자에게 문의해 주세요.',
  'unavailable':'연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.'
 };return messages[error?.code]||(error?.code?'처리하지 못했습니다. 연결 상태와 계정 설정을 확인해 주세요.':error?.message)||'처리하지 못했습니다.';
}
function liAccountRef(email){if(!db)throw Error('로그인 서비스를 불러오지 못했습니다. 새로고침해 주세요.');return db.collection('accounts').doc(liEmail(email));}
async function liGetAccount(email){const snap=await liAccountRef(email).get({source:'server'});return snap.exists?snap.data():null;}
async function liGetAllAccounts(){mgAdmin();const snap=await db.collection('accounts').get(),all=Object.create(null);snap.forEach(doc=>all[doc.id]=doc.data());return all;}
async function liGetPending(){mgAdmin();const snap=await db.collection('pendingRequests').get(),all=Object.create(null);snap.forEach(doc=>all[doc.id]=doc.data());return all;}
function liSetBusy(busy,label='로그인'){
 liBusy=busy;const button=document.querySelector('.login-btn');button.disabled=busy;button.textContent=busy?'확인 중…':label;
}
function liShowLogin(){document.getElementById('login-overlay').classList.remove('hidden');document.querySelector('.layout').inert=true;}
function liCheckProfile(firebaseUser,account){
 if(!account){const e=Error('계정이 승인되지 않았습니다. 가입 요청 상태를 관리자에게 확인해 주세요.');e.membership=true;throw e;}
 if(account.uid!==firebaseUser.uid||'pw' in account){const e=Error('계정 이전 설정을 확인해야 합니다. 관리자에게 문의해 주세요.');e.membership=true;throw e;}
 if(account.disabled===true){const e=Error('이용이 중지된 계정입니다. 관리자에게 문의해 주세요.');e.membership=true;throw e;}
 if(!['admin','user'].includes(account.role)){const e=Error('계정 권한을 확인할 수 없습니다. 관리자에게 문의해 주세요.');e.membership=true;throw e;}
}
function liWatchAccount(user){
 liUnwatch?.();liUnwatch=null;
 const ref=liAccountRef(user.email);if(typeof ref.onSnapshot!=='function')return;
 liUnwatch=ref.onSnapshot(snap=>{
  if(snap.metadata?.fromCache||window._currentUser?.uid!==user.uid)return;
  try{liCheckProfile(user,snap.exists?snap.data():null);}catch(e){window.liLogout();liError(e.message);return;}
  const data=snap.data(),current=window._currentUser;
  if(current.role!==data.role||current.name!==data.name||current.dept!==(data.dept||'')){
   current.role=data.role;current.name=String(data.name||'');current.dept=String(data.dept||'');
   if(current.role!=='admin')document.getElementById('admin-overlay').classList.add('hidden');liShowApp(current);
  }
 },e=>{if(e.code==='permission-denied'&&window._currentUser?.uid===user.uid){window.liLogout();liError('이용 권한이 변경되었습니다. 다시 로그인해 주세요.');}});
}
async function liAccept(firebaseUser,epoch){
 const email=liEmail(firebaseUser.email),account=await liGetAccount(email);
 if(epoch!==liEpoch||auth.currentUser?.uid!==firebaseUser.uid)return false;
 liCheckProfile(firebaseUser,account);
 liShowApp({uid:firebaseUser.uid,email,name:String(account.name||''),dept:String(account.dept||''),role:account.role});
 document.getElementById('li-pw').value='';liClear();liWatchAccount(window._currentUser);return true;
}
function liInit(){
 liClearSavedCredentials();liShowLogin();const remembered=liStorage('local','getItem','li_email');if(remembered)document.getElementById('li-email').value=remembered;
 document.getElementById('li-remember').checked=liStorage('local','getItem','li_keep_login')!=='0';
 if(!auth){liSetBusy(false);liError('로그인 서비스를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.');return;}
 liSetBusy(true);
 auth.onAuthStateChanged(async user=>{
  if(liManual)return;
  if(!user){if(window._currentUser)window.liLogout(false);else liSetBusy(false);return;}
  if(window._currentUser?.uid===user.uid)return;
  window.liLogout(false);const epoch=++liEpoch;liSetBusy(true);
  document.getElementById('li-email').value=user.email||'';
  try{await liAccept(user,epoch);}catch(e){if(epoch!==liEpoch)return;if(e.membership)await auth.signOut();liError(liMessage(e));}
  finally{if(epoch===liEpoch)liSetBusy(false,auth.currentUser&&!window._currentUser?'다시 연결':'로그인');}
 },e=>{liSetBusy(false);liError(liMessage(e));});
}
async function liLogin(){
 if(liBusy)return;if(!auth){liError('로그인 서비스에 연결하지 못했습니다. 새로고침해 주세요.');return;}
 let email;try{email=liEmail(document.getElementById('li-email').value);}catch(e){liError(e.message);document.getElementById('li-email').focus();return;}
 const password=document.getElementById('li-pw'),pw=password.value;
 const resume=auth.currentUser&&liEmail(auth.currentUser.email)===email&&!pw;
 if(!pw&&!resume){liError('비밀번호를 입력해 주세요.');password.focus();return;}
 const epoch=++liEpoch;liManual++;liSetBusy(true);liClear();
 try{
  const keep=document.getElementById('li-remember').checked;
  await auth.setPersistence(keep?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION);
  if(epoch!==liEpoch)return;
  const user=resume?auth.currentUser:(await auth.signInWithEmailAndPassword(email,pw)).user;
  if(epoch!==liEpoch){if(!window._currentUser&&auth.currentUser?.uid===user.uid)await auth.signOut();return;}
  if(await liAccept(user,epoch)){
   liStorage('local','setItem','li_keep_login',keep?'1':'0');
   if(keep)liStorage('local','setItem','li_email',email);else liStorage('local','removeItem','li_email');
  }
 }catch(e){if(epoch===liEpoch){if(e.membership)await auth.signOut();liError(liMessage(e));}}
 finally{liManual--;if(epoch===liEpoch)liSetBusy(false);}
}
function liShowApp(user){
  const changed=window._currentUser?.email!==user.email;
  window._currentUser=user;liCheckedAt=Date.now();document.querySelector('.layout').inert=false;document.getElementById('login-overlay').classList.add('hidden');
  const old=document.querySelector('.badge')||document.getElementById('user-menu');
  if(old){const menu=document.createElement('div');menu.className='user-menu';menu.id='user-menu';
    const button=document.createElement('button');button.className='user-menu-btn';button.type='button';button.onclick=userMenuToggle;button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','user-menu-dropdown');
    for(const [cls,text] of [['user-menu-avatar',(user.name||'?').charAt(0)],['user-menu-name',user.name||user.email],['user-menu-caret','▾']]){const span=document.createElement('span');span.className=cls;span.textContent=text;button.append(span);}
    const dropdown=document.createElement('div');dropdown.id='user-menu-dropdown';dropdown.className='user-menu-dropdown';const email=document.createElement('div');email.className='user-menu-role';email.textContent=user.email;dropdown.append(email);
    const actions=[...(user.role==='admin'?[['계정 관리',()=>adminOpen()]]:[]),['내 정보',()=>profileOpen()],['내 계산 기록 내보내기',()=>exportMyHistory()],['비밀번호 변경',()=>pwOpen()],['로그아웃',()=>liLogout()]];
    for(const [label,run] of actions){const b=document.createElement('button');b.type='button';b.className='user-menu-item';b.textContent=label;b.onclick=()=>{userMenuClose();run();};dropdown.append(b);}menu.append(button,dropdown);old.replaceWith(menu);
  }
  if(changed){rpRecent=[];rpRenderRecent();rpLoadFromCloud();}
}
function userMenuToggle(){const open=document.getElementById('user-menu-dropdown')?.classList.toggle('open');document.querySelector('.user-menu-btn')?.setAttribute('aria-expanded',String(!!open));}
function userMenuClose(){document.getElementById('user-menu-dropdown')?.classList.remove('open');document.querySelector('.user-menu-btn')?.setAttribute('aria-expanded','false');}
document.addEventListener('click',e=>{const menu=document.getElementById('user-menu');if(menu&&!menu.contains(e.target))userMenuClose();});
function liLogout(signOut=true){
 ++liEpoch;liSetBusy(false);liUnwatch?.();liUnwatch=null;clearTimeout(_rpSaveTimer);window._currentUser=null;rpRecent=[];rpRenderRecent();liClearSavedCredentials();userMenuClose();
 for(const id of ['admin-overlay','pw-overlay','req-overlay'])document.getElementById(id)?.classList.add('hidden');
 document.getElementById('profile-dialog')?.close();
 for(const id of ['profile-name','profile-dept','adm-email','adm-name','adm-dept','req-name','req-email','req-dept']){const input=document.getElementById(id);if(input)input.value='';}
 for(const id of ['profile-email','pw-account-label','profile-msg','mg-status','req-msg','pw-msg']){const label=document.getElementById(id);if(label)label.textContent='';}
 if(!document.getElementById('li-remember').checked)document.getElementById('li-email').value='';
 const menu=document.getElementById('user-menu');if(menu){const badge=document.createElement('span');badge.className='badge';badge.textContent='계산 도구';menu.replaceWith(badge);}
 for(const input of document.querySelectorAll('input[autocomplete="current-password"],input[autocomplete="new-password"],#adm-pw'))input.value='';
 for(const id of ['admin-user-list','admin-pending-list'])document.getElementById(id)?.replaceChildren();
 if(typeof mg!=='undefined'){mg.accounts=[];mg.pending=[];}
 liClear();liShowLogin();document.getElementById('li-email').focus();
 if(signOut&&auth?.currentUser)return auth.signOut().catch(e=>liError(liMessage(e)));
 return Promise.resolve();
}
async function liCheckSession(){
 const user=window._currentUser;if(!user||Date.now()-liCheckedAt<60000)return;liCheckedAt=Date.now();
 try{
  if(auth.currentUser?.uid!==user.uid)throw Object.assign(Error('다시 로그인해 주세요.'),{membership:true});
  await auth.currentUser.reload();const account=await liGetAccount(user.email);if(window._currentUser!==user)return;
  liCheckProfile(user,account);
  if(account.role!==user.role){user.role=account.role;if(user.role!=='admin')document.getElementById('admin-overlay').classList.add('hidden');liShowApp(user);}
 }catch(e){if(window._currentUser===user&&(e.membership||['auth/user-disabled','auth/user-token-expired','auth/invalid-user-token','permission-denied'].includes(e.code))){window.liLogout();liError(liMessage(e));}}
}
window.addEventListener('focus',liCheckSession);setInterval(()=>{if(!document.hidden)liCheckSession();},60000);
window.addEventListener('DOMContentLoaded',()=>{liInit();calcUnit('pressure');calcNozzlePitch();drawNozzleReferenceDiagrams();});

let liSecondaryCounter=0;
// Account creation/registration uses a separate in-memory Auth instance so the current administrator stays signed in.
async function liWithSecondary(email,pw,work){
 const app=firebase.initializeApp(firebaseConfig,'account-operation-'+(++liSecondaryCounter));
 try{
  const secondary=app.auth();await secondary.setPersistence(firebase.auth.Auth.Persistence.NONE);
  let credential;try{credential=await secondary.createUserWithEmailAndPassword(email,pw);}catch(e){if(e.code!=='auth/email-already-in-use')throw e;credential=await secondary.signInWithEmailAndPassword(email,pw);}
  return await work(credential.user,app.firestore());
 }finally{try{await app.auth().signOut();}finally{await app.delete();}}
}
function reqOpen(){document.getElementById('req-overlay').classList.remove('hidden');document.getElementById('req-msg').textContent='';for(const id of ['req-name','req-email','req-dept','req-pw1','req-pw2'])document.getElementById(id).value='';document.getElementById('req-name').focus();}
function reqClose(){document.getElementById('req-overlay').classList.add('hidden');for(const id of ['req-pw1','req-pw2'])document.getElementById(id).value='';document.getElementById('li-email').focus();}
async function reqSubmit(){
 const name=document.getElementById('req-name').value.trim(),dept=document.getElementById('req-dept').value.trim(),pw=document.getElementById('req-pw1').value,msg=document.getElementById('req-msg');let email;
 try{email=liEmail(document.getElementById('req-email').value);}catch(e){msg.textContent=e.message;return;}
 if(!name||name.length>80||!dept||dept.length>100){msg.textContent='이름은 1~80자, 소속은 1~100자로 입력해 주세요.';return;}
 if(pw.length<8||pw.length>128){msg.textContent='새 비밀번호는 8~128자로 입력해 주세요.';return;}
 if(pw!==document.getElementById('req-pw2').value){msg.textContent='비밀번호가 일치하지 않습니다.';return;}
 msg.textContent='요청을 확인하는 중…';
 await liWithSecondary(email,pw,async(user,secondaryDb)=>{
  const account=secondaryDb.collection('accounts').doc(email),pending=secondaryDb.collection('pendingRequests').doc(email);
  await secondaryDb.runTransaction(async tx=>{
   const existing=await tx.get(account),request=await tx.get(pending);
   if(existing.exists)throw Error('이미 등록된 이메일입니다.');if(request.exists)throw Error('이미 요청이 접수되었습니다. 관리자 승인을 기다려 주세요.');
   tx.set(pending,{uid:user.uid,name,dept,requestedAt:new Date().toLocaleDateString('ko-KR'),requestedAtMs:Date.now()});
  });
 });
 msg.textContent='요청이 접수되었습니다. 관리자 승인 후 이용할 수 있습니다.';for(const id of ['req-pw1','req-pw2'])document.getElementById(id).value='';
}
function pwOpen(){if(!window._currentUser)return;document.getElementById('pw-account-label').textContent=window._currentUser.email;for(const id of ['pw-old','pw-new1','pw-new2'])document.getElementById(id).value='';document.getElementById('pw-msg').textContent='';document.getElementById('pw-overlay').classList.remove('hidden');document.getElementById('pw-old').focus();}
function pwClose(){document.getElementById('pw-overlay').classList.add('hidden');for(const id of ['pw-old','pw-new1','pw-new2'])document.getElementById(id).value='';document.querySelector('.user-menu-btn')?.focus();}
async function pwSubmit(){
 const user=window._currentUser,msg=document.getElementById('pw-msg'),old=document.getElementById('pw-old').value,pw=document.getElementById('pw-new1').value;
 if(!user||auth.currentUser?.uid!==user.uid){msg.textContent='다시 로그인해 주세요.';return;}
 if(pw.length<8||pw.length>128){msg.textContent='새 비밀번호는 8~128자로 입력해 주세요.';return;}
 if(pw!==document.getElementById('pw-new2').value){msg.textContent='새 비밀번호가 일치하지 않습니다.';return;}
 if(pw===old){msg.textContent='기존 비밀번호와 다른 비밀번호를 입력해 주세요.';return;}
 msg.textContent='변경하는 중…';const current=auth.currentUser;
 await current.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email,old));
 if(window._currentUser!==user||auth.currentUser?.uid!==user.uid)return;
 await current.updatePassword(pw);if(window._currentUser!==user)return;
 liClearSavedCredentials();for(const id of ['pw-old','pw-new1','pw-new2'])document.getElementById(id).value='';msg.textContent='비밀번호를 변경했습니다.';
}
async function liResetPassword(){
 const b=document.getElementById('li-reset');if(b.disabled)return;let email;
 if(!auth){liError('로그인 서비스에 연결하지 못했습니다. 새로고침해 주세요.');return;}
 try{email=liEmail(document.getElementById('li-email').value);}catch(e){liError('이메일을 입력한 뒤 비밀번호 재설정을 눌러 주세요.');return;}
 b.disabled=true;try{await auth.sendPasswordResetEmail(email);liError('등록된 계정이면 비밀번호 재설정 메일이 발송됩니다. 메일함을 확인하세요.');}
 catch(e){liError(e.code==='auth/user-not-found'?'등록된 계정이면 비밀번호 재설정 메일이 발송됩니다. 메일함을 확인하세요.':liMessage(e));}
 finally{b.disabled=false;}
}
