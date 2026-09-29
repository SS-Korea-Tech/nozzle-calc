/* Calculator navigation, responsive help and one-step transfer undo. */
function positionCalculatorSupport(force=false){
  const help=document.getElementById('calculation-help'),recent=document.getElementById('calculation-history');
  if(!help||!recent)return;
  const small=window.innerWidth<=1000;
  const changed=positionCalculatorSupport.small!==small;
  if(small){
    const panel=document.querySelector('.panel.active');
    if(panel){panel.append(help,recent);if(changed||force){help.open=false;recent.open=false;}}
  }else{
    document.querySelector('.right-panel').append(help,recent);
    if(changed||force){help.open=true;recent.open=true;}
  }
  positionCalculatorSupport.small=small;
}
function openCalculatorSupport(id){
  positionCalculatorSupport();
  const box=document.getElementById(id);if(!box)return;
  box.open=true;box.scrollIntoView({block:'start',behavior:'smooth'});box.querySelector('summary').focus({preventScroll:true});
}
(function(){
  'use strict';
  const el=id=>document.getElementById(id);
  const fields=()=>[...document.querySelectorAll('.panel input[id],.panel select[id]')].filter(e=>e.type!=='file'&&e.type!=='password');
  const snapshot=()=>Object.fromEntries(fields().map(e=>[e.id,{value:e.value,index:e.tagName==='SELECT'?e.selectedIndex:null}]));
  const button=(label,run)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=run;return b;};
  let undo=null,baseline=null;
  function assign(data){
    const panels=new Set();
    for(const [id,v] of Object.entries(data)){const e=el(id);if(!e)continue;e.value=v.value;if(v.index!==null)e.selectedIndex=v.index;e.removeAttribute('aria-invalid');panels.add(e.closest('.panel'));}
    panels.forEach(p=>{deInvalidate(p);p?.querySelectorAll('.design-message').forEach(e=>e.textContent='');});
    if(panels.has(el('p7')))for(const id of ['nz_front_svg','nz_plan_svg'])el(id)?.replaceChildren();
  }
  function clearTransfer(){
    undo=null;const box=el('cx-transfer');if(box){box.replaceChildren();box.hidden=true;}
    document.querySelectorAll('.just-applied').forEach(e=>e.classList.remove('just-applied'));
  }
  function transfer(name,fn){window[name]=function(...args){
    const before=snapshot(),result=fn.apply(this,args),after=snapshot();
    const changed=Object.keys(before).filter(id=>JSON.stringify(before[id])!==JSON.stringify(after[id]));
    if(!changed.length)return result;
    clearTransfer();undo={before:Object.fromEntries(changed.map(id=>[id,before[id]])),after:Object.fromEntries(changed.map(id=>[id,after[id]]))};
    const box=el('cx-transfer');document.querySelector('.panel.active .panel-header')?.after(box);
    const title=document.createElement('strong');title.textContent='입력값을 적용했습니다.';box.append(title);
    const details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('ul');summary.textContent='변경한 값';
    for(const id of changed){
      const input=el(id);input.classList.add('just-applied');
      const li=document.createElement('li'),label=input.closest('.field')?.querySelector('label')?.textContent.trim()||id;
      li.textContent=label+': '+before[id].value+' → '+after[id].value;list.append(li);
    }
    details.append(summary,list);
    box.append(button('되돌리기',()=>{
      if(!undo)return;const now=snapshot();
      if(Object.keys(undo.after).some(id=>JSON.stringify(now[id])!==JSON.stringify(undo.after[id]))){title.textContent='이후에 수정한 값이 있어 되돌리지 않았습니다.';return;}
      assign(undo.before);clearTransfer();box.hidden=false;box.textContent='이전 입력값으로 되돌렸습니다. 다시 계산하세요.';
    }),details);box.hidden=false;return result;
  };}
  window.addEventListener('DOMContentLoaded',()=>{
    baseline=snapshot();
    const transfers=document.createElement('section');transfers.id='cx-transfer';transfers.className='cx-box';transfers.setAttribute('role','status');transfers.hidden=true;document.querySelector('.main').prepend(transfers);
    for(const name of ['applyRecommendedPitch','applyHeaderCount','applyTotalFlow'])transfer(name,window[name]);
    document.querySelector('.main').addEventListener('input',e=>e.target.classList?.remove('just-applied'));
    const logout=liLogout;liLogout=function(...args){
      clearTransfer();assign(baseline);weightShapeChanged();nnSelectSeries(el('nn_series'));
      document.querySelectorAll('.result-grid').forEach(e=>e.replaceChildren());
      document.querySelectorAll('.ux-result-tools,#audit-restore-note').forEach(e=>e.remove());
      document.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));
      el('li-pw').type='password';const toggle=document.querySelector('.ux-password-toggle');toggle.textContent='표시';toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label','비밀번호 표시');
      document.querySelector('.ux-caps').hidden=true;return logout(...args);
    };
    const restore=window.rpRestoreRecord;window.rpRestoreRecord=function(index){clearTransfer();return restore(index);};
    const show=window.showPanel;window.showPanel=function(id,item){
      if(!document.getElementById(id)?.classList.contains('panel'))return;
      show(id,item);
      const search=document.querySelector('.ux-search');if(item?.hidden&&search){search.value='';search.oninput();}
      positionCalculatorSupport(true);
    };
    window.addEventListener('resize',()=>positionCalculatorSupport());positionCalculatorSupport(true);
  });
})();
