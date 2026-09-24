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
    { id: "todo", label: "To do", test: (row) => open(row.r) },
    { id: "allotted", label: "Allotted", test: (row) => row.r.status === "allotted" },
    { id: "past", label: "Past", test: (row) => ["completed", "rejected", "cancelled"].includes(row.r.status) },
    { id: "all", label: "All", test: () => true },
  ];
  const FORM_TABS = [
    { id: "waiting", label: "Waiting", test: (row) => row.f.status === "submitted" },
    { id: "decided", label: "Decided", test: (row) => row.f.status !== "submitted" },
  ];

  function nextAction(r) {
    if (r.status === "pending") return `<button class="btn btn-primary" data-act="acceptRequest" data-id="${r.id}">${icon("check")} Accept</button>`;
    if (r.status === "accepted") return `<button class="btn btn-primary" data-act="allotFromRequest" data-id="${r.id}">${icon("door")} Allot</button>`;
    return "";
  }

  function requestsList() {
    const rows = S.hostelRequests("H17").map((r) => ({ ...SH.requestRow(r, true), source: r.source === "student" ? "Student" : r.type === "direct" ? "Hall Manager" : "Via HCU" }));
    return HMS.list.render({
      key: "hmRequests", tabs: TABS, rows, defaults: { sort: { key: "from", dir: 1 } },
      cols: [
        { key: "guests", label: "Guests", fmt: SH.col.guests },
        { key: "requestedBy", label: "Requested by", cls: "wrap-sm" },
        { key: "type", label: "Type", cls: "wrap-sm", fmt: SH.col.muted },
        { key: "from", label: "Arrival", fmt: SH.col.date },
        { key: "to", label: "Departure", fmt: SH.col.date },
        { key: "days", label: "Days" },
        ...(HMS.list.state("hmRequests").tab === "todo" ? [] : [{ key: "rooms", label: "Room", fmt: (v) => esc(v || "—") }]),
        { key: "status", label: "Status", fmt: SH.col.staffStatus },
      ],
      rowAttrs: (row) => `data-act="viewRequest" data-id="${row.id}"`,
      actions: (row) => `<div class="actions"><button data-act="viewRequest" data-id="${row.id}" aria-label="View">${icon("eye")}</button>${nextAction(row.r)}</div>`,
      empty: { title: "Nothing to do", body: "New requests from students, departments and HCU appear here." },
    });
  }

  function formsList() {
    const rows = S.forms().filter((f) => f.hostel === "H17" && HMS.formTypes[f.type].to === "hm").map((f) => {
      const r = S.resident(f.residentId); const L = HMS.formTypes[f.type];
      return { id: f.id, f, submittedOn: f.submittedOn, form: L.label, name: r.name, room: r.room || "—", details: L.summary(f.data, r), status: f.status === "submitted" ? "Waiting" : f.status === "approved" ? "Approved" : "Not approved", residentId: r.id };
    });
    return HMS.list.render({
      key: "hmForms", tabs: FORM_TABS, rows, defaults: { sort: { key: "submittedOn", dir: -1 } },
      cols: [
        { key: "submittedOn", label: "Submitted", fmt: SH.col.date },
        { key: "form", label: "Form" },
        { key: "name", label: "Resident" },
        { key: "room", label: "Room" },
        { key: "details", label: "Details", cls: "wrap", fmt: SH.col.muted },
        { key: "status", label: "Status", fmt: (v, row) => SH.formBadge(row.f.status) },
      ],
      rowAttrs: (row) => `data-act="go" data-href="#/hm/residents/${row.residentId}"`,
      actions: (row) => row.f.status === "submitted" ? `<div class="actions"><button class="btn btn-secondary" data-act="decideFormHm" data-id="${row.id}" data-ok="0">Reject</button><button class="btn btn-primary" data-act="decideFormHm" data-id="${row.id}" data-ok="1">Approve</button></div>` : "",
      empty: { title: "No forms", body: "Room retention, vacation, room change and mess forms from residents land here." },
    });
  }

  function render(ctx) {
    const view = ctx.ui.book.view;
    const nForms = S.forms().filter((f) => f.hostel === "H17" && f.status === "submitted" && HMS.formTypes[f.type].to === "hm").length;
    const nTodo = S.hostelRequests("H17").filter(open).length;
    return `<section data-figma-node="238:4052 / 293:10039">
      <div class="page-head">
        <h1 class="page-title">Requests</h1>
        <div class="toolbar-right">
          <div class="seg" role="tablist" aria-label="What to show">
            <button role="tab" aria-pressed="${view !== "forms"}" data-act="bookView" data-v="requests">Guest stays${nTodo ? ` <span class="count-dot">${nTodo}</span>` : ""}</button>
            <button role="tab" aria-pressed="${view === "forms"}" data-act="bookView" data-v="forms">Student forms${nForms ? ` <span class="count-dot">${nForms}</span>` : ""}</button>
          </div>
          <button class="btn btn-primary btn-lg" data-act="newGuestBooking">${icon("plus")} Book guests</button>
        </div>
      </div>
      ${view === "forms" ? formsList() : requestsList()}
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

  return { render, drawer, bookDialog };
})();
