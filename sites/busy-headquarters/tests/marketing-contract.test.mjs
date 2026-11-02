import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root='sites/busy-headquarters/';
const read=(p)=>readFileSync(root+p,'utf8');
const helperSource=read('functions/api/_shared.js');
const helpers=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(helperSource));
const full={
  MARKETING_FORMS_ENABLED:'1',MARKETING_PRIVACY_APPROVED:'1',
  MARKETING_WAF_APPROVED:'1',MARKETING_RETENTION_APPROVED:'1',
  MARKETING_ALLOWED_HOSTS:'busydoesit.co.uk',
  MARKETING_PUBLIC_ORIGIN:'https://busydoesit.co.uk',
  TURNSTILE_SITE_KEY:'test_key',TURNSTILE_SECRET:'test_secret',
  MARKETING_RATE_KV:{},MARKETING_IP_PEPPER:'pepper',
  SUPABASE_URL:'https://example.supabase.co',
  SUPABASE_SECRET_KEY:'sb_secret_test_key',
  RESEND_API_KEY:'test_secret',
  MARKETING_FROM:'Busy Does It <updates@notify.busydoesit.co.uk>'
};
test('forms are disabled by default, and cannot activate without privacy approval',()=>{
  assert.equal(helpers.ready({},'busydoesit.co.uk'),false);
  assert.equal(helpers.ready({...full,MARKETING_FORMS_ENABLED:'0'},'busydoesit.co.uk'),false);
  assert.equal(helpers.ready({...full,MARKETING_PRIVACY_APPROVED:'0'},'busydoesit.co.uk'),false);
  assert.equal(helpers.ready({...full,MARKETING_WAF_APPROVED:'0'},'busydoesit.co.uk'),false);
  assert.equal(helpers.ready({...full,MARKETING_RETENTION_APPROVED:'0'},'busydoesit.co.uk'),false);
  assert.equal(helpers.ready({...full,TURNSTILE_SECRET:''},'busydoesit.co.uk'),false);
  assert.equal(helpers.ready({...full,MARKETING_RATE_KV:null},'busydoesit.co.uk'),false);
  assert.equal(helpers.ready(full,'attacker.example'),false);
  assert.equal(helpers.ready(full,'busydoesit.co.uk'),true);
});
test('input bounds and message validation are fail closed',()=>{
  assert.equal(helpers.emailValid('hello@example.co.uk'),true);
  assert.equal(helpers.emailValid('not-an-address'),false);
  assert.equal(helpers.emailValid('a'.repeat(255)+'@x.com'),false);
  assert.equal(helpers.clean('  hello  ',20),'hello');
});
test('UI and API do not pretend disabled capture is a functioning signup',()=>{
  const html=read('index.html'),js=read('marketing-intake.js'),privacy=read('privacy.html');
  assert.doesNotMatch(html,/<form\b/);
  assert.doesNotMatch(html,/<script src="marketing-intake\.js"/);
  assert.match(html,/Not open yet/);
  assert.match(html,/hello@busydoesit\.co\.uk/);
  assert.match(js,/if\(!config\?\.enabled\|\|!config\.siteKey\)return/);
  assert.match(js,/Please press Send there/);
  assert.match(privacy,/approved/);
  assert.doesNotMatch(html,/SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|TURNSTILE_SECRET/);
});
test('schema disables anonymous access and confirms only via explicit POST',()=>{
  const sql=read('schema/marketing_waitlist.sql'),confirm=read('functions/api/confirm.js');
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/revoke all on public\.busy_marketing_waitlist from public, anon, authenticated/i);
  assert.match(confirm,/onRequestPost/);
  assert.match(confirm,/Do not confirm on GET/);
});
