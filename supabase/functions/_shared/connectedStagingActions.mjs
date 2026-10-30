const STAGING='https://pnjdlogwegnqbsfpcofw.supabase.co';
const ACTIONS=Object.freeze({app:['owner_status','build_draft','apply_app_plan','apply_coordinated_edits','set_module','move_section','set_appearance'],website:['website_create','website_edit_text','website_edit_design','website_edit_page']});
// Server environment authority only. A client marker cannot open this gate.
export function connectedStagingAction({projectUrl,enabled,domain,action}){
 if(projectUrl!==STAGING)return {allowed:true,staging:false};
 return {allowed:enabled==='true'&&Object.hasOwn(ACTIONS,domain)&&ACTIONS[domain].includes(action),staging:true};
}
