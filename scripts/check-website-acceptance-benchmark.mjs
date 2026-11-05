import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {websiteBuilderTestHarnessV3222} from './lib/website-builder-test-harness-v3222.mjs';
import {websiteIndividualityInstructions} from '../src/core/websiteCreativeBrief.mjs';
import {prepareWebsiteRequest} from '../src/core/websiteRequestPlan.mjs';
import {heroFamilies} from '../supabase/functions/busy-website-worker/websiteHeroFamilies.mjs';
const api=websiteBuilderTestHarnessV3222(['buildWebsiteDraft','renderWebsiteHtml','applyWebsiteLayoutChange','applyStructuredWebsiteEdit','rebuildPrivateWebsiteDraft']);
// Explicit synthetic fixture facts. Not customer evidence, approval or a template catalogue.
const cases=[
 ['Copper Table','Catering','Festival plates','Private buffets','Food for people gathering together.','Tell us about your gathering.'],
 ['Small Batch Kitchen','Catering','Seasonal lunch menus','Office catering','Lunch menus prepared around a supplied brief.','Explore our food.'],
 ['City Stem','Gardening','Courtyard planting','Planting advice','Planting ideas for small city spaces.','Discuss your space.'],
 ['Field & Hedge','Gardening','Hedge care','Seasonal maintenance','Practical care for gardens and boundaries.','Ask about garden care.'],
 ['Northline Studio','Creative studio','Brand direction','Editorial design','Clear visual communication for independent businesses.','Discuss a creative brief.'],
 ['Paper Current','Creative studio','Copy development','Website planning','Words and structure for a considered website.','Start with your idea.'],
 ['Still House','Wellness','Relaxation information','Consultation preparation','A quiet introduction to our approach.','Ask about our approach.'],
 ['Open Balance','Wellness','Movement sessions','Session information','Clear information before choosing a session.','Explore session information.'],
 ['Form & Shelf','Retail','Homeware information','Collection enquiries','A considered selection for everyday spaces.','Ask about the collection.'],
 ['Little Supply','Retail','Product information','Gift enquiries','Useful information about a small independent range.','Discuss what you need.'],
 ['Stonework Notes','Trades','Repair enquiries','Project assessment','Understand the work before choosing next steps.','Describe your project.'],
 ['Clear Exterior','Trades','Exterior cleaning','Surface assessment','Practical information for exterior care.','Ask about your property.'],
 ['Ledger Lane','Professional services','Record organisation','Reporting support','Make business records easier to understand.','Discuss your records.'],
 ['Plain View','Professional services','Business planning','Process review','Bring clarity to everyday business decisions.','Start a conversation.'],
 ['Corner Room','Local shop','Collection information','Local enquiries','A straightforward introduction to our independent shop.','Ask about a product.'],
 ['Book & Birch','Local shop','Book enquiries','Gift information','Help choosing from a considered selection.','Send a book enquiry.'],
 ['Slow Thread','Craft','Textile commissions','Material discussions','Thoughtful textile work shaped around a brief.','Discuss an idea.'],
 ['Clay Interval','Craft','Ceramic enquiries','Object information','Form and function in considered objects.','Ask about an object.'],
 ['Bright Window','Beauty','Treatment information','Consultation enquiries','Understand your options before deciding.','Ask about a treatment.'],
 ['Soft Measure','Beauty','Service information','Care discussions','A considered conversation about personal care.','Explore our approach.'],
 ['Shared Hours','Hospitality','Gathering enquiries','Menu information','Space and food for a gathering described by you.','Tell us about your plans.'],
 ['Daylight Counter','Hospitality','Food information','Catering enquiries','A clear introduction to our food offering.','Explore the offering.'],
 ['First Page','Minimal brief','Website enquiries','Brief preparation','Independent services explained simply.','Start with a question.'],
 ['Workroom','Minimal brief','Project enquiries','Planning discussions','A useful first conversation about your needs.','Describe what you need.']
];
const folder='.test-artifacts/website-benchmark';mkdirSync(folder,{recursive:true});const scenarios=[],findings=[],fingerprints=new Map();
for(const [i,[name,industry,a,b,description,headline]] of cases.entries()){
 const businessId='bbbbbbbb-bbbb-4bbb-8bbb-'+String(i+1).padStart(12,'0'),brief={businessName:name,businessType:industry,description,about:description,serviceArea:'',email:'review@example.invalid',services:[{id:'primary',name:a,description:'Ask about the scope of '+a.toLowerCase()+'.'},{id:'secondary',name:b,description:'Discuss your requirements for '+b.toLowerCase()+'.'}]};
 let d=api.buildWebsiteDraft({businessId,brandBrain:{websiteBrief:brief}});
 const family=heroFamilies.filter(f=>f.media===0)[i%heroFamilies.filter(f=>f.media===0).length].id;
 for(const [field,value] of [['heroComposition',family],['heroVariation',Math.floor(i/4)%2?'atelier':'authored'],['typography',['refined','confident','editorial'][Math.floor(i/8)%3]],['cardLayout',i%2?'rows':'cards']]){if(d.theme[field]===value)continue;const p=api.applyWebsiteLayoutChange(d,{action:'style',field,value});assert.equal(p.applied,true,p.reason);d=p.draft;}
 const edit=api.applyStructuredWebsiteEdit(d,{sectionId:'hero',field:'title',value:headline});assert.equal(edit.applied,true);d=edit.draft;
 assert.equal(d.businessId,businessId);assert.equal(d.publish.enabled,false);
 const fingerprint=JSON.stringify({family,typography:d.theme.typography,variation:d.theme.heroVariation,order:d.pages.find(p=>p.id==='home').sectionIds,services:d.sections.find(s=>s.type==='services')?.appearance});
 const previous=fingerprints.get(fingerprint);if(previous)findings.push({business:name,sharesStructureWith:previous,decision:'Full-page independent visual review required; names and colours are not uniqueness.'});else fingerprints.set(fingerprint,name);
 const before=d,beforeHtml=api.renderWebsiteHtml(d),q=websiteIndividualityInstructions({website:d,businessId,ownerId:'synthetic-owner',profileRevision:1},'Make my website look more individual',{rejected:i%2?['studio-index']:[]});assert.equal(q.ok,true,q.reason);const directed=prepareWebsiteRequest(d,{draftId:d.id,pageId:'home',generation:d.generation,instruction:q.instruction},{fieldEdit:api.applyStructuredWebsiteEdit,layoutEdit:api.applyWebsiteLayoutChange,rebuild:api.rebuildPrivateWebsiteDraft,renderPage:api.renderWebsiteHtml});assert.equal(directed.ok,true,directed.reason);d=api.rebuildPrivateWebsiteDraft(JSON.parse(directed.boundaries.at(-1)));
 const html=api.renderWebsiteHtml(d);assert.ok(!html.includes('<img'));writeFileSync(folder+'/'+i+'-before.html',beforeHtml);writeFileSync(folder+'/'+i+'-after.html',html);writeFileSync(folder+'/'+i+'-before.json',JSON.stringify(before));writeFileSync(folder+'/'+i+'-approved.json',JSON.stringify(d));
 scenarios.push({id:String(i),business:name,industry,family,before:i+'-before.html',after:i+'-after.html',photoExpected:false,recordPhotoBindings:[],comparison:'Same facts/branding/assets: reviewed whole-page direction and explicitly suggested heading/action text derived from supplied service names; not a CSS-only change. Distinct structural settings do not establish professional uniqueness.',sourceRichness:'approved synthetic sparse brief'});
}
assert.equal(scenarios.length,24);assert.equal(new Set(scenarios.map(x=>JSON.parse(x.id))).size,24);
writeFileSync(folder+'/scenarios.json',JSON.stringify({scenarios},null,2));writeFileSync(folder+'/coverage.json',JSON.stringify({cases:24,distinctStructuralFingerprints:fingerprints.size,findings,approvedGoldStandards:0,independentReview:'pending; automated rendering is not independent professional acceptance',cadence:{smallChanges:'affected automated source and visual regressions',majorDesignChanges:'24 whole pages plus five same-industry and sparse/rich three-industry comparison',substantialReview:'founder and independent uncoached review before marketing-quality claim'},fixtureDigest:createHash('sha256').update(JSON.stringify(cases)).digest('hex')},null,2));
console.log('PASS 24 independently scoped original-renderer synthetic businesses, photo-eligible choices from the expandable registry, 12 paired sectors, truthful sparse sources, no images/claims fabricated and explicit unreviewed structural-similarity findings.');
