"use client";

/* =============================================================================
   Trophy Hero - REAL 3D (three.js), scroll-SCRUBBED (not autoplay).
   A dimensional Green Cup, lathe-revolved from a bespoke chalice profile, is
   driven entirely by scroll progress within a sticky-pinned section. One
   deterministic timeline expressed as a pure function of progress p ∈ [0,1]:

     0.00–0.30  rotate   - the assembled cup turns on Y (+ slight X tilt); gold
                           catches the key/rim light as it spins. Scroll up = spin
                           back (fully reversible).
     0.30–0.65  dismantle- base tiers, stem, knot, handles and the green sprig
                           separate as true 3D translations (with Z depth), inner
                           parts moving least, outer parts flying furthest.
     0.65–0.85  portal   - the empty cup bowl stays central; the camera dollies
                           forward + down through the rim into the interior; a
                           gold-white bloom overlay blooms as we cross the rim.
     0.85–1.00  reveal   - bloom recedes, canvas fades + pointer-events:none, and
                           the real podium DOM below takes over ("inside" the cup).

   Perf: no idle RAF - renders only on scroll/resize. Low poly, no realtime
   shadows (a soft baked ground blob instead), PMREM env map for PBR reflections,
   full dispose on unmount. Reduced-motion / low-power / no-WebGL are routed to the
   flat SVG hero by the parent decider; this component assumes 3D is warranted.
   ============================================================================ */

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { prefersReducedMotion } from "@/lib/intro";
import RibbonMedal from "@/components/ribbon-medal";
import { hasIntroPlayed, markIntroPlayed } from "@/lib/intro-film";

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

// Explosion vectors in local space (before the group's held tilt). Center of mass
// ≈ (0, 0.3, 0): the knot barely moves, the base tiers and handles fly furthest,
// and Z components give the blast real depth/parallax. [name]: {to:[x,y,z], spin:[x,y,z]}
const EXPLODE = {
  base2: { to: [0.15, -1.35, -0.65], spin: [0.5, 0.3, -0.4] },
  base1: { to: [-0.12, -1.0, 0.35], spin: [-0.4, -0.2, 0.3] },
  stem: { to: [0.18, -0.5, 0.28], spin: [0.3, 0.4, 0.2] },
  knot: { to: [0.0, -0.12, 0.3], spin: [0.2, 0.2, 0.2] },
  handleL: { to: [-1.7, 0.25, 0.85], spin: [0.6, -0.8, 1.1] },
  handleR: { to: [1.7, 0.25, -0.85], spin: [0.6, 0.8, -1.1] },
  sprig: { to: [0.1, 1.7, 0.45], spin: [-0.9, 0.5, 0.4] }
};

