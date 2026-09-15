// ========== P3: WATER 배관 ==========
function calcWaterSize() {
  let bad=false;
  {const e=document.getElementById('wat_q'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('wat_v'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('wat_size_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const Q = parseFloat(document.getElementById('wat_q').value);
  const v = parseFloat(document.getElementById('wat_v').value);
  const d = Math.sqrt(Q / 1000 / 60 / (Math.PI / 4 * v)) * 1000;
  showResults('wat_size_result', [
    {label:'계산된 배관 내경', value:fmt(d, 2), unit:'mm'},
    {label:'배관 내경 (인치)', value:fmt(d/25.4, 3), unit:'inch'},
    {label:'배관 단면적', value:fmt(Math.PI/4*d*d, 1), unit:'mm²'},
  ]);
}

function calcWaterVelocity() {
  let bad=false;
  {const e=document.getElementById('watv_q'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('watv_d'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('watv_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const Q = parseFloat(document.getElementById('watv_q').value);
  const d = parseFloat(document.getElementById('watv_d').value);
  const A = Math.PI / 4 * Math.pow(d / 1000, 2);
  const v = Q / 1000 / 60 / A;
  showResults('watv_result', [
    {label:'배관내 유속', value:fmt(v, 3), unit:'m/sec'},
    {label:'배관 단면적', value:fmt(A * 1e6, 2), unit:'mm²'},
    {label:'유속 판정', value:fmt(v, 3), unit:'m/s · 허용 유속은 용도·압력손실 기준으로 판단'},
  ]);
}

function calcWaterLoss() {
  let bad=false;
  {const e=document.getElementById('watloss_q'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('watloss_d'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('watloss_c'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('watloss_l'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v < 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('watloss_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const Q = parseFloat(document.getElementById('watloss_q').value);   // L/min
  const d = parseFloat(document.getElementById('watloss_d').value);   // mm
  const C = parseFloat(document.getElementById('watloss_c').value);
  const L = parseFloat(document.getElementById('watloss_l').value);   // m
  // Hazen-Williams: hf (m) = 10.67 × L × Q^1.852 / (C^1.852 × d^4.87)
  // Q in m³/s, d in m
  const Q_m3s = Q / 1000 / 60;
  const d_m = d / 1000;
  const hf_m = 10.67 * L * Math.pow(Q_m3s, 1.852) / (Math.pow(C, 1.852) * Math.pow(d_m, 4.87));
  const hf_kgcm2 = hf_m / 10.0;
  const hf_bar = hf_kgcm2 * 0.980665;
  const re=(Q_m3s/(Math.PI*d_m*d_m/4))*d_m/1.004e-6;
  const applicability=L===0?'길이 0: 마찰손실 없음':re<4000?'난류 가정 재검토':'물·난류 가정';
  showResults('watloss_result', [
    {label:'압력 손실', value:fmt(hf_m, 3), unit:'m H₂O'},
    {label:'압력 손실', value:fmt(hf_kgcm2, 4), unit:'kgf/cm²'},
    {label:'압력 손실', value:fmt(hf_bar, 4), unit:'bar'},
    {label:'식 적용 확인',value:applicability,unit:'Re ≈ '+fmt(re,0)+' · 약 20°C 물',tone:L>0&&re<4000?'warning':undefined},
  ]);
}

