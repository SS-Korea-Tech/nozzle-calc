// Isentropic choked flow; dry air, a low-velocity upstream reservoir, atmospheric discharge.
// Reference: NASA Glenn, Mass Flow Choking, Mach=1 equation.
function airOrifice(d,pressure,temperature,cd=1){
 const gamma=1.4,R=287.05,ambient=101325,totalP=pressure*100000+ambient,totalT=temperature+273.15;
 if(![d,pressure,temperature,cd].every(Number.isFinite)||d<=0||pressure<=0||totalT<=0||cd<=0||cd>1)throw Error('구경·압력은 0 초과, 온도는 −273.15°C 초과, Cd는 0 초과~1로 입력하세요.');
 const critical=(2/(gamma+1))**(gamma/(gamma-1));
 if(ambient/totalP>critical)throw Error('임계유동 식의 적용 범위 밖입니다. 대기 방출 기준 약 0.905 bar(g) 이상에서 사용하세요.');
 const area=Math.PI/4*(d/1000)**2;
 const mass=cd*area*totalP/Math.sqrt(totalT)*Math.sqrt(gamma/R)*(2/(gamma+1))**((gamma+1)/(2*(gamma-1)));
 const flow=mass/1.2*60000;if(!Number.isFinite(flow)||flow<=0)throw Error('계산 범위를 초과했습니다. 구경·압력·온도의 단위를 확인하세요.');return {mass,flow};
}
function calcAirFlow(){
 const ids=['air_d','air_pres','air_temp','air_cd'];try{
  const values=ids.map(id=>{const e=document.getElementById(id);e.removeAttribute('aria-invalid');return e.value.trim()===''?NaN:Number(e.value);});
  const r=airOrifice(...values);showResults('air_flow_result',[{label:'환산 공기 분사량',value:fmt(r.flow,2),unit:'L/min · 환산 밀도 1.2 kg/m³'},{label:'질량 유량',value:fmt(r.mass*3600,4),unit:'kg/h'},{label:'유동 가정',value:values[3]===1?'이상 임계유동':'Cd 보정 임계유동',unit:'대기 방출 · 단일 최소 구경'}]);
 }catch(e){showCalculationError('air_flow_result',e.message);}
}
