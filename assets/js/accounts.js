// ══════════ Firebase 초기화 ══════════
const firebaseConfig = {
  apiKey: "AIzaSyA0FW5bjWOtm3kZESpFGXTLosOa1UCjO4s",
  authDomain: "nozzle-calc.firebaseapp.com",
  projectId: "nozzle-calc",
  storageBucket: "nozzle-calc.firebasestorage.app",
  messagingSenderId: "823973346627",
  appId: "1:823973346627:web:f81b71f84f7be4b82c43f6"
};
let db=null;
try{firebase.initializeApp(firebaseConfig);db=firebase.firestore();}catch(e){window.addEventListener('DOMContentLoaded',()=>liError('로그인 서비스에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 새로고침해 주세요.'));}

const PRIMARY_ADMIN_EMAIL = 'ycjung@spray.co.kr';
// Compatibility adapter for existing account records. Server authentication is a separate migration.
let liBusy=false,liEpoch=0,liCheckedAt=0;
function liStorage(area,action,key,value){try{return window[area+'Storage'][action](key,value);}catch{return null;}}
function liClearSavedCredentials(){for(const area of ['local','session'])for(const key of ['li_auto','li_user','li_autologin'])liStorage(area,'removeItem',key);}
function liEmail(value){const email=String(value||'').trim().toLowerCase();if(email.length>254||!/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(email)||/[\/]/.test(email))throw Error('이메일 주소를 확인해 주세요.');return email;}
function liAccountRef(email){if(!db)throw Error('로그인 서비스를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.');return db.collection('accounts').doc(liEmail(email));}
async function liGetAccount(email){const snap=await liAccountRef(email).get();return snap.exists?snap.data():null;}
async function liGetAllAccounts(){mgAdmin();const snap=await db.collection('accounts').get(),all=Object.create(null);snap.forEach(doc=>{all[doc.id]=doc.data();});return all;}
async function liGetPending(){mgAdmin();const snap=await db.collection('pendingRequests').get(),all=Object.create(null);snap.forEach(doc=>{all[doc.id]=doc.data();});return all;}
function liError(message){document.getElementById('li-error').textContent=message;}
function liClear(){liError('');}
function liInit(){liClearSavedCredentials();liShowLogin();}
function liShowLogin(){
  const email=liStorage('local','getItem','li_email');if(email){document.getElementById('li-email').value=email;document.getElementById('li-remember').checked=true;}
  document.getElementById('login-overlay').classList.remove('hidden');document.querySelector('.layout').inert=true;
}
async function liLogin(){
  if(liBusy)return;let email;const input=document.getElementById('li-email'),password=document.getElementById('li-pw'),button=document.querySelector('.login-btn');
  try{email=liEmail(input.value);}catch(e){liError(e.message);input.focus();return;}
  const pw=password.value;if(!pw){liError('비밀번호를 입력해 주세요.');password.focus();return;}
  liBusy=true;const epoch=++liEpoch;button.disabled=true;button.textContent='확인 중…';liClear();let timer;
  try{
    const account=await Promise.race([liGetAccount(email),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('응답이 지연되고 있습니다. 연결 상태를 확인하고 다시 시도해 주세요.')),15000);})]);
    if(epoch!==liEpoch)return;
    if(!account||account.pw!==pw)throw Error('이메일 또는 비밀번호를 확인해 주세요.');
    if(account.disabled===true)throw Error('이용이 중지된 계정입니다. 관리자에게 문의해 주세요.');
    if(!['admin','user'].includes(account.role))throw Error('계정 권한을 확인할 수 없습니다. 관리자에게 문의해 주세요.');
    if(document.getElementById('li-remember').checked)liStorage('local','setItem','li_email',email);else liStorage('local','removeItem','li_email');
    liClearSavedCredentials();liShowApp({email,pw,name:String(account.name||''),dept:String(account.dept||''),role:account.role});password.value='';
  }catch(e){if(epoch===liEpoch)liError(e.code?'연결 또는 접근 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.':e.message);}
  finally{clearTimeout(timer);if(epoch===liEpoch){liBusy=false;button.disabled=false;button.textContent='로그인';}}
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
function liLogout(){
  ++liEpoch;liBusy=false;clearTimeout(_rpSaveTimer);window._currentUser=null;rpRecent=[];rpRenderRecent();liClearSavedCredentials();userMenuClose();
  for(const id of ['admin-overlay','pw-overlay','req-overlay'])document.getElementById(id)?.classList.add('hidden');
  document.getElementById('profile-dialog')?.close();
  for(const input of document.querySelectorAll('input[autocomplete="current-password"],input[autocomplete="new-password"],#adm-pw'))input.value='';
  for(const id of ['admin-user-list','admin-pending-list'])document.getElementById(id)?.replaceChildren();
  if(typeof mg!=='undefined'){mg.accounts=[];mg.pending=[];}
  const button=document.querySelector('.login-btn');button.disabled=false;button.textContent='로그인';liClear();liShowLogin();document.getElementById('li-email').focus();
}
async function liCheckSession(){
  const user=window._currentUser;if(!user||Date.now()-liCheckedAt<60000)return;liCheckedAt=Date.now();
  try{const account=await liGetAccount(user.email);if(window._currentUser!==user)return;
    if(!account||account.pw!==user.pw||account.disabled===true||!['admin','user'].includes(account.role)){liLogout();liError('계정 정보가 변경되었습니다. 다시 로그인해 주세요.');return;}
    if(account.role!==user.role){user.role=account.role;if(user.role!=='admin')document.getElementById('admin-overlay').classList.add('hidden');liShowApp(user);}
  }catch{/* A temporary connection failure must not erase unsaved calculations. */}
}
window.addEventListener('focus',liCheckSession);setInterval(()=>{if(!document.hidden)liCheckSession();},60000);
window.addEventListener('DOMContentLoaded',()=>{liInit();calcUnit('pressure');calcNozzlePitch();drawNozzleReferenceDiagrams();});

