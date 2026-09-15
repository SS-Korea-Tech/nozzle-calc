
// Water-system design worksheet. Internal units: L/min, mm, m and bar(g).
const DESIGN_VERSION = '2026.09.15';
const DesignEngine = Object.freeze({
  positive(v, label) {if (!Number.isFinite(v) || v <= 0) throw Error(label+'은 0보다 큰 값이어야 합니다.');return v;},
  header(w,h,angle,reduction,target,pitch) {
    [w,h,pitch].forEach(v=>this.positive(v,'폭·거리·피치'));
    if (![angle,reduction,target].every(Number.isFinite) || angle<=0 || angle>=180 || reduction<0 || reduction>=100 || target<0 || target>=100) throw Error('각도와 중첩률·감소율 범위를 확인하세요.');
    const a=2*h*Math.tan(angle*Math.PI/360),b=a*(1-reduction/100),count=Math.ceil(w/pitch);
    if (!Number.isFinite(b) || !Number.isSafeInteger(count) || count>500) throw Error('배치 수량이 500개를 넘습니다. 폭과 피치의 단위를 확인하세요.');
    const cover=(count-1)*pitch+b,overlap=Math.max(0,b-pitch),actual=count>1?overlap/b*100:null;
    return {a,b,count,cover,overlap,actual,recommended:b*(1-target/100),first:(w-(count-1)*pitch)/2,edge:(cover-w)/2,
      widthOK:cover>=w-1e-8,gap:count>1?Math.max(0,pitch-b):0,targetOK:count===1?null:actual>=target-1e-8};
  },
  flow(q,p1,p2,n) { if(n>1)throw Error('유량 지수 n은 0 초과, 1 이하로 입력하세요.');[q,p1,p2,n].forEach(v=>this.positive(v,'유량·압력·지수'));const r=q*Math.pow(p2/p1,n);if(!Number.isFinite(r))throw Error('유량 계산 범위를 초과했습니다.');return r; },
  waterLoss(q,d,length,c) {
    [q,d,c].forEach(v=>this.positive(v,'유량·내경·C'));
    if(!Number.isFinite(length)||length<0)throw Error('배관 길이는 0 이상이어야 합니다.');
    const area=Math.PI/4*(d/1000)**2,velocity=q/60000/area;
    const head=length===0?0:10.67*length*(q/60000)**1.852/(c**1.852*(d/1000)**4.87);
    if(!Number.isFinite(head)||!Number.isFinite(velocity))throw Error('배관 계산 범위를 초과했습니다.');
    return {head,bar:head*0.0980665,velocity,re:velocity*(d/1000)/1.004e-6};
  },
  system(s) {
    if(!Number.isInteger(s.count)||s.count<1||s.count>500)throw Error('노즐 수량은 1~500개의 정수로 입력하세요.');
    if(s.exponent<=0||s.exponent>1)throw Error('유량 지수 n은 0 초과, 1 이하로 입력하세요.');
    if(!['uniform','end'].includes(s.feed))throw Error('헤더 공급 방식을 확인하세요.');
    for(const k of ['k','filter','margin'])if(!Number.isFinite(s[k])||s[k]<0)throw Error('손실계수·추가 손실·여유압은 0 이상이어야 합니다.');
    if(!Number.isFinite(s.elevation))throw Error('고저차를 확인하세요.');
    let pressure=s.pressure,total=0,minRe=Infinity;
    const nodes=[];
    this.positive(s.qref,'기준 유량');this.positive(s.pref,'기준 압력');this.positive(pressure,'말단 압력');
    if(s.feed==='end'){this.positive(s.headerD,'헤더 내경');this.positive(s.pitch,'헤더 피치');}
    for(let i=s.count-1;i>=0;i--){
      if(i<s.count-1&&s.feed==='end'){
        const loss=this.waterLoss(total,s.headerD,s.pitch/1000,s.c);
        pressure+=loss.bar;minRe=Math.min(minRe,loss.re);
      }
      const flow=this.flow(s.qref,s.pref,pressure,s.exponent);
      nodes.unshift({number:i+1,position:i*s.pitch,pressure,flow});total+=flow;
      if(!Number.isFinite(total)||!Number.isFinite(pressure)||pressure>10000)throw Error('계산 압력이 너무 큽니다. 배관 내경·피치·유량 단위를 확인하세요.');
    }
    const pipe=this.waterLoss(total,s.d,s.length,s.c);
    if(s.length>0)minRe=Math.min(minRe,pipe.re);
    const minor=s.k*pipe.velocity**2/2*1000/100000,elevation=s.elevation*0.0980665;
    const required=pressure+pipe.bar+minor+s.filter+elevation;
    const recommended=required+s.margin;
    if(!Number.isFinite(recommended))throw Error('압력 계산 범위를 초과했습니다.');
    const variation=(nodes[0].flow-nodes.at(-1).flow)/(total/s.count)*100;
    return {total,nodes,pipe,minor,elevation,header:pressure-s.pressure,required,recommended,variation,minRe,
      hydraulicKW:Math.max(0,required)*100000*(total/60000)/1000};
  }
});

