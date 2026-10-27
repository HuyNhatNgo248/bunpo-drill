/**
 * Tabs: a closed grammar notebook on a desk, a pencil lying on its cover, and
 * a sticky index tab for each of its six weeks along the fore-edge. The tab
 * under the pointer slides out and its neighbours follow a little less,
 * staggered outwards from it. Each tab carries its week as dots; the week goes
 * to the read-out. The slider is how far a tab pulls, in world units.
 *
 * The pattern: discrete items. Tweens, a stagger by distance, identity carried
 * by dots, and a hit test on the ground under the resting tabs, so a tab sliding
 * out from under the pointer cannot flip the choice.
 */
const { Cam, fit, proj, unproj, facing, rings, prism, ringAt, run, hull, poly, open, seg, rrect, clamp, rad, tween, tset, tval, tdone, mk, solid, put, place, register, pointer, disposer } = HL;

const NW = 106, NL = 150, PH = 10, CT = 1.4, ZC = PH + CT, FACE = NW - 1.6;
const N = 6, YC = [24, 45, 66, 87, 108, 129], TWD = 15, TT = 0.7;
const TZ = [3, 6.4, 4.2, 7.6, 3.6, 5.8], REST = [12, 15, 19, 13, 16, 12], LEAD = 2;
const FALL = [1, 0.6, 0.3, 0.12], STEP = 45, PULL_MAX = 46;
const PX = 74, PR = 3.2, PZ = ZC + PR;

/** A cross-section of the pencil, in the x-z plane at y: n points round its axis, of radius r. */
const section = (P, y, r, n, from = 0, to = 360) => {
  const pts = [];
  for (let k = 0; ; k++) {
    const t = from + (k * 360) / n;
    if (t > to + 1e-6) break;
    pts.push(P(PX + r * Math.cos(rad(t)), y, PZ + r * Math.sin(rad(t))));
  }
  return pts;
};

