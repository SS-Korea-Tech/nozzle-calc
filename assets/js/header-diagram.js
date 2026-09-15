// ========== P7: 노즐 배치 도면 (동적 SVG) ==========
function drawNozzleDiagrams(d) {
  drawNozzleFront(d);
  drawNozzlePlan(d);
}

// 정면도: 분사거리(H), 분사범위(A/B), 중첩(C)
function drawNozzleFront(d, targetId) {
  targetId = targetId || 'nz_front_svg';
  const W = 640, H_svg = 350;
  const nozzleY = 60;
  const planeY  = 220;

  // 스케일 기준: 두 노즐 사이 거리(F) + 양쪽 분사폭(A) 절반씩 — 항상 전체가 보이도록
  const totalMM = Math.max(d.fp + d.A_theor, d.A_theor * 1.6);
  const scale = (W - 140) / totalMM;

  const bPx  = d.B_actual * scale;
  const aPx  = d.A_theor * scale;
  const fpPx = d.fp * scale;
  const halfB = bPx / 2;
  const halfA = aPx / 2;

  const n1x = W/2 - fpPx/2;
  const n2x = W/2 + fpPx/2;

  // 실제 중첩폭 (mm) = max(0, B - F) — 결과 카드와 동일한 정의
  const overlapMM = Math.max(0, d.B_actual - d.fp);
  const overlap = overlapMM > 0;
  const overlapPx = overlapMM * scale;

  // 중첩 영역 polygon: 노즐1 우측변 ∩ 노즐2 좌측변의 교차점부터 바닥까지
  // F < B 이면 항상 두 변이 교차함 (t = F/B)
  let overlapPoly = '';
  if (overlap) {
    const t = fpPx / bPx; // 0~1
    const yCross = nozzleY + Math.min(t, 1) * (planeY - nozzleY);
    const xCross = n1x + halfB * Math.min(t, 1);
    overlapPoly = `<polygon points="${xCross},${yCross} ${n2x-halfB},${planeY} ${n1x+halfB},${planeY}"
         fill="rgba(192,57,43,0.35)"/>`;
  }

  // ── 치수선 Y좌표 (피도물 아래쪽으로 차곡차곡 배치) ──
  const productBottom = planeY + 14;
  const yB = productBottom + 22;   // B 치수선
  const yA = yB + 32;              // A 치수선
  const yC = yA + 36;              // C 치수선

  // H 치수선의 정확한 중앙
  const hMidY = (nozzleY + planeY) / 2;

  // 좌측 한계선(피도물/도형 가장 왼쪽 끝)
  const leftMost = Math.min(n1x - halfA, n1x - halfB, n2x - halfB);
  const rightMost = Math.max(n2x + halfB, n1x + halfA, n1x + halfB);

  const svg = `
<svg viewBox="${leftMost-90} 0 ${rightMost-leftMost+120} ${H_svg}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;background:#fbfdff;border:1px solid #c8dcea;border-radius:8px;">

  <!-- 헤더 파이프 -->
  <line x1="${leftMost-20}" y1="${nozzleY-18}" x2="${rightMost+20}" y2="${nozzleY-18}" stroke="#90a4ae" stroke-width="5"/>
  <text x="${leftMost-20}" y="${nozzleY-26}" font-size="10" fill="#888">HEADER</text>

  <!-- A(이론 분사폭) — 노즐1 점선 삼각형 -->
  <polygon points="${n1x},${nozzleY} ${n1x-halfA},${planeY} ${n1x+halfA},${planeY}"
    fill="none" stroke="#90caf9" stroke-width="1.5" stroke-dasharray="5,4"/>

  <!-- 분사영역 1·2 (B 기준) -->
  <polygon points="${n1x},${nozzleY} ${n1x-halfB},${planeY} ${n1x+halfB},${planeY}"
    fill="rgba(0,107,177,0.10)" stroke="#006bb1" stroke-width="1.5"/>
  <polygon points="${n2x},${nozzleY} ${n2x-halfB},${planeY} ${n2x+halfB},${planeY}"
    fill="rgba(230,126,34,0.10)" stroke="#e67e22" stroke-width="1.5"/>

  ${overlapPoly}

  <!-- 노즐 1·2 (분사영역 위에 그려서 항상 보이도록) -->
  <rect x="${n1x-7}" y="${nozzleY-9}" width="14" height="14" fill="#5a6b7a" rx="2"/>
  <rect x="${n2x-7}" y="${nozzleY-9}" width="14" height="14" fill="#5a6b7a" rx="2"/>
  <text x="${n1x}" y="${nozzleY+22}" text-anchor="middle" font-size="9" fill="#888">θ=${Math.round(d.ang)}°</text>

  <!-- 피도물 -->
  <rect x="${leftMost-10}" y="${planeY}" width="${rightMost-leftMost+20}" height="14" fill="#cfd8dc" stroke="#90a4ae"/>
  <text x="${(leftMost+rightMost)/2}" y="${planeY+10}" text-anchor="middle" font-size="10" fill="#546e7a">피도물 (PRODUCT)</text>

  <!-- H 치수선 (좌측, 치수선 전체 높이의 정확한 중앙에 라벨) -->
  <line x1="${leftMost-35}" y1="${nozzleY}" x2="${leftMost-35}" y2="${planeY}" stroke="#c0392b" stroke-width="1"/>
  <line x1="${leftMost-40}" y1="${nozzleY}" x2="${leftMost-30}" y2="${nozzleY}" stroke="#c0392b" stroke-width="1"/>
  <line x1="${leftMost-40}" y1="${planeY}" x2="${leftMost-30}" y2="${planeY}" stroke="#c0392b" stroke-width="1"/>
  <rect x="${leftMost-72}" y="${hMidY-16}" width="34" height="28" fill="#fbfdff" opacity="0.92"/>
  <text x="${leftMost-44}" y="${hMidY-2}" text-anchor="end" font-size="12" font-weight="700" fill="#c0392b">H</text>
  <text x="${leftMost-44}" y="${hMidY+12}" text-anchor="end" font-size="10" fill="#c0392b">${Math.round(d.H)}</text>

  <!-- F(피치) 치수선 (노즐 사이, 상단) -->
  <line x1="${n1x}" y1="${nozzleY-36}" x2="${n2x}" y2="${nozzleY-36}" stroke="#1a7a40" stroke-width="1.5"/>
  <line x1="${n1x}" y1="${nozzleY-41}" x2="${n1x}" y2="${nozzleY-31}" stroke="#1a7a40" stroke-width="1.5"/>
  <line x1="${n2x}" y1="${nozzleY-41}" x2="${n2x}" y2="${nozzleY-31}" stroke="#1a7a40" stroke-width="1.5"/>
  <text x="${(n1x+n2x)/2}" y="${nozzleY-46}" text-anchor="middle" font-size="12" font-weight="700" fill="#1a7a40">F (피치) = ${Math.round(d.fp)}</text>

  <!-- B 치수선 (보정 분사폭, 피도물 바로 아래 첫번째) -->
  <line x1="${n1x-halfB}" y1="${yB}" x2="${n1x+halfB}" y2="${yB}" stroke="#006bb1" stroke-width="1.5"/>
  <line x1="${n1x-halfB}" y1="${yB-5}" x2="${n1x-halfB}" y2="${yB+5}" stroke="#006bb1" stroke-width="1.5"/>
  <line x1="${n1x+halfB}" y1="${yB-5}" x2="${n1x+halfB}" y2="${yB+5}" stroke="#006bb1" stroke-width="1.5"/>
  <text x="${n1x}" y="${yB+17}" text-anchor="middle" font-size="12" font-weight="700" fill="#006bb1">B (실제) = ${fmt(d.B_actual,1)}</text>

  <!-- A 치수선 (이론 분사폭, 점선, B 아래 두번째) -->
  <line x1="${n1x-halfA}" y1="${yA}" x2="${n1x+halfA}" y2="${yA}" stroke="#5a9fd4" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="${n1x-halfA}" y1="${yA-5}" x2="${n1x-halfA}" y2="${yA+5}" stroke="#5a9fd4" stroke-width="1.5"/>
  <line x1="${n1x+halfA}" y1="${yA-5}" x2="${n1x+halfA}" y2="${yA+5}" stroke="#5a9fd4" stroke-width="1.5"/>
  <text x="${n1x}" y="${yA+17}" text-anchor="middle" font-size="12" font-weight="700" fill="#5a9fd4">A (이론) = ${fmt(d.A_theor,1)}</text>

  <!-- C 중첩 치수선 (가장 아래, 세번째) -->
  ${overlap ? `
  <line x1="${n1x+halfB-overlapPx}" y1="${yC}" x2="${n1x+halfB}" y2="${yC}" stroke="#c0392b" stroke-width="1.5"/>
  <line x1="${n1x+halfB-overlapPx}" y1="${yC-5}" x2="${n1x+halfB-overlapPx}" y2="${yC+5}" stroke="#c0392b" stroke-width="1.5"/>
  <line x1="${n1x+halfB}" y1="${yC-5}" x2="${n1x+halfB}" y2="${yC+5}" stroke="#c0392b" stroke-width="1.5"/>
  <text x="${n1x+halfB-overlapPx/2}" y="${yC+17}" text-anchor="middle" font-size="12" font-weight="700" fill="#c0392b">C (중첩) = ${fmt(overlapMM,1)} mm</text>
  ` : `
  <text x="${(n1x+n2x)/2}" y="${yC+5}" text-anchor="middle" font-size="11" fill="#888">중첩 없음 (인접 분사영역 미접촉)</text>
  `}

</svg>`;

  document.getElementById(targetId).innerHTML = svg;
}

