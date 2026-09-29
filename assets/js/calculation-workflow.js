
// Shared checks and transfers for individual calculators.
const CalculationMath = Object.freeze({
  positive(v, label) {if (!Number.isFinite(v) || v <= 0) throw Error(label+'은 0보다 큰 값이어야 합니다.');return v;},
  header(w,h,angle,reduction,target,pitch) {
    [w,h,pitch].forEach(v=>this.positive(v,'폭·거리·피치'));
    if (![angle,reduction,target].every(Number.isFinite) || angle<=0 || angle>=180 || reduction<0 || reduction>=100 || target<0 || target>=100) throw Error('각도와 중첩률·감소율 범위를 확인하세요.');
    const a=2*h*Math.tan(angle*Math.PI/360),b=a*(1-reduction/100),count=Math.ceil(w/pitch);
    if (!Number.isFinite(b) || !Number.isSafeInteger(count) || count>500) throw Error('배치 수량이 500개를 넘습니다. 폭과 피치의 단위를 확인하세요.');
    const cover=(count-1)*pitch+b,overlap=Math.max(0,b-pitch),actual=count>1?overlap/b*100:null;
    return {a,b,count,cover,overlap,actual,recommended:b*(1-target/100),first:(w-(count-1)*pitch)/2,edge:(cover-w)/2,
      widthOK:cover>=w-1e-8,gap:count>1?Math.max(0,pitch-b):0,targetOK:count===1?null:actual>=target-1e-8};
  },
  flow(q,p1,p2,n) { if(n>1)throw Error('유량 지수 n은 0 초과, 1 이하로 입력하세요.');[q,p1,p2,n].forEach(v=>this.positive(v,'유량·압력·지수'));const r=q*Math.pow(p2/p1,n);if(!Number.isFinite(r))throw Error('유량 계산 범위를 초과했습니다.');return r; }
});