/** The pencil, eraser end first (the far end) so its near parts cover it: [d, class] pairs. */
function pencil(P) {
  const tube = (y0, y1, r, n) => poly(hull(section(P, y0, r, n).concat(section(P, y1, r, n))));
  const edge = (t) => seg(P(PX + PR * Math.cos(rad(t)), 30, PZ + PR * Math.sin(rad(t))), P(PX + PR * Math.cos(rad(t)), 114, PZ + PR * Math.sin(rad(t))));
  return [
    [tube(18, 24, PR * 0.92, 12), "sil"], // the eraser
    [tube(24, 30, PR * 1.04, 12), "sil"], // the metal band that holds it
    [open(section(P, 27, PR * 1.04, 12, -60, 120)), "nf lo"],
    [tube(30, 114, PR, 6), "sil"], // the six-sided body
    [edge(0) + edge(60), "nf lo"], // two of its facet edges
    [poly(hull(section(P, 114, PR, 6).concat([P(PX, 128, PZ)]))), "sil"], // the sharpened end
    [open(section(P, 114, PR, 6, -60, 120)), "nf lo"], // where the paint stops
    [open(section(P, 124, PR * 0.29, 6, -60, 120)), "nf lo"], // where the wood gives way to the lead
  ];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let pull = value;

  // The camera is fitted with every tab pulled to the slider's far end, so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.6);
  fit(C, [[0, 0, 0], [NW, 0, 0], [0, NL, 0], [NW, NL, 0], [0, 0, PZ + PR], [FACE + 19 + PULL_MAX, YC[2], 0], [FACE + 16 + PULL_MAX, YC[5] + TWD / 2, 0]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // back cover, block of pages, front cover: back to front, bottom to top
  const [back, backIn] = rings(0, 0, NW, NL, 4, 1.2);
  put(solid(g), prism(P, front, back, backIn, 0, 1));
  const [pages, pagesIn] = rings(0, 1.6, FACE, NL - 1.6, 3, 1.2);
  put(solid(g), prism(P, front, pages, pagesIn, 1, PH));
  // the edges of the pages, round the two sides that face the viewer
  mk("path", { class: "nf lo", d: [3.6, 6.2, 8.4].map((z) => open(ringAt(P, run(pages, front), z))).join("") }, g);
  const [cover, coverIn] = rings(0, 0, NW, NL, 4, 1.4);
  put(solid(g), prism(P, front, cover, coverIn, PH, ZC));
  // the cloth tape over the spine, and the box on the cover where the owner writes a name
  mk("path", { class: "nf lo", d: seg(P(9, 0.6, ZC), P(9, NL - 0.6, ZC)) }, g);
  mk("path", { class: "nf lo", d: poly(ringAt(P, rrect(22, 16, 64, 42, 3, 4), ZC)) + seg(P(27, 33, ZC), P(59, 33, ZC)) }, g);

  for (const [d, cls] of pencil(P)) mk("path", { d, class: cls }, g);

  // the tabs, far to near; each is a thin plate with its week as dots, and slides along x
  const tabs = YC.map((yc, i) => {
    const s = solid(g);
    s.sil.classList.add("sil");
    const dots = [];
    for (let j = 0; j <= i; j++) dots.push(mk("circle", { r: 0.95, class: "dot off" }, s.g));
    return { i, yc, s, dots, o: tween(REST[i]), last: NaN };
  });

  function drawTab(t, out) {
    const [ring, inner] = rings(FACE, t.yc - TWD / 2, FACE + out, t.yc + TWD / 2, 2.2, 1);
    put(t.s, prism(P, front, ring, inner, TZ[t.i], TZ[t.i] + TT));
    const rows = t.dots.length > 3 ? [-2.3, 2.3] : [0];
    t.dots.forEach((el, j) => place(el, P(FACE + out - 3.4 - (j % 3) * 3, t.yc + rows[Math.floor(j / 3)], TZ[t.i] + TT)));
    t.last = out;
  }
  tabs.forEach((t) => drawTab(t, REST[t.i]));

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const t of tabs) {
      const out = tval(t.o, now);
      if (out !== t.last) drawTab(t, out);
      if (!tdone(t.o, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  /** The tab nearest the pointer, read on the ground under the resting tabs, which never moves; -1 off the notebook's right half. */
  function hit([sx, sy]) {
    const [wx, wy] = unproj(C, sx, sy, 5);
    if (wx < NW * 0.3 || wx > FACE + 19 + PULL_MAX + 8 || wy < 4 || wy > NL - 4) return -1;
    let best = 0;
    YC.forEach((yc, i) => { if (Math.abs(wy - yc) < Math.abs(wy - YC[best])) best = i; });
    return best;
  }

  let act = -1;
  /** Pulls tab a (-1 puts them all back). The stagger spreads from the tab pulled, or the one let go. */
  function setActive(a, force = false) {
    if (a === act && !force) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : LEAD, lit = a >= 0 ? a : LEAD;
    act = a;
    for (const t of tabs) {
      const near = a >= 0 ? (FALL[Math.abs(t.i - a)] ?? 0) : 0;
      tset(t.o, clamp(REST[t.i] + near * pull, REST[t.i], REST[t.i] + PULL_MAX), now, Math.abs(t.i - from) * STEP);
      t.s.sil.classList.toggle("hi", t.i === lit);
      t.dots.forEach((el) => { el.classList.toggle("m", t.i === lit); el.classList.toggle("off", t.i !== lit); });
    }
    read.textContent = a < 0 ? "rest" : `第${a + 1}週`;
    B.wake();
  }
  setActive(-1, true);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { pull = v; if (act >= 0) setActive(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "tabs",
  means: "A grammar notebook with a tab for each week: the tab under the pointer slides out, and its neighbours follow a little less.",
  rules: [1, 2, 5, 10],
  range: [20, 34, 46],
  mount,
});