function drawNozzlePlan(d, targetId) {
  targetId = targetId || 'nz_plan_svg';
  const svgW = 700, svgH = 280;
  const marginX = 60;
  const drawW = svgW - marginX*2;

  // 피도물 폭(W) 기준 스케일
  const totalSpan = Math.max(d.W, d.G) * 1.08;
  const scale = drawW / totalSpan;

  const wPx = d.W * scale;
  const gPx = d.G * scale;
  const bPx = d.B_actual * scale;
  const fpPx = d.fp * scale;
  const halfB = bPx/2;

  const startX = marginX + (drawW - wPx)/2;  // 피도물 중앙 정렬 기준

  // 노즐 위치들 (중앙 정렬, G 기준)
  const nozzleStartX = marginX + (drawW - gPx)/2 + halfB;
  let nozzles = [];
  for (let i=0; i<d.cnt; i++) {
    nozzles.push(nozzleStartX + i*fpPx);
  }

  const beamY = 70;
  const productY = 180;
  const colors = ['#006bb1', '#e67e22'];

  let nozzleSvg = '';
  let coverageSvg = '';
  nozzles.forEach((nx, i) => {
    const col = colors[i % 2];
    nozzleSvg += `<rect x="${nx-6}" y="${beamY-14}" width="12" height="12" fill="#5a6b7a" rx="2"/>`;
    coverageSvg += `<polygon points="${nx},${beamY} ${nx-halfB},${productY} ${nx+halfB},${productY}"
      fill="${col}1A" stroke="${col}" stroke-width="1"/>`;
  });

  // 피치(F) 치수선 — 첫~둘째 노즐 사이, 충분한 위쪽 공간
  let pitchDim = '';
  if (nozzles.length >= 2) {
    const x1 = nozzles[0], x2 = nozzles[1];
    pitchDim = `
      <line x1="${x1}" y1="${beamY-34}" x2="${x2}" y2="${beamY-34}" stroke="#1a7a40" stroke-width="1.5"/>
      <line x1="${x1}" y1="${beamY-39}" x2="${x1}" y2="${beamY-29}" stroke="#1a7a40" stroke-width="1.5"/>
      <line x1="${x2}" y1="${beamY-39}" x2="${x2}" y2="${beamY-29}" stroke="#1a7a40" stroke-width="1.5"/>
      <text x="${(x1+x2)/2}" y="${beamY-44}" text-anchor="middle" font-size="12" font-weight="700" fill="#1a7a40">F = ${Math.round(d.fp)}</text>
    `;
  }

  // 전체 커버범위(E = G) 치수선
  const gx1 = nozzles[0] - halfB;
  const gx2 = nozzles[nozzles.length-1] + halfB;
  const eDim = `
    <line x1="${gx1}" y1="${productY+24}" x2="${gx2}" y2="${productY+24}" stroke="#006bb1" stroke-width="1.5"/>
    <line x1="${gx1}" y1="${productY+19}" x2="${gx1}" y2="${productY+29}" stroke="#006bb1" stroke-width="1.5"/>
    <line x1="${gx2}" y1="${productY+19}" x2="${gx2}" y2="${productY+29}" stroke="#006bb1" stroke-width="1.5"/>
    <text x="${(gx1+gx2)/2}" y="${productY+42}" text-anchor="middle" font-size="12" font-weight="700" fill="#006bb1">E (전체 커버범위) = ${fmt(d.G,1)}</text>
  `;

  // 피도물 폭(W) 치수선 (E보다 아래)
  const wDim = `
    <line x1="${startX}" y1="${productY+62}" x2="${startX+wPx}" y2="${productY+62}" stroke="#c0392b" stroke-width="1.5"/>
    <line x1="${startX}" y1="${productY+57}" x2="${startX}" y2="${productY+67}" stroke="#c0392b" stroke-width="1.5"/>
    <line x1="${startX+wPx}" y1="${productY+57}" x2="${startX+wPx}" y2="${productY+67}" stroke="#c0392b" stroke-width="1.5"/>
    <text x="${startX+wPx/2}" y="${productY+80}" text-anchor="middle" font-size="12" font-weight="700" fill="#c0392b">피도물 폭 W = ${Math.round(d.W)}</text>
  `;

  const svg = `
<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;background:#fbfdff;border:1px solid #c8dcea;border-radius:8px;">
  <!-- 헤더 파이프 -->
  <line x1="${marginX-15}" y1="${beamY-22}" x2="${svgW-marginX+15}" y2="${beamY-22}" stroke="#90a4ae" stroke-width="5"/>
  <text x="${marginX-20}" y="${beamY-27}" text-anchor="end" font-size="10" fill="#888">HEADER</text>

  ${coverageSvg}
  ${nozzleSvg}
  ${pitchDim}

  <!-- 피도물 -->
  <rect x="${startX}" y="${productY}" width="${wPx}" height="14" fill="#cfd8dc" stroke="#90a4ae"/>
  <text x="${startX+wPx/2}" y="${productY+10}" text-anchor="middle" font-size="10" fill="#546e7a">피도물 (PRODUCT)</text>

  ${eDim}
  ${wDim}

  <!-- 노즐수량 -->
  <text x="${svgW-marginX+15}" y="20" text-anchor="end" font-size="12" font-weight="700" fill="#333">노즐 수량 N = ${d.cnt} EA</text>
</svg>`;

  document.getElementById(targetId).innerHTML = svg;
}

// 참고도(고정 예시) 렌더링
function drawNozzleReferenceDiagrams() {
  const W=1000, H=500, ang=25, tilt=15, ov=20, fp=170;
  const A_theor  = 2 * H * Math.tan(ang/2*Math.PI/180);
  const B_actual = A_theor * (1 - tilt/100);
  const C_overlap= Math.max(0,B_actual-fp);
  const cnt = Math.ceil(W/fp) || 1;
  const G = fp*(cnt-1) + B_actual;
  const d = {W,H,ang,tilt,ov,fp,A_theor,B_actual,C_overlap,cnt,G};
  drawNozzleFront(d, 'nz_ref_front_svg');
  drawNozzlePlan(d, 'nz_ref_plan_svg');
}
// ========== INIT ==========
// unit init handled by DOMContentLoaded above
