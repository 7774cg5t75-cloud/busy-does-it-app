import {buildWebsiteDraft,applyStructuredWebsiteEdit} from '../../src/domain/websiteBuilder.js';
import {mission16Fixture,mission16Assets} from './mission16-site-fixtures.mjs';

// Explicitly supplied fictional owner-reviewed source, not assertions about
// actual businesses. The first three reuse the byte-pinned Mission16 facts and
// licensed illustrations; Yard & Thread is a separately scoped image-free case.
export const mission19Sites=[
 {id:'moor-meadow',name:'Moor & Meadow',sourceIndex:0,retainPages:['home','services','about','contact','page-garden-maintenance'],personality:'Calm, practical and thoughtful; a garden is a space for everyday life.',audience:'People considering the care or arrangement of a garden in Devon.'},
 {id:'ember',name:'Ember Festival Kitchen',sourceIndex:1,retainPages:['home','products','about','contact'],personality:'Warm, food-focused and expressive; the gathering sets the direction.',audience:'People exploring festival plates, shared buffets and food-led gathering plans.'},
 {id:'quiet-light',name:'Quiet Light Studio',sourceIndex:2,retainPages:['home','services','about','contact','page-brand-direction'],personality:'Considered, clear and independent; purposeful creative decisions.',audience:'Independent businesses working through brand direction and website content.'},
 {id:'yard-thread',name:'Yard & Thread',sourceIndex:null,retainPages:['home','services','about','contact'],personality:'Lively, direct and practical; make a small outdoor space useful to everyday life.',audience:'People with small courtyards, balconies and container spaces in Bristol.'}
];
export const mission19Assets=mission16Assets;
export function mission19Fixture(index){
 const item=mission19Sites[index];if(!item)throw Error('Choose a current independently scoped Mission19 fixture.');
 if(item.sourceIndex!==null)return mission16Fixture(item.sourceIndex);
 const businessId='19191919-1919-4191-8191-000000000004',ownerId='19191919-1919-4191-8191-000000000104';
 const profile={businessName:'Yard & Thread',businessType:'Courtyard & container gardening',tagline:'Small space. More possibility.',description:'Container planting, courtyard planning and seasonal refreshes for small outdoor spaces in Bristol.',about:'A small outdoor space can hold a useful part of everyday life. We start with the courtyard, balcony or collection of pots you already have and the way you want to use it.\n\nThe first conversation covers light, access, existing plants and containers, and the care you would like to take on. From there we can discuss a practical scope together.',serviceArea:'Bristol',email:'hello@yard-thread.example.invalid',services:[
  {id:'service-0',name:'Container planting',description:'Planting conversations shaped around your pots, available light and the care you want to provide.\n\nTell us which containers you have, what you enjoy growing and how you use the space before a planting scope is agreed.'},
  {id:'service-1',name:'Courtyard planning',description:'A considered starting point for a small courtyard or balcony, with attention to movement, planting and everyday use.\n\nWe discuss the existing space, access and the parts you want to keep before exploring a practical arrangement.'},
  {id:'service-2',name:'Seasonal refresh',description:'A focused look at containers and small planting areas when you want a change through the seasons.\n\nShare what is already growing and which parts of the space you would like to refresh. Any work and timing are agreed separately.'}
 ],heroAsset:null,photos:[]};
 let website=buildWebsiteDraft({businessId,brandBrain:{websiteBrief:profile}});
 const action=applyStructuredWebsiteEdit(website,{sectionId:'hero',field:'cta',value:'Talk about your space'});if(!action.applied)throw Error(action.reason);website=action.draft;
 return {website,businessId,ownerId,profileRevision:1,goal:'I run a courtyard and container gardening business in Bristol. Prepare a useful, individual complete website for a private review.',profile,sourcePhotos:[],synthetic:true};
}
