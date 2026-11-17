/* Smooth FAQ disclosure for browsers without ::details-content.
 *
 * Chrome, Edge and recent Safari animate the row from CSS alone
 * (blocks/sp-faq-row.liquid). This file is the fallback for the browsers that
 * do not support that pseudo-element yet — Firefox, older Safari — and it bails
 * out immediately where the CSS already works, so the two never both run.
 *
 * Clicks are delegated from the document rather than bound per row, so rows the
 * Theme Editor re-renders are picked up with no re-initialisation.
 */
(function () {
  if (window.__spFaqReady) return;
  window.__spFaqReady = true;

  // Where the CSS can do it, let it.
  if (window.CSS && CSS.supports && CSS.supports('selector(::details-content)')) return;

  var DURATION = 320;
  var EASING = 'cubic-bezier(0.2, 0.6, 0.2, 1)';

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  document.addEventListener('click', function (event) {
    var summary = event.target.closest && event.target.closest('.sp-faq-row__q');
    if (!summary) return;

    var row = summary.parentElement;
    if (!row || row.tagName !== 'DETAILS') return;

    var panel = row.querySelector('.sp-faq-row__a');
    if (!panel || !panel.animate || reduced()) return; // native toggle

    event.preventDefault();

    if (row.dataset.spAnimating === 'true') return;
    row.dataset.spAnimating = 'true';

    var opening = !row.open;
    if (opening) row.open = true; // render the panel so it can be measured

    var height = panel.scrollHeight;
    var from = opening ? 0 : height;
    var to = opening ? height : 0;

    var animation = panel.animate(
      { height: [from + 'px', to + 'px'], opacity: opening ? [0, 1] : [1, 0] },
      { duration: DURATION, easing: EASING }
    );

    panel.style.overflow = 'hidden';

    animation.onfinish = function () {
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('height');
      if (!opening) row.open = false;
      row.dataset.spAnimating = 'false';
    };
  });
})();
