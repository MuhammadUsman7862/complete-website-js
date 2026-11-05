/* =====================================================================
   Bloomrix Internship Portal - PART B: jQUERY VERSION (selected features)
   Rebuilds the assignment list + modal with jQuery, and adds a "quick notes"
   component. Needs jQuery 3.x loaded before this file.

   VANILLA vs JQUERY - quick comparison
   -------------------------------------------------------------------------
   Task              Vanilla (app.js)                    jQuery (this file)
   Select            document.querySelector(All)         $('selector')
   Ready             script is deferred / DOMContentLoaded  $(function () {...})
   Text / HTML       el.textContent = x                  $el.text(x)
   Classes           el.classList.add/remove/toggle      $el.addClass/removeClass/toggleClass
   Events            el.addEventListener('click', fn)    $el.on('click', fn)
   Delegation        e.target.closest(sel) in 1 listener $list.on('click', sel, fn)
   Parent / child    el.closest(), el.querySelector()    $el.closest(), $el.find()
   Siblings          el.nextElementSibling, loops        $el.next(), $el.siblings()
   Load JSON         fetch(url).then(r => r.json())      $.getJSON(url) / $.ajax()
   Show / hide       el.hidden, CSS transitions          .fadeIn() .slideToggle() (built in)
   Trade-off: jQuery is shorter and chainable, but adds ~30 KB and most of it
   is now covered by native browser APIs. Vanilla is faster and dependency-free.
   ===================================================================== */