function reqOpen(){document.getElementById('req-overlay').classList.remove('hidden');document.getElementById('req-msg').textContent='';for(const id of ['req-name','req-email','req-dept','req-pw1','req-pw2'])document.getElementById(id).value='';document.getElementById('req-name').focus();}
function reqClose(){document.getElementById('req-overlay').classList.add('hidden');for(const id of ['req-pw1','req-pw2'])document.getElementById(id).value='';document.getElementById('li-email').focus();}
async function reqSubmit(){
  const name=document.getElementById('req-name').value.trim(),dept=document.getElementById('req-dept').value.trim(),pw=document.getElementById('req-pw1').value,msg=document.getElementById('req-msg');let email;
  try{email=liEmail(document.getElementById('req-email').value);}catch(e){msg.textContent=e.message;return;}
  if(!name||name.length>80||!dept||dept.length>100){msg.textContent='이름은 1~80자, 소속은 1~100자로 입력해 주세요.';return;}
  if(pw.length<8||pw.length>128){msg.textContent='새 비밀번호는 8~128자로 입력해 주세요.';return;}
  if(pw!==document.getElementById('req-pw2').value){msg.textContent='비밀번호가 일치하지 않습니다.';return;}
  msg.textContent='요청을 확인하는 중…';const ref=liAccountRef(email),pending=db.collection('pendingRequests').doc(email);
  await db.runTransaction(async tx=>{const account=await tx.get(ref),request=await tx.get(pending);if(account.exists)throw Error('이미 등록된 이메일입니다.');if(request.exists)throw Error('이미 요청이 접수되었습니다. 관리자 승인을 기다려 주세요.');tx.set(pending,{name,dept,pw,requestedAt:new Date().toLocaleDateString('ko-KR'),requestedAtMs:Date.now()});});
  msg.textContent='요청이 접수되었습니다. 관리자 승인 후 이용할 수 있습니다.';for(const id of ['req-pw1','req-pw2'])document.getElementById(id).value='';
}
function pwOpen(){if(!window._currentUser)return;document.getElementById('pw-account-label').textContent=window._currentUser.email;for(const id of ['pw-old','pw-new1','pw-new2'])document.getElementById(id).value='';document.getElementById('pw-msg').textContent='';document.getElementById('pw-overlay').classList.remove('hidden');document.getElementById('pw-old').focus();}
function pwClose(){document.getElementById('pw-overlay').classList.add('hidden');for(const id of ['pw-old','pw-new1','pw-new2'])document.getElementById(id).value='';document.querySelector('.user-menu-btn')?.focus();}
async function pwSubmit(){
  const user=window._currentUser,msg=document.getElementById('pw-msg'),old=document.getElementById('pw-old').value,pw=document.getElementById('pw-new1').value;
  if(!user){msg.textContent='다시 로그인해 주세요.';return;}
  if(pw.length<8||pw.length>128){msg.textContent='새 비밀번호는 8~128자로 입력해 주세요.';return;}
  if(pw!==document.getElementById('pw-new2').value){msg.textContent='새 비밀번호가 일치하지 않습니다.';return;}
  if(pw===old){msg.textContent='기존 비밀번호와 다른 비밀번호를 입력해 주세요.';return;}
  msg.textContent='변경하는 중…';await db.runTransaction(async tx=>{const ref=liAccountRef(user.email),snap=await tx.get(ref);if(window._currentUser!==user||!snap.exists||snap.data().disabled===true||snap.data().pw!==old)throw Error('현재 비밀번호와 로그인 상태를 확인해 주세요.');tx.update(ref,{pw,updatedAt:new Date().toISOString()});});
  if(window._currentUser!==user)return;user.pw=pw;liClearSavedCredentials();for(const id of ['pw-old','pw-new1','pw-new2'])document.getElementById(id).value='';msg.textContent='비밀번호를 변경했습니다. 닫기를 눌러 계속 이용하세요.';
}
