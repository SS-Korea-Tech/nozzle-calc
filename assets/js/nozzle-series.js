// ========== P5: 노즐 시리즈 선택 ==========
function nnSelectSeries(sel) {
  const pb=document.getElementById('nn_pbase'),n=document.getElementById('nn_n'),mult=document.getElementById('nn_mult');
  const preset=sel.value.includes('|');
  if(preset){const values=sel.value.split('|');pb.value=values[0];n.value=values[1];mult.value=values[2];}
  pb.readOnly=preset;n.readOnly=preset;mult.disabled=preset;
  pb.style.background=preset?'var(--blue-pale)':'';n.style.background=preset?'var(--blue-pale)':'';
  document.getElementById('nn_auto_badge').style.display=preset?'inline':'none';
  sel.dataset.mult=mult.value;
  document.getElementById('nn_mult_display').textContent=preset?'선택한 시리즈의 승수를 적용했습니다. 해당 모델 카탈로그와 대조하세요.':'직접 입력 시 기준압·유량 지수·용량번호 승수를 함께 확인하세요.';
  if(typeof nnRefreshHelp==='function')nnRefreshHelp();
}


