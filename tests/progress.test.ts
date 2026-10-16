import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, writeProgress, progressKey, type Progress } from '../src/progress.ts';

const score = {flips:3,hits:0,cars:0,trolleys:0,cones:0};
const progress: Progress = {version:1,levelIndex:1,receipt:false,rounds:[score],best:[score,null,null,null,null,null,null]};

test('progress survives refresh at the next level, completed receipt, and selected retry', () => {
  const data = new Map();
  const storage = {getItem:key=>data.get(key) ?? null,setItem:(key,value)=>data.set(key,value)};
  assert.equal(writeProgress(storage,progress),true);
  assert.deepEqual(readProgress(storage,7),progress);
  const completed: Progress = {...progress,levelIndex:6,receipt:true,rounds:Array(7).fill(score),best:Array(7).fill(score)};
  writeProgress(storage,completed);
  assert.deepEqual(readProgress(storage,7),completed);
  const retry = {...completed,levelIndex:2,receipt:false};
  writeProgress(storage,retry);
  assert.deepEqual(readProgress(storage,7),retry);
  const freshRun = {...completed,levelIndex:0,receipt:false,rounds:[]};
  writeProgress(storage,freshRun);
  assert.deepEqual(readProgress(storage,7),freshRun);
});

test('invalid, outdated, and incomplete saves cannot unlock missing levels', () => {
  for (const value of [null,'bad json',JSON.stringify({...progress,version:2}),JSON.stringify({...progress,levelIndex:7}),
    JSON.stringify({...progress,levelIndex:3}),JSON.stringify({...progress,receipt:true}),
    JSON.stringify({...progress,rounds:[{...score,flips:-1}]}),JSON.stringify({...progress,best:[]}),
    JSON.stringify({...progress,rounds:[null]}),JSON.stringify({...progress,rounds:[{...score,hits:1.2}]})]) {
    assert.equal(readProgress({getItem:()=>value},7),null);
  }
  assert.equal(readProgress({getItem:()=>JSON.stringify(progress)},6),null);
});

test('blocked storage and quota failures do not interrupt play', () => {
  assert.equal(readProgress({getItem(){throw new Error('blocked');}},7),null);
  assert.equal(writeProgress({setItem(){throw new Error('quota');}},progress),false);
  assert.equal(progressKey,'flip-my-ride-progress-v1');
});

test('startup restores completed receipts and resumes selected retries without new completions', async () => {
  const fs = await import('node:fs');
  const vm = await import('node:vm');
  const {default:ts} = await import('typescript');
  const source = fs.readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
  const startup = source.slice(source.indexOf('let restored = null;'),source.indexOf('let last = performance.now();'));
  for (const receipt of [true,false]) {
    const saved = {...progress,levelIndex:2,receipt,rounds:Array(7).fill(score),best:Array(7).fill(score)};
    let shown = false;
    const context = vm.createContext({readProgress,localStorage:{getItem:()=>JSON.stringify(saved)},levels:Array(7),roundScores:[],bestScores:Array(7).fill(null),
      levelIndex:0,gameCompleted:false,gameStarted:false,won:false,flips:0,hits:0,flipsLabel:{textContent:''},
      position:{copy(){}},target:{},pivot:{position:{copy(){return {y:0};}}},reset(){},showReceipt(){shown=true;}});
    vm.runInContext(ts.transpile(startup),context);
    assert.equal(context.levelIndex,2);
    assert.equal(context.gameCompleted,true);
    assert.equal(context.roundScores.length,7);
    assert.equal(shown,receipt);
    assert.equal(context.won,receipt);
    assert.equal(context.flips,receipt?3:0);
  }
});