const deEl=id=>document.getElementById(id);
function deNumber(id) {const v=deEl(id).value.trim();return v===''?NaN:Number(v);}
function deMessage(id,text,warning=false){const e=deEl(id);if(!e)return;e.textContent=text;e.classList.toggle('warning',warning);}
function deInvalidate(area){
  if(!area)return;
  area.querySelectorAll('.result-grid').forEach(r=>{r.classList.add('ux-stale');const t=r.nextElementSibling;if(t?.classList.contains('ux-result-tools')){t.querySelector('span').textContent='입력값이 바뀌었습니다. 다시 계산해 주세요.';t.querySelectorAll('button').forEach(b=>b.disabled=true);}});
}
function deWrite(id,value){const e=deEl(id);if(!e)return;e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
function deGo(panel,group,tab){
  showPanel(panel,document.querySelector(`.nav-item[onclick*="'${panel}'"]`));
  if(group&&tab){const b=[...deEl(panel).querySelectorAll('.tab-btn')].find(b=>b.getAttribute('onclick')?.includes(`'${tab}'`));if(b)switchTab(group,tab,b);}
    deEl(panel).scrollIntoView({block:'start'});
}
function deHeader(){return DesignEngine.header(...['nz_w','nz_h','nz_ang','nz_tilt','nz_ov','nz_fp'].map(deNumber));}
function applyRecommendedPitch(){
  try{const r=deHeader();deWrite('nz_fp',Number(r.recommended.toPrecision(12)));calcNozzlePitch();deMessage('nz_design_note','목표 중첩률에 맞는 피치를 적용했습니다.');}
  catch(e){deMessage('nz_design_note',e.message,true);}
}
function applyHeaderCount(){
  try{const r=deHeader();deWrite('fc_count',r.count);deWrite('ds_count',r.count);deWrite('ds_pitch',deNumber('nz_fp'));deGo('p9','fc','q');deMessage('fc_design_note',`헤더 수량 ${r.count}개를 적용했습니다. 노즐의 기준 유량과 압력을 입력하세요.`);}
  catch(e){deMessage('nz_design_note',e.message,true);}
}
function deFlowValues(){
  const q=deNumber('fc_q1'),p1=deNumber('fc_p1'),p2=deNumber('fc_p2'),n=deNumber('fc_n'),count=deNumber('fc_count');
  if(!Number.isInteger(count)||count<1||count>500)throw Error('노즐 수량은 1~500개의 정수로 입력하세요.');
  return {q,p1,p2,n,count,per:DesignEngine.flow(q,p1,p2,n)};
}
function applyTotalFlow(){
  try{
    const v=deFlowValues(),total=v.per*v.count;if(!Number.isFinite(total))throw Error('총유량이 계산 범위를 초과했습니다.');
    ['wat_q','watv_q','watloss_q'].forEach(id=>deWrite(id,total));
    for(const [id,value] of Object.entries({ds_count:v.count,ds_qref:v.q,ds_pref:v.p1,ds_pressure:v.p2,ds_exponent:v.n}))deWrite(id,value);
    deGo('p3','water','size');deMessage('wat_design_note',`노즐 ${v.count}개 × ${fmt(v.per,4)} = 총 ${fmt(total,4)} L/min을 배관 계산의 모든 탭과 설계 시트에 적용했습니다.`);
  }catch(e){deMessage('fc_design_note',e.message,true);}
}
function applyPipeToDesign(){
  try{
    const d=deNumber('watloss_d'),length=deNumber('watloss_l'),c=deNumber('watloss_c');DesignEngine.waterLoss(deNumber('watloss_q'),d,length,c);
    deWrite('ds_d',d);deWrite('ds_length',length);deWrite('ds_c',c);deGo('p13');
    deMessage('ds_message','배관 내경·길이·C를 적용했습니다. 노즐 조건과 부속품 손실을 확인한 뒤 계산하세요.');
  }catch(e){deMessage('watloss_design_note',e.message,true);}
}

function nnRefreshHelp(){
  const sel=deEl('nn_series'),o=sel.selectedOptions[0];
  deEl('nn_help_current').textContent=sel.value?o.textContent.trim():'시리즈를 선택하거나 직접 입력을 선택하세요.';
  const box=deEl('nn_help_values');box.replaceChildren();
  for(const [label,value] of [['기준압',`${deEl('nn_pbase').value} kgf/cm²`],['유량 지수',deEl('nn_n').value],['용량번호 승수',`×${deEl('nn_mult').value}`]]){
    const row=document.createElement('div');row.className='rht-row';for(const text of [label,value]){const sp=document.createElement('span');sp.textContent=text;row.append(sp);}box.append(row);
  }
}
function nnBuildReference(){
  const body=deEl('nn_reference_body');body.replaceChildren();
  for(const opt of deEl('nn_series').options){if(!opt.value.includes('|'))continue;const [p,n,m]=opt.value.split('|'),row=document.createElement('tr');
    for(const text of [opt.textContent.trim(),Number(p).toFixed(6),Number(n).toFixed(2),`×${m}`]){const td=document.createElement('td');td.textContent=text;row.append(td);}body.append(row);
  }
  nnRefreshHelp();
}
function compareNozzleCandidates(){
  const box=deEl('nn_candidate_result');box.replaceChildren();
  try{
    const target=DesignEngine.positive(deNumber('nn_q1'),'요구 유량'),pressure=DesignEngine.positive(deNumber('nn_p1'),'현재 압력')*0.980665;
    const rows=[];
    for(const key of ['a','b']){
      const model=deEl(`nc_${key}_model`).value.trim(),qText=deEl(`nc_${key}_q`).value.trim();
      if(!model&&!qText)continue;
      if(!model)throw Error('후보 모델명을 입력하세요.');
      const q=deNumber(`nc_${key}_q`),p=deNumber(`nc_${key}_p`),n=deNumber(`nc_${key}_n`),actual=DesignEngine.flow(q,p,pressure,n);
      if(n>1)throw Error('후보의 유량 지수 n은 1 이하로 입력하세요.');
      rows.push([model,`${fmt(actual,4)} L/min`,`${fmt((actual/target-1)*100,2)} %`,deEl(`nc_${key}_spec`).value.trim()||'미입력',deEl(`nc_${key}_source`).value.trim()||'출처 미입력']);
    }
    if(!rows.length)throw Error('카탈로그에서 확인한 후보 모델과 기준 유량을 입력하세요.');
    box.append(deTable(['후보 모델','현장 압력에서 유량','요구 유량 대비 오차','각도·재질·연결','카탈로그 출처'],rows));
    deMessage('nn_candidate_note',`${fmt(pressure,4)} bar 기준 비교입니다. 유량 오차가 작아도 분사각·패턴·재질·연결규격을 별도로 확인하세요.`);
  }catch(e){deMessage('nn_candidate_note',e.message,true);}
}
function deTable(headers,rows){
  const table=document.createElement('table');table.className='design-table';const head=document.createElement('thead'),tr=document.createElement('tr');
  headers.forEach(v=>{const th=document.createElement('th');th.scope='col';th.textContent=v;tr.append(th);});head.append(tr);table.append(head);
  const body=document.createElement('tbody');for(const row of rows){const tr=document.createElement('tr');for(const value of row){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}body.append(tr);}table.append(body);return table;
}

const DS_FIELDS = Object.freeze({
  count:{label:'노즐 수량',unit:'EA',min:1,max:500,integer:true},qref:{label:'노즐당 기준 유량',unit:'L/min',min:1e-9,max:1e6},
  pref:{label:'노즐 기준 압력',unit:'bar',min:1e-9,max:10000},pressure:{label:'말단 노즐 목표압력',unit:'bar(g)',min:1e-9,max:10000},
  exponent:{label:'유량 지수 n',unit:'',min:1e-9,max:1},d:{label:'공급관 실제 내경',unit:'mm',min:1e-6,max:10000},
  length:{label:'공급관 길이 (헤더 제외)',unit:'m',min:0,max:1e6},c:{label:'Hazen–Williams C',unit:'',min:1,max:200},
  k:{label:'공급관 부속품 ΣK',unit:'',min:0,max:1e6},filter:{label:'필터·기기 추가 손실',unit:'bar',min:0,max:10000},
  elevation:{label:'높이차 (노즐 − 공급관 입구)',unit:'m',min:-10000,max:10000},margin:{label:'설계 여유압',unit:'bar',min:0,max:10000},
  headerD:{label:'헤더 실제 내경',unit:'mm',min:1e-6,max:10000},pitch:{label:'헤더 노즐 피치',unit:'mm',min:1e-6,max:1e6}
});
const DS_TEXT=['name','model','source','revision'];
let dsCases=[];
function dsRead(){
  const s={feed:deEl('ds_feed').value};let invalid;
  for(const [key,meta] of Object.entries(DS_FIELDS)){
    const e=deEl('ds_'+key);let v=deNumber('ds_'+key);
    if(s.feed==='uniform'&&['headerD','pitch'].includes(key)&&(!Number.isFinite(v)||v<meta.min||v>meta.max))v=key==='headerD'?15.76:300;
    const ok=Number.isFinite(v)&&v>=meta.min&&v<=meta.max&&(!meta.integer||Number.isInteger(v));
    e.setAttribute('aria-invalid',String(!ok));if(!ok&&!invalid)invalid={e,meta};s[key]=v;
  }
  if(invalid){invalid.e.focus();throw Error(`${invalid.meta.label}: ${invalid.meta.min}~${invalid.meta.max}${invalid.meta.unit?' '+invalid.meta.unit:''} 범위${invalid.meta.integer?'의 정수':''}를 입력하세요.`);}
  for(const key of DS_TEXT)s[key]=deEl('ds_'+key).value.trim();
  s.feed=deEl('ds_feed').value;return s;
}
function dsWarnings(s,r){
  const warnings=[];
  if(r.minRe<4000)warnings.push(`일부 배관 구간의 Reynolds 수가 약 ${Math.round(r.minRe)}입니다. Hazen–Williams 난류 가정의 적용 여부를 재검토하세요.`);
  if(r.recommended<0)warnings.push('고저차에 의한 압력이 필요압력을 초과합니다. 감압·유량제어 조건을 확인하세요.');
  if(s.feed==='uniform')warnings.push('헤더 손실은 제외했습니다. 노즐마다 같은 압력이 걸린다는 가정입니다.');
  else warnings.push('끝단 공급·동일 높이·등간격·동일 노즐 기준입니다. 분기 국부손실과 압력회복은 별도 검토하세요.');
  warnings.push('수온 약 20°C의 물 기준입니다. 펌프 흡입 조건·NPSH·효율·성능곡선 검토는 별도입니다.');
  return warnings;
}
function dsCalculate(){
  try{
    const s=dsRead(),r=DesignEngine.system(s);
    showResults('ds_result',[
      {label:'전체 노즐 유량',value:fmt(r.total,4),unit:'L/min'},
      {label:'공급관 입구 필요압력',value:fmt(r.required,4),unit:'bar(g) · 여유압 제외'},
      {label:'여유압 포함 검토압력',value:fmt(r.recommended,4),unit:'bar(g)'},
      {label:'공급관 유속',value:fmt(r.pipe.velocity,3),unit:'m/s'},
      {label:'헤더 내 유량 편차',value:fmt(r.variation,2),unit:'% · (최대−최소)/평균'},
    ]);
    const detail=deEl('ds_breakdown');detail.replaceChildren(deTable(['압력 항목','bar'],[
      ['말단 노즐 목표압력',fmt(s.pressure,4)],['헤더 마찰손실',fmt(r.header,4)],['공급관 마찰손실',fmt(r.pipe.bar,4)],['공급관 부속품 손실 (ΣK)',fmt(r.minor,4)],['필터·기기 추가 손실',fmt(s.filter,4)],['높이차',fmt(r.elevation,4)],['설계 여유압',fmt(s.margin,4)]
    ]));
    const nodes=deEl('ds_nodes');nodes.replaceChildren();if(s.feed==='end')nodes.append(deTable(['노즐','첫 노즐부터 거리 (mm)','압력 (bar)','유량 (L/min)'],r.nodes.map(n=>[n.number,fmt(n.position,1),fmt(n.pressure,4),fmt(n.flow,4)])));
    deMessage('ds_warning',dsWarnings(s,r).join(' '),r.minRe<4000||r.recommended<0);
    deMessage('ds_message','현재 조건으로 계산했습니다. 저장 파일과 계산서에는 입력조건과 계산 버전이 함께 기록됩니다.');return {s,r};
  }catch(e){deEl('ds_result').replaceChildren();deEl('ds_breakdown').replaceChildren();deEl('ds_nodes').replaceChildren();deEl('ds_warning').textContent='';deMessage('ds_message',e.message,true);deInvalidate(deEl('p13'));return null;}
}
function dsAddCase(){
  const data=dsCalculate();if(!data)return;
  if(dsCases.length>=3){deMessage('ds_message','최대 3개 설계안을 비교할 수 있습니다. 비교 목록에서 한 안을 뺀 뒤 추가하세요.',true);return;}
  dsCases.push({...data.s,name:data.s.name||`설계안 ${dsCases.length+1}`});dsRenderCases();
  deMessage('ds_message','현재 조건을 비교 목록에 추가했습니다. 설계 파일 저장을 눌러 비교안도 함께 보관하세요.');
}
function dsRenderCases(){
  const target=deEl('ds_comparison');target.replaceChildren();if(!dsCases.length){target.textContent='조건을 바꿔가며 최대 3개 설계안을 비교할 수 있습니다.';return;}
  const rows=dsCases.map(s=>{const r=DesignEngine.system(s);return [s.name,`${s.count} EA`,`${fmt(r.total,4)} L/min`,`${s.d} mm`,`${fmt(r.recommended,4)} bar`,`${fmt(r.variation,2)} %`];});
  const table=deTable(['설계안','수량','총유량','공급관 내경','여유 포함 압력','유량 편차'],rows);target.append(table);
  dsCases.forEach((s,i)=>{const row=document.createElement('div');row.className='design-actions';
    const load=document.createElement('button');load.type='button';load.textContent=`${s.name} 불러오기`;load.onclick=()=>{dsApply(s);dsCalculate();};
    const remove=document.createElement('button');remove.type='button';remove.textContent=`${s.name} 비교에서 빼기`;remove.onclick=()=>{dsCases.splice(i,1);dsRenderCases();};row.append(load,remove);target.append(row);
  });
}
function dsApply(s){for(const key of [...Object.keys(DS_FIELDS),...DS_TEXT,'feed'])deWrite('ds_'+key,s[key]);dsHeaderFields();}
function dsValidateRecord(record){
  if(!record||typeof record!=='object'||Array.isArray(record))throw Error('설계 데이터 형식이 올바르지 않습니다.');const s={};
  for(const [key,m] of Object.entries(DS_FIELDS)){const v=record[key];if(typeof v!=='number'||!Number.isFinite(v)||v<m.min||v>m.max||(m.integer&&!Number.isInteger(v)))throw Error(`설계 파일의 ${m.label} 값을 확인하세요.`);s[key]=v;}
  for(const key of DS_TEXT){if(typeof record[key]!=='string'||record[key].length>300)throw Error('설계 파일의 설명 길이 또는 형식이 올바르지 않습니다.');s[key]=record[key];}
  if(!['uniform','end'].includes(record.feed))throw Error('설계 파일의 헤더 방식이 올바르지 않습니다.');s.feed=record.feed;DesignEngine.system(s);return s;
}
function dsDownload(){
  const data=dsCalculate();if(!data)return;
  const payload={format:'nozzle-design-v1',calculationVersion:DESIGN_VERSION,savedAt:new Date().toISOString(),current:data.s,cases:dsCases};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=(data.s.name||'nozzle-design').replace(/[^\p{L}\p{N}_.-]/gu,'_').slice(0,80)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  deMessage('ds_message','설계 파일을 저장했습니다. 이 파일을 불러오면 현재 조건과 비교안이 복원됩니다.');
}
async function dsImport(file){
  if(!file)return;
  try{
    if(file.size>1024*1024)throw Error('1 MB 이하의 설계 JSON 파일을 선택하세요.');
    const p=JSON.parse(await file.text());if(p.format!=='nozzle-design-v1'||!Array.isArray(p.cases)||p.cases.length>3)throw Error('이 프로그램에서 저장한 설계 파일을 선택하세요.');
    const current=dsValidateRecord(p.current),cases=p.cases.map(dsValidateRecord);
    dsApply(current);dsCases=cases;dsRenderCases();dsCalculate();
    deMessage('ds_message',p.calculationVersion===DESIGN_VERSION?'설계 파일을 불러와 다시 계산했습니다.':`저장 당시 계산 버전은 ${String(p.calculationVersion).slice(0,40)}입니다. 현재 버전 ${DESIGN_VERSION}으로 다시 계산했습니다.`);
  }catch(e){deMessage('ds_message',e instanceof SyntaxError?'JSON 파일 형식이 올바르지 않습니다. 현재 입력값은 유지됩니다.':e.message,true);}
  finally{deEl('ds_file').value='';}
}
function dsHeaderFields(){const active=deEl('ds_feed').value==='end';deEl('ds_header_fields').hidden=!active;}
function dsPrint(){
  const data=dsCalculate();if(!data)return;const {s,r}=data,report=deEl('design-print');report.replaceChildren();
  const add=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;report.append(e);};
  add('h1','노즐·배관 설계 계산서');add('p',`프로젝트: ${s.name||'미입력'} · 개정: ${s.revision||'미입력'}`);
  add('p',`노즐 모델: ${s.model||'미입력'} · 카탈로그/성능자료: ${s.source||'미입력'}`);
  add('p',`계산 버전 ${DESIGN_VERSION} · 작성 시각 ${new Date().toLocaleString('ko-KR')}`);
  add('h2','설계 결과');report.append(deTable(['항목','결과'],[['총유량',`${fmt(r.total,4)} L/min`],['필요압력 (여유 제외)',`${fmt(r.required,4)} bar(g)`],['여유 포함 검토압력',`${fmt(r.recommended,4)} bar(g)`],['공급관 유속',`${fmt(r.pipe.velocity,3)} m/s`],['헤더 유량 편차',`${fmt(r.variation,2)} %`]]));
  add('h2','입력조건');report.append(deTable(['항목','입력값'],Object.entries(DS_FIELDS).filter(([k])=>s.feed==='end'||!['headerD','pitch'].includes(k)).map(([k,m])=>[m.label,`${s[k]} ${m.unit}`])));
  add('p','헤더 방식: '+(s.feed==='end'?'끝단 공급, 첫 노즐 위치에 공급관 연결':'헤더 손실 제외, 균등 압력 가정'));
  add('h2','압력 구성');report.append(deEl('ds_breakdown').firstElementChild.cloneNode(true));
  if(dsCases.length){add('h2','설계안 비교');report.append(deEl('ds_comparison').querySelector('table').cloneNode(true));}
  add('h2','계산 범위와 근거');dsWarnings(s,r).forEach(t=>add('p',t));
  add('p','Q = Qref × (P/Pref)^n. hf = 10.67 L Q^1.852 / (C^1.852 d^4.87), Q: m³/s, d: m. 부속품 ΔP = ΣK ρv²/2, ρ=1000 kg/m³. 높이차 ΔP = ρgΔz, g=9.80665 m/s².');
  add('p','근거: EPA EPANET 2.2 User Manual — https://usepa.github.io/EPANET2.2/3_network_model.html');
  add('p','분사 유량·각도·재질·나사규격은 해당 모델의 카탈로그 및 실제 사용조건과 대조하세요.');
  document.body.classList.add('design-printing');window.print();
}

