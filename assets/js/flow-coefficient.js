// ========== P6: 유량계수·오리피스 ==========
const KF = Math.PI/4 * 0.06 * Math.sqrt(200);

function calcNozzleFlow() {
  let bad=false;
  {const e=document.getElementById('or_p'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('or_d'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('or_cd'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0 || v > 1){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('or_flow_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const P = parseFloat(document.getElementById('or_p').value);
  const d = parseFloat(document.getElementById('or_d').value);
  const Cd = parseFloat(document.getElementById('or_cd').value);
  const A_m2 = Math.PI / 4 * Math.pow(d / 1000, 2);
  const P_pa = P * 1e5;
  const v = Math.sqrt(2 * P_pa / 1000);
  const Q_m3s = Cd * A_m2 * v;
  const Q_lmin = Q_m3s * 1000 * 60;
  showResults('or_flow_result', [
    {label:'분사 유량', value:fmt(Q_lmin, 4), unit:'L/min'},
    {label:'분사 유량', value:fmt(Q_lmin*60/1000, 5), unit:'m³/hr'},
    {label:'이상 유속', value:fmt(v, 2), unit:'m/s · 손실 제외'},
    {label:'구경 기준 평균 유속',value:fmt(Cd*v,2),unit:'m/s · Q/A'},
    {label:'오리피스 단면적', value:fmt(A_m2*1e6, 3), unit:'mm²'},
  ]);
}

function calcNozzlePres() {
  let bad=false;
  {const e=document.getElementById('orp_q'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('orp_d'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('orp_cd'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0 || v > 1){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('or_pres_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const Q = parseFloat(document.getElementById('orp_q').value);
  const d = parseFloat(document.getElementById('orp_d').value);
  const Cd = parseFloat(document.getElementById('orp_cd').value);
  const A_m2 = Math.PI / 4 * Math.pow(d / 1000, 2);
  const Q_m3s = Q / 1000 / 60;
  const v = Q_m3s / (Cd * A_m2);
  const P_pa = 1000 * v * v / 2;
  const P_bar = P_pa / 1e5;
  showResults('or_pres_result', [
    {label:'필요 압력', value:fmt(P_bar, 4), unit:'bar'},
    {label:'필요 압력', value:fmt(P_bar/0.980665, 4), unit:'kgf/cm²'},
    {label:'이상 유속', value:fmt(v, 2), unit:'m/s · 손실 제외'},
    {label:'구경 기준 평균 유속',value:fmt(Cd*v,2),unit:'m/s · Q/A'},
  ]);
}

function calcOrifice() {
  let bad=false;
  {const e=document.getElementById('ori_p'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('ori_q'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('ori_cd'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0 || v > 1){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('or_ori_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const P = parseFloat(document.getElementById('ori_p').value);
  const Q = parseFloat(document.getElementById('ori_q').value);
  const Cd = parseFloat(document.getElementById('ori_cd').value);
  const v = Math.sqrt(2 * P * 1e5 / 1000);
  const Q_m3s = Q / 1000 / 60;
  const A = Q_m3s / (Cd * v);
  const d_mm = Math.sqrt(4 * A / Math.PI) * 1000;
  showResults('or_ori_result', [
    {label:'오리피스 구경', value:fmt(d_mm, 4), unit:'mm'},
    {label:'오리피스 단면적', value:fmt(A*1e6, 4), unit:'mm²'},
    {label:'이상 유속', value:fmt(v, 2), unit:'m/s · 손실 제외'},
    {label:'구경 기준 평균 유속',value:fmt(Cd*v,2),unit:'m/s · Q/A'},
  ]);
}

function calcCv() {
  let bad=false;
  {const e=document.getElementById('cv_q'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('cv_p'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('cv_d'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('cv_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const Q = parseFloat(document.getElementById('cv_q').value);
  const P = parseFloat(document.getElementById('cv_p').value);
  const d = parseFloat(document.getElementById('cv_d').value);
  const A_m2 = Math.PI / 4 * Math.pow(d / 1000, 2);
  const Q_m3s = Q / 1000 / 60;
  const v_ideal = Math.sqrt(2 * P * 1e5 / 1000);
  const Cd = Q_m3s / (A_m2 * v_ideal);
  showResults('cv_result', [
    {label:'유량계수 Cd', value:fmt(Cd, 6), unit:''},
    {label:'이론 토출 유속', value:fmt(v_ideal, 2), unit:'m/s'},
    {label:'실제 유량', value:fmt(Q), unit:'L/min'},
  ]);
}