export default function TrophyHero3D({ top3 = [] }) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const flashRef = useRef(null);
  const podiumRef = useRef(null);
  const copyRef = useRef(null);

  // Centre-tallest DOM order: 2nd · 1st · 3rd.
  const ordered = [
    top3.find((e) => e.rank === 2),
    top3.find((e) => e.rank === 1),
    top3.find((e) => e.rank === 3)
  ].filter(Boolean);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return undefined;

    const reduce = prefersReducedMotion();

    // ── renderer / scene / camera ──────────────────────────────────────────
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return undefined; // no WebGL - parent should have caught this, but be safe
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
    const CAM_START = new THREE.Vector3(0, 0.4, 7.0);
    const CAM_LOOK_START = new THREE.Vector3(0, 0.3, 0);
    camera.position.copy(CAM_START);

    // Soft studio reflections so the metal actually reads (no HDR asset needed).
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    // ── lights: key + soft fill + rim ──────────────────────────────────────
    const key = new THREE.DirectionalLight(0xfff2d8, 2.3);
    key.position.set(3.2, 4.5, 3.0);
    scene.add(key);
    const fill = new THREE.HemisphereLight(0xf3efe6, 0x5b5140, 0.75);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xbfe3c8, 1.4);
    rim.position.set(-3.5, 1.5, -3.2);
    scene.add(rim);
    // A tight warm kicker low on the opposite side: separates the stem and base
    // tiers from the background and puts a second highlight on the handles.
    const kicker = new THREE.DirectionalLight(0xffe9bd, 1.15);
    kicker.position.set(-2.2, -1.6, 2.6);
    scene.add(kicker);

    // ── materials ──────────────────────────────────────────────────────────
    // Polished gold: low roughness + a strong environment gives real specular
    // travel across the curves, so the form reads as metal rather than flat colour.
    const gold = new THREE.MeshStandardMaterial({ color: 0xc79a4e, metalness: 1.0, roughness: 0.16, envMapIntensity: 1.55 });
    const goldDark = new THREE.MeshStandardMaterial({ color: 0x9a7a38, metalness: 1.0, roughness: 0.3, envMapIntensity: 1.25 });
    // Brighter, softer bloom for the rim bead and nameplate band - catches the key.
    const goldBright = new THREE.MeshStandardMaterial({ color: 0xe0b45f, metalness: 1.0, roughness: 0.12, envMapIntensity: 1.7 });
    const goldInner = new THREE.MeshStandardMaterial({ color: 0xcaa24a, metalness: 1.0, roughness: 0.4, side: THREE.BackSide, envMapIntensity: 0.9 });
    const green = new THREE.MeshStandardMaterial({ color: 0x3d6b4f, metalness: 0.1, roughness: 0.55, emissive: 0x1f3a2a, emissiveIntensity: 0.35 });

    // ── geometry ─────────────────────────────────────────────────────────────
    const trophy = new THREE.Group();
    trophy.scale.setScalar(0.82); // leave breathing room around the whole award
    trophy.position.y = 0.16; // sit slightly higher in frame (not hugging the bottom)
    scene.add(trophy);
    const parts = {};

    // Chalice bowl - a hollow lathe: up the outside, over the rim, down the inside.
    // Deliberate clean profile (wide flaring cup on a slim foot), not a stock trophy.
    const bowlProfile = [
      [0.05, -0.12], [0.5, -0.12], [0.62, -0.05], [0.7, 0.12], [0.78, 0.4],
      [0.88, 0.7], [0.95, 0.9], [0.985, 0.98], [1.0, 1.0], // outer wall up to the rim top
      [0.985, 1.015], [0.95, 1.02], [0.9, 0.99], // rounded lip rolling over the rim
      [0.85, 0.8], [0.74, 0.45], [0.62, 0.16], [0.5, 0.02], [0.06, 0.04] // inner wall down
    ].map(([x, y]) => new THREE.Vector2(x, y));
    // High segment count + welded seam so the revolve has no visible facets and no
    // hard seam line down the front where the lathe wraps (0 → 2π).
    let bowlGeo = new THREE.LatheGeometry(bowlProfile, 128);
    bowlGeo = mergeVertices(bowlGeo);
    bowlGeo.computeVertexNormals();
    const bowl = new THREE.Mesh(bowlGeo, gold);
    // second material pass for the interior so the cavity reads when we fly in
    const bowlInner = new THREE.Mesh(bowlGeo, goldInner);
    // Bead around the lip - a single bright specular line that defines the rim.
    const rimBead = new THREE.Mesh(new THREE.TorusGeometry(0.995, 0.022, 16, 160), goldBright);
    rimBead.rotation.x = Math.PI / 2;
    rimBead.position.y = 1.005;
    const cup = new THREE.Group();
    cup.add(bowl, bowlInner, rimBead);
    parts.cup = cup;
    trophy.add(cup);

    // Green sprig rising out of the cup - the "Green" in Green Cup. The stalk is
    // long enough to clear the rim (y ≈ 1.0) so it reads as a seedling growing out
    // of the trophy, not a bud stranded on the lip.
    const sprig = new THREE.Group();
    // Sized in geometry, not group scale - the dismantle overwrites .scale each
    // frame, so a scaled-down group would snap back to full size mid-film.
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.024, 1.14, 14), green);
    stalk.position.y = 0.68;
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.082, 20, 16), green);
    bud.scale.set(0.72, 1.5, 0.72);
    bud.position.y = 1.31;

    // Two leaves - flattened spheres, angled up and out from the stalk.
    const leafGeo = new THREE.SphereGeometry(0.082, 18, 14);
    const makeLeaf = (dir) => {
      const leaf = new THREE.Mesh(leafGeo, green);
      leaf.scale.set(1.5, 0.62, 0.2);      // long, thin blade
      leaf.position.set(dir * 0.1, 1.12, 0);
      leaf.rotation.z = dir * 0.62;         // sweep upward from the stem
      leaf.rotation.y = dir * 0.32;         // turn slightly out of plane
      return leaf;
    };
    sprig.add(stalk, bud, makeLeaf(-1), makeLeaf(1));
    parts.sprig = sprig;
    trophy.add(sprig);

    // Knot (joint bead) just under the bowl.
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 18), gold);
    knot.position.y = -0.2;
    parts.knot = knot;
    trophy.add(knot);

    // Stem - slim tapered column.
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.42, 20), gold);
    stem.position.y = -0.44;
    parts.stem = stem;
    trophy.add(stem);

    // Base tiers as chamfered lathes - the small 45° breaks at each edge catch the
    // key light as bright lines, which is what sells cast metal (a plain cylinder's
    // hard edge just goes dark).
    const tier = (pts, mat) => {
      let g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 72);
      g = mergeVertices(g);
      g.computeVertexNormals();
      return new THREE.Mesh(g, mat);
    };

    // Tier 1 (upper plinth): chamfered top and bottom.
    const base1 = tier(
      [[0, -0.08], [0.38, -0.08], [0.42, -0.045], [0.42, 0.04], [0.335, 0.08], [0, 0.08]],
      gold
    );
    base1.position.y = -0.72;
    parts.base1 = base1;
    trophy.add(base1);

    // Tier 2 (widest, bottom): a deeper skirt with a stepped foot.
    const base2 = tier(
      [[0, -0.085], [0.6, -0.085], [0.635, -0.05], [0.62, 0.015], [0.52, 0.06], [0.48, 0.085], [0, 0.085]],
      goldDark
    );
    base2.position.y = -0.9;
    parts.base2 = base2;
    trophy.add(base2);

    // Nameplate band around the upper plinth - a bright ring that reads as an
    // engraved collar and ties the base back to the rim bead.
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.425, 0.016, 14, 96), goldBright);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = -0.735;
    base1.add(collar);
    collar.position.y = -0.015; // local to base1, so it travels with the tier

    // Handles - swept C-curve "ears" (a tube along a spline), tapering where they
    // meet the bowl, so they read as cast loving-cup handles rather than flat rings.
    const handleCurve = new THREE.CatmullRomCurve3(
      [
        [-0.20, 0.335, 0], [0.075, 0.365, 0], [0.275, 0.235, 0], [0.335, 0.01, 0],
        [0.265, -0.215, 0], [0.055, -0.345, 0], [-0.20, -0.325, 0]
      ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      false,
      "catmullrom",
      0.4
    );
    const handleGeo = new THREE.TubeGeometry(handleCurve, 96, 0.05, 18, false);
    const handleL = new THREE.Mesh(handleGeo, gold);
    handleL.position.set(-0.79, 0.5, 0);
    // Mirrored by a half turn (the curve lives in the z = 0 plane), so the open
    // side always faces the bowl.
    handleL.rotation.y = Math.PI;
    parts.handleL = handleL;
    trophy.add(handleL);

    const handleR = new THREE.Mesh(handleGeo, gold);
    handleR.position.set(0.79, 0.5, 0);
    parts.handleR = handleR;
    trophy.add(handleR);

    // Soft fake ground shadow (a blurred radial sprite - no realtime shadow pass).
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext("2d");
    const grd = sctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    grd.addColorStop(0, "rgba(40,35,20,0.42)");
    grd.addColorStop(1, "rgba(40,35,20,0)");
    sctx.fillStyle = grd;
    sctx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 1.1),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.02;
    scene.add(shadow);

    // Record base transforms so the dismantle is a pure offset from rest.
    Object.values(parts).forEach((p) => {
      p.userData.basePos = p.position.clone();
      p.userData.baseRot = p.rotation.clone();
    });

    // ── podium overlay (emerges FROM the cup, scrubbed by the same progress) ──
    const podiumRoot = podiumRef.current;
    let champCol = null;
    let champSpot = null;
    let champNum = null;
    let champScore = 0;
    const wingData = [];
    if (podiumRoot) {
      champCol = podiumRoot.querySelector(".gcp__col--1");
      champSpot = podiumRoot.querySelector(".gcp__col--1 .gcp__spotlight");
      champNum = podiumRoot.querySelector(".gcp__col--1 [data-count]");
      champScore = champNum ? parseFloat(champNum.dataset.count) || 0 : 0;
      const champCentre = champCol ? champCol.offsetLeft + champCol.offsetWidth / 2 : 0;
      podiumRoot.querySelectorAll(".gcp__col").forEach((c) => { c.style.transformOrigin = "50% 100%"; });
      ["2", "3"].forEach((r) => {
        const el = podiumRoot.querySelector(`.gcp__col--${r}`);
        if (!el) return;
        const numEl = el.querySelector("[data-count]");
        wingData.push({
          el,
          numEl,
          score: numEl ? parseFloat(numEl.dataset.count) || 0 : 0,
          dx: champCentre - (el.offsetLeft + el.offsetWidth / 2)
        });
      });
    }

    // ── the scrubbed timeline: everything is a function of p ────────────────
    const tmpLook = new THREE.Vector3();
    const applyProgress = (p) => {
      // AUTOPLAY INTRO (plays like a video on every load):
      //   0.00-0.46  assemble - scattered parts fly IN and form the cup, which
      //              spins to rest (the dismantle, reversed).
      //   0.46-0.56  beat     - the finished cup holds.
      //   0.56-0.74  portal   - camera pushes into the bowl, bloom, canvas fades.
      //   0.74-1.00  podium   - #1 rises, then #2/#3 deal out; scores count up.
      const asm = smoothstep(0.0, 0.46, p); // 0 = fully scattered, 1 = assembled
      const dp = 1 - asm; // reuse the dismantle offsets, reversed
      const cp = smoothstep(0.56, 0.74, p); // camera push into the cup

      // 1 · the cup spins to rest as it assembles
      const spin = 1 - asm;
      trophy.rotation.y = spin * Math.PI * 1.35;
      trophy.rotation.x = spin * 0.22;

      // 2 · dismantle - offset every mover; the cup stays central (portal anchor).
      //     As the camera commits to the cup (cp), the flung parts shrink away.
      const partScale = Math.max(0.0001, 1 - cp);
      for (const [name, cfg] of Object.entries(EXPLODE)) {
        const part = parts[name];
        if (!part) continue;
        const bp = part.userData.basePos;
        const br = part.userData.baseRot;
        part.position.set(bp.x + cfg.to[0] * dp, bp.y + cfg.to[1] * dp, bp.z + cfg.to[2] * dp);
        part.rotation.set(br.x + cfg.spin[0] * dp, br.y + cfg.spin[1] * dp, br.z + cfg.spin[2] * dp);
        part.scale.setScalar(partScale);
      }
      parts.cup.position.set(0, 0, dp * 0.12);

      // 3 · portal - dolly the camera forward + down through the rim into the cup
      // End targets include the trophy's +0.34 lift so the push still lands inside the bowl.
      camera.position.set(lerp(CAM_START.x, 0.0, cp), lerp(CAM_START.y, 0.88, cp), lerp(CAM_START.z, 0.32, cp));
      tmpLook.set(lerp(CAM_LOOK_START.x, 0, cp), lerp(CAM_LOOK_START.y, 0.24, cp), lerp(CAM_LOOK_START.z, 0, cp));
      camera.lookAt(tmpLook);

      // 4 · bloom at the rim, then the cup canvas fades so the podium can rise out.
      const flashEl = flashRef.current;
      if (flashEl) {
        let f = 0;
        if (p > 0.60 && p <= 0.70) f = smoothstep(0.60, 0.70, p) * 0.96;
        else if (p > 0.70 && p <= 0.75) f = 0.96;
        else if (p > 0.75) f = 0.96 * (1 - smoothstep(0.75, 0.86, p));
        flashEl.style.opacity = f.toFixed(3);
      }
      canvas.style.opacity = (1 - smoothstep(0.68, 0.78, p)).toFixed(3);

      // 4b · the title stays fixed at the top (matching the standalone podium view).

      // 5 · THE PODIUM RISES OUT OF THE CUP - #1 first, then #2/#3 from behind #1,
      //     all scrubbed by the same scroll progress.
      const rev1 = smoothstep(0.74, 0.86, p); // #1 up from inside the cup
      const rev2 = smoothstep(0.86, 0.97, p); // #2 / #3 out from behind #1
      if (champCol) {
        champCol.style.opacity = rev1.toFixed(3);
        champCol.style.transform = `translateY(${((1 - rev1) * 165).toFixed(1)}px) scale(${(0.42 + rev1 * 0.58).toFixed(3)})`;
      }
      if (champSpot) champSpot.style.opacity = rev1.toFixed(3);
      wingData.forEach((w) => {
        w.el.style.opacity = rev2.toFixed(3);
        w.el.style.transform = `translateX(${(w.dx * (1 - rev2)).toFixed(1)}px) translateY(${((1 - rev2) * 30).toFixed(1)}px) scale(${(0.82 + rev2 * 0.18).toFixed(3)})`;
      });
      if (champNum) champNum.textContent = (champScore * smoothstep(0.76, 0.90, p)).toFixed(1);
      wingData.forEach((w) => { if (w.numEl) w.numEl.textContent = (w.score * smoothstep(0.88, 0.99, p)).toFixed(1); });
    };

    // ── sizing + render (only on demand) ───────────────────────────────────
    const size = () => {
      // Measure the CANVAS box, not the window. The canvas fills the hero section,
      // which is a full screen on desktop but deliberately shorter on phones - using
      // window.innerHeight there gives a taller buffer than the box it is drawn into
      // and squashes the cup vertically.
      const w = canvas.clientWidth || section.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || section.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    // ── autoplay: the intro runs like a video on every page load ────────────
    const DURATION = 5200; // ms for the whole assemble -> cup -> podium film
    let raf = 0;
    let startedAt = 0;
    let finished = false;
    let safetyTimer = 0;

    const finish = () => {
      finished = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      applyProgress(1);
      renderer.render(scene, camera);
    };

    const frame = (now) => {
      if (!startedAt) startedAt = now;
      const t = Math.min(1, (now - startedAt) / DURATION);
      applyProgress(t);
      renderer.render(scene, camera);
      if (t < 1) raf = requestAnimationFrame(frame);
      else finish();
    };

    const onResize = () => {
      size();
      if (finished) {
        applyProgress(1);
        renderer.render(scene, camera);
      }
    };
    window.addEventListener("resize", onResize);

    size();

    if (reduce || hasIntroPlayed()) {
      // Reduced motion, or the film already played on this page load (returning
      // from another tab): land straight on the finished podium.
      finish();
    } else {
      markIntroPlayed(); // claim it now, so a mid-film tab switch can not replay it
      applyProgress(0); // scattered parts, before the first frame paints
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
      // Safety net: if the ticker is ever throttled (backgrounded tab), make sure
      // the page still ends up in its finished state rather than mid-film.
      safetyTimer = window.setTimeout(() => { if (!finished) finish(); }, DURATION + 2500);
    }

    // ── teardown ────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(safetyTimer);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((mm) => mm.dispose());
        }
      });
      shadowTex.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section className="tphero tphero3d" ref={sectionRef} aria-label="The Green Cup">
      <div className="tphero__sticky">
        <canvas className="tphero3d__canvas" ref={canvasRef} aria-hidden="true" />
        <div className="tphero3d__flash" ref={flashRef} aria-hidden="true" />

        <div className="tphero3d__podium" ref={podiumRef} aria-label="Top three hostels">
          <ol className="gcp__stage">
            {ordered.map((hostel) => (
              <li key={hostel.hostelId} className={`gcp__col gcp__col--${hostel.rank}`} data-rank={hostel.rank}>
                {hostel.rank === 1 ? <span className="gcp__spotlight" aria-hidden="true" /> : null}
                <article className="gcp__card">
                  <span className="gcp__seal">
                    <RibbonMedal rank={hostel.rank} size={hostel.rank === 1 ? 72 : 62} />
                  </span>
                  <p className="gcp__name">{hostel.name}</p>
                  <p className="gcp__score">
                    <span className="gcp__num" data-count={hostel.totalScore}>0.0</span>
                    <span className="gcp__unit">pts</span>
                  </p>
                </article>
                <div className="gcp__stand">
                  <span className="gcp__stand-num">{hostel.rank}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="tphero__copy" ref={copyRef}>
          <h1 className="tphero__title">
            The <em>Green Cup</em> Leaderboard
          </h1>
        </div>
      </div>
    </section>
  );
}
