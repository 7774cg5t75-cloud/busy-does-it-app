import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const site='sites/busy-headquarters/';
const read=(path)=>readFileSync(site+path,'utf8');
const home=read('index.html');
const privacy=read('privacy.html');
const sample=read('showcase/index.html');

test('coming-soon branding and canonical host are correct',()=>{
  assert.match(home,/BUSY DOES IT — COMING SOON/);
  assert.match(home,/rel="canonical" href="https:\/\/busydoesit\.co\.uk\/"/);
  assert.match(home,/rel="icon" href="assets\/busy-orb\.svg"/);
  assert.match(home,/property="og:title"/);
  assert.match(home,/property="og:description"/);
  assert.match(home,/property="og:url" content="https:\/\/busydoesit\.co\.uk\/"/);
  assert.match(home,/© Busy Does It · Coming soon/);
});
test('launch code remains in review and does not accidentally collect data',()=>{
  assert.match(home,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(home,/SUBSCRIPTIONS ARE NOT OPEN/);
});
test('early contact uses actual authorised business address',()=>{
  assert.match(home,/mailto:hello@busydoesit\.co\.uk/);
  assert.doesNotMatch(home,/<form\b/);
  assert.doesNotMatch(home,/marketing-intake\.js" defer/);
  assert.match(home,/An email does not create an account or a confirmed place on a waiting list/);
});
test('privacy is explicitly UNAPPROVED and fictional demo remains disclosed',()=>{
  assert.match(privacy,/PRIVACY NOTICE DRAFT — NOT APPROVED FOR PUBLIC LAUNCH/);
  assert.match(sample,/FICTIONAL BUSINESS/);
  assert.match(sample,/<meta name="robots" content="noindex,nofollow">/);
});
