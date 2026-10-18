import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const startup = source.slice(source.indexOf('let renderer: THREE.WebGLRenderer;'), source.indexOf('renderer.setPixelRatio('));

function startRenderer(failures) {
  const attempts = [], canvases = [], events = [];
  const errorScreen = {hidden: true};
  const reload = {addEventListener() {}};
  const context = vm.createContext({
    Error,
    THREE: {WebGLRenderer: class {
      constructor(options) {
        attempts.push(options);
        if (attempts.length <= failures) {
          options.canvas.listeners.webglcontextcreationerror({statusMessage: `failure ${attempts.length}`});
          throw new Error(`renderer failure ${attempts.length}`);
        }
      }
    }},
    document: {
      createElement() {
        const canvas = {listeners: {}, addEventListener(name, handler) {this.listeners[name] = handler;}, removeEventListener(name) {delete this.listeners[name];}};
        canvases.push(canvas);
        return canvas;
      },
      querySelector(selector) {return selector === '#error' ? errorScreen : reload;},
    },
    trackEvent(name, data) {events.push({name, data});},
  });
  let error;
  try {vm.runInContext(ts.transpile(startup), context);} catch (caught) {error = caught;}
  return {attempts, canvases, events, errorScreen, error};
}

test('renderer starts with antialiasing and does not retry on success', () => {
  const result = startRenderer(0);
  assert.deepEqual(result.attempts.map(attempt => attempt.antialias), [true]);
  assert.equal(result.error, undefined);
  assert.equal(result.errorScreen.hidden, true);
  assert.equal(result.events.length, 0);
});

test('renderer retries once without antialiasing on a fresh canvas', () => {
  const result = startRenderer(1);
  assert.deepEqual(result.attempts.map(attempt => attempt.antialias), [true, false]);
  assert.notEqual(result.attempts[0].canvas, result.attempts[1].canvas);
  assert.equal(result.error, undefined);
  assert.equal(result.errorScreen.hidden, true);
  assert.equal(result.events.length, 0);
});

test('renderer shows and reports the final failure after both attempts fail', () => {
  const result = startRenderer(2);
  assert.deepEqual(result.attempts.map(attempt => attempt.antialias), [true, false]);
  assert.equal(result.errorScreen.hidden, false);
  assert.equal(result.error.message, 'renderer failure 2');
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].name, 'game_error');
  assert.equal(result.events[0].data.context_message, 'failure 2');
  assert.equal(result.events[0].data.error_message, 'renderer failure 2');
});
