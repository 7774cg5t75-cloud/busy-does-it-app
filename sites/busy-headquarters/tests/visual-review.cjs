const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const { chromium }=require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const cases=[
    ['home-desktop','/',1440,900,false],
    ['home-mobile','/',390,844,true],
    ['clearflow-desktop','/showcase/',1440,900,false],
    ['clearflow-mobile','/showcase/',390,844,true],
  ];
  const failures=[];
  fs.mkdirSync('marketing-visual-evidence',{recursive:true});
  for(const [label,url,width,height,isMobile] of cases){
    const context=await browser.newContext({viewport:{width,height},isMobile,hasTouch:isMobile,deviceScaleFactor:1});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8765'+url,{waitUntil:'domcontentloaded'});
    // Scroll naturally to trigger lazy-loaded images before the full-page capture.
    const fullHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
    for(let y=0;y<fullHeight;y+=Math.max(350,Math.floor(height*.75))){
      await page.evaluate(y=>window.scrollTo(0,y),y);
      await page.waitForTimeout(140);
    }
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.waitForTimeout(1100);
    await page.screenshot({path:path.join('marketing-visual-evidence',label+'.png'),fullPage:true,animations:'disabled'});
    const result=await page.evaluate(()=>({
      docWidth:document.documentElement.scrollWidth,
      innerWidth:window.innerWidth,
      h1:document.querySelector('h1')?.innerText,
      images:[...document.images].map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0})),
      sampleColour:getComputedStyle(document.querySelector('.hero')).backgroundImage
    }));
    console.log(JSON.stringify({label, ...result,errors}));
    if(result.docWidth>result.innerWidth+2)failures.push(label+': horizontal overflow '+result.docWidth+'/'+result.innerWidth);
    if(errors.length)failures.push(label+': page JS errors '+errors.join('; '));
    await context.close();
  }
  await browser.close();
  assert.equal(failures.length,0,failures.join('\n'));
})().catch(err=>{console.error(err);process.exitCode=1;});
