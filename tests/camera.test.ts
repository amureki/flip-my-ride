import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import * as THREE from "three";

const source = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const resize = ts.transpile(source.slice(source.indexOf("function resize()"), source.indexOf("new ResizeObserver(resize)")));

test("mobile framing contains the playable lot in portrait and landscape", () => {
  for (const [width, height] of [[393, 500], [393, 350], [652, 285], [320, 280]]) {
    const camera = new THREE.OrthographicCamera();
    const messageStyles = new Map([["left", "100px"], ["top", "100px"], ["width", "400px"]]);
    vm.runInNewContext(resize + "resize()", {
      camera,
      message: { style: { removeProperty(name) { messageStyles.delete(name); } } },
      mobileControls: { matches: true },
      stage: { getBoundingClientRect: () => ({ width, height }) },
      renderer: { setSize() {} },
    });
    assert.equal(messageStyles.size, 0, "Mobile must clear desktop message placement");
    for (const x of [-8.5, 8.5]) {
      for (const z of [-7, 7]) {
        const point = new THREE.Vector3(x, 0, z).project(camera);
        assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, `${width}×${height}: lot corner is cropped`);
      }
    }
    if (width < height) {
      assert.ok(23.6 / (camera.right - camera.left) > 1.06, "Portrait framing must remain closer than the original view");
    }
    assert.deepEqual(camera.position.toArray(), [14, 20, 22], "Mobile must retain the original diagonal view");
  }
});
