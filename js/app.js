/* =====================================================================
   Bloomrix Internship Portal - PART A: VANILLA JAVASCRIPT (no libraries)
   Features: theme + saved statuses (localStorage), fetch JSON, render with
   <template>, search/filter, delegated clicks, <dialog> modal, toasts,
   application form validation.
   ===================================================================== */
(() => {
  'use strict';

  const KEYS = { theme: 'bloomrix.theme', status: 'bloomrix.status', apps: 'bloomrix.applications' };
  const LABELS = { pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed' };
  const BADGE = { pending: 'badge', 'in-progress': 'badge badge--wip', completed: 'badge badge--done' };
  const NEXT = { pending: 'in-progress', 'in-progress': 'completed', completed: 'pending' };
  const qs = (sel, root = document) => root.querySelector(sel);

  /* ---------- localStorage helpers (try/catch: storage can be blocked) ---------- */
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } }
  };

  /* ---------- Notifications ---------- */
  function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = `${type === 'error' ? '\u26A0' : type === 'success' ? '\u2713' : '\u2139'} ${message}`;
    qs('#toasts').append(el);
    setTimeout(() => el.remove(), 3000);
  }

  /* ---------- Theme: restore the saved radio, save on change ---------- */
  function initTheme() {
    const radio = qs(`#theme-${store.get(KEYS.theme, 'system')}`);
    if (radio) radio.checked = true;                       // CSS :has(:checked) does the rest
    document.querySelectorAll('input[name="theme"]').forEach(r =>
      r.addEventListener('change', () => {
        const name = r.id.replace('theme-', '');
        store.set(KEYS.theme, name);
        toast(`Theme saved: ${name}`, 'success');
      }));
  }

  /* ---------- Assignment list component ---------- */
  let items = [];
  const list = qs('#va-list'), countEl = qs('#va-count'), modal = qs('#va-modal');

  async function loadAssignments() {
    try {
      const res = await fetch('data/assignments.json');   // fails on file:// - fallback below
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (err) {
      console.warn('fetch failed, using inline fallback:', err);
      toast('Loaded built-in data (run a local server to use fetch).', 'info');
      return JSON.parse(qs('#assignments-fallback').textContent);
    }
  }

  function persistStatuses() { store.set(KEYS.status, Object.fromEntries(items.map(a => [a.id, a.status]))); }

  function render(focusId) {
    const term = qs('#va-search').value.trim().toLowerCase();
    const status = qs('#va-filter').value;
    const rows = items.filter(a =>
      (status === 'all' || a.status === status) &&
      `${a.title} ${a.description} ${a.category}`.toLowerCase().includes(term));

    const tpl = qs('#task-card');
    list.replaceChildren(...rows.map(a => {
      const node = tpl.content.cloneNode(true);
      node.querySelector('li').dataset.id = a.id;
      node.querySelector('h3').textContent = `Week ${a.week}: ${a.title}`;   // textContent = safe, no HTML injection
      node.querySelector('.desc').textContent = a.description;
      node.querySelector('.meta').textContent = `${a.category} \u00B7 Due ${a.due}`;
      const badge = node.querySelector('.badge');
      badge.className = BADGE[a.status];
      badge.dataset.status = a.status;
      badge.textContent = LABELS[a.status];
      return node;
    }));
    qs('#va-empty').hidden = rows.length > 0;
    countEl.textContent = `Showing ${rows.length} of ${items.length} assignments. ${statusSummaryVanilla()}`;
    if (focusId) qs(`li[data-id="${focusId}"] .badge`, list)?.focus();
  }

  /* ---------- Modal (native <dialog>) ---------- */
  function openModal(a) {
    qs('#va-modal-title').textContent = `Week ${a.week}: ${a.title}`;
    qs('#va-modal-body').textContent = a.description;
    qs('#va-modal-meta').textContent = `${a.category} \u00B7 Due ${a.due} \u00B7 ${LABELS[a.status]}`;
    modal.showModal();                                    // focus trap + Esc + ::backdrop for free
  }
  qs('#va-modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });   // click on backdrop

  /* ---------- Delegated events: one listener serves every dynamic card ---------- */
  list.addEventListener('click', e => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const a = items.find(x => x.id === Number(li.dataset.id));
    if (e.target.closest('.js-details')) openModal(a);
    else if (e.target.closest('.badge')) {
      a.status = NEXT[a.status];
      persistStatuses();
      render(a.id);
      toast(`Week ${a.week} is now "${LABELS[a.status]}"`, 'success');
    }
  });
  qs('#va-search').addEventListener('input', () => render());
  qs('#va-filter').addEventListener('change', () => render());

  /* ---------- Application form ---------- */
  function initForm() {
    const form = qs('form.form');
    form.addEventListener('submit', e => {
      e.preventDefault();                                 // stay on the page; no real server here
      if (!form.checkValidity()) {
        form.reportValidity();
        toast('Please fix the highlighted fields.', 'error');
        return;
      }
      const data = Object.fromEntries(new FormData(form));
      data.resume = data.resume?.name;                    // store the file name only
      delete data.samples; delete data.password;          // never store passwords
      const apps = store.get(KEYS.apps, []);
      apps.push({ ...data, submittedAt: new Date().toISOString() });
      store.set(KEYS.apps, apps);
      toast(`Thanks ${data.fname}! Application saved (${apps.length} total).`, 'success');
      form.reset();
    });
    form.addEventListener('reset', () => toast('Form cleared.', 'info'));
  }

  /* ---------------------------------------------------------------------
     CONVERTED BACK TO VANILLA: jQuery -> Vanilla (see statusSummaryJQ in app-jquery.js)

       jQuery original                          Vanilla equivalent
       --------------------------------------   ------------------------------------------
       $('#jq-list .badge')                     document.querySelectorAll('#va-list .badge')
       $badges.filter('[data-status="x"]')      [...nodeList].filter(b => b.dataset.status === 'x')
       .length                                  .length (NodeList is not an Array: spread it first)
       $('#jq-summary').text(str)               element.textContent = str
     --------------------------------------------------------------------- */
  function statusSummaryVanilla() {
    const badges = [...document.querySelectorAll('#va-list .badge')];
    const n = s => badges.filter(b => b.dataset.status === s).length;
    return `${n('completed')} completed, ${n('in-progress')} in progress, ${n('pending')} pending.`;
  }

  /* ---------- Start ---------- */
  initTheme();
  initForm();
  loadAssignments().then(data => {
    const saved = store.get(KEYS.status, {});
    items = data.map(a => ({ ...a, status: saved[a.id] || a.status }));
    render();
  });
})();
