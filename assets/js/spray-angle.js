// ========== P10: 분사 각도 ==========
function calcSprayAngle() {
  let bad=false;
  {const e=document.getElementById('sp_h'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('sp_ang'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0 || v >= 180){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('sp_pitch'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v < 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  if(bad){showCalculationError('sp_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const H   = parseFloat(document.getElementById('sp_h').value);
  const ang = parseFloat(document.getElementById('sp_ang').value);
  const P   = parseFloat(document.getElementById('sp_pitch').value);
  const W   = 2 * H * Math.tan(ang / 2 * Math.PI / 180);
  const Z   = Math.max(0, W - P);
  const overlapPct = P > 0 ? Z / W * 100 : 100;
  showResults('sp_result', [
    {label:'이론 분사 범위 W', value:fmt(W, 2), unit:'mm'},
    {label:'중첩 범위 Z',      value:fmt(Z, 2), unit:'mm'},
    {label:'중첩률',           value:fmt(overlapPct, 2), unit:'%'},
    {label:'분사 반경',        value:fmt(W/2, 2), unit:'mm (편방향)'},
  ]);
}

function buildSprayTable() {
  const angles = [15,25,30,40,50,65,80,95,110,120,130];
  const dists  = [50,100,200,300,400,500,600,700,800,900,1000];
  let h = '<thead><tr><th>각도(°)</th>';
  dists.forEach(d => h += `<th>${d}mm</th>`);
  h += '</tr></thead><tbody>';
  angles.forEach(a => {
    h += `<tr><td>${a}°</td>`;
    dists.forEach(d => {
      h += `<td>${(2*d*Math.tan(a/2*Math.PI/180)).toFixed(1)}</td>`;
    });
    h += '</tr>';
  });
  h += '</tbody>';
  document.getElementById('spray_ref_table').innerHTML = h;
}


