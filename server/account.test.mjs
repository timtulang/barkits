import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { createApi } from './api.mjs';
const origin='https://barkits.example';
const token='a'.repeat(43);
const digest=createHash('sha256').update(token).digest('hex');
function fixture(failure) {
  const calls=[];
  const handle=createApi({origin,signingKey:'test-only',clientId:'test',googleClient:{},vercel:true,
    sql:{async query(query,params){
      if(query.includes('consume_ip_quota'))return [{retry_after:0}];
      if(query.includes('consume_account_quota')){if(params[0]!==digest)throw Object.assign(new Error('Expired'),{code:'28000'});return [{retry_after:0}];}
      calls.push({query,params});if(failure)throw failure;return [{value:{revision:1}}];
    }}});
  const request=(path,body,headers={})=>handle(new Request(origin+path,{method:body===undefined?'GET':'POST',
    headers:{Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json','x-vercel-forwarded-for':'192.0.2.10',...headers},
    body:body===undefined?undefined:JSON.stringify(body)}));
  return {calls,request};
}
test('settings bind the session and use parameterized authorized SQL',async()=>{
  const f=fixture();assert.equal((await f.request('/api/account/settings')).status,200);
  const body={revision:0,biography:"O'Brien"};
  const response=await f.request('/api/account/settings',body);assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(f.calls[1],{query:'select barkits.save_account_settings($1,$2,$3::jsonb) as value',params:[digest,0,JSON.stringify(body)]});
  for(const invalid of [null,[],{}, {revision:-1},{revision:0.5}])assert.equal((await f.request('/api/account/settings',invalid)).status,400);
});
test('account settings reject expired identities, foreign origins and persistence failures',async()=>{
  const f=fixture();assert.equal((await f.request('/api/account/settings',undefined,{Authorization:''})).status,401);
  assert.equal((await f.request('/api/account/settings',{revision:0},{Origin:'https://evil.example'})).status,403);
  assert.equal(f.calls.length,0);
  for(const [code,status] of [['P0001',409],['22023',400],[undefined,503]]){
    assert.equal((await fixture(Object.assign(new Error('Failure'),{code})).request('/api/account/settings',{revision:0})).status,status);
  }
});

test('security actions require the acting session and explicit deletion confirmation',async()=>{
  const f=fixture();assert.equal((await f.request('/api/account/security')).status,200);
  assert.deepEqual(f.calls[0],{query:'select barkits.own_account_security($1) as value',params:[digest]});
  assert.equal((await f.request('/api/account/revoke-others',{})).status,200);
  assert.equal((await f.request('/api/account/revoke-others',[])).status,400);
  assert.equal((await f.request('/api/account/revoke-others',{user_id:'victim'})).status,400);
  const body={confirmation:'DELETE',revision:'1'.repeat(64),successors:{}};
  const response=await f.request('/api/account/delete',body);assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{deleted:true});assert.ok(response.headers.get('set-cookie').includes('Max-Age=0'));
  assert.deepEqual(f.calls.at(-1),{query:'select barkits.delete_own_account($1,$2,$3::jsonb)',params:[digest,body.revision,'{}']});
  for(const invalid of [{...body,confirmation:'delete'},{...body,revision:'stale'},{...body,successors:[]},{...body,id:'victim'}])assert.equal((await f.request('/api/account/delete',invalid)).status,400);
  assert.equal((await fixture(new Error('Unavailable')).request('/api/account/delete',body)).status,503);
});

test('dashboard validates pagination and binds the acting identity',async()=>{
  const f=fixture();assert.equal((await f.request('/api/account/dashboard?past=true&offset=50')).status,200);
  assert.deepEqual(f.calls[0],{query:'select barkits.account_dashboard($1,$2,$3) as value',params:[digest,true,50]});
  for(const query of ['offset=-1','offset=1','offset=100050','past=maybe','user_id=victim'])assert.equal((await f.request('/api/account/dashboard?'+query)).status,400);
});

test('dashboard accepts Vercel rewrites while preserving pagination validation',async()=>{
  for(const path of ['/api/entry','/api/account/dashboard']){
    const f=fixture();
    const entry=path+'?__barkits_route=account/dashboard';
    assert.equal((await f.request(entry+'&past=false&offset=0')).status,200);
    assert.deepEqual(f.calls[0],{query:'select barkits.account_dashboard($1,$2,$3) as value',params:[digest,false,0]});
    assert.equal((await f.request(entry+'&past=true&offset=50')).status,200);
    assert.deepEqual(f.calls[1].params,[digest,true,50]);
    for(const query of ['offset=1','past=maybe','user_id=victim'])assert.equal((await f.request(entry+'&'+query)).status,400);
    assert.equal((await f.request(entry+'&__barkits_route='+'x'.repeat(8192))).status,414);
    assert.equal(f.calls.length,2);
  }
});
