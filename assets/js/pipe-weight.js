// ========== P4: 배관 WEIGHT ==========
function calcPipeWeight() {
  const solid=document.getElementById('wt_shape').value==='solid';
  let bad=false;
  {const e=document.getElementById('wt_od'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('wt_t'),v=e.value.trim()===''?NaN:Number(e.value);if(!solid&&(!Number.isFinite(v) || v <= 0)){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('wt_len'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}
  {const e=document.getElementById('wt_material'),v=e.value.trim()===''?NaN:Number(e.value);if(!Number.isFinite(v) || v <= 0){e.setAttribute('aria-invalid','true');bad=true;}else{e.removeAttribute('aria-invalid');}}if(!solid&&Number(document.getElementById('wt_t').value)*2>=Number(document.getElementById('wt_od').value)){document.getElementById('wt_t').setAttribute('aria-invalid','true');showCalculationError('wt_result','배관 두께는 0보다 크고 외경의 절반보다 작아야 합니다. 속찬 봉은 단면 형식에서 선택하세요.');return;}
  if(bad){showCalculationError('wt_result','입력값을 확인하세요. 빈칸·허용 범위 밖의 값으로는 계산할 수 없습니다.');return;}

  const OD = parseFloat(document.getElementById('wt_od').value);
  const t = parseFloat(document.getElementById('wt_t').value);
  const L = parseFloat(document.getElementById('wt_len').value);
  const ID = solid ? 0 : (OD - 2 * t);  // t=0: 속찬 봉
  const rho = parseFloat(document.getElementById('wt_material').value); // kg/m³
  const area = Math.PI / 4 * (OD * OD - ID * ID) / 1e6; // m²
  const wPerM = area * rho;
  showResults('wt_result', [
    {label: solid ? '봉 단면 (속찬)' : '배관 내경 (ID)', value:fmt(ID, 2), unit:'mm'},
    {label:'단위 무게', value:fmt(wPerM, 3), unit:'kg/m'},
    {label:`총 무게 (${L}m)`, value:fmt(wPerM * L, 3), unit:'kg'},
    {label:'강관 단면적', value:fmt(area * 1e6, 2), unit:'mm²'},
  ]);
}


function weightShapeChanged(){const e=document.getElementById('wt_t');e.disabled=document.getElementById('wt_shape').value==='solid';e.removeAttribute('aria-invalid');deInvalidate(e.closest('.section-body'));}
window.addEventListener('DOMContentLoaded',()=>{document.getElementById('wt_shape').addEventListener('change',weightShapeChanged);weightShapeChanged();});