window.addEventListener('DOMContentLoaded',()=>{
  nnBuildReference();nnSelectSeries(deEl('nn_series'));dsHeaderFields();
  deEl('ds_feed').addEventListener('change',dsHeaderFields);
  deEl('ds_file').addEventListener('change',e=>dsImport(e.target.files[0]));
  deEl('p13').addEventListener('input',()=>{deEl('ds_breakdown').replaceChildren();deEl('ds_nodes').replaceChildren();deEl('ds_warning').textContent='';deMessage('ds_message','입력값을 변경했습니다. 다시 계산하세요.');});
  deEl('p13').addEventListener('change',()=>{deInvalidate(deEl('p13'));deEl('ds_breakdown').replaceChildren();deEl('ds_nodes').replaceChildren();});
  deEl('p5').addEventListener('input',()=>{nnRefreshHelp();deEl('nn_candidate_result').replaceChildren();deMessage('nn_candidate_note','조건이 바뀌면 후보 비교를 다시 실행하세요.');});
  deEl('p5').addEventListener('change',()=>{nnRefreshHelp();deEl('nn_candidate_result').replaceChildren();});
  for(const ids of [['wat_q','watv_q','watloss_q'],['watv_d','watloss_d']])for(const id of ids)deEl(id).addEventListener('input',()=>{
    for(const other of ids)if(other!==id){deEl(other).value=deEl(id).value;deInvalidate(deEl(other).closest('.section-body'));}
  });
  const restore=window.rpRestoreRecord;
  window.rpRestoreRecord=function(index){
    restore(index);
    const panel=document.querySelector('.panel.active')?.id;
    if(panel==='p4')weightShapeChanged();
    if(panel==='p5'){nnSelectSeries(deEl('nn_series'));deEl('nn_candidate_result').replaceChildren();}
    if(panel==='p13'){dsHeaderFields();deEl('ds_breakdown').replaceChildren();deEl('ds_nodes').replaceChildren();deEl('ds_warning').textContent='';deMessage('ds_message','저장된 입력조건입니다. 다시 계산하세요.');}
    if(panel==='p7'){['nz_front_svg','nz_plan_svg'].forEach(id=>deEl(id)?.replaceChildren());deMessage('nz_design_note','저장된 입력조건입니다. 다시 계산하면 배치도를 표시합니다.');}
  };
  // The same checked equation supplies the air reference table and calculation.
  const table=deEl('p8').querySelector('table');if(table){const rows=table.querySelectorAll('tr');
    const pressures=[0.7,1,1.5,2,2.5,3,4,5,7,10];
    rows.forEach((tr,index)=>{if(index===0)return;const cells=tr.querySelectorAll('td'),diameter=parseFloat(cells[0]?.textContent);if(!diameter)return;pressures.forEach((p,j)=>{if(!cells[j+1])return;try{cells[j+1].textContent=fmt(airOrifice(diameter,p*0.980665,20,1).flow,1);}catch{cells[j+1].textContent='범위 밖';}});});
  }
});
window.addEventListener('afterprint',()=>document.body.classList.remove('design-printing'));

