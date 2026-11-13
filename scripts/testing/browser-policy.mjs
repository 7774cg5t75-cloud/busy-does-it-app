// Optional acceptance runner only. No configurable unsafe fallback.
export async function launchFixtureBrowser(chromium){
 return chromium.launch({headless:true,chromiumSandbox:true,
  args:['--disable-background-networking','--disable-component-update','--no-first-run']});
}
