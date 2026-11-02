import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root='sites/busy-headquarters/';
const home=readFileSync(root+'index.html','utf8');
const sample=readFileSync(root+'showcase/index.html','utf8');
const scripts=readFileSync(root+'marketing-intake.js','utf8');

test('Busy headline and approved product identity remain intact',()=>{
  assert.match(home,/Build a website\.<br><span class="gradient-text">Create your own app\.<\/span><br>Run your business\./);
  assert.match(home,/Busy Does It — the team behind your one-person business\./);
  assert.match(home,/You tell Busy\.<br><span class="gradient-text">Busy does it\.<\/span>/);
  assert.match(home,/Built for small-business owners\.<br><span class="gradient-text">By a small-business owner\./);
});
test('Marketing copy is natural and accurate for a not-yet-launched product',()=>{
  assert.match(home,/One easy-to-use AI assistant/);
  assert.match(home,/Have an idea for an app\?/);
  assert.match(home,/Need more work\?/);
  assert.match(home,/That's one of the main things we're building\./);
  assert.match(home,/subscriptions aren't open yet/);
  assert.match(home,/Not open yet/);
  assert.doesNotMatch(home,/Yes, that's a major part of our vision/);
});
test('Gated early access and email fallback still describe truthful actions',()=>{
  assert.match(home,/id="busy-early-access-form" hidden/);
  assert.match(home,/id="busy-interest-intro"/);
  assert.match(home,/id="busy-interest-note"/);
  assert.match(home,/mailto:hello@busydoesit.co.uk/);
  assert.match(scripts,/if\(!config\?\.enabled\|\|!config\.siteKey\)return/);
  assert.match(scripts,/intro\.textContent='Interested in trying Busy/);
  assert.match(scripts,/note\.textContent='A confirmation email is required/);
});
test('ClearFlow retains fictional provenance and a richer, distinct palette',()=>{
  assert.match(sample,/A BUSY DOES IT DESIGN SHOWCASE/);
  assert.match(sample,/FICTIONAL BUSINESS/);
  assert.match(sample,/no messages, bookings or payments are taken/i);
  assert.match(sample,/This is not an actual cleaning transformation or evidence of work/);
  assert.match(sample,/Did Busy’s current Website Builder generate this exact site\?/);
  assert.match(sample,/No\. This is a bespoke marketing concept/);
  assert.doesNotMatch(sample,/curb appeal/);
  assert.match(sample,/\.service:nth-child\(3n\+2\)/);
  assert.match(sample,/\.process-item:nth-child\(2\)/);
  assert.match(sample,/\.hero:before/);
  assert.match(sample,/\.faq-list details\[open\]/);
  assert.match(sample,/@media\(max-width:480px\)/);
  assert.match(sample,/@media\(prefers-reduced-motion:reduce\)/);
});
