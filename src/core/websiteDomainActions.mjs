// Existing domain/status handlers: no provider adapter, retry queue or automatic new action.
function createWebsiteDomainActions({websiteDomainDraft,websiteDraft,withoutPrivateWebsiteDesignFeedback,websiteBeginTask,websiteTaskAwait,websiteTaskCurrent,websiteTaskSourceCurrent,websiteAsyncGateRef,websitePublishingRequest,refreshWebsitePublishingStatus,setWebsitePublishingAction,setWebsitePublishingError,setWebsitePublishingNotice,setTimeout}){
  const requestWebsiteDomain = async () => {
    const hostname = websiteDomainDraft.trim();
    if (!hostname) return false;
    const task=websiteBeginTask("hosting",{deploymentBound:false});if(!task)return false;
    setWebsitePublishingAction("domain");
    setWebsitePublishingError("");
    try {
      const result = await websiteTaskAwait(task,()=>websitePublishingRequest("request_domain", {
        hostname,
        websiteDraft:withoutPrivateWebsiteDesignFeedback(websiteDraft),
      }));
      setWebsitePublishingNotice(
        `Domain verification created. Add TXT record ${result?.verificationName || ""} with the value shown, then check ownership once. After ownership is proved, BUSY will prepare Cloudflare routing and SSL automatically.`
      );
      await websiteTaskAwait(task,()=>refreshWebsitePublishingStatus({ quiet: true }));
      return true;
    } catch (error) {if(!websiteTaskCurrent(task))return false;
      setWebsitePublishingError(
        error?.message || "BUSY could not start domain verification."
      );
      return false;
    } finally {
      if(websiteAsyncGateRef.current.owns(task))setWebsitePublishingAction("");
      websiteAsyncGateRef.current.finish(task);
    }
  };

  const followCustomDomain = (task) => {
    [1500, 5000, 12000, 25000].forEach((delay) => {
      setTimeout(() => {if(websiteTaskSourceCurrent(task))refreshWebsitePublishingStatus({ quiet: true });}, delay);
    });
  };

  // Read-only public DNS inspection: no provider provisioning or state changes.
  const inspectWebsiteDomainDns = async (domainId) => {
    if(!domainId)throw Error("Select a domain first.");
    const task=websiteBeginTask("status");if(!task)throw Error("The website changed or a status check is already running.");
    try{
    const data=await websiteTaskAwait(task,()=>websitePublishingRequest("inspect_domain_dns",{domainId}));
    if(!data?.ok||data?.diagnostics?.domainId!==domainId||data.diagnostics.readOnly!==true)
      throw Error("BUSY could not verify the DNS check belongs to this business.");
    return data.diagnostics;
    }finally{websiteAsyncGateRef.current.finish(task);}
  };

  const verifyWebsiteDomain = async (domainId) => {
    if (!domainId) return false;
    const task=websiteBeginTask("hosting",{deploymentBound:false});if(!task)return false;
    setWebsitePublishingAction(`verify-domain:${domainId}`);
    setWebsitePublishingError("");
    try {
      const result = await websiteTaskAwait(task,()=>websitePublishingRequest("verify_domain", {
        domainId,
      }));
      setWebsitePublishingNotice(
        result?.verified
          ? result?.activation?.error
            ? "Domain ownership is verified. BUSY could not continue the provider step immediately, so the background reconciler will retry safely."
            : "Domain ownership is verified. BUSY has started the Cloudflare hostname, DNS-routing and SSL setup automatically."
          : "The verification TXT record is not visible in public DNS yet. Nothing was changed."
      );
      await websiteTaskAwait(task,()=>refreshWebsitePublishingStatus({ quiet: true }));
      if (result?.verified) followCustomDomain(task);
      return !!result?.verified;
    } catch (error) {if(!websiteTaskCurrent(task))return false;
      setWebsitePublishingError(
        error?.message || "BUSY could not verify that domain."
      );
      return false;
    } finally {
      if(websiteAsyncGateRef.current.owns(task))setWebsitePublishingAction("");
      websiteAsyncGateRef.current.finish(task);
    }
  };

  const provisionWebsiteDomain = async (domainId) => {
    if (!domainId) return false;
    const task=websiteBeginTask("hosting",{deploymentBound:false});if(!task)return false;
    setWebsitePublishingAction(`provision-domain:${domainId}`);
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    try {
      const result = await websiteTaskAwait(task,()=>websitePublishingRequest("provision_domain", {
        domainId,
      }));
      const configured = !!result?.provider?.configured;
      setWebsitePublishingNotice(
        configured
          ? "BUSY refreshed this domain with Cloudflare. Add any DNS records still shown below; BUSY will continue checking routing, SSL and the exact live deployment automatically."
          : "The BUSY-side Cloudflare adapter is ready, but the server connection is not complete yet. No unsafe routing change was made."
      );
      await websiteTaskAwait(task,()=>refreshWebsitePublishingStatus({ quiet: true }));
      if (configured) followCustomDomain(task);
      return configured;
    } catch (error) {if(!websiteTaskCurrent(task))return false;
      setWebsitePublishingError(
        error?.message || "BUSY could not prepare external website routing."
      );
      return false;
    } finally {
      if(websiteAsyncGateRef.current.owns(task))setWebsitePublishingAction("");
      websiteAsyncGateRef.current.finish(task);
    }
  };

  const refreshWebsiteSignals = async () => {
    const task=websiteBeginTask("hosting",{deploymentBound:false});if(!task)return false;
    setWebsitePublishingAction("signals");
    setWebsitePublishingError("");
    setWebsitePublishingNotice("");
    try {
      const result = await websiteTaskAwait(task,()=>websitePublishingRequest("refresh_signals"));
      const configured = !!result?.signals?.configured;
      setWebsitePublishingNotice(
        configured
          ? "BUSY refreshed the current external website traffic signals and updated the tenant usage rollup."
          : "Real traffic collection is ready on the BUSY side, but Cloudflare analytics credentials are not connected yet. No traffic numbers were invented."
      );
      await websiteTaskAwait(task,()=>refreshWebsitePublishingStatus({ quiet: true }));
      return configured;
    } catch (error) {if(!websiteTaskCurrent(task))return false;
      setWebsitePublishingError(
        error?.message || "BUSY could not refresh website traffic signals."
      );
      return false;
    } finally {
      if(websiteAsyncGateRef.current.owns(task))setWebsitePublishingAction("");
      websiteAsyncGateRef.current.finish(task);
    }
  };


 return {requestWebsiteDomain,verifyWebsiteDomain,provisionWebsiteDomain,refreshWebsiteSignals,inspectWebsiteDomainDns};
}
export {createWebsiteDomainActions};
