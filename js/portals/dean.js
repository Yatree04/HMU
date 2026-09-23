/* ==========================================================================
   Associate Dean SA portal (IA 56:1114).
   Approvals Queue — IRCC, Department, IR Student and Individual requests;
   Approval detail and documents; Approve with note, Partial approval,
   Reject with reason. History — search by date and type.
   ========================================================================== */
(function () {
  const S = HMS.store.sel, A = HMS.store.act, D = HMS.date, UI = HMS.ui, C = HMS.campus, SH = HMS.shared;
  const { icon, esc, kv } = UI;
  const app = HMS.app;
  const ui = app.ui;
  const render = () => app.render();

  const TABS = [
    { id: "all", label: "All", test: () => true },
    { id: "ircc", label: "IRCC Requests", test: (r) => ["ircc-intern", "event", "exam"].includes(r.type) },
    { id: "dept", label: "Department Requests", test: (r) => r.source === "department" },
    { id: "ir", label: "IR Student Requests", test: (r) => r.type === "ir" },
    { id: "individual", label: "Individual Requests", test: (r) => r.count === 1 },
  ];
  const waiting = () => S.requests().filter((r) => r.status === "dean").sort((a, b) => a.requestedOn.localeCompare(b.requestedOn));
  const decided = () => S.requests().filter((r) => (r.timeline || []).some((e) => e.role === "dean"));

  function queue(ctx) {
    const u = ctx.ui.dean;
    const tab = TABS.find((t) => t.id === u.tab) || TABS[0];
    const all = waiting();
    const list = all.filter(tab.test);
    const t = S.turnaround();
    const oldest = all.length ? D.days(all[0].requestedOn, HMS.TODAY) : 0;
    return `<section>
      <div class="page-head"><h1 class="page-title">Approvals Queue</h1></div>
      <div class="stats stats-4">
        <div class="stat stat-sm"><div class="stat-label">Waiting for you</div><div class="stat-value"><b>${all.length}</b><small>requests</small></div></div>
        <div class="stat stat-sm"><div class="stat-label">People in them</div><div class="stat-value"><b>${all.reduce((n, r) => n + r.count, 0)}</b></div></div>
        <div class="stat stat-sm"><div class="stat-label">Oldest waiting</div><div class="stat-value"><b>${oldest}</b><small>days</small></div></div>
        <div class="stat stat-sm"><div class="stat-label">Your average decision time</div><div class="stat-value"><b>${t.dean}</b><small>days</small></div></div>
      </div>
      <div class="tabs" role="tablist">${TABS.map((x) => `<button class="tab" role="tab" aria-selected="${x.id === tab.id}" data-act="deanTab" data-tab="${x.id}">${x.label} <span class="muted">${all.filter(x.test).length}</span></button>`).join("")}</div>
      ${list.length ? `<div class="queue">${list.map((r) => {
        const age = D.days(r.requestedOn, HMS.TODAY);
        const clash = S.requests().filter((o) => o.id !== r.id && ["dean", "hcu", "pending", "accepted", "allotted"].includes(o.status) && o.count >= 10 && D.rangesOverlap(o.from, o.to, r.from, r.to));
        return `<article class="q-row" data-act="go" data-href="#/dean/approvals/${r.id}" role="button" tabindex="0">
          <div class="q-main"><div class="req-kind">${esc(SH.typeLabel(r))} · ${esc(r.requestedBy)}</div><h3>${esc(r.title)}</h3>
            <p>${esc(r.comments)}</p>
            ${clash.length ? `<span class="badge badge-warn">Overlaps ${esc(clash[0].title)}${clash.length > 1 ? ` +${clash.length - 1}` : ""}</span>` : ""}</div>
          <dl class="q-facts">${kv("People", r.count + " · " + esc(r.gender))}${kv("Dates", D.fmt(r.from) + " – " + D.fmt(r.to))}${kv("Nights", D.days(r.from, r.to))}${kv("Documents", (r.documents || []).length)}</dl>
          <div class="q-age"><span class="badge ${age > 3 ? "badge-danger" : "badge-grey"}">${age === 0 ? "Today" : age + " day" + (age > 1 ? "s" : "") + " waiting"}</span><span class="btn btn-primary">Review ${icon("caretRight")}</span></div>
        </article>`;
      }).join("")}</div>` : `<div class="empty"><strong>Nothing waiting</strong>New department, IRCC and event requests appear here first.</div>`}
    </section>`;
  }

  function review(ctx, id) {
    const r = S.request(id);
    if (!r) return `<div class="empty"><strong>Request not found</strong></div>`;
    const d = ctx.ui.dean;
    if (d.reviewId !== id) { d.reviewId = id; d.keep = [...r.guestIds]; d.from = r.from; d.to = r.to; d.mode = "full"; d.note = ""; }
    const guests = r.guestIds.map((g) => S.guest(g));
    const decision = r.status === "dean" ? `<div class="pcard decision">
        <h2>Your decision</h2>
        <div class="seg" role="group" aria-label="Decision type"><button aria-pressed="${d.mode === "full"}" data-act="deanMode" data-mode="full">Approve all</button><button aria-pressed="${d.mode === "partial"}" data-act="deanMode" data-mode="partial">Partial approval</button></div>
        ${d.mode === "partial" ? `<p class="muted" style="font-size:12px;margin:12px 0 6px">Untick people you don't approve, or shorten the dates.</p>
          <div class="pgrid" style="margin-bottom:10px"><label class="field"><span>From</span><input class="input" type="date" value="${d.from}" data-on-change="deanDate" data-k="from"></label><label class="field"><span>To</span><input class="input" type="date" value="${d.to}" data-on-change="deanDate" data-k="to"></label></div>
          <div class="check-list">${guests.map((g) => `<label><input type="checkbox" class="checkbox" data-on-change="deanKeep" data-id="${g.id}" ${d.keep.includes(g.id) ? "checked" : ""}> ${esc(g.name)} <small class="muted">${esc(g.gender)} · ${esc(g.relation)}</small></label>`).join("")}</div>
          <p class="muted" style="font-size:12px">${d.keep.length} of ${guests.length} approved.</p>` : ""}
        <label class="field" style="margin-top:12px"><span>Note to HCU and the requester</span><textarea class="input" id="dean-note" rows="3" data-on-input="deanNote" placeholder="e.g. Approved. Keep them close to IDC if possible.">${esc(d.note || "")}</textarea></label>
        <div class="row-end" style="margin-top:14px">
          <button class="btn btn-danger btn-lg" data-act="deanReject" data-id="${r.id}">${icon("x")} Reject with reason</button>
          <button class="btn btn-primary btn-lg" data-act="deanApprove" data-id="${r.id}" ${d.mode === "partial" && !d.keep.length ? "disabled" : ""}>${icon("check")} ${d.mode === "partial" ? "Approve " + d.keep.length : "Approve with note"}</button>
        </div>
      </div>` : "";
    return `<section>
      <button class="back" data-act="go" data-href="#/dean/approvals">${icon("caretLeft")} Approvals Queue</button>
      <div class="page-head"><h1 class="page-title">Approval<span class="sep">|</span>${esc(r.id)}</h1></div>
      ${SH.requestDetail(r, { extra: decision })}
    </section>`;
  }

  function history(ctx) {
    const h = ctx.ui.deanHist;
    let list = decided();
    if (h.q) { const q = h.q.toLowerCase(); list = list.filter((r) => (r.title + r.requestedBy).toLowerCase().includes(q)); }
    if (h.type) list = list.filter((r) => r.type === h.type);
    if (h.from) list = list.filter((r) => r.from >= h.from);
    if (h.to) list = list.filter((r) => r.to <= h.to);
    const dec = (r) => r.timeline.filter((e) => e.role === "dean").slice(-1)[0];
    list.sort((a, b) => dec(b).at.localeCompare(dec(a).at));
    return `<section>
      <div class="page-head"><h1 class="page-title">History</h1></div>
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="search">${icon("search")}<input class="input" type="search" placeholder="Search by name or requester" value="${esc(h.q)}" data-on-input="deanHist" data-k="q"></span>
          <span class="mini-select"><select data-on-change="deanHist" data-k="type"><option value="">All types</option>${Object.entries(C.TYPES).filter(([, t]) => t.dean).map(([k, t]) => `<option value="${k}" ${h.type === k ? "selected" : ""}>${esc(t.label)}</option>`).join("")}</select>${icon("caretDown")}</span>
          <label class="field inline"><span>Stay from</span><input class="input" type="date" value="${h.from}" data-on-change="deanHist" data-k="from"></label>
          <label class="field inline"><span>to</span><input class="input" type="date" value="${h.to}" data-on-change="deanHist" data-k="to"></label>
        </div>
      </div>
      ${list.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Decided</th><th>Request</th><th>Type</th><th>From</th><th>People</th><th>Stay</th><th>Decision</th><th>Now</th></tr></thead><tbody>
        ${list.map((r) => { const e = dec(r); return `<tr data-act="go" data-href="#/dean/approvals/${r.id}" class="click-row"><td>${D.fmt(e.at)}</td><td>${esc(r.title)}</td><td style="font-weight:400">${esc(SH.typeLabel(r))}</td><td style="font-weight:400">${esc(r.requestedBy)}</td><td>${r.count}</td><td>${D.fmt(r.from)} – ${D.fmt(r.to)}</td><td><span class="badge ${e.act === "rejected" ? "badge-danger" : "badge-teal"}">${e.act === "partial" ? "Partly approved" : e.act === "rejected" ? "Rejected" : "Approved"}</span></td><td>${SH.badge(r.status)}</td></tr>`; }).join("")}
      </tbody></table></div>` : `<div class="empty"><strong>No decisions match</strong></div>`}
    </section>`;
  }

  const handlers = {
    deanTab: (el) => { ui.dean.tab = el.dataset.tab; render(); },
    deanMode: (el) => { ui.dean.mode = el.dataset.mode; render(); },
    deanKeep: (el) => { const id = el.dataset.id; ui.dean.keep = el.checked ? [...new Set([...ui.dean.keep, id])] : ui.dean.keep.filter((x) => x !== id); render(); },
    deanDate: (el) => { ui.dean[el.dataset.k] = el.value; render(); },
    deanApprove: (el) => {
      const r = S.request(el.dataset.id); const note = (ui.dean.note || "").trim();
      const d = ui.dean;
      if (d.mode === "partial") {
        if (d.to < d.from) return UI.toast("End date must be after the start.");
        A.deanApprove(r.id, note, d.keep, { from: d.from, to: d.to });
      } else A.deanApprove(r.id, note);
      d.reviewId = null;
      app.go("#/dean/approvals");
      UI.toast(`Approved “${r.title}”. HCU will pick a hostel; ${r.requestedBy} has been told.`);
    },
    deanReject: (el) => {
      const r = S.request(el.dataset.id);
      app.form("Reject “" + r.title + "”?", `<label class="field"><span>Reason (sent to ${esc(r.requestedBy)})</span><textarea class="input" name="reason" rows="3" placeholder="e.g. Minors can't stay in student hostels. Please use the guest house."></textarea></label>`, "Reject",
        (v) => { if (!v.reason.trim()) return "Add a reason so they know what to change."; A.deanReject(r.id, v.reason.trim()); ui.dean.reviewId = null; setTimeout(() => app.go("#/dean/approvals"), 0); UI.toast("Rejected. " + r.requestedBy + " has been told."); }, { danger: true });
    },
    deanNote: (el) => { ui.dean.note = el.value; },
    deanHist: (el) => { ui.deanHist[el.dataset.k] = el.value; render(); },
  };

  app.portal({
    id: "dean",
    defaultPath: "approvals",
    nav: [["approvals", "Approvals Queue"], ["history", "History"]],
    title: (r) => (r.path === "history" ? "History" : "Approvals"),
    init(u) { u.dean = { tab: "all", reviewId: null, keep: [], mode: "full", from: "", to: "" }; u.deanHist = { q: "", type: "", from: "", to: "" }; },
    render(route, ctx) {
      if (route.path === "history") return history(ctx);
      return route.id ? review(ctx, route.id) : queue(ctx);
    },
    handlers,
  });
})();
