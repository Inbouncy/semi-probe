/*
 * Product area — Manual Manipulators PDP.
 *
 * Two independent pieces, both scoped to one section so several can coexist:
 *
 *   1. The gallery: a sliding window over the product images. The window is
 *      pure CSS — the row is exactly as wide as its clipping parent and its
 *      children overflow it, so sliding is one integer custom property and
 *      this file never measures a pixel. The visible count comes from that
 *      same stylesheet (--sp-thumbs), so the breakpoints stay in the CSS.
 *
 *   2. The configurator: three dependent dropdowns reconstructed from the
 *      section's variant map. The product has a single 21-value Shopify
 *      option and the catalogue is not being changed before launch, so the
 *      three axes live in the theme and resolve back to a real variant id
 *      before the form is submitted.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------- gallery */

  function initGallery(root) {
    var row = root.querySelector('[data-sp-row]');
    var hero = root.querySelector('[data-sp-hero]');
    if (!row || !hero) return;

    var items = Array.prototype.slice.call(row.children);
    var thumbs = Array.prototype.slice.call(root.querySelectorAll('[data-sp-thumb]'));
    var prev = root.querySelector('[data-sp-prev]');
    var next = root.querySelector('[data-sp-next]');
    var strip = root.querySelector('.sp-gallery__strip');
    if (items.length < 2) return;

    var offset = 0;
    var timer = null;
    var hovering = false;
    var taken = false;
    var period = parseInt(root.getAttribute('data-rotate-ms'), 10) || 3000;
    var wantsRotation = root.getAttribute('data-autorotate') === 'true';

    function visible() {
      var raw = getComputedStyle(row).getPropertyValue('--sp-thumbs');
      var n = parseInt(raw, 10);
      return n > 0 ? n : 1;
    }

    function maxOffset() {
      return Math.max(0, items.length - visible());
    }

    function apply() {
      var max = maxOffset();
      if (offset > max) offset = max;
      if (offset < 0) offset = 0;
      row.style.setProperty('--sp-offset', String(offset));
      if (prev) prev.disabled = offset <= 0;
      if (next) next.disabled = offset >= max;
    }

    /* An arrow or a swipe is the visitor steering. Hover-pause covers a
       mouse, but a touch visitor has no hover, so the window would slide
       out from under them three seconds later. Once they steer, the
       automatic advance stands down for good. */
    function slide(delta) {
      taken = true;
      stop();
      offset += delta;
      apply();
    }

    function advance() {
      var max = maxOffset();
      if (max === 0) return;
      offset = offset >= max ? 0 : offset + 1;
      apply();
    }

    function canRotate() {
      return (
        wantsRotation &&
        !taken &&
        !reduceMotion.matches &&
        !hovering &&
        !document.hidden &&
        !root.contains(document.activeElement) &&
        maxOffset() > 0
      );
    }

    function tick() {
      if (canRotate()) advance();
    }

    function start() {
      if (taken) return;
      if (timer === null) timer = window.setInterval(tick, period);
    }

    function stop() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    /* The hero follows the thumbnail the visitor picks. Variant selection
       deliberately does not touch it: no variant carries its own image yet,
       and when they do this is the one place that has to change. */
    function select(button) {
      var full = button.getAttribute('data-full');
      if (!full) return;
      hero.setAttribute('src', full);
      hero.setAttribute('srcset', button.getAttribute('data-srcset') || '');
      hero.setAttribute('alt', button.getAttribute('data-alt') || '');
      thumbs.forEach(function (other) {
        var on = other === button;
        other.classList.toggle('is-selected', on);
        other.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    thumbs.forEach(function (button) {
      button.addEventListener('click', function () {
        select(button);
      });
    });

    if (prev) prev.addEventListener('click', function () { slide(-1); });
    if (next) next.addEventListener('click', function () { slide(1); });

    /* Pause while the visitor is looking at or tabbing through the strip. */
    if (strip) {
      root.addEventListener('pointerenter', function () { hovering = true; });
      root.addEventListener('pointerleave', function () { hovering = false; });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    /* Swipe. Pointer events cover touch, pen and mouse drag in one path. */
    var startX = null;
    var window_ = root.querySelector('[data-sp-window]');
    if (window_) {
      window_.addEventListener('pointerdown', function (event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        startX = event.clientX;
      });
      window_.addEventListener('pointerup', function (event) {
        if (startX === null) return;
        var delta = event.clientX - startX;
        startX = null;
        if (Math.abs(delta) < 40) return;
        slide(delta < 0 ? 1 : -1);
      });
      window_.addEventListener('pointercancel', function () { startX = null; });
    }

    /* The visible count changes at the breakpoints, so the window has to be
       re-clamped when the viewport crosses one. */
    var resizeFrame = null;
    window.addEventListener('resize', function () {
      if (resizeFrame !== null) return;
      resizeFrame = window.requestAnimationFrame(function () {
        resizeFrame = null;
        apply();
      });
    });

    apply();
    start();
  }

  /* -------------------------------------------------------- configurator */

  function shortLabel(label) {
    return String(label || '').split(' (')[0].trim();
  }

  function initBuy(section) {
    var holder = section.querySelector('[data-sp-config]');
    var buy = section.querySelector('[data-sp-buy]');
    if (!holder || !buy) return;

    var cfg;
    try {
      cfg = JSON.parse(holder.textContent);
    } catch (error) {
      return;
    }

    var mapped = cfg.variants.filter(function (v) {
      return v.model && v.base && v.arm;
    });
    if (!mapped.length) return;

    var selects = {
      model: buy.querySelector('[data-sp-select="model"]'),
      base: buy.querySelector('[data-sp-select="base"]'),
      arm: buy.querySelector('[data-sp-select="arm"]')
    };
    if (!selects.model || !selects.base || !selects.arm) return;

    var other = buy.querySelector('[data-sp-select="other"]');
    var idInput = buy.querySelector('[data-sp-variant-id]');
    var addButton = buy.querySelector('[data-sp-add]');
    var addText = buy.querySelector('[data-sp-add-text]');

    var tables = { model: cfg.models, base: cfg.bases, arm: cfg.arms };

    function lookup(axis, key) {
      var list = tables[axis] || [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].key === key) return list[i];
      }
      return null;
    }

    /* Which keys on `axis` are reachable given the choices already fixed. */
    function reachable(axis, fixed) {
      var keys = [];
      mapped.forEach(function (v) {
        var ok = Object.keys(fixed).every(function (name) {
          return !fixed[name] || v[name] === fixed[name];
        });
        if (ok && keys.indexOf(v[axis]) === -1) keys.push(v[axis]);
      });
      return keys;
    }

    /* Rebuild rather than hide: `hidden` on an <option> is still uneven
       across browsers, and a stale disabled option can be left selected. */
    function fill(select, axis, keys, preferred) {
      var chosen = keys.indexOf(preferred) !== -1 ? preferred : keys[0];
      var order = (tables[axis] || []).filter(function (entry) {
        return keys.indexOf(entry.key) !== -1;
      });
      select.textContent = '';
      order.forEach(function (entry) {
        var option = document.createElement('option');
        option.value = entry.key;
        option.textContent = entry.label;
        if (entry.key === chosen) option.selected = true;
        select.appendChild(option);
      });
      return chosen;
    }

    function find(model, base, arm) {
      for (var i = 0; i < mapped.length; i++) {
        var v = mapped[i];
        if (v.model === model && v.base === base && v.arm === arm) return v;
      }
      return null;
    }

    function setText(attr, value) {
      var node = buy.querySelector('[data-sp-' + attr + ']');
      if (node) node.textContent = value == null ? '' : value;
    }

    function setDescriptor(axis, value) {
      var node = buy.querySelector('[data-sp-descriptor="' + axis + '"]');
      if (node) node.textContent = value || '';
    }

    /* `settled` stays false until the first render has run, so landing on
       the page never rewrites its address: only a choice the visitor makes
       does. */
    var settled = false;

    function applyVariant(variant) {
      if (!variant) return;
      if (idInput) idInput.value = variant.id;
      setText('price', variant.price);
      setText('sku', variant.sku);

      if (addButton) {
        addButton.disabled = !variant.available;
        if (addText) {
          addText.textContent = variant.available ? cfg.cartLabel : cfg.soldOutLabel;
        }
      }

      if (settled && cfg.updateUrl && window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    /* Cascade: model fixes the reachable bases, model+base fix the arms. */
    function refresh() {
      var model = selects.model.value;

      var bases = reachable('base', { model: model });
      var base = fill(selects.base, 'base', bases, selects.base.value);

      var arms = reachable('arm', { model: model, base: base });
      var arm = fill(selects.arm, 'arm', arms, selects.arm.value);

      var modelEntry = lookup('model', model);
      var baseEntry = lookup('base', base);
      var armEntry = lookup('arm', arm);

      setDescriptor('model', modelEntry && modelEntry.descriptor);
      setDescriptor('base', baseEntry && baseEntry.descriptor);
      setDescriptor('arm', armEntry && armEntry.descriptor);

      setText('tpi', modelEntry && modelEntry.tpi);
      setText('res', modelEntry && modelEntry.res);
      setText('travel', modelEntry && modelEntry.travel);
      setText('base', baseEntry && shortLabel(baseEntry.label));
      setText('arm', armEntry && shortLabel(armEntry.label));

      applyVariant(find(model, base, arm));
    }

    Object.keys(selects).forEach(function (axis) {
      selects[axis].addEventListener('change', refresh);
    });

    /* The catch-all only exists when a SKU is missing from the variant map.
       It picks a variant outright, so it bypasses the three axes. */
    if (other) {
      other.addEventListener('change', function () {
        var id = other.value;
        for (var i = 0; i < cfg.variants.length; i++) {
          if (String(cfg.variants[i].id) === String(id)) {
            applyVariant(cfg.variants[i]);
            return;
          }
        }
      });
    }

    refresh();
    settled = true;
  }

  function init(scope) {
    scope.querySelectorAll('[data-sp-gallery]').forEach(initGallery);
    scope.querySelectorAll('.sp-pdp').forEach(initBuy);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(document); });
  } else {
    init(document);
  }

  /* Theme Editor re-renders the whole section on every setting change. */
  document.addEventListener('shopify:section:load', function (event) {
    init(event.target);
  });
})();
