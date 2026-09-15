// ========== RIGHT PANEL ==========




// 최근 계산 기록 — 로그인 사용자별 Firestore에 영구 저장
let rpRecent = [];

function rpAddRecent(title, value, unit, resultId) {
  if (!value || value === '—' || value==='ERR' || !window._currentUser) return;
  const time = new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  const dateStr = new Date().toLocaleDateString('ko-KR',{month:'2-digit',day:'2-digit'});

  // 현재 활성 패널 + 탭
  const activePanel = resultId ? document.getElementById(resultId)?.closest('.panel') : document.querySelector('.panel.active');
  const panel = activePanel ? activePanel.id : '';

  // 현재 패널의 모든 입력값 스냅샷
  const snapshot = {};
  if (activePanel) {
    activePanel.querySelectorAll('input[id], select[id]').forEach(el => {
      if(el.type==='file')return;
      snapshot[el.id] = el.value;
      if(el.tagName==='SELECT'){snapshot._selectedOptions ||= {};snapshot._selectedOptions[el.id]=el.selectedIndex;}
    });
    const activeTab = activePanel.querySelector('.tab-panel.active');
    snapshot._activeTab = activeTab ? activeTab.id : '';
  }

  const record = {time, date: dateStr, panel, title, value, unit, snapshot, ts: Date.now()};
  rpRecent.unshift(record);
  if (rpRecent.length > 20) rpRecent.pop();
  rpRenderRecent();
  rpSaveToCloud();
}

// Firestore에 현재 기록 목록 저장 (디바운스)
let _rpSaveTimer = null;
function rpSaveToCloud() {
  if (!window._currentUser) return;
  clearTimeout(_rpSaveTimer);
  const savingUser=window._currentUser;
  const savingRecords=JSON.parse(JSON.stringify(rpRecent));
  _rpSaveTimer = setTimeout(async () => {
    if(window._currentUser!==savingUser)return;
    try {
      const email = savingUser.email;
      await db.collection('history').doc(email).set({ records: savingRecords });
    } catch(e) { console.error('기록 저장 실패', e); for(const id of ['rp-recent','rp-recent-mobile']){const el=document.getElementById(id);if(el&&!el.querySelector('.save-error')){const msg=document.createElement('p');msg.className='save-error';msg.setAttribute('role','status');msg.textContent='기록 저장에 실패했습니다. 필요한 결과를 복사해 보관하세요.';el.prepend(msg);}} }
  }, 400);
}

