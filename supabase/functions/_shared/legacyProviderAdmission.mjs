// Historical OAuth/provider writers have no transactionally verified current
// business/actor/connection binding. Configuration or a model cannot open this
// fence. Replace each original path with reviewed finite authority, not a flag.
export function legacyProviderAdmission(){return Object.freeze({allowed:false,code:'provider_authority_review_required'});}