const deEl=id=>document.getElementById(id);
function deNumber(id) {const v=deEl(id).value.trim();return v===''?NaN:Number(v);}
function deMessage(id,text,warning=false){const e=deEl(id);if(!e)return;e.textContent=text;e.classList.toggle('warning',warning);}
function deInvalidate(area){
  if(!area)return;
  area.querySelectorAll('.result-grid').forEach(r=>{r.classList.add('ux-stale');const t=r.nextElementSibling;if(t?.classList.contains('ux-result-tools')){t.querySelector('span').textContent='입력값이 바뀌었습니다. 다시 계산해 주세요.';t.querySelectorAll('button').forEach(b=>b.disabled=true);}});
}
function deWrite(id,value){const e=deEl(id);if(!e)return;e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
function deGo(panel,group,tab){
  showPanel(panel,document.querySelector(`.nav-item[onclick*="'${panel}'"]`));
  if(group&&tab){const b=[...deEl(panel).querySelectorAll('.tab-btn')].find(b=>b.getAttribute('onclick')?.includes(`'${tab}'`));if(b)switchTab(group,tab,b);}
    deEl(panel).scrollIntoView({block:'start'});
}
const CALC_LINKS=[['wat_q','watv_q','watloss_q'],['watv_d','watloss_d'],['air_p','airv_p'],['air_q','airv_q'],['fc_q1','fp_q1'],['fc_p1','fp_p1'],['fc_n','fp_n']];
function syncCalculatorInputs(panel){
  for(const ids of CALC_LINKS){
    if(!ids.some(id=>deEl(id).closest('.panel')===panel))continue;
    const active=ids.find(id=>deEl(id).closest('.tab-panel')?.classList.contains('active'))||ids[0];
    for(const id of ids)if(id!==active){deEl(id).value=deEl(active).value;deInvalidate(deEl(id).closest('.section-body'));}
  }
}
function deHeader(){return CalculationMath.header(...['nz_w','nz_h','nz_ang','nz_tilt','nz_ov','nz_fp'].map(deNumber));}
function applyRecommendedPitch(){
  try{const r=deHeader();deWrite('nz_fp',Number(r.recommended.toPrecision(12)));calcNozzlePitch();deMessage('nz_design_note','목표 중첩률에 맞는 피치를 적용했습니다.');}
  catch(e){deMessage('nz_design_note',e.message,true);}
}
function applyHeaderCount(){
  try{const r=deHeader();deWrite('fc_count',r.count);deGo('p9','fc','q');deMessage('fc_design_note',`헤더 수량 ${r.count}개를 적용했습니다. 노즐의 기준 유량과 압력을 입력하세요.`);}
  catch(e){deMessage('nz_design_note',e.message,true);}
}
function deFlowValues(){
  let invalid=null;
  for(const id of ['fc_q1','fc_p1','fc_p2','fc_n','fc_count']){
    const e=deEl(id),v=deNumber(id),valid=Number.isFinite(v)&&v>0&&(id!=='fc_n'||v<=1)&&(id!=='fc_count'||(Number.isInteger(v)&&v<=500));
    if(valid)e.removeAttribute('aria-invalid');else{e.setAttribute('aria-invalid','true');invalid ||= id;}
  }
  if(invalid){const label=deEl(invalid).closest('.field').querySelector('label').textContent.trim();throw Error(label+': '+(invalid==='fc_count'?'1~500개의 정수를 입력하세요.':invalid==='fc_n'?'0 초과, 1 이하로 입력하세요.':'0보다 큰 값을 입력하세요.'));}
  const q=deNumber('fc_q1'),p1=deNumber('fc_p1'),p2=deNumber('fc_p2'),n=deNumber('fc_n'),count=deNumber('fc_count');
  return {q,p1,p2,n,count,per:CalculationMath.flow(q,p1,p2,n)};
}
function applyTotalFlow(){
  try{
    const v=deFlowValues(),total=v.per*v.count;if(!Number.isFinite(total))throw Error('총유량이 계산 범위를 초과했습니다.');
    ['wat_q','watv_q','watloss_q'].forEach(id=>deWrite(id,total));
    deGo('p3','water','size');deMessage('wat_design_note',`노즐 ${v.count}개 × ${fmt(v.per,4)} = 총 ${fmt(total,4)} L/min을 물 배관의 3개 탭에 적용했습니다.`);
  }catch(e){deMessage('fc_design_note',e.message,true);}
}
function nnRefreshHelp(){
  const sel=deEl('nn_series'),o=sel.selectedOptions[0];
  deEl('nn_help_current').textContent=sel.value?o.textContent.trim():'시리즈를 선택하거나 직접 입력을 선택하세요.';
  const box=deEl('nn_help_values');box.replaceChildren();
  for(const [label,value] of [['기준압',`${deEl('nn_pbase').value} kgf/cm²`],['유량 지수',deEl('nn_n').value],['용량번호 승수',`×${deEl('nn_mult').value}`]]){
    const row=document.createElement('div');row.className='rht-row';for(const text of [label,value]){const sp=document.createElement('span');sp.textContent=text;row.append(sp);}box.append(row);
  }
}
function nnBuildReference(){
  const body=deEl('nn_reference_body');body.replaceChildren();
  for(const opt of deEl('nn_series').options){if(!opt.value.includes('|'))continue;const [p,n,m]=opt.value.split('|'),row=document.createElement('tr');
    for(const text of [opt.textContent.trim(),Number(p).toFixed(6),Number(n).toFixed(2),`×${m}`]){const td=document.createElement('td');td.textContent=text;row.append(td);}body.append(row);
  }
  nnRefreshHelp();
}
window.addEventListener('DOMContentLoaded',()=>{
  nnBuildReference();nnSelectSeries(deEl('nn_series'));
  deEl('p5').addEventListener('input',nnRefreshHelp);
  deEl('p5').addEventListener('change',nnRefreshHelp);
  for(const ids of CALC_LINKS)for(const id of ids)deEl(id).addEventListener('input',()=>{
    for(const other of ids)if(other!==id){deEl(other).value=deEl(id).value;deInvalidate(deEl(other).closest('.section-body'));}
  });
  for(const id of ['p2','p3','p9'])syncCalculatorInputs(deEl(id));
  const restore=window.rpRestoreRecord;
  window.rpRestoreRecord=function(index){
    if(!/^p(?:[1-9]|1[0-2])$/.test(rpRecent[index]?.panel||''))return;
    restore(index);
    const panel=document.querySelector('.panel.active')?.id;
    syncCalculatorInputs(deEl(panel));
    if(panel==='p4')weightShapeChanged();
    if(panel==='p5')nnSelectSeries(deEl('nn_series'));
    if(panel==='p7'){['nz_front_svg','nz_plan_svg'].forEach(id=>deEl(id)?.replaceChildren());deMessage('nz_design_note','저장된 입력조건입니다. 다시 계산하면 배치도를 표시합니다.');}
  };
  // The same checked equation supplies the air reference table and calculation.
  const table=deEl('p8').querySelector('table');if(table){const rows=table.querySelectorAll('tr');
    const pressures=[0.7,1,1.5,2,2.5,3,4,5,7,10];
    rows.forEach((tr,index)=>{if(index===0)return;const cells=tr.querySelectorAll('td'),diameter=parseFloat(cells[0]?.textContent);if(!diameter)return;pressures.forEach((p,j)=>{if(!cells[j+1])return;try{cells[j+1].textContent=fmt(airOrifice(diameter,p*0.980665,20,1).flow,1);}catch{cells[j+1].textContent='범위 밖';}});});
  }
});

