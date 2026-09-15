// ========== P2: AIR 배관 ==========
function calcAirPipeSize() {
  let bad=false;
  {const e=document.getElementById('air_p'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v < 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('air_q'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('air_v'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('air_size_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const P = parseFloat(document.getElementById('air_p').value);     // bar
  const Q = parseFloat(document.getElementById('air_q').value);     // L/min
  const v = parseFloat(document.getElementById('air_v').value);     // m/s
  // Q_actual (m³/s) = Q_standard × (101.325/(P*100+101.325))
  const Pabs_kPa = P * 100 + 101.325;
  // 기준 유량을 선압 체적유량으로 환산합니다.
  // Actually: standard Q at line pressure → actual volume
  // d = sqrt(4*Q_actual / (pi*v)) in m → mm
  const Q_line_m3s = Q / 1000 / 60 * (101.325 / Pabs_kPa);
  const d_mm = Math.sqrt(4 * Q_line_m3s / (Math.PI * v)) * 1000;
  showResults('air_size_result', [
    {label:'계산된 배관 내경', value:fmt(d_mm, 2), unit:'mm'},
    {label:'배관 내경 (인치)', value:fmt(d_mm/25.4, 3), unit:'inch'},
    {label:'배관 단면적', value:fmt(Math.PI/4*d_mm*d_mm, 1), unit:'mm²'},
  ]);
}

function calcAirVelocity() {
  let bad=false;
  {const e=document.getElementById('airv_p'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v < 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('airv_q'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('airv_d'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('airv_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const P = parseFloat(document.getElementById('airv_p').value);
  const Q = parseFloat(document.getElementById('airv_q').value);
  const d = parseFloat(document.getElementById('airv_d').value);
  const Pabs = P * 100 + 101.325;
  const A = Math.PI / 4 * Math.pow(d / 1000, 2);
  const Q_line = Q / 1000 / 60 * (101.325 / Pabs);
  const vel = Q_line / A;
  showResults('airv_result', [
    {label:'배관내 유속', value:fmt(vel, 2), unit:'m/sec'},
    {label:'배관 단면적', value:fmt(A * 1e6, 3), unit:'mm²'},
    {label:'선압 실제 유량', value:fmt(Q_line * 60000, 2), unit:'L/min (선압 기준)'},
  ]);
}

