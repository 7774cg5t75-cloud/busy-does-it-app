// Original owner_status read orchestration, extracted without provider execution.
// Required original contracts are independently exercised in disposable PostgreSQL.
export function createOwnerStatusReader({supabase,appForBusiness,moduleCatalog,publicProfileForBusiness,readBusinessContent,reviewPushGatewayReceipts}){
// V3.181 durable BUSY Work bookings for this authenticated owner business.
// Never return raw customer messages or contact details through this list.
async function ownerWorkBookingLedger(businessId, miniAppId) {
  const earliest=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
  const result=await supabase.from("busy_mini_app_work_bookings")
    .select("id,business_id,mini_app_id,request_id,customer_record_id,action_record_id,calendar_date,calendar_time,state,updated_at")
    .eq("business_id",businessId).eq("mini_app_id",miniAppId)
    .gte("calendar_date",earliest)
    .order("calendar_date",{ascending:true}).limit(200);
  if(result.error)throw result.error;
  return {rows:result.data||[],truncated:(result.data||[]).length>=200,
    scope:"authenticated_owner_business",verifiedExternalCalendar:false};
}

async function readOwnerStatus(businessId) {
  const [app, catalog, profile] = await Promise.all([
    appForBusiness(businessId),
    moduleCatalog(),
    publicProfileForBusiness(businessId),
  ]);
  if(app&&app.business_id!==businessId)throw Error("Wrong business app scope");
  if (!app) {
    return {
      app: null,
      versions: [],
      requests: [],
      requestLinks: [],
      workBookingLedger:{rows:[],truncated:false,verifiedExternalCalendar:false},
      messageCheckpoints:{rows:[],truncated:false},
      messageDeliveryOutbox:{rows:[],truncated:false},
      pushGatewayEvidence:{ok:false,reason:"No Business App is configured."},
      requestCount30: 0,
      guestRequestCount30: 0,
      entrySummary: [],
      catalog,
      publicProfile: profile,
    };
  }

  const entrySince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [versions, requests, requestLinks, entrySummary, requestCount30, guestRequestCount30, workBookingLedger, messageCheckpoints, messageDeliveryOutbox] = await Promise.all([
    supabase
      .from("busy_mini_app_versions")
      .select(
        "id,version_no,source_profile_revision,source_draft_revision,config_hash,state,change_label,change_summary,public_web_storage_path,public_web_artifact_bytes,public_web_published_at,created_at,prepared_at,published_at"
      )
      .eq("mini_app_id", app.id)
      .eq("business_id",businessId)
      .order("version_no", { ascending: false })
      .limit(12),
    supabase
      .from("busy_mini_app_requests")
      .select(
        "id,business_id,mini_app_id,version_id,module_key,request_type,status,payload,consumer_user_id,contact_name,contact_email,contact_phone,service_name,preferred_date_text,request_origin,identity_assurance,guest_proof_verified_at,business_unread_count,customer_unread_count,last_business_read_at,last_customer_read_at,created_at,updated_at"
      )
      .eq("mini_app_id", app.id)
      .eq("business_id",businessId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("busy_mini_app_request_links")
      .select("request_id,business_id,customer_record_id,action_record_id,bridge_state,linked_at,updated_at,metadata")
      .eq("business_id", businessId)
      .order("linked_at", { ascending: false })
      .limit(100),
    supabase.rpc("busy_mini_app_entry_summary", {
      p_business_id: businessId,
      p_mini_app_id: app.id,
      p_since: entrySince,
    }),
    supabase
      .from("busy_mini_app_requests")
      .select("id", { count: "exact", head: true })
      .eq("mini_app_id", app.id)
      .eq("business_id",businessId)
      .gte("created_at", entrySince),
    supabase
      .from("busy_mini_app_requests")
      .select("id", { count: "exact", head: true })
      .eq("mini_app_id", app.id)
      .eq("business_id",businessId)
      .eq("request_origin", "guest_web")
      .gte("created_at", entrySince),
    ownerWorkBookingLedger(businessId,app.id),
    supabase.from("busy_mini_app_request_messages")
      .select("id,business_id,mini_app_id,request_id,sender_role,created_at")
      .eq("business_id",businessId).eq("mini_app_id",app.id)
      .order("created_at",{ascending:false}).limit(150),
    supabase.from("busy_mini_app_message_delivery_outbox")
      .select("id,business_id,mini_app_id,request_id,message_id,recipient_role,state,attempt_count,submitted_token_count,created_at")
      .eq("business_id",businessId).eq("mini_app_id",app.id)
      .order("created_at",{ascending:false}).limit(100),
  ]);
  if (versions.error) throw versions.error;
  if (requests.error) throw requests.error;
  if (requestLinks.error) throw requestLinks.error;
  if (entrySummary.error) throw entrySummary.error;
  if (requestCount30.error) throw requestCount30.error;
  if (guestRequestCount30.error) throw guestRequestCount30.error;
  if(messageCheckpoints.error)throw messageCheckpoints.error;
  if(messageDeliveryOutbox.error)throw messageDeliveryOutbox.error;
  // Reconcile saved gateway submission tickets in a read-only, tenant-scoped
  // query. An unavailable query remains UNKNOWN, never a false zero success.
  let pushGatewayEvidence={ok:false,
    reason:"Gateway evidence could not be checked; saved replies remain available."};
  const intentRows=messageDeliveryOutbox.data||[];
  if(intentRows.length){
    const keys=intentRows.map(x=>
      "miniapp:"+x.request_id+":message:"+x.message_id);
    try{
      const delivered=await supabase.from("busy_push_deliveries")
        .select("business_id,notification_key,provider_receipts")
        .eq("business_id",businessId)
        .in("notification_key",keys)
        .limit(400);
      if(!delivered.error){
        pushGatewayEvidence=reviewPushGatewayReceipts({
          businessId,appId:app.id,outboxRows:intentRows,
          deliveryRows:delivered.data||[],
          outboxTruncated:intentRows.length>=100,
          deliveryTruncated:(delivered.data||[]).length>=400
        });
      }
    }catch(error){console.warn("Gateway receipt review is not available.");}
  }else{
    pushGatewayEvidence=reviewPushGatewayReceipts({
      businessId,appId:app.id,outboxRows:[],deliveryRows:[]
    });
  }

  return {
    app:app.draft_config?.contentLayout?.length?{...app,businessContent:await readBusinessContent(supabase,businessId,{publicOnly:true})}:app,
    versions: versions.data || [],
    requests: requests.data || [],
    requestLinks: requestLinks.data || [],
    workBookingLedger,
    messageCheckpoints:{rows:messageCheckpoints.data||[],
      truncated:(messageCheckpoints.data||[]).length>=150},
    messageDeliveryOutbox:{rows:messageDeliveryOutbox.data||[],
      truncated:(messageDeliveryOutbox.data||[]).length>=100},
    pushGatewayEvidence,
    entrySummary: entrySummary.data || [],
    requestCount30: Number(requestCount30.count || 0),
    guestRequestCount30: Number(guestRequestCount30.count || 0),
    catalog,
    publicProfile: profile,
  };
}


return readOwnerStatus;
}
