// ========== P5: NOZZLE NO. ==========
function calcNozzleNo() {
  let bad=false;
  {const e=document.getElementById('nn_p1'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('nn_q1'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('nn_pbase'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('nn_n'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('nn_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const P1    = parseFloat(document.getElementById('nn_p1').value);
  const Q1    = parseFloat(document.getElementById('nn_q1').value);
  const Pbase = parseFloat(document.getElementById('nn_pbase').value);
  const n     = parseFloat(document.getElementById('nn_n').value);
  const sel   = document.getElementById('nn_series');
  const mult  = Number(document.getElementById('nn_mult').value);
  if(!sel.value || n>1 || ![1,10].includes(mult)){showCalculationError('nn_result','노즐 시리즈 또는 직접 입력을 선택하고 지수·승수를 확인하세요.');return;}

  if ([P1,Q1,Pbase,n].some(v=>isNaN(v)||v<=0)) {
    document.getElementById('nn_result').innerHTML = '<div class="rp-empty">유효한 값을 입력하세요.</div>';
    return;
  }

  // Nozzle No. = (Pbase/P현장)^n × Q현장(L/min) × 0.26418 × 승수
  const nozzleNo = Math.pow(Pbase/P1, n) * Q1 / 3.785411784 * mult;
  // 참고: 기준압에서의 L/min 환산
  const qBase = Q1 * Math.pow(Pbase/P1, n);

  showResults('nn_result', [
    {label:'계산 용량번호', value:fmt(nozzleNo,3), unit:'실제 판매 용량번호와 대조'},
    {label:'기준압에서 환산 유량',value:fmt(qBase,4),unit:'L/min'},
  ]);
}

