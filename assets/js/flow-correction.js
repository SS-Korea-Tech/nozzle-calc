// ========== P9: 유량 보정 ==========
function calcFlowCorr() {
  try {const v=deFlowValues();showResults('fc_q_result',[
    {label:'노즐당 적용 유량',value:fmt(v.per,4),unit:'L/min'},
    {label:'전체 노즐 유량',value:fmt(v.per*v.count,4),unit:`L/min · ${v.count}개 동시 분사`},
    {label:'기준 대비 유량 비율',value:fmt(v.per/v.q*100,2),unit:'%'},
    {label:'노즐당 유량 증감',value:fmt(v.per-v.q,4),unit:'L/min'}]);deMessage('fc_design_note','모든 노즐의 압력이 동일하다는 가정입니다. 헤더의 압력 차이는 설계 시트에서 검토하세요.');}
  catch(e){document.getElementById('fc_q_result').replaceChildren();deMessage('fc_design_note',e.message,true);deInvalidate(document.getElementById('fc-q'));}
}

function calcPresCorr() {
  let bad=false;
  {const e=document.getElementById('fp_p1'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('fp_q1'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('fp_q2'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('fp_n'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0 || v > 1){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('fp_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const P1 = parseFloat(document.getElementById('fp_p1').value);
  const Q1 = parseFloat(document.getElementById('fp_q1').value);
  const Q2 = parseFloat(document.getElementById('fp_q2').value);
  const n  = parseFloat(document.getElementById('fp_n').value);
  const P2 = P1 * Math.pow(Q2 / Q1, 1 / n);
  showResults('fp_result', [
    {label:'필요 압력 P₂', value:fmt(P2, 4), unit:'bar'},
    {label:'기준 대비 압력 비율',  value:fmt(P2/P1*100, 2), unit:'%'},
    {label:'압력 증감',    value:fmt(P2-P1, 4), unit:'bar'},
  ]);
}

function calcSGFlow() {
  let bad=false;
  {const e=document.getElementById('sg_qw'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('sg_sg'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('sg_rho'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('sg_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const Qw  = parseFloat(document.getElementById('sg_qw').value);
  const sg  = parseFloat(document.getElementById('sg_sg').value);
  const rho = parseFloat(document.getElementById('sg_rho').value);
  if(Math.abs(sg-rho/1000)>Math.max(1,sg)*1e-8){showCalculationError('sg_result','비중과 밀도가 일치하지 않습니다. 둘 중 한 항목을 다시 입력하면 연동됩니다.',['sg_sg','sg_rho']);return;}
  const Q_liq  = Qw / Math.sqrt(sg);
  const Q_liq2 = Qw * Math.sqrt(1000 / rho);
  showResults('sg_result', [
    {label:'액체 유량 (비중 기준)', value:fmt(Q_liq, 4), unit:'L/min'},
    {label:'액체 유량 (밀도 기준)', value:fmt(Q_liq2, 4), unit:'L/min'},
    {label:'비중', value:fmt(sg), unit:'SG'},
    {label:'밀도', value:fmt(rho), unit:'kg/m³'},
    {label:'물 기준 유량', value:fmt(Qw), unit:'L/min'},
  ]);
}


window.addEventListener('DOMContentLoaded',()=>{
 const sg=document.getElementById('sg_sg'),rho=document.getElementById('sg_rho');
 for(const [from,to,factor] of [[sg,rho,1000],[rho,sg,0.001]])from.addEventListener('input',()=>{to.value=from.value===''?'':String(Number(from.value)*factor);deInvalidate(from.closest('.section-body'));});
 rho.value=sg.value===''?'':String(Number(sg.value)*1000);
});
