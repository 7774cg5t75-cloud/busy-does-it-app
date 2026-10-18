// Common finding vocabulary for the EXISTING builder reviews and save gates.
// No scoring, persistence, publishing authority or independent review engine.
export function editingQualityDecision(findings=[]){
 const levels=['advisory','critical'],proof=['finite-contract','calculated-palette'];
 const rows=(Array.isArray(findings)?findings:[]).slice(0,40).filter(f=>f&&typeof f.id==='string'&&typeof f.message==='string'&&levels.includes(f.level))
  .map(f=>({...f,level:f.level==='critical'&&!proof.includes(f.evidence)?'advisory':f.level}));
 const critical=rows.filter(f=>f.level==='critical'),advisory=rows.filter(f=>f.level==='advisory');
 return {level:critical.length?'critical':advisory.length?'advisory':'safe',mayCommit:critical.length===0,
  findings:rows,criticalCount:critical.length,advisoryCount:advisory.length,
  ownerMayKeepChoice:critical.length===0,renderingVerified:false,
  explanation:critical[0]?.message||advisory[0]?.message||'No critical structured-design failure found. Actual browser and device review is still needed.'};
}
