// ========== P12: 단면2차모멘트·단면계수 ==========
function calcRect() {
  let bad=false;
  {const e=document.getElementById('r_h'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('r_b'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('rect_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const h = parseFloat(document.getElementById('r_h').value);
  const b = parseFloat(document.getElementById('r_b').value);
  if (!isFinite(h)||!isFinite(b)||h<=0||b<=0) return;
  const I  = b * Math.pow(h,3) / 12;
  const Z  = b * Math.pow(h,2) / 6;
  const Ix = h * Math.pow(b,3) / 12;
  const Zx = h * Math.pow(b,2) / 6;
  showResults('rect_result', [
    {label:'단면2차모멘트 I (h 방향 높이)', value:fmt(I,4), unit:'cm⁴'},
    {label:'단면계수 Z (h 방향 높이)',       value:fmt(Z,4), unit:'cm³'},
    {label:'단면2차모멘트 Ix (b 방향 높이)', value:fmt(Ix,4), unit:'cm⁴'},
    {label:'단면계수 Zx (b 방향 높이)',      value:fmt(Zx,4), unit:'cm³'},
  ]);
}

function calcCircleIZ() {
  let bad=false;
  {const e=document.getElementById('c_d1'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v < 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('c_d2'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('circle_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const D1 = parseFloat(document.getElementById('c_d1').value) || 0;
  const D2 = parseFloat(document.getElementById('c_d2').value);
  if (!isFinite(D2)||D2<=0||D1<0||D1>=D2) {
    showResults('circle_result',[{label:'오류',value:'D₂ > D₁ ≥ 0 확인',unit:''}]); return;
  }
  const I  = Math.PI * (Math.pow(D2,4) - Math.pow(D1,4)) / 64;
  const Ip = Math.PI * (Math.pow(D2,4) - Math.pow(D1,4)) / 32;
  const Z  = I  / (D2/2);
  const Zp = Ip / (D2/2);
  const A  = Math.PI * (Math.pow(D2,2) - Math.pow(D1,2)) / 4;
  showResults('circle_result', [
    {label:'단면2차모멘트 I',   value:fmt(I,4),  unit:'cm⁴'},
    {label:'극단면2차모멘트 Ip', value:fmt(Ip,4), unit:'cm⁴'},
    {label:'단면계수 Z',        value:fmt(Z,4),  unit:'cm³'},
    {label:'극단면계수 Zp',     value:fmt(Zp,4), unit:'cm³'},
    {label:'단면적 A',          value:fmt(A,4),  unit:'cm²'},
  ]);
}

function calcParallel() {
  let bad=false;
  {const e=document.getElementById('pa_ix'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v < 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('pa_iy'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v < 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('pa_a'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('pa_x'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v)){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('pa_y'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v)){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('parallel_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const Ix = parseFloat(document.getElementById('pa_ix').value);
  const Iy = parseFloat(document.getElementById('pa_iy').value);
  const A  = parseFloat(document.getElementById('pa_a').value);
  const x  = parseFloat(document.getElementById('pa_x').value);
  const y  = parseFloat(document.getElementById('pa_y').value);
  if ([Ix,Iy,A,x,y].some(v=>!isFinite(v)) || Ix<0 || Iy<0 || A<=0) return;
  const Ixp = Ix + A * y * y;
  const Iyp = Iy + A * x * x;
  showResults('parallel_result', [
    {label:"Ix' (X'축 단면2차모멘트)", value:fmt(Ixp,4), unit:'cm⁴'},
    {label:"Iy' (Y'축 단면2차모멘트)", value:fmt(Iyp,4), unit:'cm⁴'},
    {label:'A·y² 증가량',              value:fmt(A*y*y,4), unit:'cm⁴'},
    {label:'A·x² 증가량',              value:fmt(A*x*x,4), unit:'cm⁴'},
  ]);
}