// Firestore에서 현재 사용자의 기록 불러오기
async function rpLoadFromCloud() {
  if (!window._currentUser) return;
  const loadingUser=window._currentUser;
  try {
    const email = window._currentUser.email;
    const doc = await db.collection('history').doc(email).get();
    if(window._currentUser!==loadingUser)return;
    rpRecent = (doc.exists && doc.data().records) ? doc.data().records : [];
  } catch(e) {
    if(window._currentUser!==loadingUser)return;
    console.error('기록 불러오기 실패', e);
    rpRecent = [];
  }
  rpRenderRecent();
}
function escapeHistory(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function rpRenderRecent() {
  const el  = document.getElementById('rp-recent');
  const elM = document.getElementById('rp-recent-mobile');  // 모바일용
  if (!el) return;
  if (rpRecent.length === 0) {
    el.innerHTML = '<div class="rp-empty">계산 실행 시 표시됩니다</div>';
    if(elM) elM.innerHTML=el.innerHTML;
    return;
  }
  const sectionNames = {
    p1:'단위환산', p2:'AIR배관', p3:'WATER배관', p4:'배관Weight',
    p5:'NozzleNo', p6:'유량계수', p7:'헤더노즐', p8:'AIR분사량',
    p9:'유량보정', p10:'분사각도', p11:'충격력', p12:'단면모멘트', p13:'설계 시트'
  };
  const html = rpRecent.map((r, idx) =>
    `<div class="rp-recent-item" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}" onclick="rpRestoreRecord(${idx})" title="클릭하면 해당 섹션으로 이동합니다">
      <div class="rpi-meta">
        <span class="rpi-section">${escapeHistory(sectionNames[r.panel]||r.panel||'—')}</span>
        <span class="rpi-time">${escapeHistory(r.time)}</span>
      </div>
      <div class="rpi-title">${escapeHistory(r.title)}</div>
      <div class="rpi-val">${escapeHistory(r.value)}<span class="rpi-unit">${escapeHistory(r.unit||'')}</span></div>
      <div class="rpi-goto">↗ 섹션으로 이동</div>
    </div>`
  ).join('');
  if (el)  el.innerHTML  = html;
  if (elM) elM.innerHTML = html;
}

function rpRestoreRecord(idx) {
  const r = rpRecent[idx];
  if (!r || !/^p(?:[1-9]|1[0-3])$/.test(r.panel)) return;

  // 1. 해당 패널로 이동
  const navItem = document.querySelector(`.nav-item[onclick*="'${r.panel}'"]`);
  if (navItem) showPanel(r.panel, navItem);

  // 2. 탭 복원 (있으면)
  if (r.snapshot && r.snapshot._activeTab) {
    const tabPanel = document.getElementById(r.snapshot._activeTab);
    if (tabPanel?.matches('.tab-panel') && tabPanel.closest('.panel')?.id === r.panel) {
      // 부모의 tab-panel들 비활성화
      tabPanel.closest('.panel')?.querySelectorAll('.tab-panel').forEach(t => t.classList.remove('active'));
      tabPanel.classList.add('active');
      // 탭 버튼도 동기화
      const tabId = r.snapshot._activeTab; // e.g. "sec-rect"
      tabPanel.closest('.panel').querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes("'"+tabId.split('-').slice(1).join('-')+"'")) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  // 3. 입력값 복원
  if (r.snapshot) {
    Object.entries(r.snapshot).forEach(([id, val]) => {
      if (id.startsWith('_')) return;
      const el = document.getElementById(id);
      if(el?.closest('.panel')?.id===r.panel&&el.matches('input,select')&&el.type!=='file'){el.value=val;const selected=r.snapshot._selectedOptions?.[id];if(el.tagName==='SELECT'&&Number.isInteger(selected)&&selected>=0&&selected<el.options.length&&el.options[selected].value===val)el.selectedIndex=selected;}
    });
  }

  const restoredPanel=document.getElementById(r.panel);
  restoredPanel?.querySelectorAll('.result-grid').forEach(el=>{el.replaceChildren();if(el.nextElementSibling?.classList.contains('ux-result-tools'))el.nextElementSibling.remove();});
  if(r.panel==='p5'){const sel=document.getElementById('nn_series');sel.dataset.mult=sel.value.split('|')[2]||'10';}
  const note=document.getElementById('audit-restore-note')||document.createElement('p');note.id='audit-restore-note';note.textContent='저장된 입력값을 불러왔습니다. 계산하기를 눌러 결과를 확인하세요.';note.setAttribute('role','status');restoredPanel?.querySelector('.panel-header')?.append(note);
  // 4. 스크롤 맨 위로
  document.querySelector('.main')?.scrollTo({top:0, behavior:'smooth'});
}
function rpClearRecent() {
  rpRecent.length = 0;
  rpRenderRecent();
  rpSaveToCloud();
}

// showResults 후킹 — 첫 번째 결과를 자동으로 최근 기록에 추가
const _origShowResults = window.showResults;
function showResultsHooked(elId, results) {
  const el=document.getElementById(elId);if(!el||!Array.isArray(results)||!results.length)return;
  if(_origShowResults(elId,results)===false)return false;
  if(results[0].value!=='—'&&results[0].label!=='오류')rpAddRecent(results[0].label,results[0].value,results[0].unit,elId);return true;
}
// 기존 showResults 덮어쓰기
window.addEventListener('DOMContentLoaded', () => {
  if (typeof showResults === 'function') {
    window.showResults = showResultsHooked;
  }
});




// 현재 패널 변경 시 도움말 자동 업데이트
function updateRPHelp(panelId) {
  document.querySelectorAll('.rp-help-item').forEach(el => el.classList.remove('active'));
  const target = document.querySelector(`.rp-help-item[data-panel="${panelId}"]`);
  if (target) target.classList.add('active');
}

// showPanel 에 도움말 연동 추가
const _origShowPanel = window.showPanel;
window.showPanel = function(id, el) {
  try {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    if (el) el.classList.add('active');
    document.querySelector('.main')?.scrollTo(0, 0);
    if (id === 'p10' && typeof buildSprayTable === 'function') buildSprayTable();
    if (id === 'p1' && typeof calcUnit === 'function') calcUnit('pressure');
    // 도움말 패널 업데이트
    updateRPHelp(id);
  } catch(e) { console.error('showPanel error:', e); }
};


window.addEventListener('DOMContentLoaded', () => {
  calcUnit('pressure');
  updateRPHelp('p1');
  // 우측 빠른 환산 초기 계산
});



  // 섹션명 매핑
  const sectionNames = {
    p1:'단위 환산', p2:'AIR 배관 내경', p3:'WATER 배관', p4:'배관 Weight',
    p5:'Nozzle No.', p6:'유량계수·오리피스', p7:'헤더 노즐 수량·피치',
    p8:'노즐 공기 분사량', p9:'유량 보정', p10:'분사 각도',
    p11:'분사 충격력', p12:'단면 2차 모멘트'
  };