(function () {
  'use strict';
  if (!window.jQuery) {                                   // CDN blocked / offline
    console.warn('jQuery did not load - the jQuery demo is disabled.');
    document.getElementById('jq-count').textContent = 'jQuery could not be loaded (check your internet connection).';
    return;
  }

  $(function () {                                         // DOM-ready
    $.fx.off = window.matchMedia('(prefers-reduced-motion: reduce)').matches;   // respect reduced motion

    const LABELS = { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed' };
    const BADGE = { pending: 'badge', 'in-progress': 'badge badge--wip', completed: 'badge badge--done' };
    const NEXT = { pending: 'in-progress', 'in-progress': 'completed', completed: 'pending' };
    const $list = $('#jq-list');
    let items = [], currentId = null;

    /* ---------- Notifications (effects: fadeIn, delay, fadeOut) ---------- */
    function toast(msg, type) {
      const icon = type === 'error' ? '\u26A0' : '\u2713';
      $('<div>', { class: 'toast toast--' + (type || 'success'), text: icon + ' ' + msg })
        .hide().appendTo('#toasts').fadeIn(150).delay(2500)
        .fadeOut(300, function () { $(this).remove(); });
    }

    /* ---------- AJAX: load JSON (fallback to inline data when file:// blocks it) ---------- */
    $.ajax({ url: 'data/assignments.json', dataType: 'json' })
      .done(function (data) { items = data; render(); })
      .fail(function () {
        items = JSON.parse($('#assignments-fallback').text());
        render();
        toast('Loaded built-in data (run a local server to use AJAX).', 'error');
      });

    /* ---------- Build one card (jQuery equivalent of the <template> clone) ---------- */
    function buildCard(a) {
      return $('<li>', { class: 'card-slot' }).attr('data-id', a.id).append(
        $('<article>', { class: 'card card--task' }).append(
          $('<div>').append(
            $('<h3>').text('Week ' + a.week + ': ' + a.title),
            $('<p>').text(a.description),
            $('<p>', { class: 'card__more list-meta' }).text(a.category + ' \u00B7 Due ' + a.due).hide(),
            $('<p>').append(
              $('<button>', { type: 'button', class: 'btn btn--outline btn--sm js-details', text: 'Details' }),
              ' ',
              $('<button>', { type: 'button', class: 'btn btn--outline btn--sm js-toggle', 'aria-expanded': 'false', text: 'More info' }))
          ),
          $('<button>', { type: 'button', class: BADGE[a.status], 'data-status': a.status, text: LABELS[a.status] })
        ));
    }

    function render() {
      const term = $.trim($('#jq-search').val()).toLowerCase();
      const status = $('#jq-filter').val();
      const rows = $.grep(items, function (a) {                // $.grep = Array.filter
        return (status === 'all' || a.status === status) &&
          (a.title + ' ' + a.description + ' ' + a.category).toLowerCase().indexOf(term) !== -1;
      });
      $list.empty();
      $.each(rows, function (i, a) { buildCard(a).hide().appendTo($list).fadeIn(250); });   // effect 1: fadeIn
      $('#jq-count').text('Showing ' + rows.length + ' of ' + items.length + ' assignments.');
      statusSummaryJQ();
    }

    /* The function that is converted back to Vanilla JS in app.js (statusSummaryVanilla) */
    function statusSummaryJQ() {
      const $badges = $list.find('.badge');
      const n = function (s) { return $badges.filter('[data-status="' + s + '"]').length; };
      $('#jq-summary').text(n('completed') + ' completed, ' + n('in-progress') + ' in progress, ' + n('pending') + ' pending.');
    }

    $('#jq-search').on('input', render);
    $('#jq-filter').on('change', render);

    /* ---------- Delegated events + traversal on the dynamic list ---------- */
    // Select a card: addClass on this <li>, removeClass on its siblings
    $list.on('click', 'li', function () {
      $(this).addClass('is-selected').siblings().removeClass('is-selected');
    });

    // Toggle extra info: closest() -> find() -> slideToggle()   (effect 2: slideToggle)
    $list.on('click', '.js-toggle', function () {
      const $btn = $(this), open = $btn.attr('aria-expanded') === 'true';
      $btn.closest('.card').find('.card__more').slideToggle(200);
      $btn.attr('aria-expanded', String(!open)).text(open ? 'More info' : 'Less info');
    });

    // Cycle status: closest('li') gives the card, data('id') reads data-id (as a number)
    $list.on('click', '.badge', function () {
      const id = $(this).closest('li').data('id');
      const a = $.grep(items, function (x) { return x.id === id; })[0];
      a.status = NEXT[a.status];
      $(this).attr('data-status', a.status).attr('class', BADGE[a.status]).text(LABELS[a.status]);
      statusSummaryJQ();
      toast('Week ' + a.week + ' is now "' + LABELS[a.status] + '"');
    });

    $list.on('click', '.js-details', function (e) {
      e.stopPropagation();
      openModal($(this).closest('li').data('id'));
    });

    /* ---------- jQuery modal (effects: fadeIn / fadeOut) ---------- */
    const $modal = $('#jq-modal');
    function openModal(id) {
      const a = $.grep(items, function (x) { return x.id === id; })[0];
      currentId = id;
      $('#jq-modal-title').text('Week ' + a.week + ': ' + a.title);
      $('#jq-modal-body').text(a.description);
      $('#jq-modal-meta').text(a.category + ' \u00B7 Due ' + a.due + ' \u00B7 ' + LABELS[a.status]);
      // traversal: is there a next card after the current one?
      $('#jq-modal-next').prop('disabled', !$list.find('li[data-id="' + id + '"]').next().length);
      if (!$modal.is(':visible')) { $modal.fadeIn(200); }
      $('#jq-modal-close').trigger('focus');
    }
    function closeModal() { $modal.fadeOut(150); }
    $('#jq-modal-close').on('click', closeModal);
    $modal.on('click', function (e) { if (e.target === this) { closeModal(); } });   // overlay click
    $(document).on('keydown', function (e) { if (e.key === 'Escape' && $modal.is(':visible')) { closeModal(); } });
    $('#jq-modal-next').on('click', function () {
      const $next = $list.find('li[data-id="' + currentId + '"]').next();                // traversal: next()
      if ($next.length) { openModal($next.data('id')); }
    });

    /* ---------- Quick notes: jQuery form + delegated remove ---------- */
    $('#jq-note-form').on('submit', function (e) {
      e.preventDefault();
      const $input = $(this).find('input');
      const text = $.trim($input.val());
      if (!text) {
        $input.addClass('is-invalid').trigger('focus');
        toast('Please type a note first.', 'error');
        return;
      }
      $input.removeClass('is-invalid');
      $('<li>').append($('<span>').text(text),
        $('<button>', { type: 'button', class: 'btn btn--outline btn--sm js-remove', text: 'Remove', 'aria-label': 'Remove note: ' + text }))
        .hide().appendTo('#jq-notes').slideDown(200);
      this.reset();
    });
    $('#jq-notes').on('click', '.js-remove', function () {
      $(this).parent().slideUp(200, function () { $(this).remove(); });   // parent() traversal
    });
  });
})();
