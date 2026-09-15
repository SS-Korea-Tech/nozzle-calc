// ========== P1: 단위환산 (입출력 선택형) ==========

const UNIT_FACTORS = {
  pressure: {
    bar:1, kgcm2:0.980665, mpa:10, kpa:0.01,
    psi:0.06894757293168, atm:1.01325, mmhg:0.00133322, mmh2o:0.0000980665
  },
  flow: {
    lmin:1, m3hr:1000/60, m3min:1000, m3s:60000,
    lhr:1/60, gpm:3.785411784, gph:3.785411784/60
  },
  length: { mm:1, cm:10, m:1000, inch:25.4, ft:304.8 },
  temp: { c:1, f:1, k:1, r:1 },  // special handling
  weight: { kg:1, g:0.001, ton:1000, lb:0.45359237, oz:0.028349523125 },
  velocity: { ms:1, kmh:1/3.6, mph:0.44704, fts:0.3048 }
};

const UNIT_LABELS = {
  pressure: {bar:'bar',kgcm2:'kgf/cm²',mpa:'MPa',kpa:'kPa',psi:'psi',atm:'atm',mmhg:'mmHg',mmh2o:'mmH₂O'},
  flow:     {lmin:'L/min',m3hr:'m³/hr',m3min:'m³/min',m3s:'m³/s',lhr:'L/hr',gpm:'US GPM',gph:'US GPH'},
  length:   {mm:'mm',cm:'cm',m:'m',inch:'inch',ft:'ft'},
  temp:     {c:'°C',f:'°F',k:'K',r:'°R'},
  weight:   {kg:'kg',g:'g',ton:'ton',lb:'lb',oz:'oz'},
  velocity: {ms:'m/s',kmh:'km/h',mph:'mph',fts:'ft/s'}
};

function toBaseUnit(cat, val, from) {
  if (cat === 'temp') {
    if (from==='c') return val;
    if (from==='f') return (val-32)*5/9;
    if (from==='k') return val-273.15;
    if (from==='r') return (val-491.67)*5/9;
  }
  return val * UNIT_FACTORS[cat][from];
}
function fromBaseUnit(cat, base, to) {
  if (cat === 'temp') {
    if (to==='c') return base;
    if (to==='f') return base*9/5+32;
    if (to==='k') return base+273.15;
    if (to==='r') return (base+273.15)*9/5;
  }
  return base / UNIT_FACTORS[cat][to];
}

function calcUnit(cat) {
  const val = parseFloat(document.getElementById('uval-'+cat).value);
  const from = document.getElementById('ufrom-'+cat).value;
  const to   = document.getElementById('uto-'+cat).value;
  if (!isFinite(val)) { document.getElementById('ures-'+cat).textContent='—'; document.getElementById('utable-'+cat).textContent='값을 입력해 주세요.'; return; }
  const base = toBaseUnit(cat, val, from);
  if(cat==='temp' && base < -273.15-1e-9){document.getElementById('ures-'+cat).textContent='범위 오류';document.getElementById('utable-'+cat).textContent='절대영도 미만의 온도입니다.';return;}
  const result = fromBaseUnit(cat, base, to);
  if(!Number.isFinite(base)||!Number.isFinite(result)){document.getElementById('ures-'+cat).textContent='범위 오류';document.getElementById('utable-'+cat).textContent='값의 크기와 단위를 확인하세요.';return;}
  document.getElementById('ures-'+cat).textContent = fmt(result, 6);

  // 전체 환산표 업데이트
  const labels = UNIT_LABELS[cat];
  let html = '';
  for (const [u, lbl] of Object.entries(labels)) {
    const v = fromBaseUnit(cat, base, u);
    html += `<div class="unit-full-card"><div class="ufc-label">${lbl}</div><div class="ufc-val">${fmt(v,5)}</div></div>`;
  }
  document.getElementById('utable-'+cat).innerHTML = html;
}

function selectUnitCat(cat, btn) {
  document.querySelectorAll('.unit-cat-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.unit-cat-panel').forEach(p=>p.style.display='none');
  document.getElementById('ucat-'+cat).style.display='';
  calcUnit(cat);
}

function swapUnit(cat) {
  const sf = document.getElementById('ufrom-'+cat);
  const st = document.getElementById('uto-'+cat);
  const tmp = sf.value; sf.value = st.value; st.value = tmp;
  calcUnit(cat);
}

// 초기화


