
// ========== FORMULA TOGGLE ==========
function toggleFormula(id, btn) {
  const content = document.getElementById(id);
  const isOpen = content.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  // arrow는 CSS transition으로만 처리 (style 직접 조작 안 함)
  const label = btn.querySelector('.lbl');
  if (label) label.textContent = isOpen ? '공식 닫기' : '계산 공식 보기';
}

// ========== NAV ==========
function showPanel(id, el) {
  try {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => {n.classList.remove('active');n.removeAttribute('aria-current');});
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    if (el) {el.classList.add('active');el.setAttribute('aria-current','page');}

    // 스크롤을 위로
    document.querySelector('.main')?.scrollTo(0, 0);

    // 패널별 초기화
    if (id === 'p10' && typeof buildSprayTable === 'function') buildSprayTable();
    if (id === 'p1' && typeof calcUnit === 'function') {const active=document.querySelector('.unit-cat-btn.active')?.getAttribute('onclick')?.match(/selectUnitCat\('([^']+)'/);calcUnit(active?.[1]||'pressure');}
  } catch(e) {
    console.error('showPanel error:', e);
  }
}

function switchTab(group, tab, btn) {
  document.querySelectorAll(`[id^="${group}-"]`).forEach(p => p.classList.remove('active'));
  btn.closest('.tabs').querySelectorAll('.tab-btn').forEach(b => {b.classList.remove('active');b.setAttribute('aria-selected','false');});
  document.getElementById(`${group}-${tab}`).classList.add('active');
  btn.classList.add('active');btn.setAttribute('aria-selected','true');
}

// ========== RESULT CARD ==========
function showResults(containerId, results) {
  const el = document.getElementById(containerId);if(!el)return false;
  if(results[0]?.label==='오류'){showCalculationError(containerId,String(results[0].value));return false;}
  if(results.some(r=>['ERR','NaN','Infinity','-Infinity'].includes(String(r.value)))){showCalculationError(containerId,'계산 범위를 초과했습니다. 입력값의 크기와 단위를 확인하세요.');return false;}
  el.removeAttribute('data-calculation-error');el.replaceChildren();
  for(const r of results){
    const card=document.createElement('div');card.className='result-card';if(['warning','pass'].includes(r.tone))card.classList.add('result-'+r.tone);
    const label=document.createElement('div');label.className='result-label';label.textContent=r.label||'';
    const value=document.createElement('div');value.className='result-value';value.textContent=String(r.value??'—');
    if(/^[+−-]?[\d.,]+(?:e[+−-]?\d+)?$/i.test(value.textContent))value.classList.add('numeric-result');
    card.append(label,value);if(r.unit){const unit=document.createElement('div');unit.className='result-unit';unit.textContent=r.unit;card.append(unit);}el.append(card);
  }
  return true;
}

function fmt(v, d = 4) {
  if (!Number.isFinite(Number(v))) return 'ERR';
  const n=Number(v),a=Math.abs(n),digits=Math.max(0,Math.min(6,d));
  if(a>=1e7 || (a>0&&a<10**(-digits)))return n.toExponential(Math.min(digits,3));
  return n.toFixed(digits);
}


function showCalculationError(id,message,fields=[]){
 const box=document.getElementById(id);if(!box)return;box.replaceChildren();box.dataset.calculationError='true';
 const alert=document.createElement('div');alert.className='result-card';alert.setAttribute('role','alert');alert.textContent=message;box.append(alert);
 if(box.nextElementSibling?.classList.contains('ux-result-tools'))box.nextElementSibling.remove();
 for(const field of fields)document.getElementById(field)?.setAttribute('aria-invalid','true');
}
