import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";

const source = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const resize = source.slice(source.indexOf("function resize()"), source.indexOf("new ResizeObserver(resize)"));

test("mobile framing contains the playable lot in portrait and landscape", () => {
  for (const [width, height] of [[393, 500], [393, 350], [652, 285], [320, 280]]) {
    const camera = new THREE.OrthographicCamera();
    vm.runInNewContext(resize + "resize()", {
      camera,
      mobileControls: { matches: true },
      stage: { getBoundingClientRect: () => ({ width, height }) },
      renderer: { setSize() {} },
    });
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
