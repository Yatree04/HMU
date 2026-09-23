/* ==========================================================================
   Hall Manager · Requests — Figma 238:4593 (All), 238:4993 (Student)
   Group requests carry the teal right edge. Book dialog — Figma 306:2388.
   Requests reach this page after HCU routes them to Hostel 17 (or straight
   from a Hostel 17 student for guests). Student forms have their own tab.
   ========================================================================== */
window.HMS = window.HMS || {};
HMS.views = HMS.views || {};

HMS.views.requests = (function () {
  const { icon, esc, kv, phoneMask } = HMS.ui;
  const D = HMS.date;
  const S = HMS.store.sel;
  const SH = HMS.shared;

  const open = (r) => r.status === "pending" || r.status === "accepted";
  const TABS = [
    { id: "all", label: "All", test: open },
    { id: "student", label: "Student Requests", test: (r) => r.source === "student" && open(r) },
    { id: "group", label: "Department, IRCC & HCU", test: (r) => r.source !== "student" && open(r) },
    { id: "allotted", label: "Allotted", test: (r) => r.status === "allotted" },
    { id: "past", label: "Past Requests", test: (r) => ["completed", "rejected", "cancelled"].includes(r.status) },
    { id: "forms", label: "Student Forms", forms: true },
  ];

  function card(r) {
    const group = r.kind === "group";
    const days = D.days(r.from, r.to) + 1;
    const f1 = group ? kv("Number of Guests", /^\d+ /.test(r.title) ? esc(r.title) : `${r.count} · ${esc(r.title)}`) : kv("Name", esc(r.requestedBy === "Hall Manager" ? r.title : r.requestedBy));
    const f5 = group ? kv("Requested by", esc(r.requestedBy)) : kv("Contact Number", esc(phoneMask(r.contact)));
    const primary = r.status === "pending"
      ? `<button class="btn btn-primary" data-act="acceptRequest" data-id="${r.id}">${icon("check")} Accept</button>`
      : r.status === "accepted"
        ? `<button class="btn btn-primary" data-act="allotFromRequest" data-id="${r.id}">${icon("door")} Allot rooms</button>`
        : "";
    return `<article class="req ${group ? "group" : ""}">
      <div class="req-kind">${esc(SH.typeLabel(r))}${r.source !== "student" && r.type !== "direct" ? " · via HCU" : ""}</div>
      <span class="status">${SH.badge(r.status, true)}</span>
      <div class="req-fields">
        ${f1}${kv("Days", days)}
        ${kv("From", D.fmt(r.from))}${kv("To", D.fmt(r.to))}
        ${f5}${kv("Requested on", D.fmt(r.requestedOn))}
      </div>
      <div class="row">
        <button class="btn btn-secondary" data-act="viewRequest" data-id="${r.id}">${icon("eye")} View</button>
        ${primary}
      </div>
    </article>`;
  }

  function formsTable(u) {
    let list = S.forms().filter((f) => f.hostel === "H17" && HMS.formTypes[f.type].to === "hm");
    if (u.q) { const q = u.q.toLowerCase(); list = list.filter((f) => (S.resident(f.residentId).name + HMS.formTypes[f.type].label).toLowerCase().includes(q)); }
    list = [...list.filter((f) => f.status === "submitted"), ...list.filter((f) => f.status !== "submitted")];
    if (!list.length) return `<div class="empty"><strong>No forms</strong>Room retention, vacation, room change and mess forms from residents land here.</div>`;
    return `<div class="table-wrap"><table class="data"><thead><tr><th>Submitted</th><th>Form</th><th>Resident</th><th>Room</th><th>Details</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.map((f) => { const r = S.resident(f.residentId); const L = HMS.formTypes[f.type]; return `<tr>
        <td>${D.fmt(f.submittedOn)}</td><td>${esc(L.label)}</td>
        <td><button class="link" data-act="go" data-href="#/hm/residents/${r.id}">${esc(r.name)}</button></td><td>${esc(r.room || "—")}</td>
        <td style="font-weight:400;white-space:normal;max-width:320px">${esc(L.summary(f.data, r))}</td>
        <td>${SH.formBadge(f.status)}</td>
        <td>${f.status === "submitted" ? `<div class="actions" style="gap:8px"><button class="btn btn-secondary" data-act="decideFormHm" data-id="${f.id}" data-ok="0">Reject</button><button class="btn btn-primary" data-act="decideFormHm" data-id="${f.id}" data-ok="1">Approve</button></div>` : `<span class="muted" style="font-weight:400">${D.fmt(f.decidedOn)}</span>`}</td></tr>`; }).join("")}
    </tbody></table></div>`;
  }

  function render(ctx) {
    const u = ctx.ui.book;
    const tab = TABS.find((t) => t.id === u.tab) || TABS[0];
    const all = S.hostelRequests("H17");
    let list = tab.forms ? [] : all.filter(tab.test);
    if (u.q) { const q = u.q.toLowerCase(); list = list.filter((r) => (r.title + r.requestedBy + r.comments).toLowerCase().includes(q)); }
    list.sort((a, b) => (u.sortAsc ? 1 : -1) * a.requestedOn.localeCompare(b.requestedOn));
    const counts = Object.fromEntries(TABS.map((t) => [t.id, t.forms ? S.forms().filter((f) => f.hostel === "H17" && f.status === "submitted" && HMS.formTypes[f.type].to === "hm").length : all.filter(t.test).length]));
    return `<section data-figma-node="238:4593">
      <div class="page-head">
        <h1 class="page-title">Requests</h1>
        <div class="toolbar-right">
          ${u.searchOpen ? `<span class="search">${icon("search")}<input class="input" type="search" placeholder="Search requests" value="${esc(u.q)}" data-on-input="bookQ" autofocus></span>` : `<button class="icon-btn" data-act="toggleBookSearch" aria-label="Search requests">${icon("search")}</button>`}
          <button class="icon-btn" data-act="toggleBookSort" aria-label="Sort by request date">${icon("sort")}</button>
          <button class="btn btn-primary btn-lg" data-act="newGuestBooking">${icon("plus")} Book guests</button>
        </div>
      </div>
      <div class="tabs" role="tablist">
        ${TABS.map((t) => `<button class="tab" role="tab" aria-selected="${t.id === tab.id}" data-act="bookTab" data-tab="${t.id}">${t.label} <span class="muted">${counts[t.id]}</span></button>`).join("")}
      </div>
      ${tab.forms ? formsTable(u) : list.length ? `<div class="req-grid">${list.map(card).join("")}</div>` : `<div class="empty"><strong>No requests here</strong>${tab.id === "all" ? "New requests from students, departments and HCU will appear here." : "Switch tabs to see other requests."}</div>`}
    </section>`;
  }

  function drawer(id) {
    const r = S.request(id);
    const guests = r.guestIds.map((gid) => S.guest(gid));
    const stays = S.requestStays(r.id);
    const roomOf = (gid) => (stays.find((s) => s.personId === gid) || {}).room;
    return `<div class="drawer-head">
        <div><div class="req-kind">${esc(SH.typeLabel(r))} · ${esc(r.id)}</div><h2 class="modal-title" style="padding:0">${esc(r.title)}</h2></div>
        <button class="icon-btn" data-act="closeLayer" aria-label="Close">${icon("x")}</button>
      </div>
      <div class="drawer-body">
        <p>${SH.badge(r.status, true)}</p>
        ${SH.stepper(r)}
        <div class="pgrid" style="margin:14px 0 18px">
          ${kv("Requested by", esc(r.requestedBy) + (r.requesterRoll ? " · " + esc(r.requesterRoll) : ""))}${kv("Requested on", D.fmt(r.requestedOn))}
          ${kv("From", D.fmt(r.from))}${kv("To", D.fmt(r.to))}
          ${kv("Days", D.days(r.from, r.to) + 1)}${kv("Contact Number", esc(phoneMask(r.contact)))}
        </div>
        ${kv("Comments", esc(r.comments || "—"), "comments")}
        ${r.deanNote ? `<div style="margin-top:12px">${kv("Associate Dean SA", esc(r.deanNote), "comments")}</div>` : ""}
        ${r.rejectReason ? `<div class="warn-line">Rejected: ${esc(r.rejectReason)}</div>` : ""}
        ${r.documents && r.documents.length ? `<h3 class="drawer-h">Documents</h3><ul class="docs">${r.documents.map((d) => `<li>${icon("file")} <span>${esc(d)}</span></li>`).join("")}</ul>` : ""}
        <h3 class="drawer-h">Guests (${guests.length})</h3>
        ${guests.length ? `<table class="data"><thead><tr><th>Name</th><th>Relation</th><th>Room</th></tr></thead><tbody>
          ${guests.map((g) => `<tr><td>${esc(g.name)}</td><td style="font-weight:400">${esc(g.relation || "—")}</td><td>${roomOf(g.id) ? `<button class="link" data-act="go" data-href="#/hm/map?floor=${HMS.floorplan.parseRoom(roomOf(g.id)).floor}&room=${roomOf(g.id)}">${roomOf(g.id)}</button>` : `<span class="muted">Not allotted</span>`}</td></tr>`).join("")}
        </tbody></table>` : `<p class="muted" style="font-size:12px">No guest list attached.</p>`}
        <h3 class="drawer-h">History</h3>
        ${SH.timeline(r)}
      </div>
      <div class="drawer-foot">
        ${r.status === "pending" ? `<button class="btn btn-danger btn-lg" data-act="rejectRequest" data-id="${r.id}">${icon("x")} Reject</button><button class="btn btn-primary btn-lg" data-act="acceptRequest" data-id="${r.id}">${icon("check")} Accept</button>` : ""}
        ${r.status === "accepted" ? `<button class="btn btn-primary btn-lg" data-act="allotFromRequest" data-id="${r.id}">${icon("door")} Allot rooms on map</button>` : ""}
        ${r.status === "allotted" ? `<button class="btn btn-secondary btn-lg" data-act="editRequestDates" data-id="${r.id}">${icon("pencil")} Change dates</button>` : ""}
      </div>`;
  }

  /** Book dialog (306:2388): Book / Notify tabs, "Add Guest", list with checkboxes, Request */
  function bookDialog(ctx, draft) {
    return `<div class="modal-head"><div class="tabs" role="tablist">
        <button class="tab" role="tab" aria-selected="${draft.tab === "book"}" data-act="bookDraftTab" data-tab="book">Book</button>
        <button class="tab" role="tab" aria-selected="${draft.tab === "notify"}" data-act="bookDraftTab" data-tab="notify">Notify</button>
      </div></div>
      <div class="modal-body">
      ${draft.tab === "book" ? `
        <div class="add-resident">${icon("plus")}<input placeholder="Add Guest" id="draft-guest" data-on-enter="draftAddGuest" aria-label="Guest name, press Enter to add"></div>
        <div class="pgrid" style="margin-top:14px">
          <label class="field"><span>From</span><input class="input" type="date" id="draft-from" value="${draft.from}"></label>
          <label class="field"><span>To</span><input class="input" type="date" id="draft-to" value="${draft.to}"></label>
          <label class="field" style="grid-column:1/-1"><span>Comments</span><textarea class="input" id="draft-comments" rows="2" placeholder="Why they are staying, who asked">${esc(draft.comments)}</textarea></label>
        </div>
        <div class="cand-list">
          ${draft.guests.length ? draft.guests.map((g, i) => `<div class="cand">
            ${kv("Name", esc(g.name))}${kv("Days", D.days(draft.from, draft.to) + 1)}<span></span>
            <input type="checkbox" class="checkbox check" ${g.on ? "checked" : ""} data-on-change="draftToggle" data-i="${i}" aria-label="Include ${esc(g.name)}">
          </div>`).join("") : `<div class="empty" style="padding:20px">Type a guest's name above and press Enter.</div>`}
        </div>` : `
        <label class="field"><span>Send to</span><select class="select-input" id="draft-notify-to"><option>HCU Office</option><option>Warden</option><option>Mess Committee</option></select></label>
        <label class="field" style="margin-top:12px"><span>Message</span><textarea class="input" id="draft-notify-msg" rows="4" placeholder="What should they know?"></textarea></label>`}
      </div>
      <div class="modal-foot">
        <button class="btn btn-secondary" data-act="closeLayer">${icon("x")} Cancel</button>
        ${draft.tab === "book" ? `<button class="btn btn-primary" data-act="draftSubmit" ${draft.guests.filter((g) => g.on).length ? "" : "disabled"}>${icon("check")} Request</button>` : `<button class="btn btn-primary" data-act="draftNotify">${icon("send")} Send</button>`}
      </div>`;
  }

  return { render, drawer, bookDialog, TABS };
})();
