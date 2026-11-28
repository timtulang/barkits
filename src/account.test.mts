import assert from 'node:assert/strict';
import { test } from 'node:test';
import { settingsProblem, type AccountSettings } from './account-settings.ts';
const settings:AccountSettings={username:'kits_test',biography:'Hello 🥭',avatar:'map-pin',mode:null,budget:null,max_minutes:null,category:'All',recap_audience:'private',reminders:true,revision:0};
test('account preferences validate identifiers, Unicode text, fares and duration',()=>{
  assert.equal(settingsProblem(settings),undefined);
  for(const invalid of [{username:'A B'},{username:'ab'},{biography:'x\ny'},{biography:'🥭'.repeat(501)},{budget:NaN},{budget:-1},{budget:1.234},{max_minutes:0},{max_minutes:1441},{max_minutes:1.5}])assert.ok(settingsProblem({...settings,...invalid}));
  assert.equal(settingsProblem({...settings,biography:'🥭'.repeat(500),budget:0,max_minutes:1440}),undefined);
});

import { localReturnPath, sharedReturnId } from './session-recovery.ts';
import { listenForSessionExpiration, sessionExpired, sessionGeneration, sessionRestored } from './services/session-events.ts';
test('session recovery accepts only local meetup paths and rejects external redirects',()=>{
  assert.equal(localReturnPath('/meetups/local-123'),'/meetups/local-123');
  for(const path of ['https://evil.example','//evil.example','/meetups/../evil','/meetups/x?redirect=evil','/meetups/x/extra'])assert.equal(localReturnPath(path),null);
  assert.equal(sharedReturnId('11111111-1111-4111-8111-111111111111'),'11111111-1111-4111-8111-111111111111');
  assert.equal(sharedReturnId('arbitrary'),undefined);
});
test('a late expired request cannot invalidate a recovered session',()=>{
  let expired=0;const stop=listenForSessionExpiration(()=>expired++);const old=sessionGeneration();sessionRestored();
  assert.equal(sessionExpired(old),false);assert.equal(expired,0);assert.equal(sessionExpired(),true);assert.equal(expired,1);stop();
  sessionExpired();assert.equal(expired,1);
});
