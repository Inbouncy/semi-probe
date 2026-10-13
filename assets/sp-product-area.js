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

    var viewport = root.querySelector('[data-sp-viewport]');
    var offset = 0;
    var timer = null;
    var hovering = false;
    var taken = false;
    var zoomLoaded = false;
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
      hero.setAttribute('data-zoom-src', button.getAttribute('data-zoom') || '');
      zoomLoaded = false;
      thumbs.forEach(function (other) {
        var on = other === button;
        other.classList.toggle('is-selected', on);
        other.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    /* The magnifier. The resting page loads a rendition sized for the
       viewport; enlarging that would only show bigger soft pixels. So the
       first time a visitor hovers, the full-size rendition is fetched in the
       background and swapped in once it has decoded — never mid-paint, and
       never if they picked a different photograph while it was loading. */
    function loadZoomSource() {
      if (zoomLoaded) return;
      var wanted = hero.getAttribute('data-zoom-src');
      if (!wanted) return;
      zoomLoaded = true;
      var pre = new Image();
      pre.onload = function () {
        if (hero.getAttribute('data-zoom-src') !== wanted) return;
        hero.removeAttribute('srcset');
        hero.removeAttribute('sizes');
        hero.setAttribute('src', wanted);
      };
      pre.onerror = function () { zoomLoaded = false; };
      pre.src = wanted;
    }

    /* The lens. A mouse opens it by hovering; a finger opens it by pressing
       and holding, which is what a touch visitor already expects and the
       only way the badge's promise means anything on a phone. */
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function aimAt(clientX, clientY) {
      var box = viewport.getBoundingClientRect();
      if (!box.width || !box.height) return;
      var x = ((clientX - box.left) / box.width) * 100;
      var y = ((clientY - box.top) / box.height) * 100;
      hero.style.transformOrigin = x.toFixed(2) + '% ' + y.toFixed(2) + '%';
    }

    function openLens() {
      loadZoomSource();
      viewport.classList.add('is-zooming');
    }

    function closeLens() {
      viewport.classList.remove('is-zooming');
      hero.style.transformOrigin = '';
    }

    if (viewport) {
      if (finePointer) {
        viewport.addEventListener('pointerenter', openLens);
        viewport.addEventListener('pointerleave', closeLens);
        viewport.addEventListener('pointermove', function (event) {
          aimAt(event.clientX, event.clientY);
        });
      }

      /* Press and hold. The hold has to outlast a flick, or the lens would
         swallow every scroll that begins on the photograph; and the finger
         has to stay roughly still, or an early drag cancels it. Once open,
         the finger drags the magnified view around and lifting closes it. */
      var HOLD_MS = 220;
      var SLOP_PX = 10;
      var holdTimer = null;
      var pressAt = null;
      var held = false;

      function cancelHold() {
        if (holdTimer !== null) {
          window.clearTimeout(holdTimer);
          holdTimer = null;
        }
        pressAt = null;
      }

      viewport.addEventListener('pointerdown', function (event) {
        if (event.pointerType === 'mouse') return;
        cancelHold();
        pressAt = { x: event.clientX, y: event.clientY, id: event.pointerId };
        holdTimer = window.setTimeout(function () {
          holdTimer = null;
          if (!pressAt) return;
          held = true;
          try {
            viewport.setPointerCapture(pressAt.id);
          } catch (error) {
            /* capture is a convenience, not a requirement */
          }
          openLens();
          aimAt(pressAt.x, pressAt.y);
        }, HOLD_MS);
      });

      viewport.addEventListener(
        'pointermove',
        function (event) {
          if (event.pointerType === 'mouse') return;
          if (!held) {
            if (!pressAt) return;
            var dx = event.clientX - pressAt.x;
            var dy = event.clientY - pressAt.y;
            if (Math.sqrt(dx * dx + dy * dy) > SLOP_PX) cancelHold();
            return;
          }
          /* The lens is open, so this drag aims it rather than scrolling. */
          event.preventDefault();
          aimAt(event.clientX, event.clientY);
        },
        { passive: false }
      );

      function endPress(event) {
        if (event && event.pointerType === 'mouse') return;
        cancelHold();
        if (held) {
          held = false;
          closeLens();
        }
      }

      viewport.addEventListener('pointerup', endPress);
      viewport.addEventListener('pointercancel', endPress);

      /* A long press on an image otherwise raises the save/share sheet. */
      viewport.addEventListener('contextmenu', function (event) {
        if (held) event.preventDefault();
      });

      /* Without hover there is nothing to discover the lens by, so the badge
         says how to open it. */
      if (!finePointer) {
        var badge = root.querySelector('[data-sp-badge]');
        var touchLabel = badge && badge.getAttribute('data-touch-label');
        if (badge && touchLabel) badge.textContent = touchLabel;
      }
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

  /* The Compare Models table sits in its own section further down the page
     and its Select buttons drive this configurator, which is what the
     design's note on that table describes. The listener is delegated from
     the document and registered once, because the two sections re-render
     independently in the Theme Editor and a per-section listener would
     stack up a duplicate on every edit. */
  function modelButtons() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-sp-select-model]'));
  }

  function syncModelButtons(model) {
    modelButtons().forEach(function (button) {
      var on = button.getAttribute('data-sp-select-model') === model;
      button.classList.toggle('is-current', on);
      var label = on
        ? button.getAttribute('data-selected-label')
        : button.getAttribute('data-select-label');
      if (label) button.textContent = label;
    });
  }

  /* The Specifications section further down binds its values to this
     configurator through [data-sp-spec] placeholders, so it never has to
     know how the variant map works - it just names the value it wants. */
  function syncLiveSpecs(values) {
    var nodes = document.querySelectorAll('[data-sp-spec]');
    Array.prototype.forEach.call(nodes, function (node) {
      var key = node.getAttribute('data-sp-spec');
      if (!Object.prototype.hasOwnProperty.call(values, key)) return;
      node.textContent = values[key] == null ? '' : values[key];
    });
  }

  /* The Documentation list highlights the row for the model being
     configured. Figma pins that highlight to MA-9100, but the row is
     labelled "(Selected Model)", which stops being true the moment a
     visitor picks another - so it follows the selection instead. */
  function syncDocRows(model) {
    var rows = document.querySelectorAll('[data-sp-doc-model]');
    Array.prototype.forEach.call(rows, function (row) {
      var on = row.getAttribute('data-sp-doc-model') === model;
      row.classList.toggle('is-current', on);
      var suffix = row.querySelector('[data-sp-doc-suffix]');
      if (suffix) suffix.hidden = !on;
    });
  }

  function scrollToConfigurator() {
    var target = document.querySelector('.sp-pdp__col--buy') ||
      document.querySelector('[data-sp-select="model"]');
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  var modelPickerBound = false;

  function bindModelPicker() {
    if (modelPickerBound) return;
    modelPickerBound = true;
    document.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-sp-select-model]');
      if (!button) return;
      var select = document.querySelector('[data-sp-select="model"]');
      if (!select) return;
      var wanted = button.getAttribute('data-sp-select-model');
      var match = Array.prototype.slice.call(select.options).some(function (option) {
        return option.value === wanted;
      });
      if (!match) return;
      select.value = wanted;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      scrollToConfigurator();
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest) return;
      if (!event.target.closest('[data-sp-scroll-to-config]')) return;
      scrollToConfigurator();
    });
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

    var selects = {
      model: buy.querySelector('[data-sp-select="model"]'),
      base: buy.querySelector('[data-sp-select="base"]'),
      arm: buy.querySelector('[data-sp-select="arm"]')
    };

    var other = buy.querySelector('[data-sp-select="other"]');
    var idInput = buy.querySelector('[data-sp-variant-id]');
    var addButton = buy.querySelector('[data-sp-add]');
    var addText = buy.querySelector('[data-sp-add-text]');
    var hasAxes = !!(mapped.length && selects.model && selects.base && selects.arm);

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

      /* Only an explicit false means sold out. This product does not track
         inventory, so every variant is purchasable; if the flag ever went
         missing, defaulting to purchasable loses a sale far less often than
         defaulting to SOLD OUT does. */
      if (addButton) {
        var soldOut = variant.available === false;
        addButton.disabled = soldOut;
        if (addText) {
          addText.textContent = soldOut ? cfg.soldOutLabel : cfg.cartLabel;
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

      syncModelButtons(model);
      syncDocRows(model);

      var variant = find(model, base, arm);
      var baseShort = baseEntry ? shortLabel(baseEntry.label) : '';
      var armShort = armEntry ? shortLabel(armEntry.label) : '';
      syncLiveSpecs({
        model: model,
        tpi: modelEntry && modelEntry.tpi,
        resolution: modelEntry && modelEntry.res,
        travel: modelEntry && modelEntry.travel,
        base: baseShort,
        arm: armShort,
        sku: variant && variant.sku,
        config: [model, armShort, baseShort].filter(Boolean).join(' ')
      });

      applyVariant(variant);
    }

    if (hasAxes) {
      Object.keys(selects).forEach(function (axis) {
        selects[axis].addEventListener('change', refresh);
      });
    }

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

    bindModelPicker();
    if (hasAxes) refresh();
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
