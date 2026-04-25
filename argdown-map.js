const Po = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(Po);
const Fo = 1, zo = 2, Bo = 16, Zo = 1, Vo = 2, jo = 4, Ho = 8, Yo = 16, Uo = 2, si = "[", cn = "[!", Un = "]", dt = {}, W = Symbol(), In = !1;
var li = Array.isArray, Wo = Array.prototype.indexOf, ht = Array.prototype.includes, vn = Array.from, an = Object.keys, sn = Object.defineProperty, Xe = Object.getOwnPropertyDescriptor, Ko = Object.prototype, Go = Array.prototype, Jo = Object.getPrototypeOf, qr = Object.isExtensible;
function Qo(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
function fi() {
  var e, t, n = new Promise((r, i) => {
    e = r, t = i;
  });
  return { promise: n, resolve: e, reject: t };
}
const G = 2, ln = 4, dn = 8, ui = 1 << 24, Fe = 16, Ce = 32, Ue = 64, Wn = 128, we = 512, Y = 1024, J = 2048, Ae = 4096, ce = 8192, Ie = 16384, hn = 32768, mt = 65536, Ir = 1 << 17, ci = 1 << 18, at = 1 << 19, Xo = 1 << 20, Be = 1 << 25, rt = 32768, Pn = 1 << 21, Kn = 1 << 22, Ve = 1 << 23, Nt = Symbol("$state"), vi = Symbol("legacy props"), vt = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), mn = 3, wt = 8;
function ea() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function ta(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function na() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function ra(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function ia() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function oa() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function aa(e) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function sa() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function la() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function fa() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function ua() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
function pn(e) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
function ca() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
let q = !1;
function qe(e) {
  q = e;
}
let L;
function oe(e) {
  if (e === null)
    throw pn(), dt;
  return L = e;
}
function Pt() {
  return oe(/* @__PURE__ */ Oe(L));
}
function se(e) {
  if (q) {
    if (/* @__PURE__ */ Oe(L) !== null)
      throw pn(), dt;
    L = e;
  }
}
function va(e = 1) {
  if (q) {
    for (var t = e, n = L; t--; )
      n = /** @type {TemplateNode} */
      /* @__PURE__ */ Oe(n);
    L = n;
  }
}
function fn(e = !0) {
  for (var t = 0, n = L; ; ) {
    if (n.nodeType === wt) {
      var r = (
        /** @type {Comment} */
        n.data
      );
      if (r === Un) {
        if (t === 0) return n;
        t -= 1;
      } else (r === si || r === cn) && (t += 1);
    }
    var i = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Oe(n)
    );
    e && n.remove(), n = i;
  }
}
function di(e) {
  if (!e || e.nodeType !== wt)
    throw pn(), dt;
  return (
    /** @type {Comment} */
    e.data
  );
}
function hi(e) {
  return e === this.v;
}
function da(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function mi(e) {
  return !da(e, this.v);
}
let Ft = !1, ha = !1;
function ma() {
  Ft = !0;
}
let K = null;
function pt(e) {
  K = e;
}
function Gn(e, t = !1, n) {
  K = {
    p: K,
    i: !1,
    c: null,
    e: null,
    s: e,
    x: null,
    l: Ft && !t ? { s: null, u: null, $: [] } : null
  };
}
function Jn(e) {
  var t = (
    /** @type {ComponentContext} */
    K
  ), n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n)
      Di(r);
  }
  return e !== void 0 && (t.x = e), t.i = !0, K = t.p, e ?? /** @type {T} */
  {};
}
function zt() {
  return !Ft || K !== null && K.l === null;
}
let Je = [];
function pi() {
  var e = Je;
  Je = [], Qo(e);
}
function et(e) {
  if (Je.length === 0 && !Lt) {
    var t = Je;
    queueMicrotask(() => {
      t === Je && pi();
    });
  }
  Je.push(e);
}
function pa() {
  for (; Je.length > 0; )
    pi();
}
function gi(e) {
  var t = D;
  if (t === null)
    return N.f |= Ve, e;
  if ((t.f & hn) === 0) {
    if ((t.f & Wn) === 0)
      throw e;
    t.b.error(e);
  } else
    gt(e, t);
}
function gt(e, t) {
  for (; t !== null; ) {
    if ((t.f & Wn) !== 0)
      try {
        t.b.error(e);
        return;
      } catch (n) {
        e = n;
      }
    t = t.parent;
  }
  throw e;
}
const ga = -7169;
function Z(e, t) {
  e.f = e.f & ga | t;
}
function Qn(e) {
  (e.f & we) !== 0 || e.deps === null ? Z(e, Y) : Z(e, Ae);
}
function _i(e) {
  if (e !== null)
    for (const t of e)
      (t.f & G) === 0 || (t.f & rt) === 0 || (t.f ^= rt, _i(
        /** @type {Derived} */
        t.deps
      ));
}
function wi(e, t, n) {
  (e.f & J) !== 0 ? t.add(e) : (e.f & Ae) !== 0 && n.add(e), _i(e.deps), Z(e, Y);
}
const Qt = /* @__PURE__ */ new Set();
let F = null, Se = null, le = [], gn = null, Fn = !1, Lt = !1;
class Pe {
  committed = !1;
  /**
   * The current values of any sources that are updated in this batch
   * They keys of this map are identical to `this.#previous`
   * @type {Map<Source, any>}
   */
  current = /* @__PURE__ */ new Map();
  /**
   * The values of any sources that are updated in this batch _before_ those updates took place.
   * They keys of this map are identical to `this.#current`
   * @type {Map<Source, any>}
   */
  previous = /* @__PURE__ */ new Map();
  /**
   * When the batch is committed (and the DOM is updated), we need to remove old branches
   * and append new ones by calling the functions added inside (if/each/key/etc) blocks
   * @type {Set<() => void>}
   */
  #e = /* @__PURE__ */ new Set();
  /**
   * If a fork is discarded, we need to destroy any effects that are no longer needed
   * @type {Set<(batch: Batch) => void>}
   */
  #t = /* @__PURE__ */ new Set();
  /**
   * The number of async effects that are currently in flight
   */
  #n = 0;
  /**
   * The number of async effects that are currently in flight, _not_ inside a pending boundary
   */
  #a = 0;
  /**
   * A deferred that resolves when the batch is committed, used with `settled()`
   * TODO replace with Promise.withResolvers once supported widely enough
   * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
   */
  #s = null;
  /**
   * Deferred effects (which run after async work has completed) that are DIRTY
   * @type {Set<Effect>}
   */
  #i = /* @__PURE__ */ new Set();
  /**
   * Deferred effects that are MAYBE_DIRTY
   * @type {Set<Effect>}
   */
  #r = /* @__PURE__ */ new Set();
  /**
   * A map of branches that still exist, but will be destroyed when this batch
   * is committed — we skip over these during `process`.
   * The value contains child effects that were dirty/maybe_dirty before being reset,
   * so they can be rescheduled if the branch survives.
   * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
   */
  #o = /* @__PURE__ */ new Map();
  is_fork = !1;
  #l = !1;
  is_deferred() {
    return this.is_fork || this.#a > 0;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(t) {
    this.#o.has(t) || this.#o.set(t, { d: [], m: [] });
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   */
  unskip_effect(t) {
    var n = this.#o.get(t);
    if (n) {
      this.#o.delete(t);
      for (var r of n.d)
        Z(r, J), Te(r);
      for (r of n.m)
        Z(r, Ae), Te(r);
    }
  }
  /**
   *
   * @param {Effect[]} root_effects
   */
  process(t) {
    le = [], this.apply();
    var n = [], r = [];
    for (const i of t)
      this.#f(i, n, r);
    if (this.is_deferred()) {
      this.#c(r), this.#c(n);
      for (const [i, o] of this.#o)
        Ei(i, o);
    } else {
      for (const i of this.#e) i();
      this.#e.clear(), this.#n === 0 && this.#u(), F = null, Pr(r), Pr(n), this.#s?.resolve();
    }
    Se = null;
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   * @param {Effect[]} effects
   * @param {Effect[]} render_effects
   */
  #f(t, n, r) {
    t.f ^= Y;
    for (var i = t.first, o = null; i !== null; ) {
      var s = i.f, a = (s & (Ce | Ue)) !== 0, l = a && (s & Y) !== 0, f = l || (s & ce) !== 0 || this.#o.has(i);
      if (!f && i.fn !== null) {
        a ? i.f ^= Y : o !== null && (s & (ln | dn | ui)) !== 0 ? o.b.defer_effect(i) : (s & ln) !== 0 ? n.push(i) : Bt(i) && ((s & Fe) !== 0 && this.#r.add(i), It(i));
        var c = i.first;
        if (c !== null) {
          i = c;
          continue;
        }
      }
      var d = i.parent;
      for (i = i.next; i === null && d !== null; )
        d === o && (o = null), i = d.next, d = d.parent;
    }
  }
  /**
   * @param {Effect[]} effects
   */
  #c(t) {
    for (var n = 0; n < t.length; n += 1)
      wi(t[n], this.#i, this.#r);
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Source} source
   * @param {any} value
   */
  capture(t, n) {
    n !== W && !this.previous.has(t) && this.previous.set(t, n), (t.f & Ve) === 0 && (this.current.set(t, t.v), Se?.set(t, t.v));
  }
  activate() {
    F = this, this.apply();
  }
  deactivate() {
    F === this && (F = null, Se = null);
  }
  flush() {
    if (this.activate(), le.length > 0) {
      if (yi(), F !== null && F !== this)
        return;
    } else this.#n === 0 && this.process([]);
    this.deactivate();
  }
  discard() {
    for (const t of this.#t) t(this);
    this.#t.clear();
  }
  #u() {
    if (Qt.size > 1) {
      this.previous.clear();
      var t = Se, n = !0;
      for (const i of Qt) {
        if (i === this) {
          n = !1;
          continue;
        }
        const o = [];
        for (const [a, l] of this.current) {
          if (i.current.has(a))
            if (n && l !== i.current.get(a))
              i.current.set(a, l);
            else
              continue;
          o.push(a);
        }
        if (o.length === 0)
          continue;
        const s = [...i.current.keys()].filter((a) => !this.current.has(a));
        if (s.length > 0) {
          var r = le;
          le = [];
          const a = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map();
          for (const f of o)
            bi(f, s, a, l);
          if (le.length > 0) {
            F = i, i.apply();
            for (const f of le)
              i.#f(f, [], []);
            i.deactivate();
          }
          le = r;
        }
      }
      F = null, Se = t;
    }
    this.committed = !0, Qt.delete(this);
  }
  /**
   *
   * @param {boolean} blocking
   */
  increment(t) {
    this.#n += 1, t && (this.#a += 1);
  }
  /**
   *
   * @param {boolean} blocking
   */
  decrement(t) {
    this.#n -= 1, t && (this.#a -= 1), !this.#l && (this.#l = !0, et(() => {
      this.#l = !1, this.is_deferred() ? le.length > 0 && this.flush() : this.revive();
    }));
  }
  revive() {
    for (const t of this.#i)
      this.#r.delete(t), Z(t, J), Te(t);
    for (const t of this.#r)
      Z(t, Ae), Te(t);
    this.flush();
  }
  /** @param {() => void} fn */
  oncommit(t) {
    this.#e.add(t);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(t) {
    this.#t.add(t);
  }
  settled() {
    return (this.#s ??= fi()).promise;
  }
  static ensure() {
    if (F === null) {
      const t = F = new Pe();
      Qt.add(F), Lt || et(() => {
        F === t && t.flush();
      });
    }
    return F;
  }
  apply() {
  }
}
function ne(e) {
  var t = Lt;
  Lt = !0;
  try {
    for (var n; ; ) {
      if (pa(), le.length === 0 && (F?.flush(), le.length === 0))
        return gn = null, /** @type {T} */
        n;
      yi();
    }
  } finally {
    Lt = t;
  }
}
function yi() {
  Fn = !0;
  var e = null;
  try {
    for (var t = 0; le.length > 0; ) {
      var n = Pe.ensure();
      if (t++ > 1e3) {
        var r, i;
        _a();
      }
      n.process(le), je.clear();
    }
  } finally {
    Fn = !1, gn = null;
  }
}
function _a() {
  try {
    ia();
  } catch (e) {
    gt(e, gn);
  }
}
let De = null;
function Pr(e) {
  var t = e.length;
  if (t !== 0) {
    for (var n = 0; n < t; ) {
      var r = e[n++];
      if ((r.f & (Ie | ce)) === 0 && Bt(r) && (De = /* @__PURE__ */ new Set(), It(r), r.deps === null && r.first === null && r.nodes === null && (r.teardown === null && r.ac === null ? Fi(r) : r.fn = null), De?.size > 0)) {
        je.clear();
        for (const i of De) {
          if ((i.f & (Ie | ce)) !== 0) continue;
          const o = [i];
          let s = i.parent;
          for (; s !== null; )
            De.has(s) && (De.delete(s), o.push(s)), s = s.parent;
          for (let a = o.length - 1; a >= 0; a--) {
            const l = o[a];
            (l.f & (Ie | ce)) === 0 && It(l);
          }
        }
        De.clear();
      }
    }
    De = null;
  }
}
function bi(e, t, n, r) {
  if (!n.has(e) && (n.add(e), e.reactions !== null))
    for (const i of e.reactions) {
      const o = i.f;
      (o & G) !== 0 ? bi(
        /** @type {Derived} */
        i,
        t,
        n,
        r
      ) : (o & (Kn | Fe)) !== 0 && (o & J) === 0 && xi(i, t, r) && (Z(i, J), Te(
        /** @type {Effect} */
        i
      ));
    }
}
function xi(e, t, n) {
  const r = n.get(e);
  if (r !== void 0) return r;
  if (e.deps !== null)
    for (const i of e.deps) {
      if (ht.call(t, i))
        return !0;
      if ((i.f & G) !== 0 && xi(
        /** @type {Derived} */
        i,
        t,
        n
      ))
        return n.set(
          /** @type {Derived} */
          i,
          !0
        ), !0;
    }
  return n.set(e, !1), !1;
}
function Te(e) {
  for (var t = gn = e; t.parent !== null; ) {
    t = t.parent;
    var n = t.f;
    if (Fn && t === D && (n & Fe) !== 0 && (n & ci) === 0)
      return;
    if ((n & (Ue | Ce)) !== 0) {
      if ((n & Y) === 0) return;
      t.f ^= Y;
    }
  }
  le.push(t);
}
function Ei(e, t) {
  if (!((e.f & Ce) !== 0 && (e.f & Y) !== 0)) {
    (e.f & J) !== 0 ? t.d.push(e) : (e.f & Ae) !== 0 && t.m.push(e), Z(e, Y);
    for (var n = e.first; n !== null; )
      Ei(n, t), n = n.next;
  }
}
function wa(e) {
  let t = 0, n = it(0), r;
  return () => {
    nr() && (M(n), rr(() => (t === 0 && (r = ar(() => e(() => Dt(n)))), t += 1, () => {
      et(() => {
        t -= 1, t === 0 && (r?.(), r = void 0, Dt(n));
      });
    })));
  };
}
var ya = mt | at | Wn;
function ba(e, t, n) {
  new xa(e, t, n);
}
class xa {
  /** @type {Boundary | null} */
  parent;
  is_pending = !1;
  /** @type {TemplateNode} */
  #e;
  /** @type {TemplateNode | null} */
  #t = q ? L : null;
  /** @type {BoundaryProps} */
  #n;
  /** @type {((anchor: Node) => void)} */
  #a;
  /** @type {Effect} */
  #s;
  /** @type {Effect | null} */
  #i = null;
  /** @type {Effect | null} */
  #r = null;
  /** @type {Effect | null} */
  #o = null;
  /** @type {DocumentFragment | null} */
  #l = null;
  /** @type {TemplateNode | null} */
  #f = null;
  #c = 0;
  #u = 0;
  #h = !1;
  #d = !1;
  /** @type {Set<Effect>} */
  #m = /* @__PURE__ */ new Set();
  /** @type {Set<Effect>} */
  #p = /* @__PURE__ */ new Set();
  /**
   * A source containing the number of pending async deriveds/expressions.
   * Only created if `$effect.pending()` is used inside the boundary,
   * otherwise updating the source results in needless `Batch.ensure()`
   * calls followed by no-op flushes
   * @type {Source<number> | null}
   */
  #v = null;
  #b = wa(() => (this.#v = it(this.#c), () => {
    this.#v = null;
  }));
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   */
  constructor(t, n, r) {
    this.#e = t, this.#n = n, this.#a = r, this.parent = /** @type {Effect} */
    D.b, this.is_pending = !!this.#n.pending, this.#s = ir(() => {
      if (D.b = this, q) {
        const o = this.#t;
        Pt(), /** @type {Comment} */
        o.nodeType === wt && /** @type {Comment} */
        o.data === cn ? this.#E() : (this.#x(), this.#u === 0 && (this.is_pending = !1));
      } else {
        var i = this.#w();
        try {
          this.#i = ge(() => r(i));
        } catch (o) {
          this.error(o);
        }
        this.#u > 0 ? this.#_() : this.is_pending = !1;
      }
      return () => {
        this.#f?.remove();
      };
    }, ya), q && (this.#e = L);
  }
  #x() {
    try {
      this.#i = ge(() => this.#a(this.#e));
    } catch (t) {
      this.error(t);
    }
  }
  #E() {
    const t = this.#n.pending;
    t && (this.#r = ge(() => t(this.#e)), et(() => {
      var n = this.#w();
      this.#i = this.#g(() => (Pe.ensure(), ge(() => this.#a(n)))), this.#u > 0 ? this.#_() : (tt(
        /** @type {Effect} */
        this.#r,
        () => {
          this.#r = null;
        }
      ), this.is_pending = !1);
    }));
  }
  #w() {
    var t = this.#e;
    return this.is_pending && (this.#f = ye(), this.#e.before(this.#f), t = this.#f), t;
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(t) {
    wi(t, this.#m, this.#p);
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!this.#n.pending;
  }
  /**
   * @param {() => Effect | null} fn
   */
  #g(t) {
    var n = D, r = N, i = K;
    Me(this.#s), xe(this.#s), pt(this.#s.ctx);
    try {
      return t();
    } catch (o) {
      return gi(o), null;
    } finally {
      Me(n), xe(r), pt(i);
    }
  }
  #_() {
    const t = (
      /** @type {(anchor: Node) => void} */
      this.#n.pending
    );
    this.#i !== null && (this.#l = document.createDocumentFragment(), this.#l.append(
      /** @type {TemplateNode} */
      this.#f
    ), Zi(this.#i, this.#l)), this.#r === null && (this.#r = ge(() => t(this.#e)));
  }
  /**
   * Updates the pending count associated with the currently visible pending snippet,
   * if any, such that we can replace the snippet with content once work is done
   * @param {1 | -1} d
   */
  #y(t) {
    if (!this.has_pending_snippet()) {
      this.parent && this.parent.#y(t);
      return;
    }
    if (this.#u += t, this.#u === 0) {
      this.is_pending = !1;
      for (const n of this.#m)
        Z(n, J), Te(n);
      for (const n of this.#p)
        Z(n, Ae), Te(n);
      this.#m.clear(), this.#p.clear(), this.#r && tt(this.#r, () => {
        this.#r = null;
      }), this.#l && (this.#e.before(this.#l), this.#l = null);
    }
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   */
  update_pending_count(t) {
    this.#y(t), this.#c += t, !(!this.#v || this.#h) && (this.#h = !0, et(() => {
      this.#h = !1, this.#v && _t(this.#v, this.#c);
    }));
  }
  get_effect_pending() {
    return this.#b(), M(
      /** @type {Source<number>} */
      this.#v
    );
  }
  /** @param {unknown} error */
  error(t) {
    var n = this.#n.onerror;
    let r = this.#n.failed;
    if (this.#d || !n && !r)
      throw t;
    this.#i && (te(this.#i), this.#i = null), this.#r && (te(this.#r), this.#r = null), this.#o && (te(this.#o), this.#o = null), q && (oe(
      /** @type {TemplateNode} */
      this.#t
    ), va(), oe(fn()));
    var i = !1, o = !1;
    const s = () => {
      if (i) {
        ca();
        return;
      }
      i = !0, o && ua(), Pe.ensure(), this.#c = 0, this.#o !== null && tt(this.#o, () => {
        this.#o = null;
      }), this.is_pending = this.has_pending_snippet(), this.#i = this.#g(() => (this.#d = !1, ge(() => this.#a(this.#e)))), this.#u > 0 ? this.#_() : this.is_pending = !1;
    };
    et(() => {
      try {
        o = !0, n?.(t, s), o = !1;
      } catch (a) {
        gt(a, this.#s && this.#s.parent);
      }
      r && (this.#o = this.#g(() => {
        Pe.ensure(), this.#d = !0;
        try {
          return ge(() => {
            r(
              this.#e,
              () => t,
              () => s
            );
          });
        } catch (a) {
          return gt(
            a,
            /** @type {Effect} */
            this.#s.parent
          ), null;
        } finally {
          this.#d = !1;
        }
      }));
    });
  }
}
function Ea(e, t, n, r) {
  const i = zt() ? _n : Xn;
  var o = e.filter((h) => !h.settled);
  if (n.length === 0 && o.length === 0) {
    r(t.map(i));
    return;
  }
  var s = F, a = (
    /** @type {Effect} */
    D
  ), l = $a(), f = o.length === 1 ? o[0].promise : o.length > 1 ? Promise.all(o.map((h) => h.promise)) : null;
  function c(h) {
    l();
    try {
      r(h);
    } catch (E) {
      (a.f & Ie) === 0 && gt(E, a);
    }
    s?.deactivate(), zn();
  }
  if (n.length === 0) {
    f.then(() => c(t.map(i)));
    return;
  }
  function d() {
    l(), Promise.all(n.map((h) => /* @__PURE__ */ Sa(h))).then((h) => c([...t.map(i), ...h])).catch((h) => gt(h, a));
  }
  f ? f.then(d) : d();
}
function $a() {
  var e = D, t = N, n = K, r = F;
  return function(o = !0) {
    Me(e), xe(t), pt(n), o && r?.activate();
  };
}
function zn() {
  Me(null), xe(null), pt(null);
}
// @__NO_SIDE_EFFECTS__
function _n(e) {
  var t = G | J, n = N !== null && (N.f & G) !== 0 ? (
    /** @type {Derived} */
    N
  ) : null;
  return D !== null && (D.f |= at), {
    ctx: K,
    deps: null,
    effects: null,
    equals: hi,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      W
    ),
    wv: 0,
    parent: n ?? D,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function Sa(e, t, n) {
  let r = (
    /** @type {Effect | null} */
    D
  );
  r === null && ea();
  var i = (
    /** @type {Boundary} */
    r.b
  ), o = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), s = it(
    /** @type {V} */
    W
  ), a = !N, l = /* @__PURE__ */ new Map();
  return La(() => {
    var f = fi();
    o = f.promise;
    try {
      Promise.resolve(e()).then(f.resolve, f.reject).then(() => {
        c === F && c.committed && c.deactivate(), zn();
      });
    } catch (E) {
      f.reject(E), zn();
    }
    var c = (
      /** @type {Batch} */
      F
    );
    if (a) {
      var d = i.is_rendered();
      i.update_pending_count(1), c.increment(d), l.get(c)?.reject(vt), l.delete(c), l.set(c, f);
    }
    const h = (E, v = void 0) => {
      if (c.activate(), v)
        v !== vt && (s.f |= Ve, _t(s, v));
      else {
        (s.f & Ve) !== 0 && (s.f ^= Ve), _t(s, E);
        for (const [b, _] of l) {
          if (l.delete(b), b === c) break;
          _.reject(vt);
        }
      }
      a && (i.update_pending_count(-1), c.decrement(d));
    };
    f.promise.then(h, (E) => h(null, E || "unknown"));
  }), Oa(() => {
    for (const f of l.values())
      f.reject(vt);
  }), new Promise((f) => {
    function c(d) {
      function h() {
        d === o ? f(s) : c(o);
      }
      d.then(h, h);
    }
    c(o);
  });
}
// @__NO_SIDE_EFFECTS__
function Fr(e) {
  const t = /* @__PURE__ */ _n(e);
  return Vi(t), t;
}
// @__NO_SIDE_EFFECTS__
function Xn(e) {
  const t = /* @__PURE__ */ _n(e);
  return t.equals = mi, t;
}
function $i(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      te(
        /** @type {Effect} */
        t[n]
      );
  }
}
function Ta(e) {
  for (var t = e.parent; t !== null; ) {
    if ((t.f & G) === 0)
      return (t.f & Ie) === 0 ? (
        /** @type {Effect} */
        t
      ) : null;
    t = t.parent;
  }
  return null;
}
function er(e) {
  var t, n = D;
  Me(Ta(e));
  try {
    e.f &= ~rt, $i(e), t = Ui(e);
  } finally {
    Me(n);
  }
  return t;
}
function Si(e) {
  var t = er(e);
  if (!e.equals(t) && (e.wv = Hi(), (!F?.is_fork || e.deps === null) && (e.v = t, e.deps === null))) {
    Z(e, Y);
    return;
  }
  Ye || (Se !== null ? (nr() || F?.is_fork) && Se.set(e, t) : Qn(e));
}
let Bn = /* @__PURE__ */ new Set();
const je = /* @__PURE__ */ new Map();
let Ti = !1;
function it(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: hi,
    rv: 0,
    wv: 0
  };
  return n;
}
// @__NO_SIDE_EFFECTS__
function fe(e, t) {
  const n = it(e);
  return Vi(n), n;
}
// @__NO_SIDE_EFFECTS__
function ki(e, t = !1, n = !0) {
  const r = it(e);
  return t || (r.equals = mi), Ft && n && K !== null && K.l !== null && (K.l.s ??= []).push(r), r;
}
function ie(e, t, n = !1) {
  N !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!ke || (N.f & Ir) !== 0) && zt() && (N.f & (G | Fe | Kn | Ir)) !== 0 && (be === null || !ht.call(be, e)) && fa();
  let r = n ? Ze(t) : t;
  return _t(e, r);
}
function _t(e, t) {
  if (!e.equals(t)) {
    var n = e.v;
    Ye ? je.set(e, t) : je.set(e, n), e.v = t;
    var r = Pe.ensure();
    if (r.capture(e, n), (e.f & G) !== 0) {
      const i = (
        /** @type {Derived} */
        e
      );
      (e.f & J) !== 0 && er(i), Qn(i);
    }
    e.wv = Hi(), Ai(e, J), zt() && D !== null && (D.f & Y) !== 0 && (D.f & (Ce | Ue)) === 0 && (pe === null ? Ia([e]) : pe.push(e)), !r.is_fork && Bn.size > 0 && !Ti && ka();
  }
  return t;
}
function ka() {
  Ti = !1;
  for (const e of Bn)
    (e.f & Y) !== 0 && Z(e, Ae), Bt(e) && It(e);
  Bn.clear();
}
function zr(e, t = 1) {
  var n = M(e), r = t === 1 ? n++ : n--;
  return ie(e, n), r;
}
function Dt(e) {
  ie(e, e.v + 1);
}
function Ai(e, t) {
  var n = e.reactions;
  if (n !== null)
    for (var r = zt(), i = n.length, o = 0; o < i; o++) {
      var s = n[o], a = s.f;
      if (!(!r && s === D)) {
        var l = (a & J) === 0;
        if (l && Z(s, t), (a & G) !== 0) {
          var f = (
            /** @type {Derived} */
            s
          );
          Se?.delete(f), (a & rt) === 0 && (a & we && (s.f |= rt), Ai(f, Ae));
        } else l && ((a & Fe) !== 0 && De !== null && De.add(
          /** @type {Effect} */
          s
        ), Te(
          /** @type {Effect} */
          s
        ));
      }
    }
}
function Ze(e) {
  if (typeof e != "object" || e === null || Nt in e)
    return e;
  const t = Jo(e);
  if (t !== Ko && t !== Go)
    return e;
  var n = /* @__PURE__ */ new Map(), r = li(e), i = /* @__PURE__ */ fe(0), o = nt, s = (a) => {
    if (nt === o)
      return a();
    var l = N, f = nt;
    xe(null), jr(o);
    var c = a();
    return xe(l), jr(f), c;
  };
  return r && n.set("length", /* @__PURE__ */ fe(
    /** @type {any[]} */
    e.length
  )), new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(a, l, f) {
        (!("value" in f) || f.configurable === !1 || f.enumerable === !1 || f.writable === !1) && sa();
        var c = n.get(l);
        return c === void 0 ? c = s(() => {
          var d = /* @__PURE__ */ fe(f.value);
          return n.set(l, d), d;
        }) : ie(c, f.value, !0), !0;
      },
      deleteProperty(a, l) {
        var f = n.get(l);
        if (f === void 0) {
          if (l in a) {
            const c = s(() => /* @__PURE__ */ fe(W));
            n.set(l, c), Dt(i);
          }
        } else
          ie(f, W), Dt(i);
        return !0;
      },
      get(a, l, f) {
        if (l === Nt)
          return e;
        var c = n.get(l), d = l in a;
        if (c === void 0 && (!d || Xe(a, l)?.writable) && (c = s(() => {
          var E = Ze(d ? a[l] : W), v = /* @__PURE__ */ fe(E);
          return v;
        }), n.set(l, c)), c !== void 0) {
          var h = M(c);
          return h === W ? void 0 : h;
        }
        return Reflect.get(a, l, f);
      },
      getOwnPropertyDescriptor(a, l) {
        var f = Reflect.getOwnPropertyDescriptor(a, l);
        if (f && "value" in f) {
          var c = n.get(l);
          c && (f.value = M(c));
        } else if (f === void 0) {
          var d = n.get(l), h = d?.v;
          if (d !== void 0 && h !== W)
            return {
              enumerable: !0,
              configurable: !0,
              value: h,
              writable: !0
            };
        }
        return f;
      },
      has(a, l) {
        if (l === Nt)
          return !0;
        var f = n.get(l), c = f !== void 0 && f.v !== W || Reflect.has(a, l);
        if (f !== void 0 || D !== null && (!c || Xe(a, l)?.writable)) {
          f === void 0 && (f = s(() => {
            var h = c ? Ze(a[l]) : W, E = /* @__PURE__ */ fe(h);
            return E;
          }), n.set(l, f));
          var d = M(f);
          if (d === W)
            return !1;
        }
        return c;
      },
      set(a, l, f, c) {
        var d = n.get(l), h = l in a;
        if (r && l === "length")
          for (var E = f; E < /** @type {Source<number>} */
          d.v; E += 1) {
            var v = n.get(E + "");
            v !== void 0 ? ie(v, W) : E in a && (v = s(() => /* @__PURE__ */ fe(W)), n.set(E + "", v));
          }
        if (d === void 0)
          (!h || Xe(a, l)?.writable) && (d = s(() => /* @__PURE__ */ fe(void 0)), ie(d, Ze(f)), n.set(l, d));
        else {
          h = d.v !== W;
          var b = s(() => Ze(f));
          ie(d, b);
        }
        var _ = Reflect.getOwnPropertyDescriptor(a, l);
        if (_?.set && _.set.call(c, f), !h) {
          if (r && typeof l == "string") {
            var $ = (
              /** @type {Source<number>} */
              n.get("length")
            ), A = Number(l);
            Number.isInteger(A) && A >= $.v && ie($, A + 1);
          }
          Dt(i);
        }
        return !0;
      },
      ownKeys(a) {
        M(i);
        var l = Reflect.ownKeys(a).filter((d) => {
          var h = n.get(d);
          return h === void 0 || h.v !== W;
        });
        for (var [f, c] of n)
          c.v !== W && !(f in a) && l.push(f);
        return l;
      },
      setPrototypeOf() {
        la();
      }
    }
  );
}
var Br, Ci, Mi, Oi;
function Zn() {
  if (Br === void 0) {
    Br = window, Ci = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype, n = Text.prototype;
    Mi = Xe(t, "firstChild").get, Oi = Xe(t, "nextSibling").get, qr(e) && (e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__style = void 0, e.__e = void 0), qr(n) && (n.__t = void 0);
  }
}
function ye(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function He(e) {
  return (
    /** @type {TemplateNode | null} */
    Mi.call(e)
  );
}
// @__NO_SIDE_EFFECTS__
function Oe(e) {
  return (
    /** @type {TemplateNode | null} */
    Oi.call(e)
  );
}
function me(e, t) {
  if (!q)
    return /* @__PURE__ */ He(e);
  var n = /* @__PURE__ */ He(L);
  if (n === null)
    n = L.appendChild(ye());
  else if (t && n.nodeType !== mn) {
    var r = ye();
    return n?.before(r), oe(r), r;
  }
  return t && tr(
    /** @type {Text} */
    n
  ), oe(n), n;
}
function Aa(e, t = !1) {
  if (!q) {
    var n = /* @__PURE__ */ He(e);
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ Oe(n) : n;
  }
  if (t) {
    if (L?.nodeType !== mn) {
      var r = ye();
      return L?.before(r), oe(r), r;
    }
    tr(
      /** @type {Text} */
      L
    );
  }
  return L;
}
function Ot(e, t = 1, n = !1) {
  let r = q ? L : e;
  for (var i; t--; )
    i = r, r = /** @type {TemplateNode} */
    /* @__PURE__ */ Oe(r);
  if (!q)
    return r;
  if (n) {
    if (r?.nodeType !== mn) {
      var o = ye();
      return r === null ? i?.after(o) : r.before(o), oe(o), o;
    }
    tr(
      /** @type {Text} */
      r
    );
  }
  return oe(r), r;
}
function Ri(e) {
  e.textContent = "";
}
function Ni() {
  return !1;
}
function tr(e) {
  if (
    /** @type {string} */
    e.nodeValue.length < 65536
  )
    return;
  let t = e.nextSibling;
  for (; t !== null && t.nodeType === mn; )
    t.remove(), e.nodeValue += /** @type {string} */
    t.nodeValue, t = e.nextSibling;
}
function Li(e) {
  var t = N, n = D;
  xe(null), Me(null);
  try {
    return e();
  } finally {
    xe(t), Me(n);
  }
}
function Ca(e) {
  D === null && (N === null && ra(), na()), Ye && ta();
}
function Ma(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function Re(e, t, n) {
  var r = D;
  r !== null && (r.f & ce) !== 0 && (e |= ce);
  var i = {
    ctx: K,
    deps: null,
    nodes: null,
    f: e | J | we,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: r,
    b: r && r.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null
  };
  if (n)
    try {
      It(i), i.f |= hn;
    } catch (a) {
      throw te(i), a;
    }
  else t !== null && Te(i);
  var o = i;
  if (n && o.deps === null && o.teardown === null && o.nodes === null && o.first === o.last && // either `null`, or a singular child
  (o.f & at) === 0 && (o = o.first, (e & Fe) !== 0 && (e & mt) !== 0 && o !== null && (o.f |= mt)), o !== null && (o.parent = r, r !== null && Ma(o, r), N !== null && (N.f & G) !== 0 && (e & Ue) === 0)) {
    var s = (
      /** @type {Derived} */
      N
    );
    (s.effects ??= []).push(o);
  }
  return i;
}
function nr() {
  return N !== null && !ke;
}
function Oa(e) {
  const t = Re(dn, null, !1);
  return Z(t, Y), t.teardown = e, t;
}
function Zr(e) {
  Ca();
  var t = (
    /** @type {Effect} */
    D.f
  ), n = !N && (t & Ce) !== 0 && (t & hn) === 0;
  if (n) {
    var r = (
      /** @type {ComponentContext} */
      K
    );
    (r.e ??= []).push(e);
  } else
    return Di(e);
}
function Di(e) {
  return Re(ln | Xo, e, !1);
}
function Ra(e) {
  Pe.ensure();
  const t = Re(Ue | at, e, !0);
  return () => {
    te(t);
  };
}
function Na(e) {
  Pe.ensure();
  const t = Re(Ue | at, e, !0);
  return (n = {}) => new Promise((r) => {
    n.outro ? tt(t, () => {
      te(t), r(void 0);
    }) : (te(t), r(void 0));
  });
}
function qi(e) {
  return Re(ln, e, !1);
}
function La(e) {
  return Re(Kn | at, e, !0);
}
function rr(e, t = 0) {
  return Re(dn | t, e, !0);
}
function Vn(e, t = [], n = [], r = []) {
  Ea(r, t, n, (i) => {
    Re(dn, () => e(...i.map(M)), !0);
  });
}
function ir(e, t = 0) {
  var n = Re(Fe | t, e, !0);
  return n;
}
function ge(e) {
  return Re(Ce | at, e, !0);
}
function Ii(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = Ye, r = N;
    Vr(!0), xe(null);
    try {
      t.call(null);
    } finally {
      Vr(n), xe(r);
    }
  }
}
function Pi(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    const i = n.ac;
    i !== null && Li(() => {
      i.abort(vt);
    });
    var r = n.next;
    (n.f & Ue) !== 0 ? n.parent = null : te(n, t), n = r;
  }
}
function Da(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & Ce) === 0 && te(t), t = n;
  }
}
function te(e, t = !0) {
  var n = !1;
  (t || (e.f & ci) !== 0) && e.nodes !== null && e.nodes.end !== null && (qa(
    e.nodes.start,
    /** @type {TemplateNode} */
    e.nodes.end
  ), n = !0), Pi(e, t && !n), un(e, 0), Z(e, Ie);
  var r = e.nodes && e.nodes.t;
  if (r !== null)
    for (const o of r)
      o.stop();
  Ii(e);
  var i = e.parent;
  i !== null && i.first !== null && Fi(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = null;
}
function qa(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : /* @__PURE__ */ Oe(e);
    e.remove(), e = n;
  }
}
function Fi(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function tt(e, t, n = !0) {
  var r = [];
  zi(e, r, !0);
  var i = () => {
    n && te(e), t && t();
  }, o = r.length;
  if (o > 0) {
    var s = () => --o || i();
    for (var a of r)
      a.out(s);
  } else
    i();
}
function zi(e, t, n) {
  if ((e.f & ce) === 0) {
    e.f ^= ce;
    var r = e.nodes && e.nodes.t;
    if (r !== null)
      for (const a of r)
        (a.is_global || n) && t.push(a);
    for (var i = e.first; i !== null; ) {
      var o = i.next, s = (i.f & mt) !== 0 || // If this is a branch effect without a block effect parent,
      // it means the parent block effect was pruned. In that case,
      // transparency information was transferred to the branch effect.
      (i.f & Ce) !== 0 && (e.f & Fe) !== 0;
      zi(i, t, s ? n : !1), i = o;
    }
  }
}
function or(e) {
  Bi(e, !0);
}
function Bi(e, t) {
  if ((e.f & ce) !== 0) {
    e.f ^= ce, (e.f & Y) === 0 && (Z(e, J), Te(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next, i = (n.f & mt) !== 0 || (n.f & Ce) !== 0;
      Bi(n, i ? t : !1), n = r;
    }
    var o = e.nodes && e.nodes.t;
    if (o !== null)
      for (const s of o)
        (s.is_global || t) && s.in();
  }
}
function Zi(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
      var i = n === r ? null : /* @__PURE__ */ Oe(n);
      t.append(n), n = i;
    }
}
let rn = !1, Ye = !1;
function Vr(e) {
  Ye = e;
}
let N = null, ke = !1;
function xe(e) {
  N = e;
}
let D = null;
function Me(e) {
  D = e;
}
let be = null;
function Vi(e) {
  N !== null && (be === null ? be = [e] : be.push(e));
}
let re = null, ae = 0, pe = null;
function Ia(e) {
  pe = e;
}
let ji = 1, Qe = 0, nt = Qe;
function jr(e) {
  nt = e;
}
function Hi() {
  return ++ji;
}
function Bt(e) {
  var t = e.f;
  if ((t & J) !== 0)
    return !0;
  if (t & G && (e.f &= ~rt), (t & Ae) !== 0) {
    for (var n = (
      /** @type {Value[]} */
      e.deps
    ), r = n.length, i = 0; i < r; i++) {
      var o = n[i];
      if (Bt(
        /** @type {Derived} */
        o
      ) && Si(
        /** @type {Derived} */
        o
      ), o.wv > e.wv)
        return !0;
    }
    (t & we) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    Se === null && Z(e, Y);
  }
  return !1;
}
function Yi(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !(be !== null && ht.call(be, e)))
    for (var i = 0; i < r.length; i++) {
      var o = r[i];
      (o.f & G) !== 0 ? Yi(
        /** @type {Derived} */
        o,
        t,
        !1
      ) : t === o && (n ? Z(o, J) : (o.f & Y) !== 0 && Z(o, Ae), Te(
        /** @type {Effect} */
        o
      ));
    }
}
function Ui(e) {
  var t = re, n = ae, r = pe, i = N, o = be, s = K, a = ke, l = nt, f = e.f;
  re = /** @type {null | Value[]} */
  null, ae = 0, pe = null, N = (f & (Ce | Ue)) === 0 ? e : null, be = null, pt(e.ctx), ke = !1, nt = ++Qe, e.ac !== null && (Li(() => {
    e.ac.abort(vt);
  }), e.ac = null);
  try {
    e.f |= Pn;
    var c = (
      /** @type {Function} */
      e.fn
    ), d = c(), h = e.deps, E = F?.is_fork;
    if (re !== null) {
      var v;
      if (E || un(e, ae), h !== null && ae > 0)
        for (h.length = ae + re.length, v = 0; v < re.length; v++)
          h[ae + v] = re[v];
      else
        e.deps = h = re;
      if (nr() && (e.f & we) !== 0)
        for (v = ae; v < h.length; v++)
          (h[v].reactions ??= []).push(e);
    } else !E && h !== null && ae < h.length && (un(e, ae), h.length = ae);
    if (zt() && pe !== null && !ke && h !== null && (e.f & (G | Ae | J)) === 0)
      for (v = 0; v < /** @type {Source[]} */
      pe.length; v++)
        Yi(
          pe[v],
          /** @type {Effect} */
          e
        );
    if (i !== null && i !== e) {
      if (Qe++, i.deps !== null)
        for (let b = 0; b < n; b += 1)
          i.deps[b].rv = Qe;
      if (t !== null)
        for (const b of t)
          b.rv = Qe;
      pe !== null && (r === null ? r = pe : r.push(.../** @type {Source[]} */
      pe));
    }
    return (e.f & Ve) !== 0 && (e.f ^= Ve), d;
  } catch (b) {
    return gi(b);
  } finally {
    e.f ^= Pn, re = t, ae = n, pe = r, N = i, be = o, pt(s), ke = a, nt = l;
  }
}
function Pa(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = Wo.call(n, e);
    if (r !== -1) {
      var i = n.length - 1;
      i === 0 ? n = t.reactions = null : (n[r] = n[i], n.pop());
    }
  }
  if (n === null && (t.f & G) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (re === null || !ht.call(re, t))) {
    var o = (
      /** @type {Derived} */
      t
    );
    (o.f & we) !== 0 && (o.f ^= we, o.f &= ~rt), Qn(o), $i(o), un(o, 0);
  }
}
function un(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var r = t; r < n.length; r++)
      Pa(e, n[r]);
}
function It(e) {
  var t = e.f;
  if ((t & Ie) === 0) {
    Z(e, Y);
    var n = D, r = rn;
    D = e, rn = !0;
    try {
      (t & (Fe | ui)) !== 0 ? Da(e) : Pi(e), Ii(e);
      var i = Ui(e);
      e.teardown = typeof i == "function" ? i : null, e.wv = ji;
      var o;
      In && ha && (e.f & J) !== 0 && e.deps;
    } finally {
      rn = r, D = n;
    }
  }
}
function M(e) {
  var t = e.f, n = (t & G) !== 0;
  if (N !== null && !ke) {
    var r = D !== null && (D.f & Ie) !== 0;
    if (!r && (be === null || !ht.call(be, e))) {
      var i = N.deps;
      if ((N.f & Pn) !== 0)
        e.rv < Qe && (e.rv = Qe, re === null && i !== null && i[ae] === e ? ae++ : re === null ? re = [e] : re.push(e));
      else {
        (N.deps ??= []).push(e);
        var o = e.reactions;
        o === null ? e.reactions = [N] : ht.call(o, N) || o.push(N);
      }
    }
  }
  if (Ye && je.has(e))
    return je.get(e);
  if (n) {
    var s = (
      /** @type {Derived} */
      e
    );
    if (Ye) {
      var a = s.v;
      return ((s.f & Y) === 0 && s.reactions !== null || Ki(s)) && (a = er(s)), je.set(s, a), a;
    }
    var l = (s.f & we) === 0 && !ke && N !== null && (rn || (N.f & we) !== 0), f = s.deps === null;
    Bt(s) && (l && (s.f |= we), Si(s)), l && !f && Wi(s);
  }
  if (Se?.has(e))
    return Se.get(e);
  if ((e.f & Ve) !== 0)
    throw e.v;
  return e.v;
}
function Wi(e) {
  if (e.deps !== null) {
    e.f |= we;
    for (const t of e.deps)
      (t.reactions ??= []).push(e), (t.f & G) !== 0 && (t.f & we) === 0 && Wi(
        /** @type {Derived} */
        t
      );
  }
}
function Ki(e) {
  if (e.v === W) return !0;
  if (e.deps === null) return !1;
  for (const t of e.deps)
    if (je.has(t) || (t.f & G) !== 0 && Ki(
      /** @type {Derived} */
      t
    ))
      return !0;
  return !1;
}
function ar(e) {
  var t = ke;
  try {
    return ke = !0, e();
  } finally {
    ke = t;
  }
}
const Gi = /* @__PURE__ */ new Set(), jn = /* @__PURE__ */ new Set();
function Ji(e) {
  for (var t = 0; t < e.length; t++)
    Gi.add(e[t]);
  for (var n of jn)
    n(e);
}
let Hr = null;
function Xt(e) {
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), r = e.type, i = e.composedPath?.() || [], o = (
    /** @type {null | Element} */
    i[0] || e.target
  );
  Hr = e;
  var s = 0, a = Hr === e && e.__root;
  if (a) {
    var l = i.indexOf(a);
    if (l !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e.__root = t;
      return;
    }
    var f = i.indexOf(t);
    if (f === -1)
      return;
    l <= f && (s = l);
  }
  if (o = /** @type {Element} */
  i[s] || e.target, o !== t) {
    sn(e, "currentTarget", {
      configurable: !0,
      get() {
        return o || n;
      }
    });
    var c = N, d = D;
    xe(null), Me(null);
    try {
      for (var h, E = []; o !== null; ) {
        var v = o.assignedSlot || o.parentNode || /** @type {any} */
        o.host || null;
        try {
          var b = o["__" + r];
          b != null && (!/** @type {any} */
          o.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === o) && b.call(o, e);
        } catch (_) {
          h ? E.push(_) : h = _;
        }
        if (e.cancelBubble || v === t || v === null)
          break;
        o = v;
      }
      if (h) {
        for (let _ of E)
          queueMicrotask(() => {
            throw _;
          });
        throw h;
      }
    } finally {
      e.__root = t, delete e.currentTarget, xe(c), Me(d);
    }
  }
}
function Qi(e) {
  var t = document.createElement("template");
  return t.innerHTML = e.replaceAll("<!>", "<!---->"), t.content;
}
function ot(e, t) {
  var n = (
    /** @type {Effect} */
    D
  );
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
// @__NO_SIDE_EFFECTS__
function We(e, t) {
  var n = (t & Uo) !== 0, r, i = !e.startsWith("<!>");
  return () => {
    if (q)
      return ot(L, null), L;
    r === void 0 && (r = Qi(i ? e : "<!>" + e), r = /** @type {TemplateNode} */
    /* @__PURE__ */ He(r));
    var o = (
      /** @type {TemplateNode} */
      n || Ci ? document.importNode(r, !0) : r.cloneNode(!0)
    );
    return ot(o, o), o;
  };
}
// @__NO_SIDE_EFFECTS__
function Fa(e, t, n = "svg") {
  var r = !e.startsWith("<!>"), i = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
  return () => {
    if (q)
      return ot(L, null), L;
    if (!o) {
      var s = (
        /** @type {DocumentFragment} */
        Qi(i)
      ), a = (
        /** @type {Element} */
        /* @__PURE__ */ He(s)
      );
      o = /** @type {Element} */
      /* @__PURE__ */ He(a);
    }
    var l = (
      /** @type {TemplateNode} */
      o.cloneNode(!0)
    );
    return ot(l, l), l;
  };
}
// @__NO_SIDE_EFFECTS__
function Xi(e, t) {
  return /* @__PURE__ */ Fa(e, t, "svg");
}
function za() {
  if (q)
    return ot(L, null), L;
  var e = document.createDocumentFragment(), t = document.createComment(""), n = ye();
  return e.append(t, n), ot(t, n), e;
}
function _e(e, t) {
  if (q) {
    var n = (
      /** @type {Effect & { nodes: EffectNodes }} */
      D
    );
    ((n.f & hn) === 0 || n.nodes.end === null) && (n.nodes.end = L), Pt();
    return;
  }
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
const Ba = ["touchstart", "touchmove"];
function Za(e) {
  return Ba.includes(e);
}
function Yr(e, t) {
  var n = t == null ? "" : typeof t == "object" ? t + "" : t;
  n !== (e.__t ??= e.nodeValue) && (e.__t = n, e.nodeValue = n + "");
}
function eo(e, t) {
  return to(e, t);
}
function Va(e, t) {
  Zn(), t.intro = t.intro ?? !1;
  const n = t.target, r = q, i = L;
  try {
    for (var o = /* @__PURE__ */ He(n); o && (o.nodeType !== wt || /** @type {Comment} */
    o.data !== si); )
      o = /* @__PURE__ */ Oe(o);
    if (!o)
      throw dt;
    qe(!0), oe(
      /** @type {Comment} */
      o
    );
    const s = to(e, { ...t, anchor: o });
    return qe(!1), /**  @type {Exports} */
    s;
  } catch (s) {
    if (s instanceof Error && s.message.split(`
`).some((a) => a.startsWith("https://svelte.dev/e/")))
      throw s;
    return s !== dt && console.warn("Failed to hydrate: ", s), t.recover === !1 && oa(), Zn(), Ri(n), qe(!1), eo(e, t);
  } finally {
    qe(r), oe(i);
  }
}
const ut = /* @__PURE__ */ new Map();
function to(e, { target: t, anchor: n, props: r = {}, events: i, context: o, intro: s = !0 }) {
  Zn();
  var a = /* @__PURE__ */ new Set(), l = (d) => {
    for (var h = 0; h < d.length; h++) {
      var E = d[h];
      if (!a.has(E)) {
        a.add(E);
        var v = Za(E);
        t.addEventListener(E, Xt, { passive: v });
        var b = ut.get(E);
        b === void 0 ? (document.addEventListener(E, Xt, { passive: v }), ut.set(E, 1)) : ut.set(E, b + 1);
      }
    }
  };
  l(vn(Gi)), jn.add(l);
  var f = void 0, c = Na(() => {
    var d = n ?? t.appendChild(ye());
    return ba(
      /** @type {TemplateNode} */
      d,
      {
        pending: () => {
        }
      },
      (h) => {
        if (o) {
          Gn({});
          var E = (
            /** @type {ComponentContext} */
            K
          );
          E.c = o;
        }
        if (i && (r.$$events = i), q && ot(
          /** @type {TemplateNode} */
          h,
          null
        ), f = e(h, r) || {}, q && (D.nodes.end = L, L === null || L.nodeType !== wt || /** @type {Comment} */
        L.data !== Un))
          throw pn(), dt;
        o && Jn();
      }
    ), () => {
      for (var h of a) {
        t.removeEventListener(h, Xt);
        var E = (
          /** @type {number} */
          ut.get(h)
        );
        --E === 0 ? (document.removeEventListener(h, Xt), ut.delete(h)) : ut.set(h, E);
      }
      jn.delete(l), d !== n && d.parentNode?.removeChild(d);
    };
  });
  return Hn.set(f, c), f;
}
let Hn = /* @__PURE__ */ new WeakMap();
function ja(e, t) {
  const n = Hn.get(e);
  return n ? (Hn.delete(e), n(t)) : Promise.resolve();
}
class Ha {
  /** @type {TemplateNode} */
  anchor;
  /** @type {Map<Batch, Key>} */
  #e = /* @__PURE__ */ new Map();
  /**
   * Map of keys to effects that are currently rendered in the DOM.
   * These effects are visible and actively part of the document tree.
   * Example:
   * ```
   * {#if condition}
   * 	foo
   * {:else}
   * 	bar
   * {/if}
   * ```
   * Can result in the entries `true->Effect` and `false->Effect`
   * @type {Map<Key, Effect>}
   */
  #t = /* @__PURE__ */ new Map();
  /**
   * Similar to #onscreen with respect to the keys, but contains branches that are not yet
   * in the DOM, because their insertion is deferred.
   * @type {Map<Key, Branch>}
   */
  #n = /* @__PURE__ */ new Map();
  /**
   * Keys of effects that are currently outroing
   * @type {Set<Key>}
   */
  #a = /* @__PURE__ */ new Set();
  /**
   * Whether to pause (i.e. outro) on change, or destroy immediately.
   * This is necessary for `<svelte:element>`
   */
  #s = !0;
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(t, n = !0) {
    this.anchor = t, this.#s = n;
  }
  #i = () => {
    var t = (
      /** @type {Batch} */
      F
    );
    if (this.#e.has(t)) {
      var n = (
        /** @type {Key} */
        this.#e.get(t)
      ), r = this.#t.get(n);
      if (r)
        or(r), this.#a.delete(n);
      else {
        var i = this.#n.get(n);
        i && (this.#t.set(n, i.effect), this.#n.delete(n), i.fragment.lastChild.remove(), this.anchor.before(i.fragment), r = i.effect);
      }
      for (const [o, s] of this.#e) {
        if (this.#e.delete(o), o === t)
          break;
        const a = this.#n.get(s);
        a && (te(a.effect), this.#n.delete(s));
      }
      for (const [o, s] of this.#t) {
        if (o === n || this.#a.has(o)) continue;
        const a = () => {
          if (Array.from(this.#e.values()).includes(o)) {
            var f = document.createDocumentFragment();
            Zi(s, f), f.append(ye()), this.#n.set(o, { effect: s, fragment: f });
          } else
            te(s);
          this.#a.delete(o), this.#t.delete(o);
        };
        this.#s || !r ? (this.#a.add(o), tt(s, a, !1)) : a();
      }
    }
  };
  /**
   * @param {Batch} batch
   */
  #r = (t) => {
    this.#e.delete(t);
    const n = Array.from(this.#e.values());
    for (const [r, i] of this.#n)
      n.includes(r) || (te(i.effect), this.#n.delete(r));
  };
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(t, n) {
    var r = (
      /** @type {Batch} */
      F
    ), i = Ni();
    if (n && !this.#t.has(t) && !this.#n.has(t))
      if (i) {
        var o = document.createDocumentFragment(), s = ye();
        o.append(s), this.#n.set(t, {
          effect: ge(() => n(s)),
          fragment: o
        });
      } else
        this.#t.set(
          t,
          ge(() => n(this.anchor))
        );
    if (this.#e.set(r, t), i) {
      for (const [a, l] of this.#t)
        a === t ? r.unskip_effect(l) : r.skip_effect(l);
      for (const [a, l] of this.#n)
        a === t ? r.unskip_effect(l.effect) : r.skip_effect(l.effect);
      r.oncommit(this.#i), r.ondiscard(this.#r);
    } else
      q && (this.anchor = L), this.#i();
  }
}
function ct(e, t, n = !1) {
  q && Pt();
  var r = new Ha(e), i = n ? mt : 0;
  function o(s, a) {
    if (q) {
      const f = di(e) === cn;
      if (s === f) {
        var l = fn();
        oe(l), r.anchor = l, qe(!1), r.ensure(s, a), qe(!0);
        return;
      }
    }
    r.ensure(s, a);
  }
  ir(() => {
    var s = !1;
    t((a, l = !0) => {
      s = !0, o(l, a);
    }), s || o(!1, null);
  }, i);
}
function Ya(e, t) {
  return t;
}
function Ua(e, t, n) {
  for (var r = [], i = t.length, o, s = t.length, a = 0; a < i; a++) {
    let d = t[a];
    tt(
      d,
      () => {
        if (o) {
          if (o.pending.delete(d), o.done.add(d), o.pending.size === 0) {
            var h = (
              /** @type {Set<EachOutroGroup>} */
              e.outrogroups
            );
            Yn(vn(o.done)), h.delete(o), h.size === 0 && (e.outrogroups = null);
          }
        } else
          s -= 1;
      },
      !1
    );
  }
  if (s === 0) {
    var l = r.length === 0 && n !== null;
    if (l) {
      var f = (
        /** @type {Element} */
        n
      ), c = (
        /** @type {Element} */
        f.parentNode
      );
      Ri(c), c.append(f), e.items.clear();
    }
    Yn(t, !l);
  } else
    o = {
      pending: new Set(t),
      done: /* @__PURE__ */ new Set()
    }, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(o);
}
function Yn(e, t = !0) {
  for (var n = 0; n < e.length; n++)
    te(e[n], t);
}
var Ur;
function Wa(e, t, n, r, i, o = null) {
  var s = e, a = /* @__PURE__ */ new Map();
  {
    var l = (
      /** @type {Element} */
      e
    );
    s = q ? oe(/* @__PURE__ */ He(l)) : l.appendChild(ye());
  }
  q && Pt();
  var f = null, c = /* @__PURE__ */ Xn(() => {
    var _ = n();
    return li(_) ? _ : _ == null ? [] : vn(_);
  }), d, h = !0;
  function E() {
    b.fallback = f, Ka(b, d, s, t, r), f !== null && (d.length === 0 ? (f.f & Be) === 0 ? or(f) : (f.f ^= Be, Rt(f, null, s)) : tt(f, () => {
      f = null;
    }));
  }
  var v = ir(() => {
    d = /** @type {V[]} */
    M(c);
    var _ = d.length;
    let $ = !1;
    if (q) {
      var A = di(s) === cn;
      A !== (_ === 0) && (s = fn(), oe(s), qe(!1), $ = !0);
    }
    for (var T = /* @__PURE__ */ new Set(), k = (
      /** @type {Batch} */
      F
    ), O = Ni(), z = 0; z < _; z += 1) {
      q && L.nodeType === wt && /** @type {Comment} */
      L.data === Un && (s = /** @type {Comment} */
      L, $ = !0, qe(!1));
      var y = d[z], m = r(y, z), S = h ? null : a.get(m);
      S ? (S.v && _t(S.v, y), S.i && _t(S.i, z), O && k.unskip_effect(S.e)) : (S = Ga(
        a,
        h ? s : Ur ??= ye(),
        y,
        m,
        z,
        i,
        t,
        n
      ), h || (S.e.f |= Be), a.set(m, S)), T.add(m);
    }
    if (_ === 0 && o && !f && (h ? f = ge(() => o(s)) : (f = ge(() => o(Ur ??= ye())), f.f |= Be)), q && _ > 0 && oe(fn()), !h)
      if (O) {
        for (const [C, V] of a)
          T.has(C) || k.skip_effect(V.e);
        k.oncommit(E), k.ondiscard(() => {
        });
      } else
        E();
    $ && qe(!0), M(c);
  }), b = { effect: v, items: a, outrogroups: null, fallback: f };
  h = !1, q && (s = L);
}
function At(e) {
  for (; e !== null && (e.f & Ce) === 0; )
    e = e.next;
  return e;
}
function Ka(e, t, n, r, i) {
  var o = t.length, s = e.items, a = At(e.effect.first), l, f = null, c = [], d = [], h, E, v, b;
  for (b = 0; b < o; b += 1) {
    if (h = t[b], E = i(h, b), v = /** @type {EachItem} */
    s.get(E).e, e.outrogroups !== null)
      for (const m of e.outrogroups)
        m.pending.delete(v), m.done.delete(v);
    if ((v.f & Be) !== 0)
      if (v.f ^= Be, v === a)
        Rt(v, null, n);
      else {
        var _ = f ? f.next : a;
        v === e.effect.last && (e.effect.last = v.prev), v.prev && (v.prev.next = v.next), v.next && (v.next.prev = v.prev), ze(e, f, v), ze(e, v, _), Rt(v, _, n), f = v, c = [], d = [], a = At(f.next);
        continue;
      }
    if ((v.f & ce) !== 0 && or(v), v !== a) {
      if (l !== void 0 && l.has(v)) {
        if (c.length < d.length) {
          var $ = d[0], A;
          f = $.prev;
          var T = c[0], k = c[c.length - 1];
          for (A = 0; A < c.length; A += 1)
            Rt(c[A], $, n);
          for (A = 0; A < d.length; A += 1)
            l.delete(d[A]);
          ze(e, T.prev, k.next), ze(e, f, T), ze(e, k, $), a = $, f = k, b -= 1, c = [], d = [];
        } else
          l.delete(v), Rt(v, a, n), ze(e, v.prev, v.next), ze(e, v, f === null ? e.effect.first : f.next), ze(e, f, v), f = v;
        continue;
      }
      for (c = [], d = []; a !== null && a !== v; )
        (l ??= /* @__PURE__ */ new Set()).add(a), d.push(a), a = At(a.next);
      if (a === null)
        continue;
    }
    (v.f & Be) === 0 && c.push(v), f = v, a = At(v.next);
  }
  if (e.outrogroups !== null) {
    for (const m of e.outrogroups)
      m.pending.size === 0 && (Yn(vn(m.done)), e.outrogroups?.delete(m));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (a !== null || l !== void 0) {
    var O = [];
    if (l !== void 0)
      for (v of l)
        (v.f & ce) === 0 && O.push(v);
    for (; a !== null; )
      (a.f & ce) === 0 && a !== e.fallback && O.push(a), a = At(a.next);
    var z = O.length;
    if (z > 0) {
      var y = o === 0 ? n : null;
      Ua(e, O, y);
    }
  }
}
function Ga(e, t, n, r, i, o, s, a) {
  var l = (s & Fo) !== 0 ? (s & Bo) === 0 ? /* @__PURE__ */ ki(n, !1, !1) : it(n) : null, f = (s & zo) !== 0 ? it(i) : null;
  return {
    v: l,
    i: f,
    e: ge(() => (o(t, l ?? n, f ?? i, a), () => {
      e.delete(r);
    }))
  };
}
function Rt(e, t, n) {
  if (e.nodes)
    for (var r = e.nodes.start, i = e.nodes.end, o = t && (t.f & Be) === 0 ? (
      /** @type {EffectNodes} */
      t.nodes.start
    ) : n; r !== null; ) {
      var s = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Oe(r)
      );
      if (o.before(r), r === i)
        return;
      r = s;
    }
}
function ze(e, t, n) {
  t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Wr(e, t, n, r, i) {
  q && Pt();
  var o = t.$$slots?.[n], s = !1;
  o === !0 && (o = t[n === "default" ? "children" : n], s = !0), o === void 0 || o(e, s ? () => r : r);
}
function Zt(e, t) {
  qi(() => {
    var n = e.getRootNode(), r = (
      /** @type {ShadowRoot} */
      n.host ? (
        /** @type {ShadowRoot} */
        n
      ) : (
        /** @type {Document} */
        n.head ?? /** @type {Document} */
        n.ownerDocument.head
      )
    );
    if (!r.querySelector("#" + t.hash)) {
      const i = document.createElement("style");
      i.id = t.hash, i.textContent = t.code, r.appendChild(i);
    }
  });
}
const Kr = [...` 	
\r\f \v\uFEFF`];
function Ja(e, t, n) {
  var r = e == null ? "" : "" + e;
  if (n) {
    for (var i in n)
      if (n[i])
        r = r ? r + " " + i : i;
      else if (r.length)
        for (var o = i.length, s = 0; (s = r.indexOf(i, s)) >= 0; ) {
          var a = s + o;
          (s === 0 || Kr.includes(r[s - 1])) && (a === r.length || Kr.includes(r[a])) ? r = (s === 0 ? "" : r.substring(0, s)) + r.substring(a + 1) : s = a;
        }
  }
  return r === "" ? null : r;
}
function no(e, t, n, r, i, o) {
  var s = e.__className;
  if (q || s !== n || s === void 0) {
    var a = Ja(n, r, o);
    (!q || a !== e.getAttribute("class")) && (a == null ? e.removeAttribute("class") : e.className = a), e.__className = n;
  } else if (o && i !== o)
    for (var l in o) {
      var f = !!o[l];
      (i == null || f !== !!i[l]) && e.classList.toggle(l, f);
    }
  return o;
}
function Gr(e, t) {
  return e === t || e?.[Nt] === t;
}
function Qa(e = {}, t, n, r) {
  return qi(() => {
    var i, o;
    return rr(() => {
      i = o, o = [], ar(() => {
        e !== n(...o) && (t(e, ...o), i && Gr(n(...i), e) && t(null, ...i));
      });
    }), () => {
      et(() => {
        o && Gr(n(...o), e) && t(null, ...o);
      });
    };
  }), e;
}
let en = !1;
function Xa(e) {
  var t = en;
  try {
    return en = !1, [e(), en];
  } finally {
    en = t;
  }
}
function ue(e, t, n, r) {
  var i = !Ft || (n & Vo) !== 0, o = (n & Ho) !== 0, s = (n & Yo) !== 0, a = (
    /** @type {V} */
    r
  ), l = !0, f = () => (l && (l = !1, a = s ? ar(
    /** @type {() => V} */
    r
  ) : (
    /** @type {V} */
    r
  )), a), c;
  if (o) {
    var d = Nt in e || vi in e;
    c = Xe(e, t)?.set ?? (d && t in e ? (T) => e[t] = T : void 0);
  }
  var h, E = !1;
  o ? [h, E] = Xa(() => (
    /** @type {V} */
    e[t]
  )) : h = /** @type {V} */
  e[t], h === void 0 && r !== void 0 && (h = f(), c && (i && aa(), c(h)));
  var v;
  if (i ? v = () => {
    var T = (
      /** @type {V} */
      e[t]
    );
    return T === void 0 ? f() : (l = !0, T);
  } : v = () => {
    var T = (
      /** @type {V} */
      e[t]
    );
    return T !== void 0 && (a = /** @type {V} */
    void 0), T === void 0 ? a : T;
  }, i && (n & jo) === 0)
    return v;
  if (c) {
    var b = e.$$legacy;
    return (
      /** @type {() => V} */
      function(T, k) {
        return arguments.length > 0 ? ((!i || !k || b || E) && c(k ? v() : T), T) : v();
      }
    );
  }
  var _ = !1, $ = ((n & Zo) !== 0 ? _n : Xn)(() => (_ = !1, v()));
  o && M($);
  var A = (
    /** @type {Effect} */
    D
  );
  return (
    /** @type {() => V} */
    function(T, k) {
      if (arguments.length > 0) {
        const O = k ? M($) : i && o ? Ze(T) : T;
        return ie($, O), _ = !0, a !== void 0 && (a = O), T;
      }
      return Ye && _ || (A.f & Ie) !== 0 ? $.v : M($);
    }
  );
}
function es(e) {
  return new ts(e);
}
class ts {
  /** @type {any} */
  #e;
  /** @type {Record<string, any>} */
  #t;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(t) {
    var n = /* @__PURE__ */ new Map(), r = (o, s) => {
      var a = /* @__PURE__ */ ki(s, !1, !1);
      return n.set(o, a), a;
    };
    const i = new Proxy(
      { ...t.props || {}, $$events: {} },
      {
        get(o, s) {
          return M(n.get(s) ?? r(s, Reflect.get(o, s)));
        },
        has(o, s) {
          return s === vi ? !0 : (M(n.get(s) ?? r(s, Reflect.get(o, s))), Reflect.has(o, s));
        },
        set(o, s, a) {
          return ie(n.get(s) ?? r(s, a), a), Reflect.set(o, s, a);
        }
      }
    );
    this.#t = (t.hydrate ? Va : eo)(t.component, {
      target: t.target,
      anchor: t.anchor,
      props: i,
      context: t.context,
      intro: t.intro ?? !1,
      recover: t.recover
    }), (!t?.props?.$$host || t.sync === !1) && ne(), this.#e = i.$$events;
    for (const o of Object.keys(this.#t))
      o === "$set" || o === "$destroy" || o === "$on" || sn(this, o, {
        get() {
          return this.#t[o];
        },
        /** @param {any} value */
        set(s) {
          this.#t[o] = s;
        },
        enumerable: !0
      });
    this.#t.$set = /** @param {Record<string, any>} next */
    (o) => {
      Object.assign(i, o);
    }, this.#t.$destroy = () => {
      ja(this.#t);
    };
  }
  /** @param {Record<string, any>} props */
  $set(t) {
    this.#t.$set(t);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(t, n) {
    this.#e[t] = this.#e[t] || [];
    const r = (...i) => n.call(this, ...i);
    return this.#e[t].push(r), () => {
      this.#e[t] = this.#e[t].filter(
        /** @param {any} fn */
        (i) => i !== r
      );
    };
  }
  $destroy() {
    this.#t.$destroy();
  }
}
let ro;
typeof HTMLElement == "function" && (ro = class extends HTMLElement {
  /** The Svelte component constructor */
  $$ctor;
  /** Slots */
  $$s;
  /** @type {any} The Svelte component instance */
  $$c;
  /** Whether or not the custom element is connected */
  $$cn = !1;
  /** @type {Record<string, any>} Component props data */
  $$d = {};
  /** `true` if currently in the process of reflecting component props back to attributes */
  $$r = !1;
  /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
  $$p_d = {};
  /** @type {Record<string, EventListenerOrEventListenerObject[]>} Event listeners */
  $$l = {};
  /** @type {Map<EventListenerOrEventListenerObject, Function>} Event listener unsubscribe functions */
  $$l_u = /* @__PURE__ */ new Map();
  /** @type {any} The managed render effect for reflecting attributes */
  $$me;
  /** @type {ShadowRoot | null} The ShadowRoot of the custom element */
  $$shadowRoot = null;
  /**
   * @param {*} $$componentCtor
   * @param {*} $$slots
   * @param {ShadowRootInit | undefined} shadow_root_init
   */
  constructor(e, t, n) {
    super(), this.$$ctor = e, this.$$s = t, n && (this.$$shadowRoot = this.attachShadow(n));
  }
  /**
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} listener
   * @param {boolean | AddEventListenerOptions} [options]
   */
  addEventListener(e, t, n) {
    if (this.$$l[e] = this.$$l[e] || [], this.$$l[e].push(t), this.$$c) {
      const r = this.$$c.$on(e, t);
      this.$$l_u.set(t, r);
    }
    super.addEventListener(e, t, n);
  }
  /**
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} listener
   * @param {boolean | AddEventListenerOptions} [options]
   */
  removeEventListener(e, t, n) {
    if (super.removeEventListener(e, t, n), this.$$c) {
      const r = this.$$l_u.get(t);
      r && (r(), this.$$l_u.delete(t));
    }
  }
  async connectedCallback() {
    if (this.$$cn = !0, !this.$$c) {
      let t = function(i) {
        return (o) => {
          const s = document.createElement("slot");
          i !== "default" && (s.name = i), _e(o, s);
        };
      };
      var e = t;
      if (await Promise.resolve(), !this.$$cn || this.$$c)
        return;
      const n = {}, r = ns(this);
      for (const i of this.$$s)
        i in r && (i === "default" && !this.$$d.children ? (this.$$d.children = t(i), n.default = !0) : n[i] = t(i));
      for (const i of this.attributes) {
        const o = this.$$g_p(i.name);
        o in this.$$d || (this.$$d[o] = on(o, i.value, this.$$p_d, "toProp"));
      }
      for (const i in this.$$p_d)
        !(i in this.$$d) && this[i] !== void 0 && (this.$$d[i] = this[i], delete this[i]);
      this.$$c = es({
        component: this.$$ctor,
        target: this.$$shadowRoot || this,
        props: {
          ...this.$$d,
          $$slots: n,
          $$host: this
        }
      }), this.$$me = Ra(() => {
        rr(() => {
          this.$$r = !0;
          for (const i of an(this.$$c)) {
            if (!this.$$p_d[i]?.reflect) continue;
            this.$$d[i] = this.$$c[i];
            const o = on(
              i,
              this.$$d[i],
              this.$$p_d,
              "toAttribute"
            );
            o == null ? this.removeAttribute(this.$$p_d[i].attribute || i) : this.setAttribute(this.$$p_d[i].attribute || i, o);
          }
          this.$$r = !1;
        });
      });
      for (const i in this.$$l)
        for (const o of this.$$l[i]) {
          const s = this.$$c.$on(i, o);
          this.$$l_u.set(o, s);
        }
      this.$$l = {};
    }
  }
  // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
  // and setting attributes through setAttribute etc, this is helpful
  /**
   * @param {string} attr
   * @param {string} _oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(e, t, n) {
    this.$$r || (e = this.$$g_p(e), this.$$d[e] = on(e, n, this.$$p_d, "toProp"), this.$$c?.$set({ [e]: this.$$d[e] }));
  }
  disconnectedCallback() {
    this.$$cn = !1, Promise.resolve().then(() => {
      !this.$$cn && this.$$c && (this.$$c.$destroy(), this.$$me(), this.$$c = void 0);
    });
  }
  /**
   * @param {string} attribute_name
   */
  $$g_p(e) {
    return an(this.$$p_d).find(
      (t) => this.$$p_d[t].attribute === e || !this.$$p_d[t].attribute && t.toLowerCase() === e
    ) || e;
  }
});
function on(e, t, n, r) {
  const i = n[e]?.type;
  if (t = i === "Boolean" && typeof t != "boolean" ? t != null : t, !r || !n[e])
    return t;
  if (r === "toAttribute")
    switch (i) {
      case "Object":
      case "Array":
        return t == null ? null : JSON.stringify(t);
      case "Boolean":
        return t ? "" : null;
      case "Number":
        return t ?? null;
      default:
        return t;
    }
  else
    switch (i) {
      case "Object":
      case "Array":
        return t && JSON.parse(t);
      case "Boolean":
        return t;
      // conversion already handled above
      case "Number":
        return t != null ? +t : t;
      default:
        return t;
    }
}
function ns(e) {
  const t = {};
  return e.childNodes.forEach((n) => {
    t[
      /** @type {Element} node */
      n.slot || "default"
    ] = !0;
  }), t;
}
function Vt(e, t, n, r, i, o) {
  let s = class extends ro {
    constructor() {
      super(e, n, i), this.$$p_d = t;
    }
    static get observedAttributes() {
      return an(t).map(
        (a) => (t[a].attribute || a).toLowerCase()
      );
    }
  };
  return an(t).forEach((a) => {
    sn(s.prototype, a, {
      get() {
        return this.$$c && a in this.$$c ? this.$$c[a] : this.$$d[a];
      },
      set(l) {
        l = on(a, l, t), this.$$d[a] = l;
        var f = this.$$c;
        if (f) {
          var c = Xe(f, a)?.get;
          c ? f[a] = l : f.$set({ [a]: l });
        }
      }
    });
  }), r.forEach((a) => {
    sn(s.prototype, a, {
      get() {
        return this.$$c?.[a];
      }
    });
  }), e.element = /** @type {any} */
  s, s;
}
ma();
var rs = /* @__PURE__ */ Xi('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="384" height="448" viewBox="0 0 384 448" class="svelte-18sx640"><g id="icomoon-ignore"></g><path fill="#fff" d="M188.75 264c0 2-1 4.25-2.5 5.75l-83 83 36 36c3 3 4.75 7 4.75 11.25 0 8.75-7.25 16-16 16h-112c-8.75 0-16-7.25-16-16v-112c0-8.75 7.25-16 16-16 4.25 0 8.25 1.75 11.25 4.75l36 36 83-83c1.5-1.5 3.75-2.5 5.75-2.5s4.25 1 5.75 2.5l28.5 28.5c1.5 1.5 2.5 3.75 2.5 5.75zM384 48v112c0 8.75-7.25 16-16 16-4.25 0-8.25-1.75-11.25-4.75l-36-36-83 83c-1.5 1.5-3.75 2.5-5.75 2.5s-4.25-1-5.75-2.5l-28.5-28.5c-1.5-1.5-2.5-3.75-2.5-5.75s1-4.25 2.5-5.75l83-83-36-36c-3-3-4.75-7-4.75-11.25 0-8.75 7.25-16 16-16h112c8.75 0 16 7.25 16 16z"></path></svg>');
const is = {
  hash: "svelte-18sx640",
  code: "svg.svelte-18sx640 {height:0.8rem;width:auto;color:var(--argdown-button-font-color, #fff);}"
};
function io(e) {
  Zt(e, is);
  var t = rs();
  _e(e, t);
}
Vt(io, {}, [], [], { mode: "open" });
var os = /* @__PURE__ */ We('<a href="https://argdown.org" class="argdown-mark svelte-xsmr90"><svg class="icon svelte-xsmr90" width="100%" height="100%" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;"><g transform="matrix(1,0,0,1,-0.948929,-0.0447248)"><path d="M21.4,16.695L24.949,16.695L16.949,25.67L8.949,16.695L12.51,16.695L12.51,6.42L15.51,8.295L15.51,20.06L16.949,21.675L18.4,20.047L18.4,8.295L21.4,6.42L21.4,16.695Z"></path></g></svg> <span class="name svelte-xsmr90">argdown</span></a>');
const as = {
  hash: "svelte-xsmr90",
  code: ".argdown-mark.svelte-xsmr90 {font-size:0.8rem;display:flex;flex-direction:row;justify-content:flex-start;align-content:center;align-items:center;z-index:10;background-color:var(--argdown-logo-bg-color);border-radius:3px;color:var(--argdown-logo-color);fill:var(--argdown-logo-color);text-decoration:none;padding:1rem 1rem 1rem 0;}.argdown-mark.svelte-xsmr90 .icon:where(.svelte-xsmr90) {width:2rem;height:2rem;}.argdown-mark.svelte-xsmr90 .name:where(.svelte-xsmr90) {display:inline-block;font-weight:bold;font-family:Arial, Helvetica, sans-serif;text-decoration:none;}"
};
function oo(e) {
  Zt(e, as);
  var t = os();
  _e(e, t);
}
Vt(oo, {}, [], [], { mode: "open" });
var ss = /* @__PURE__ */ Xi('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="384" height="448" viewBox="0 0 384 448" class="svelte-gx4fjs"><g id="icomoon-ignore"></g><path fill="#fff" d="M192 240v112c0 8.75-7.25 16-16 16-4.25 0-8.25-1.75-11.25-4.75l-36-36-83 83c-1.5 1.5-3.75 2.5-5.75 2.5s-4.25-1-5.75-2.5l-28.5-28.5c-1.5-1.5-2.5-3.75-2.5-5.75s1-4.25 2.5-5.75l83-83-36-36c-3-3-4.75-7-4.75-11.25 0-8.75 7.25-16 16-16h112c8.75 0 16 7.25 16 16zM380.75 72c0 2-1 4.25-2.5 5.75l-83 83 36 36c3 3 4.75 7 4.75 11.25 0 8.75-7.25 16-16 16h-112c-8.75 0-16-7.25-16-16v-112c0-8.75 7.25-16 16-16 4.25 0 8.25 1.75 11.25 4.75l36 36 83-83c1.5-1.5 3.75-2.5 5.75-2.5s4.25 1 5.75 2.5l28.5 28.5c1.5 1.5 2.5 3.75 2.5 5.75z"></path></svg>');
const ls = {
  hash: "svelte-gx4fjs",
  code: "svg.svelte-gx4fjs {height:0.8rem;width:auto;color:var(--argdown-button-font-color, #fff);}"
};
function ao(e) {
  Zt(e, ls);
  var t = ss();
  _e(e, t);
}
Vt(ao, {}, [], [], { mode: "open" });
var qt = /* @__PURE__ */ ((e) => (e.Zoom = "click to enable zoom!", e))(qt || {}), fs = /* @__PURE__ */ We('<div class="notification svelte-1kavxqw"> </div>'), us = /* @__PURE__ */ We('<li class="svelte-1kavxqw"><button class="svelte-1kavxqw">Deactivate Zoom</button></li>'), cs = /* @__PURE__ */ We('<li class="svelte-1kavxqw"><button class="svelte-1kavxqw"><!></button></li>'), vs = /* @__PURE__ */ We('<header class="svelte-1kavxqw"><div class="notificationContainer svelte-1kavxqw"></div> <nav><!> <ul class="svelte-1kavxqw"><!> <li class="svelte-1kavxqw"><button class="view-toggle svelte-1kavxqw"> </button></li> <!></ul></nav></header>');
const ds = {
  hash: "svelte-1kavxqw",
  code: `.svelte-1kavxqw {font-family:-apple-system,
			BlinkMacSystemFont,
			Segoe UI,
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			Fira Sans,
			Droid Sans,
			Helvetica Neue,
			sans-serif;}header.svelte-1kavxqw {position:relative;height:2rem;width:100%;}nav.svelte-1kavxqw {height:100%;width:100%;display:flex;flex-direction:row;justify-content:space-between;align-content:center;}nav.withoutLogo.svelte-1kavxqw {justify-content:flex-end;}ul.svelte-1kavxqw {margin:0;padding:0;list-style-type:none;display:flex;gap:3px;}ul.svelte-1kavxqw li:where(.svelte-1kavxqw) {margin:0;padding:0;display:flex;}nav.svelte-1kavxqw button:where(.svelte-1kavxqw) {cursor:pointer;z-index:1;}button.svelte-1kavxqw {font-size:0.8rem;font-weight:bold;color:var(--argdown-button-font-color, #fff);background-color:var(--argdown-button-bg-color, #3e8eaf);padding:0.4rem 0.8rem;border-radius:4px;border:0;transition:background-color 0.1s ease;box-sizing:border-box;border-bottom:1px solid var(--argdown-button-border-bottom-color, #38809d);display:flex;align-items:center;justify-content:center;}button.view-toggle.svelte-1kavxqw {min-width:5rem;}button.svelte-1kavxqw:hover {background-color:var(--argdown-button-bg-hover-color, #387e9c);}.notificationContainer.svelte-1kavxqw {position:absolute;left:0;width:100%;height:100%;display:flex;justify-content:center;z-index:0;align-items:center;}.notification.svelte-1kavxqw {font-weight:bold;color:var(--argdown-notification-font-color, black);}`
};
function so(e, t) {
  Gn(t, !0), Zt(e, ds);
  let n = ue(t, "initialView", 7, "map"), r = ue(t, "withoutMaximize", 7, !1), i = ue(t, "withoutLogo", 7, !1), o = ue(t, "withoutHeader", 7, !1), s = ue(t, "activeView", 31, () => Ze(n())), a = ue(t, "isExpand", 15, !1), l = ue(t, "notifications", 23, () => [qt.Zoom]), f = ue(t, "deactivatePanZoom", 7, () => {
  });
  var c = {
    get initialView() {
      return n();
    },
    set initialView(v = "map") {
      n(v), ne();
    },
    get withoutMaximize() {
      return r();
    },
    set withoutMaximize(v = !1) {
      r(v), ne();
    },
    get withoutLogo() {
      return i();
    },
    set withoutLogo(v = !1) {
      i(v), ne();
    },
    get withoutHeader() {
      return o();
    },
    set withoutHeader(v = !1) {
      o(v), ne();
    },
    get activeView() {
      return s();
    },
    set activeView(v = n) {
      s(v), ne();
    },
    get isExpand() {
      return a();
    },
    set isExpand(v = !1) {
      a(v), ne();
    },
    get notifications() {
      return l();
    },
    set notifications(v = [qt.Zoom]) {
      l(v), ne();
    },
    get deactivatePanZoom() {
      return f();
    },
    set deactivatePanZoom(v = () => {
    }) {
      f(v), ne();
    }
  }, d = za(), h = Aa(d);
  {
    var E = (v) => {
      var b = vs(), _ = me(b);
      Wa(_, 21, l, Ya, (w, Q) => {
        var X = fs(), Ee = me(X, !0);
        se(X), Vn(() => Yr(Ee, M(Q))), _e(w, X);
      }), se(_);
      var $ = Ot(_, 2);
      let A;
      var T = me($);
      {
        var k = (w) => {
          oo(w);
        };
        ct(T, (w) => {
          i() || w(k);
        });
      }
      var O = Ot(T, 2), z = me(O);
      {
        var y = (w) => {
          var Q = us(), X = me(Q);
          X.__click = () => {
            f()();
          }, se(Q), _e(w, Q);
        };
        ct(z, (w) => {
          s() === "map" && !l().includes(qt.Zoom) && w(y);
        });
      }
      var m = Ot(z, 2), S = me(m);
      S.__click = () => {
        s(s() === "map" ? "source" : "map");
      };
      var C = me(S, !0);
      se(S), se(m);
      var V = Ot(m, 2);
      {
        var B = (w) => {
          var Q = cs(), X = me(Q);
          X.__click = () => {
            a(!a());
          };
          var Ee = me(X);
          {
            var j = (H) => {
              ao(H);
            }, ee = (H) => {
              io(H);
            };
            ct(Ee, (H) => {
              a() ? H(j) : H(ee, !1);
            });
          }
          se(X), se(Q), _e(w, Q);
        };
        ct(V, (w) => {
          r() || w(B);
        });
      }
      se(O), se($), se(b), Vn(() => {
        A = no($, 1, "svelte-1kavxqw", null, A, { withoutLogo: i() }), Yr(C, s() === "map" ? "Source" : "Map");
      }), _e(v, b);
    };
    ct(h, (v) => {
      o() || v(E);
    });
  }
  return _e(e, d), Jn(c);
}
Ji(["click"]);
Vt(
  so,
  {
    initialView: {},
    withoutMaximize: {},
    withoutLogo: {},
    withoutHeader: {},
    activeView: {},
    isExpand: {},
    notifications: {},
    deactivatePanZoom: {}
  },
  [],
  [],
  { mode: "open" }
);
function hs(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Ct = { exports: {} }, Jr;
function ms() {
  if (Jr) return Ct.exports;
  Jr = 1, Ct.exports = e, Ct.exports.addWheelListener = e, Ct.exports.removeWheelListener = t;
  function e(n, r, i) {
    n.addEventListener("wheel", r, i);
  }
  function t(n, r, i) {
    n.removeEventListener("wheel", r, i);
  }
  return Ct.exports;
}
var Mt = { exports: {} }, On, Qr;
function ps() {
  if (Qr) return On;
  Qr = 1;
  var e = 4, t = 1e-3, n = 1e-7, r = 10, i = 11, o = 1 / (i - 1), s = typeof Float32Array == "function";
  function a(b, _) {
    return 1 - 3 * _ + 3 * b;
  }
  function l(b, _) {
    return 3 * _ - 6 * b;
  }
  function f(b) {
    return 3 * b;
  }
  function c(b, _, $) {
    return ((a(_, $) * b + l(_, $)) * b + f(_)) * b;
  }
  function d(b, _, $) {
    return 3 * a(_, $) * b * b + 2 * l(_, $) * b + f(_);
  }
  function h(b, _, $, A, T) {
    var k, O, z = 0;
    do
      O = _ + ($ - _) / 2, k = c(O, A, T) - b, k > 0 ? $ = O : _ = O;
    while (Math.abs(k) > n && ++z < r);
    return O;
  }
  function E(b, _, $, A) {
    for (var T = 0; T < e; ++T) {
      var k = d(_, $, A);
      if (k === 0)
        return _;
      var O = c(_, $, A) - b;
      _ -= O / k;
    }
    return _;
  }
  function v(b) {
    return b;
  }
  return On = function(_, $, A, T) {
    if (!(0 <= _ && _ <= 1 && 0 <= A && A <= 1))
      throw new Error("bezier x values must be in [0, 1] range");
    if (_ === $ && A === T)
      return v;
    for (var k = s ? new Float32Array(i) : new Array(i), O = 0; O < i; ++O)
      k[O] = c(O * o, _, A);
    function z(y) {
      for (var m = 0, S = 1, C = i - 1; S !== C && k[S] <= y; ++S)
        m += o;
      --S;
      var V = (y - k[S]) / (k[S + 1] - k[S]), B = m + V * o, w = d(B, _, A);
      return w >= t ? E(y, B, _, A) : w === 0 ? B : h(y, m, m + o, _, A);
    }
    return function(m) {
      return m === 0 ? 0 : m === 1 ? 1 : c(z(m), $, T);
    };
  }, On;
}
var Xr;
function gs() {
  if (Xr) return Mt.exports;
  Xr = 1;
  var e = ps(), t = {
    ease: e(0.25, 0.1, 0.25, 1),
    easeIn: e(0.42, 0, 1, 1),
    easeOut: e(0, 0, 0.58, 1),
    easeInOut: e(0.42, 0, 0.58, 1),
    linear: e(0, 0, 1, 1)
  };
  Mt.exports = n, Mt.exports.makeAggregateRaf = a, Mt.exports.sharedScheduler = a();
  function n(l, f, c) {
    var d = /* @__PURE__ */ Object.create(null), h = /* @__PURE__ */ Object.create(null);
    c = c || {};
    var E = typeof c.easing == "function" ? c.easing : t[c.easing];
    E || (c.easing && console.warn("Unknown easing function in amator: " + c.easing), E = t.ease);
    var v = typeof c.step == "function" ? c.step : r, b = typeof c.done == "function" ? c.done : r, _ = i(c.scheduler), $ = Object.keys(f);
    $.forEach(function(S) {
      d[S] = l[S], h[S] = f[S] - l[S];
    });
    var A = typeof c.duration == "number" ? c.duration : 400, T = Math.max(1, A * 0.06), k, O = 0;
    return k = _.next(y), {
      cancel: z
    };
    function z() {
      _.cancel(k), k = 0;
    }
    function y() {
      var S = E(O / T);
      O += 1, m(S), O <= T ? (k = _.next(y), v(l)) : (k = 0, setTimeout(function() {
        b(l);
      }, 0));
    }
    function m(S) {
      $.forEach(function(C) {
        l[C] = h[C] * S + d[C];
      });
    }
  }
  function r() {
  }
  function i(l) {
    if (!l) {
      var f = typeof window < "u" && window.requestAnimationFrame;
      return f ? o() : s();
    }
    if (typeof l.next != "function") throw new Error("Scheduler is supposed to have next(cb) function");
    if (typeof l.cancel != "function") throw new Error("Scheduler is supposed to have cancel(handle) function");
    return l;
  }
  function o() {
    return {
      next: window.requestAnimationFrame.bind(window),
      cancel: window.cancelAnimationFrame.bind(window)
    };
  }
  function s() {
    return {
      next: function(l) {
        return setTimeout(l, 1e3 / 60);
      },
      cancel: function(l) {
        return clearTimeout(l);
      }
    };
  }
  function a() {
    var l = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Set(), c = 0;
    return {
      next: h,
      cancel: h,
      clearAll: d
    };
    function d() {
      l.clear(), f.clear(), cancelAnimationFrame(c), c = 0;
    }
    function h(b) {
      f.add(b), E();
    }
    function E() {
      c || (c = requestAnimationFrame(v));
    }
    function v() {
      c = 0;
      var b = f;
      f = l, l = b, l.forEach(function(_) {
        _();
      }), l.clear();
    }
  }
  return Mt.exports;
}
var Rn, ei;
function _s() {
  if (ei) return Rn;
  ei = 1;
  function e(r) {
    n(r);
    const i = t(r);
    return r.on = i.on, r.off = i.off, r.fire = i.fire, r;
  }
  function t(r) {
    let i = /* @__PURE__ */ Object.create(null);
    return { on: function(o, s, a) {
      if (typeof s != "function") throw new Error("callback is expected to be a function");
      let l = i[o];
      return l || (l = i[o] = []), l.push({ callback: s, ctx: a }), r;
    }, off: function(o, s) {
      if (typeof o > "u") return i = /* @__PURE__ */ Object.create(null), r;
      if (i[o]) if (typeof s != "function") delete i[o];
      else {
        const a = i[o];
        for (let l = 0; l < a.length; ++l) a[l].callback === s && a.splice(l, 1);
      }
      return r;
    }, fire: function(o) {
      const s = i[o];
      if (!s) return r;
      let a;
      arguments.length > 1 && (a = Array.prototype.slice.call(arguments, 1));
      for (let l = 0; l < s.length; ++l) {
        const f = s[l];
        f.callback.apply(f.ctx, a);
      }
      return r;
    } };
  }
  function n(r) {
    if (!r) throw new Error("Eventify cannot use falsy object as events subject");
    const i = ["on", "fire", "off"];
    for (let o = 0; o < i.length; ++o) if (r.hasOwnProperty(i[o])) throw new Error("Subject cannot be eventified, since it already has property '" + i[o] + "'");
  }
  return Rn = e, Rn;
}
var Nn, ti;
function ws() {
  if (ti) return Nn;
  ti = 1, Nn = e;
  function e(r, i, o) {
    typeof o != "object" && (o = {});
    var s = typeof o.minVelocity == "number" ? o.minVelocity : 5, a = typeof o.amplitude == "number" ? o.amplitude : 0.25, l = typeof o.cancelAnimationFrame == "function" ? o.cancelAnimationFrame : t(), f = typeof o.requestAnimationFrame == "function" ? o.requestAnimationFrame : n(), c, d, h = 342, E, v, b, _, $, A, T, k;
    return {
      start: z,
      stop: m,
      cancel: O
    };
    function O() {
      l(E), l(k);
    }
    function z() {
      c = r(), _ = T = v = $ = 0, d = /* @__PURE__ */ new Date(), l(E), l(k), E = f(y);
    }
    function y() {
      var C = Date.now(), V = C - d;
      d = C;
      var B = r(), w = B.x - c.x, Q = B.y - c.y;
      c = B;
      var X = 1e3 / (1 + V);
      v = 0.8 * w * X + 0.2 * v, $ = 0.8 * Q * X + 0.2 * $, E = f(y);
    }
    function m() {
      l(E), l(k);
      var C = r();
      b = C.x, A = C.y, d = Date.now(), (v < -s || v > s) && (_ = a * v, b += _), ($ < -s || $ > s) && (T = a * $, A += T), k = f(S);
    }
    function S() {
      var C = Date.now() - d, V = !1, B = 0, w = 0;
      _ && (B = -_ * Math.exp(-C / h), B > 0.5 || B < -0.5 ? V = !0 : B = _ = 0), T && (w = -T * Math.exp(-C / h), w > 0.5 || w < -0.5 ? V = !0 : w = T = 0), V && (i(b + B, A + w), k = f(S));
    }
  }
  function t() {
    return typeof cancelAnimationFrame == "function" ? cancelAnimationFrame : clearTimeout;
  }
  function n() {
    return typeof requestAnimationFrame == "function" ? requestAnimationFrame : function(r) {
      return setTimeout(r, 16);
    };
  }
  return Nn;
}
var Ln, ni;
function ys() {
  if (ni) return Ln;
  ni = 1, Ln = e;
  function e(r) {
    if (r)
      return {
        capture: n,
        release: n
      };
    var i, o, s, a = !1;
    return {
      capture: l,
      release: f
    };
    function l(c) {
      a = !0, o = window.document.onselectstart, s = window.document.ondragstart, window.document.onselectstart = t, i = c, i.ondragstart = t;
    }
    function f() {
      a && (a = !1, window.document.onselectstart = o, i && (i.ondragstart = s));
    }
  }
  function t(r) {
    return r.stopPropagation(), !1;
  }
  function n() {
  }
  return Ln;
}
var Dn, ri;
function bs() {
  if (ri) return Dn;
  ri = 1, Dn = e;
  function e() {
    this.x = 0, this.y = 0, this.scale = 1;
  }
  return Dn;
}
var tn = { exports: {} }, ii;
function xs() {
  if (ii) return tn.exports;
  ii = 1, tn.exports = e, tn.exports.canAttach = t;
  function e(n, r) {
    if (!t(n))
      throw new Error("svg element is required for svg.panzoom to work");
    var i = n.ownerSVGElement;
    if (!i)
      throw new Error(
        "Do not apply panzoom to the root <svg> element. Use its child instead (e.g. <g></g>). As of March 2016 only FireFox supported transform on the root element"
      );
    r.disableKeyboardInteraction || i.setAttribute("tabindex", 0);
    var o = {
      getBBox: a,
      getScreenCTM: l,
      getOwner: s,
      applyTransform: c,
      initTransform: f
    };
    return o;
    function s() {
      return i;
    }
    function a() {
      var d = n.getBBox();
      return {
        left: d.x,
        top: d.y,
        width: d.width,
        height: d.height
      };
    }
    function l() {
      var d = i.getCTM();
      return d || i.getScreenCTM();
    }
    function f(d) {
      var h = n.getCTM();
      h === null && (h = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix()), d.x = h.e, d.y = h.f, d.scale = h.a, i.removeAttributeNS(null, "viewBox");
    }
    function c(d) {
      n.setAttribute("transform", "matrix(" + d.scale + " 0 0 " + d.scale + " " + d.x + " " + d.y + ")");
    }
  }
  function t(n) {
    return n && n.ownerSVGElement && n.getCTM;
  }
  return tn.exports;
}
var nn = { exports: {} }, oi;
function Es() {
  if (oi) return nn.exports;
  oi = 1, nn.exports = e, nn.exports.canAttach = t;
  function e(n, r) {
    var i = t(n);
    if (!i)
      throw new Error("panzoom requires DOM element to be attached to the DOM tree");
    var o = n.parentElement;
    n.scrollTop = 0, r.disableKeyboardInteraction || o.setAttribute("tabindex", 0);
    var s = {
      getBBox: l,
      getOwner: a,
      applyTransform: f
    };
    return s;
    function a() {
      return o;
    }
    function l() {
      return {
        left: 0,
        top: 0,
        width: n.clientWidth,
        height: n.clientHeight
      };
    }
    function f(c) {
      n.style.transformOrigin = "0 0 0", n.style.transform = "matrix(" + c.scale + ", 0, 0, " + c.scale + ", " + c.x + ", " + c.y + ")";
    }
  }
  function t(n) {
    return n && n.parentElement && n.style;
  }
  return nn.exports;
}
var qn, ai;
function $s() {
  if (ai) return qn;
  ai = 1;
  var e = ms(), t = gs(), n = _s(), r = ws(), i = ys(), o = i(), s = i(!0), a = bs(), l = xs(), f = Es(), c = 1, d = 1.75, h = 300, E = 200;
  qn = v;
  function v(y, m) {
    m = m || {};
    var S = m.controller;
    if (S || (l.canAttach(y) ? S = l(y, m) : f.canAttach(y) && (S = f(y, m))), !S)
      throw new Error(
        "Cannot create panzoom for the current type of dom element"
      );
    var C = S.getOwner(), V = { x: 0, y: 0 }, B = !1, w = new a();
    S.initTransform && S.initTransform(w);
    var Q = typeof m.filterKey == "function" ? m.filterKey : $, X = typeof m.pinchSpeed == "number" ? m.pinchSpeed : 1, Ee = m.bounds, j = typeof m.maxZoom == "number" ? m.maxZoom : Number.POSITIVE_INFINITY, ee = typeof m.minZoom == "number" ? m.minZoom : 0, H = typeof m.boundsPadding == "number" ? m.boundsPadding : 0.05, ve = typeof m.zoomDoubleClickSpeed == "number" ? m.zoomDoubleClickSpeed : d, wn = m.beforeWheel || $, yt = m.beforeMouseDown || $, yn = typeof m.zoomSpeed == "number" ? m.zoomSpeed : c, Ne = b(m.transformOrigin), bn = m.enableTextSelection ? s : o;
    A(Ee), m.autocenter && vo();
    var bt, sr = 0, lr = 0, xt = 0, fr = null, ur = /* @__PURE__ */ new Date(), xn, Et = !1, $t = !1, de, he, En, $n, Sn, $e;
    "smoothScroll" in m && !m.smoothScroll ? $e = O() : $e = r(Eo, Ao, m.smoothScroll);
    var Tn, St, jt, Ht = !1;
    gr();
    var Yt = {
      dispose: Co,
      moveBy: st,
      moveTo: kn,
      smoothMoveTo: ko,
      centerOn: To,
      zoomTo: Gt,
      zoomAbs: Ut,
      smoothZoom: Kt,
      smoothZoomAbs: qo,
      showRectangle: co,
      pause: lo,
      resume: fo,
      isPaused: uo,
      getTransform: ho,
      getMinZoom: mo,
      setMinZoom: po,
      getMaxZoom: go,
      setMaxZoom: _o,
      getTransformOrigin: wo,
      setTransformOrigin: yo,
      getZoomSpeed: bo,
      setZoomSpeed: xo
    };
    n(Yt);
    var cr = typeof m.initialX == "number" ? m.initialX : w.x, vr = typeof m.initialY == "number" ? m.initialY : w.y, dr = typeof m.initialZoom == "number" ? m.initialZoom : w.scale;
    return (cr != w.x || vr != w.y || dr != w.scale) && Ut(cr, vr, dr), Yt;
    function lo() {
      _r(), Ht = !0;
    }
    function fo() {
      Ht && (gr(), Ht = !1);
    }
    function uo() {
      return Ht;
    }
    function co(u) {
      var p = C.getBoundingClientRect(), g = Ke(p.width, p.height), x = u.right - u.left, R = u.bottom - u.top;
      if (!Number.isFinite(x) || !Number.isFinite(R))
        throw new Error("Invalid rectangle");
      var I = g.x / x, P = g.y / R, U = Math.min(I, P);
      w.x = -(u.left + x / 2) * U + g.x / 2, w.y = -(u.top + R / 2) * U + g.y / 2, w.scale = U;
    }
    function Ke(u, p) {
      if (S.getScreenCTM) {
        var g = S.getScreenCTM(), x = g.a, R = g.d, I = g.e, P = g.f;
        V.x = u * x - I, V.y = p * R - P;
      } else
        V.x = u, V.y = p;
      return V;
    }
    function vo() {
      var u, p, g = 0, x = 0, R = mr();
      if (R)
        g = R.left, x = R.top, u = R.right - R.left, p = R.bottom - R.top;
      else {
        var I = C.getBoundingClientRect();
        u = I.width, p = I.height;
      }
      var P = S.getBBox();
      if (!(P.width === 0 || P.height === 0)) {
        var U = p / P.height, ft = u / P.width, Ge = Math.min(ft, U);
        w.x = -(P.left + P.width / 2) * Ge + u / 2 + g, w.y = -(P.top + P.height / 2) * Ge + p / 2 + x, w.scale = Ge;
      }
    }
    function ho() {
      return w;
    }
    function mo() {
      return ee;
    }
    function po(u) {
      ee = u;
    }
    function go() {
      return j;
    }
    function _o(u) {
      j = u;
    }
    function wo() {
      return Ne;
    }
    function yo(u) {
      Ne = b(u);
    }
    function bo() {
      return yn;
    }
    function xo(u) {
      if (!Number.isFinite(u))
        throw new Error("Zoom speed should be a number");
      yn = u;
    }
    function Eo() {
      return {
        x: w.x,
        y: w.y
      };
    }
    function kn(u, p) {
      w.x = u, w.y = p, An(), lt("pan"), Cn();
    }
    function hr(u, p) {
      kn(w.x + u, w.y + p);
    }
    function An() {
      var u = mr();
      if (u) {
        var p = !1, g = $o(), x = u.left - g.right;
        return x > 0 && (w.x += x, p = !0), x = u.right - g.left, x < 0 && (w.x += x, p = !0), x = u.top - g.bottom, x > 0 && (w.y += x, p = !0), x = u.bottom - g.top, x < 0 && (w.y += x, p = !0), p;
      }
    }
    function mr() {
      if (Ee) {
        if (typeof Ee == "boolean") {
          var u = C.getBoundingClientRect(), p = u.width, g = u.height;
          return {
            left: p * H,
            top: g * H,
            right: p * (1 - H),
            bottom: g * (1 - H)
          };
        }
        return Ee;
      }
    }
    function $o() {
      var u = S.getBBox(), p = So(u.left, u.top);
      return {
        left: p.x,
        top: p.y,
        right: u.width * w.scale + p.x,
        bottom: u.height * w.scale + p.y
      };
    }
    function So(u, p) {
      return {
        x: u * w.scale + w.x,
        y: p * w.scale + w.y
      };
    }
    function Cn() {
      B = !0, bt = window.requestAnimationFrame(Mo);
    }
    function pr(u, p, g) {
      if (k(u) || k(p) || k(g))
        throw new Error("zoom requires valid numbers");
      var x = w.scale * g;
      if (x < ee) {
        if (w.scale === ee) return;
        g = ee / w.scale;
      }
      if (x > j) {
        if (w.scale === j) return;
        g = j / w.scale;
      }
      var R = Ke(u, p);
      if (w.x = R.x - g * (R.x - w.x), w.y = R.y - g * (R.y - w.y), Ee && H === 1 && ee === 1)
        w.scale *= g, An();
      else {
        var I = An();
        I || (w.scale *= g);
      }
      lt("zoom"), Cn();
    }
    function Ut(u, p, g) {
      var x = g / w.scale;
      pr(u, p, x);
    }
    function To(u) {
      var p = u.ownerSVGElement;
      if (!p)
        throw new Error("ui element is required to be within the scene");
      var g = u.getBoundingClientRect(), x = g.left + g.width / 2, R = g.top + g.height / 2, I = p.getBoundingClientRect(), P = I.width / 2 - x, U = I.height / 2 - R;
      st(P, U, !0);
    }
    function ko(u, p) {
      st(u - w.x, p - w.y, !0);
    }
    function st(u, p, g) {
      if (!g)
        return hr(u, p);
      Tn && Tn.cancel();
      var x = { x: 0, y: 0 }, R = { x: u, y: p }, I = 0, P = 0;
      Tn = t(x, R, {
        step: function(U) {
          hr(U.x - I, U.y - P), I = U.x, P = U.y;
        }
      });
    }
    function Ao(u, p) {
      Jt(), kn(u, p);
    }
    function Co() {
      _r();
    }
    function gr() {
      C.addEventListener("mousedown", Tr, { passive: !1 }), C.addEventListener("dblclick", Sr, { passive: !1 }), C.addEventListener("touchstart", yr, { passive: !1 }), C.addEventListener("keydown", wr, { passive: !1 }), e.addWheelListener(C, Or, { passive: !1 }), Cn();
    }
    function _r() {
      e.removeWheelListener(C, Or), C.removeEventListener("mousedown", Tr), C.removeEventListener("keydown", wr), C.removeEventListener("dblclick", Sr), C.removeEventListener("touchstart", yr), bt && (window.cancelAnimationFrame(bt), bt = 0), $e.cancel(), Cr(), Mr(), bn.release(), Mn();
    }
    function Mo() {
      B && Oo();
    }
    function Oo() {
      B = !1, S.applyTransform(w), lt("transform"), bt = 0;
    }
    function wr(u) {
      var p = 0, g = 0, x = 0;
      if (u.keyCode === 38 ? g = 1 : u.keyCode === 40 ? g = -1 : u.keyCode === 37 ? p = 1 : u.keyCode === 39 ? p = -1 : u.keyCode === 189 || u.keyCode === 109 ? x = 1 : (u.keyCode === 187 || u.keyCode === 107) && (x = -1), !Q(u, p, g, x)) {
        if (p || g) {
          u.preventDefault(), u.stopPropagation();
          var R = C.getBoundingClientRect(), I = Math.min(R.width, R.height), P = 0.05, U = I * P * p, ft = I * P * g;
          st(U, ft);
        }
        if (x) {
          var Ge = Rr(x * 100), I = Ne ? kt() : Ro();
          Gt(I.x, I.y, Ge);
        }
      }
    }
    function Ro() {
      var u = C.getBoundingClientRect();
      return {
        x: u.width / 2,
        y: u.height / 2
      };
    }
    function yr(u) {
      if (No(u), Tt(), u.touches.length === 1)
        return Do(u, u.touches[0]);
      u.touches.length === 2 && (Sn = $r(u.touches[0], u.touches[1]), jt = !0, br());
    }
    function No(u) {
      m.onTouch && !m.onTouch(u) || (u.stopPropagation(), u.preventDefault());
    }
    function Lo(u) {
      Tt(), !(m.onDoubleClick && !m.onDoubleClick(u)) && (u.preventDefault(), u.stopPropagation());
    }
    function Do(u) {
      lr = /* @__PURE__ */ new Date();
      var p = u.touches[0], g = Le(p);
      xn = g;
      var x = Ke(g.x, g.y);
      de = x.x, he = x.y, En = de, $n = he, $e.cancel(), br();
    }
    function br() {
      Et || (Et = !0, document.addEventListener("touchmove", xr), document.addEventListener("touchend", Wt), document.addEventListener("touchcancel", Wt));
    }
    function xr(u) {
      if (u.touches.length === 1) {
        u.stopPropagation();
        var p = u.touches[0], g = Le(p), x = Ke(g.x, g.y), R = x.x - de, I = x.y - he;
        R !== 0 && I !== 0 && Nr(), de = x.x, he = x.y, st(R, I);
      } else if (u.touches.length === 2) {
        jt = !0;
        var P = u.touches[0], U = u.touches[1], ft = $r(P, U), Ge = 1 + (ft / Sn - 1) * X, Lr = Le(P), Dr = Le(U);
        if (de = (Lr.x + Dr.x) / 2, he = (Lr.y + Dr.y) / 2, Ne) {
          var g = kt();
          de = g.x, he = g.y;
        }
        Gt(de, he, Ge), Sn = ft, u.stopPropagation(), u.preventDefault();
      }
    }
    function Tt() {
      xt && (clearTimeout(xt), xt = 0);
    }
    function Er(u) {
      if (m.onClick) {
        Tt();
        var p = de - En, g = he - $n, x = Math.sqrt(p * p + g * g);
        x > 5 || (xt = setTimeout(function() {
          xt = 0, m.onClick(u);
        }, h));
      }
    }
    function Wt(u) {
      if (Tt(), u.touches.length > 0) {
        var p = Le(u.touches[0]), g = Ke(p.x, p.y);
        de = g.x, he = g.y;
      } else {
        var x = /* @__PURE__ */ new Date();
        if (x - sr < h)
          if (Ne) {
            var p = kt();
            Kt(p.x, p.y, ve);
          } else
            Kt(xn.x, xn.y, ve);
        else x - lr < E && Er(u);
        sr = x, Mn(), Mr();
      }
    }
    function $r(u, p) {
      var g = u.clientX - p.clientX, x = u.clientY - p.clientY;
      return Math.sqrt(g * g + x * x);
    }
    function Sr(u) {
      Lo(u);
      var p = Le(u);
      Ne && (p = kt()), Kt(p.x, p.y, ve);
    }
    function Tr(u) {
      if (Tt(), !yt(u)) {
        if (fr = u, ur = /* @__PURE__ */ new Date(), Et)
          return u.stopPropagation(), !1;
        var p = u.button === 1 && window.event !== null || u.button === 0;
        if (p) {
          $e.cancel();
          var g = Le(u), x = Ke(g.x, g.y);
          return En = de = x.x, $n = he = x.y, document.addEventListener("mousemove", kr), document.addEventListener("mouseup", Ar), bn.capture(u.target || u.srcElement), !1;
        }
      }
    }
    function kr(u) {
      if (!Et) {
        Nr();
        var p = Le(u), g = Ke(p.x, p.y), x = g.x - de, R = g.y - he;
        de = g.x, he = g.y, st(x, R);
      }
    }
    function Ar() {
      var u = /* @__PURE__ */ new Date();
      u - ur < E && Er(fr), bn.release(), Mn(), Cr();
    }
    function Cr() {
      document.removeEventListener("mousemove", kr), document.removeEventListener("mouseup", Ar), $t = !1;
    }
    function Mr() {
      document.removeEventListener("touchmove", xr), document.removeEventListener("touchend", Wt), document.removeEventListener("touchcancel", Wt), $t = !1, jt = !1, Et = !1;
    }
    function Or(u) {
      if (!wn(u)) {
        $e.cancel();
        var p = u.deltaY;
        u.deltaMode > 0 && (p *= 100);
        var g = Rr(p);
        if (g !== 1) {
          var x = Ne ? kt() : Le(u);
          Gt(x.x, x.y, g), u.preventDefault();
        }
      }
    }
    function Le(u) {
      var p, g, x = C.getBoundingClientRect();
      return p = u.clientX - x.left, g = u.clientY - x.top, { x: p, y: g };
    }
    function Kt(u, p, g) {
      var x = w.scale, R = { scale: x }, I = { scale: g * x };
      $e.cancel(), Jt(), St = t(R, I, {
        step: function(P) {
          Ut(u, p, P.scale);
        },
        done: Io
      });
    }
    function qo(u, p, g) {
      var x = w.scale, R = { scale: x }, I = { scale: g };
      $e.cancel(), Jt(), St = t(R, I, {
        step: function(P) {
          Ut(u, p, P.scale);
        }
      });
    }
    function kt() {
      var u = C.getBoundingClientRect();
      return {
        x: u.width * Ne.x,
        y: u.height * Ne.y
      };
    }
    function Gt(u, p, g) {
      return $e.cancel(), Jt(), pr(u, p, g);
    }
    function Jt() {
      St && (St.cancel(), St = null);
    }
    function Rr(u) {
      var p = Math.sign(u), g = Math.min(0.25, Math.abs(yn * u / 128));
      return 1 - p * g;
    }
    function Nr() {
      $t || (lt("panstart"), $t = !0, $e.start());
    }
    function Mn() {
      $t && (jt || $e.stop(), lt("panend"));
    }
    function Io() {
      lt("zoomend");
    }
    function lt(u) {
      Yt.fire(u, Yt);
    }
  }
  function b(y) {
    if (y) {
      if (typeof y == "object")
        return (!T(y.x) || !T(y.y)) && _(y), y;
      _();
    }
  }
  function _(y) {
    throw console.error(y), new Error(
      [
        "Cannot parse transform origin.",
        "Some good examples:",
        '  "center center" can be achieved with {x: 0.5, y: 0.5}',
        '  "top center" can be achieved with {x: 0.5, y: 0}',
        '  "bottom right" can be achieved with {x: 1, y: 1}'
      ].join(`
`)
    );
  }
  function $() {
  }
  function A(y) {
    var m = typeof y;
    if (!(m === "undefined" || m === "boolean")) {
      var S = T(y.left) && T(y.top) && T(y.bottom) && T(y.right);
      if (!S)
        throw new Error(
          "Bounds object is not valid. It can be: undefined, boolean (true|false) or an object {left, top, right, bottom}"
        );
    }
  }
  function T(y) {
    return Number.isFinite(y);
  }
  function k(y) {
    return Number.isNaN ? Number.isNaN(y) : y !== y;
  }
  function O() {
    return {
      start: $,
      stop: $,
      cancel: $
    };
  }
  function z() {
    if (typeof document > "u") return;
    var y = document.getElementsByTagName("script");
    if (!y) return;
    for (var m, S = 0; S < y.length; ++S) {
      var C = y[S];
      if (C.src && C.src.match(/\bpanzoom(\.min)?\.js/)) {
        m = C;
        break;
      }
    }
    if (!m) return;
    var V = m.getAttribute("query");
    if (!V) return;
    var B = m.getAttribute("name") || "pz", w = Date.now();
    Q();
    function Q() {
      var j = document.querySelector(V);
      if (!j) {
        var ee = Date.now(), H = ee - w;
        if (H < 2e3) {
          setTimeout(Q, 100);
          return;
        }
        console.error("Cannot find the panzoom element", B);
        return;
      }
      var ve = X(m);
      console.log(ve), window[B] = v(j, ve);
    }
    function X(j) {
      for (var ee = j.attributes, H = {}, ve = 0; ve < ee.length; ++ve) {
        var wn = ee[ve], yt = Ee(wn);
        yt && (H[yt.name] = yt.value);
      }
      return H;
    }
    function Ee(j) {
      if (j.name) {
        var ee = j.name[0] === "p" && j.name[1] === "z" && j.name[2] === "-";
        if (ee) {
          var H = j.name.substr(3), ve = JSON.parse(j.value);
          return { name: H, value: ve };
        }
      }
    }
  }
  return z(), qn;
}
var Ss = $s();
const Ts = /* @__PURE__ */ hs(Ss);
var ks = /* @__PURE__ */ We('<div class="map-view svelte-ort8id"><!></div>'), As = /* @__PURE__ */ We('<div class="source-view svelte-ort8id"><!></div>'), Cs = /* @__PURE__ */ We("<div><!> <!></div>");
const Ms = {
  hash: "svelte-ort8id",
  code: ".map-view.svelte-ort8id {overflow:hidden;height:100%;width:100%;display:flex;align-items:center;justify-content:center;}.source-view.svelte-ort8id {overflow:auto;height:100%;width:100%;}.element.svelte-ort8id {display:block;background-color:var(--argdown-bg-color, #fff);border:1px solid var(--argdown-border-color, #eee);border-radius:6px;padding:10px;}div.isExpand.svelte-ort8id {position:fixed;left:0;top:0;right:0;bottom:0;z-index:1000000;margin:0;}"
};
function Os(e, t) {
  Gn(t, !0), Zt(e, Ms);
  let n = ue(t, "initialView", 7, "map"), r = ue(t, "withoutZoom", 7, !1), i = ue(t, "withoutMaximize", 7, !1), o = ue(t, "withoutLogo", 7, !1), s = ue(t, "withoutHeader", 7, !1), a = /* @__PURE__ */ fe(Ze(n())), l = /* @__PURE__ */ fe(!1), f = /* @__PURE__ */ fe(void 0), c = /* @__PURE__ */ Fr(() => {
    const y = M(f)?.firstChild;
    if (y instanceof HTMLSlotElement)
      return [...y.assignedElements()?.[0].children].find((m) => m instanceof SVGElement);
  }), d = /* @__PURE__ */ fe(void 0);
  Zr(() => {
    M(d) || !M(c) || r() || (M(c).style.width = "100%", ie(d, Ts(M(c)), !0), M(d).pause());
  }), Zr(() => {
    M(l) || (M(d)?.moveTo(0, 0), M(d)?.zoomAbs(0, 0, 1));
  });
  let h = /* @__PURE__ */ fe(0), E = /* @__PURE__ */ Fr(() => (M(h), r() ? [] : M(d)?.isPaused() && M(a) === "map" ? [qt.Zoom] : []));
  function v() {
    M(d) && (M(d).resume(), zr(h));
  }
  function b() {
    M(d) && (M(d).pause(), zr(h));
  }
  var _ = {
    get initialView() {
      return n();
    },
    set initialView(y = "map") {
      n(y), ne();
    },
    get withoutZoom() {
      return r();
    },
    set withoutZoom(y = !1) {
      r(y), ne();
    },
    get withoutMaximize() {
      return i();
    },
    set withoutMaximize(y = !1) {
      i(y), ne();
    },
    get withoutLogo() {
      return o();
    },
    set withoutLogo(y = !1) {
      o(y), ne();
    },
    get withoutHeader() {
      return s();
    },
    set withoutHeader(y = !1) {
      s(y), ne();
    }
  }, $ = Cs();
  let A;
  var T = me($);
  so(T, {
    get withoutMaximize() {
      return i();
    },
    get withoutLogo() {
      return o();
    },
    get withoutHeader() {
      return s();
    },
    get notifications() {
      return M(E);
    },
    deactivatePanZoom: b,
    get activeView() {
      return M(a);
    },
    set activeView(y) {
      ie(a, y, !0);
    },
    get isExpand() {
      return M(l);
    },
    set isExpand(y) {
      ie(l, y, !0);
    }
  });
  var k = Ot(T, 2);
  {
    var O = (y) => {
      var m = ks();
      m.__click = v;
      var S = me(m);
      Wr(S, t, "map", {}), se(m), Qa(m, (C) => ie(f, C), () => M(f)), _e(y, m);
    }, z = (y) => {
      var m = As(), S = me(m);
      Wr(S, t, "source", {}), se(m), _e(y, m);
    };
    ct(k, (y) => {
      M(a) === "map" ? y(O) : y(z, !1);
    });
  }
  return se($), Vn(() => A = no($, 1, "element svelte-ort8id", null, A, { isExpand: M(l) })), _e(e, $), Jn(_);
}
Ji(["click"]);
customElements.define("argdown-map", Vt(
  Os,
  {
    initialView: {},
    withoutZoom: {},
    withoutMaximize: {},
    withoutLogo: {},
    withoutHeader: {}
  },
  ["map", "source"],
  [],
  { mode: "open" }
));
