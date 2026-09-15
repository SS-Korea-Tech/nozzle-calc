// ========== P11: 충격력 ==========
function calcImpact() {
  let bad=false;
  {const e=document.getElementById('imp_p'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('imp_q'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('imp_eff'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v < 0 || v > 100){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('imp_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const P = parseFloat(document.getElementById('imp_p').value);
  const Q = parseFloat(document.getElementById('imp_q').value);
  const eff = parseFloat(document.getElementById('imp_eff').value) / 100;
  const F_max = (1000 * (Q / 60000) * Math.sqrt(2 * P * 100000 / 1000)) / 9.80665;
  const F_eff = F_max * eff;
  showResults('imp_result', [
    {label:'이론 최대 충격력', value:fmt(F_max, 4), unit:'kgf'},
    {label:`실효 충격력 (효율 ${Math.round(eff*100)}%)`, value:fmt(F_eff, 4), unit:'kgf'},
    {label:'실효 충격력', value:fmt(F_eff*9.80665, 3), unit:'N'},
  ]);
}

