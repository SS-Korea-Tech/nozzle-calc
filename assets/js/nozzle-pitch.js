// ========== P7: 노즐수량·피치 ==========
function calcNozzlePitch() {
  try {
    const r=deHeader(),W=deNumber('nz_w'),H=deNumber('nz_h'),ang=deNumber('nz_ang'),tilt=deNumber('nz_tilt'),ov=deNumber('nz_ov'),fp=deNumber('nz_fp');
    drawNozzleDiagrams({W,H,ang,tilt,ov,fp,A_theor:r.a,B_actual:r.b,C_overlap:r.overlap,pitch_calc:r.recommended,cnt:r.count,G:r.cover});
    showResults('nz_pitch_result',[
      {label:'이론 분사폭 A',value:fmt(r.a,1),unit:'mm'},
      {label:'보정 분사폭 B',value:fmt(r.b,1),unit:'mm · 감소율 적용 추정값'},
      {label:'배치 수량',value:String(r.count),unit:'EA · 중앙 정렬'},
      {label:'실제 중첩률',value:r.actual===null?'해당 없음':fmt(r.actual,2),unit:r.actual===null?'노즐 1개':'%'},
      {label:'목표 중첩률 판정',value:r.targetOK===null?'해당 없음':r.targetOK?'목표 충족':'목표 미달',unit:r.targetOK===null?'노즐 1개':`목표 ${ov}%`,tone:r.targetOK===null?undefined:r.targetOK?'pass':'warning'},
      {label:'권장 피치',value:fmt(r.recommended,2),unit:'mm · 목표 중첩률 기준'},
      {label:'노즐 사이 빈 구간',value:fmt(r.gap,2),unit:'mm',tone:r.gap>0?'warning':undefined},
      {label:'총 커버 범위',value:fmt(r.cover,1),unit:'mm',tone:r.widthOK?'pass':'warning'},
      {label:'폭 커버 판정',value:r.widthOK?'폭 충족':'폭 부족',unit:'균일 분사 판정은 별도',tone:r.widthOK?'pass':'warning'},
      {label:'양끝 노즐 중심 여백',value:fmt(r.first,2),unit:'mm · 피도물 끝에서 노즐 중심'},
      {label:'한쪽 가장자리 커버 여유',value:fmt(r.edge,2),unit:'mm · 음수이면 부족'},
    ]);
    deMessage('nz_design_note','분사폭은 기하학적 추정값입니다. 실제 균일도와 목표 중첩률은 해당 노즐의 패턴 자료로 확인하세요.');
  } catch(e) {
    document.getElementById('nz_pitch_result').replaceChildren();
    ['nz_front_svg','nz_plan_svg'].forEach(id=>document.getElementById(id)?.replaceChildren());
    deMessage('nz_design_note',e.message,true);deInvalidate(document.getElementById('p7'));
  }
}

