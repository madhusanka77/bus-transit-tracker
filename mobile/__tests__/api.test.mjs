import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../netlify/lib/transit-handler.mjs';

function setup({ conflict = false, failure = false } = {}) {
  let state = null;
  let version = 0;
  const store = {
    get: async () => { if (failure) throw new Error('unavailable'); return state; },
    getWithMetadata: async () => state ? {data:state,etag:String(version)} : null,
    setJSON: async (_key, data, condition) => {
      if (conflict) { conflict = false; version++; state = { history: [{latitude:1}], position:null }; return {modified:false}; }
      if (condition.onlyIfMatch && condition.onlyIfMatch !== String(version)) return {modified:false};
      state = data; version++; return {modified:true,etag:String(version)};
    },
  };
  return createHandler(() => store);
}
const request = (path, data) => new Request('https://test.example/api/' + path, data === undefined ? {} :
  {method:'POST',body:JSON.stringify(data)});
const fix = {busId:'BUS-01',route:'177',latitude:6.933,longitude:79.984,speed:5,heading:90};

test('publishes a GPS fix, retrieves it, and keeps its timestamp across polls', async () => {
  const handler = setup();
  assert.deepEqual(await (await handler(request('location'))).json(), {position:null});
  const published = await (await handler(request('location',fix))).json();
  const read = await (await handler(request('location'))).json();
  assert.deepEqual(read,published);
  assert.equal(read.position.latitude,fix.latitude);
  assert.equal((await (await handler(request('history?limit=1'))).json()).length,1);
});
test('rejects invalid coordinates, bus IDs, JSON, methods and history limits', async () => {
  const handler = setup();
  for (const bad of [{...fix,latitude:91},{...fix,latitude:null},{...fix,busId:'other'}]) {
    assert.equal((await handler(request('location',bad))).status,400);
  }
  assert.equal((await handler(new Request('https://test.example/api/location',{method:'POST',body:'bad'}))).status,400);
  assert.equal((await handler(new Request('https://test.example/api/location',{method:'DELETE'}))).status,405);
  assert.equal((await handler(request('history?limit=0'))).status,400);
});
test('retries a concurrent write without discarding the other history record', async () => {
  const handler=setup({conflict:true});
  assert.equal((await handler(request('location',fix))).status,200);
  assert.equal((await (await handler(request('history'))).json()).length,2);
});
test('reports storage failure and supports Android/browser preflight', async () => {
  const handler=setup({failure:true});
  assert.equal((await handler(request('location'))).status,503);
  const preflight=await handler(new Request('https://test.example/api/location',{method:'OPTIONS'}));
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'*');
});

