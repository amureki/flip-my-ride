import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { levels } from '../src/levels.ts';
import { meetsCleanPar, runTotal } from '../src/receipt.ts';

const source = fs.readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');

test('receipt retry selects any lot without discarding scores; Play again clears the run', () => {
  const buttons = [];
  const roundScores = levels.map(() => ({flips:4,hits:0,cars:0,trolleys:0,cones:0}));
  const saved = structuredClone(roundScores);
  const element = () => ({append() {}, setAttribute() {}, addEventListener(_event, handler) {this.click = handler;}});
  const table = {hidden:true, tBodies:[{replaceChildren() {}, insertRow() {return {append() {}, insertCell:element};}}]};
  const context = vm.createContext({levels,roundScores,meetsCleanPar,runTotal,final:true,gameCompleted:true,gameStarted:true,won:true,levelIndex:6,
    document:{querySelector:()=>table,createElement(tag) {const node=element();if(tag==='button')buttons.push(node);return node;}},
    stage:{focus() {}},reset(reason) {context.resetReason=reason;},nextButton:element(),
    shareContent:(_url,score)=>score,location:{href:'http://localhost/'}});
  vm.runInContext(ts.transpile(source.slice(source.indexOf('    const breakdown ='),source.indexOf('    const cleanPars ='))),context);
  assert.equal(buttons.length,7);
  buttons[1].click();
  assert.equal(context.levelIndex,1);
  assert.equal(context.resetReason,'next');
  assert.equal(context.gameCompleted,true);
  assert.deepEqual(roundScores,saved);
  const share = source.slice(source.indexOf('function currentShareContent()'),source.indexOf('function updateShareLinks()'));
  vm.runInContext(ts.transpile(share),context);
  assert.equal(vm.runInContext('currentShareContent().completedLots',context),7);
  const next = source.slice(source.indexOf('nextButton.addEventListener("click"'),source.indexOf('function currentShareContent()'));
  vm.runInContext(ts.transpile(next),context);
  context.nextButton.click();
  assert.equal(context.levelIndex,0);
  assert.equal(context.gameCompleted,false);
  assert.equal(context.gameStarted,false);
  assert.equal(roundScores.length,0);
});
