/* ==========================================================================
   Hall Manager · Actions and Settings. Not designed in Figma yet; built from
   the Hall Manager IA in FigJam (WTbfKcPH3Gop5Xp4xFDHBy): Room management,
   Resident management, Batch operations, Reports and exports. Styled with
   the same tokens and components as the designed screens.
   ========================================================================== */
window.HMS = window.HMS || {};
HMS.views = HMS.views || {};

HMS.views.actions = (function () {
  const { icon, esc, kv } = HMS.ui;
  const D = HMS.date;
  const S = HMS.store.sel;
  const FP = HMS.floorplan;
  const SH = HMS.shared;

  const TABS = [
    ["rooms", "Room management"], ["residents", "Resident management"], ["batch", "Batch operations"], ["notices", "Notices"], ["reports", "Reports"],
  ];

  function rooms(ctx) {
    const day = ctx.ui.day;
    const blocked = S.raw().maintenance.filter((m) => D.overlaps(m.from, m.to, day) || m.from > day).sort((a, b) => a.room.localeCompare(b.room));
    return `<div class="act-grid">
      <div class="tool"><h3>${icon("wrench")} Block rooms for repair</h3><p>Take one or many rooms out of use. They turn red on the map and can't be allotted.</p>
        <button class="btn btn-primary" data-act="hmBlockRooms">Block rooms</button></div>
      <div class="tool"><h3>${icon("layers")} Renovate a wing</h3><p>Block every room of a wing on a floor, e.g. while it's being repainted.</p>
        <button class="btn btn-primary" data-act="hmBlockWing">Block a wing</button></div>
    </div>
    <h2 class="sec-title">Rooms out of use <span class="muted">${blocked.length}</span></h2>
    ${blocked.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Room</th><th>Wing</th><th>Issue</th><th>From</th><th>Until</th><th>Reported by</th><th></th></tr></thead><tbody>
      ${blocked.map((m) => `<tr><td><button class="link" data-act="go" data-href="#/hm/map?floor=${FP.parseRoom(m.room).floor}&room=${m.room}">${m.room}</button></td><td>${FP.wingOf(m.room)}</td><td style="font-weight:400">${esc(m.note)}</td><td>${D.fmt(m.from)}</td><td>${m.to ? D.fmt(m.to) : "Not set"}</td><td style="font-weight:400">${esc(m.reportedBy)}</td>
      <td><button class="btn btn-secondary" data-act="clearMaintenance" data-room="${m.room}">Release</button></td></tr>`).join("")}
    </tbody></table></div>` : `<div class="empty"><strong>Every room is usable</strong></div>`}`;
  }

  function residents() {
    return `<div class="act-grid">
      <div class="tool"><h3>${icon("door")} Move a resident</h3><p>Shift someone to a free room from a date. Their occupancy history keeps both rooms.</p><button class="btn btn-primary" data-act="hmMove">Move resident</button></div>
      <div class="tool"><h3>${icon("swap")} Swap two residents</h3><p>Two residents trade rooms on the same day, e.g. after a room change request.</p><button class="btn btn-primary" data-act="hmSwap">Swap rooms</button></div>
      <div class="tool"><h3>${icon("users")} Hostel shift in</h3><p>Record a resident moving in from another hostel and give her a room.</p><button class="btn btn-primary" data-act="hmShiftIn">Record shift</button></div>
      <div class="tool"><h3>${icon("download")} Export residents</h3><p>Copy the full resident list as CSV (room, roll, name, department, programme).</p><button class="btn btn-secondary" data-act="exportAll">Copy as CSV</button></div>
    </div>`;
  }

  function batch(ctx) {
    const waiting = S.unhousedResidents();
    const free = S.freeRoomsBetween(ctx.ui.day, "9999-12-31").length;
    return `<div class="pcard"><h2>New residents from HCU</h2>
      ${waiting.length ? `<p class="muted" style="font-size:12px;margin:0 0 12px">HCU assigned these students to Hostel 17. ${free} rooms are free from ${D.fmt(ctx.ui.day)} onwards.</p>
      <div class="table-wrap"><table class="data"><thead><tr><th><input type="checkbox" class="checkbox" data-on-change="hmBatchAll" ${ctx.ui.act.pick.length === waiting.length ? "checked" : ""} aria-label="Select all"></th><th>Roll</th><th>Name</th><th>Programme</th><th>Department</th><th>Joining</th></tr></thead><tbody>
        ${waiting.map((r) => `<tr><td><input type="checkbox" class="checkbox" data-on-change="hmBatchPick" data-id="${r.id}" ${ctx.ui.act.pick.includes(r.id) ? "checked" : ""} aria-label="Select ${esc(r.name)}"></td><td>${esc(r.roll)}</td><td>${esc(r.name)}</td><td>${esc(r.degree)}</td><td>${esc(r.dept)}</td><td>${D.fmt(r.joined)}</td></tr>`).join("")}
      </tbody></table></div>
      <div class="row-end"><label class="field inline"><span>Prefer floor</span><select class="select-input" id="batch-floor"><option value="">Any</option>${FP.FLOORS.map((f) => `<option>${f}</option>`).join("")}</select></label>
        <button class="btn btn-secondary" data-act="go" data-href="#/hm/map">Pick rooms on the map</button>
        <button class="btn btn-primary" data-act="hmAutoAllot" ${ctx.ui.act.pick.length ? "" : "disabled"}>${icon("check")} Auto-allot ${ctx.ui.act.pick.length || ""} selected</button></div>`
      : `<div class="empty"><strong>No one waiting</strong>When HCU uploads a new batch for Hostel 17, the students show up here.</div>`}
    </div>
    <div class="act-grid" style="margin-top:16px">
      <div class="tool"><h3>${icon("calendar")} Semester-end vacate</h3><p>Vacate everyone finishing their programme, or a whole programme and semester, on one date.</p><button class="btn btn-primary" data-act="hmBulkVacate">Plan a vacate</button></div>
      <div class="tool"><h3>${icon("form")} Retention and vacation forms</h3><p>Forms from residents are approved in Requests → Student Forms, or straight from the Updates panel.</p><button class="btn btn-secondary" data-act="go" data-href="#/hm/requests?tab=forms">Open forms</button></div>
    </div>`;
  }

  function notices() {
    const list = S.notices("H17");
    return `<div class="page-sub"><button class="btn btn-primary" data-act="hmPostNotice">${icon("megaphone")} Post a notice</button><span class="muted" style="font-size:12px">Notices show on every Hostel 17 resident's home page.</span></div>
      <div class="notice-list">${list.map((n) => `<article class="notice"><div class="notice-top"><h3>${esc(n.title)}</h3><span class="muted num">${D.fmt(n.date)}</span></div><p>${esc(n.body)}</p><small class="muted">${esc(n.by)}${n.hostel === "all" ? " · all hostels" : ""}</small></article>`).join("")}</div>`;
  }

  function reports(ctx) {
    const day = ctx.ui.day;
    const st = S.stats(day);
    const byFloor = FP.FLOORS.map((f) => { const rooms = FP.SLOTS.map((s) => FP.roomNo(f, s.idx)); const empty = rooms.filter((r) => S.roomState(r, day) === "empty").length; return { label: "Floor " + f, value: rooms.length - empty, max: rooms.length, sub: `${empty} free` }; });
    const byWing = FP.WINGS.map((w) => { const rooms = FP.allRooms().filter((r) => FP.wingOf(r) === w); const empty = rooms.filter((r) => S.roomState(r, day) === "empty").length; return { label: "Wing " + w, value: rooms.length - empty, max: rooms.length, sub: `${empty} free` }; });
    const prog = ["Bachelors", "Masters", "PhD"].map((g) => ({ label: g, value: S.raw().residents.filter((r) => r.room && r.programGroup === g).length }));
    const guestsNow = S.residentRows("Guests", day);
    return `<div class="report-grid">
      <div class="pcard"><h2>Occupancy by floor · ${D.fmt(day)}</h2>${SH.bars(byFloor)}</div>
      <div class="pcard"><h2>Occupancy by wing</h2>${SH.bars(byWing)}</div>
      <div class="pcard"><h2>Residents by programme</h2>${SH.bars(prog)}</div>
      <div class="pcard"><h2>Today</h2><div class="pgrid">${kv("Rooms", st.total)}${kv("Free", st.empty)}${kv("Residents", st.allotted)}${kv("Guests in house", st.guests)}${kv("Under repair", st.maint)}${kv("Checking out", st.checkOuts + " rooms")}</div></div>
    </div>
    <div class="act-grid" style="margin-top:16px">
      <div class="tool"><h3>${icon("download")} Vacant rooms</h3><p>Every room free on ${D.fmt(day)}, with floor and wing.</p><button class="btn btn-secondary" data-act="hmExport" data-what="vacant">Copy as CSV</button></div>
      <div class="tool"><h3>${icon("download")} Guests in house</h3><p>${guestsNow.length} guests with arrival and departure dates.</p><button class="btn btn-secondary" data-act="hmExport" data-what="guests">Copy as CSV</button></div>
      <div class="tool"><h3>${icon("download")} Repairs</h3><p>Rooms blocked for repair and since when.</p><button class="btn btn-secondary" data-act="hmExport" data-what="repairs">Copy as CSV</button></div>
      <div class="tool"><h3>${icon("download")} Requests log</h3><p>Every request for Hostel 17 with its status, for HCU.</p><button class="btn btn-secondary" data-act="hmExport" data-what="requests">Copy as CSV</button></div>
    </div>`;
  }

  function render(ctx) {
    const tab = ctx.ui.act.tab;
    const body = { rooms, residents, batch, notices, reports }[tab](ctx);
    return `<section>
      <div class="page-head"><h1 class="page-title">Actions</h1><button class="btn btn-secondary" data-act="resetDemo">Reset demo data</button></div>
      <div class="tabs" role="tablist">${TABS.map(([id, l]) => `<button class="tab" role="tab" aria-selected="${tab === id}" data-act="actTab" data-tab="${id}">${l}${id === "batch" && S.unhousedResidents().length ? ` <span class="count-dot">${S.unhousedResidents().length}</span>` : ""}</button>`).join("")}</div>
      ${body}
    </section>`;
  }
  return { render, TABS };
})();

HMS.views.settings = (function () {
  const { icon, esc, kv } = HMS.ui;
  const S = HMS.store.sel;
  function render() {
    const s = S.settings();
    return `<section>
      <div class="page-head"><h1 class="page-title">Settings</h1></div>
      <div class="report-grid">
        <div class="pcard"><h2>Hostel profile</h2><div class="pgrid">${kv("Hostel", "Hostel 17")}${kv("For", "Women")}${kv("Floors", "6")}${kv("Wings", "A, B, C, D")}${kv("Rooms", HMS.floorplan.allRooms().length + " singles")}${kv("Hall Manager", "Diksha Rathod")}</div></div>
        <div class="pcard"><h2>Language</h2><p class="muted" style="font-size:12px;margin:0 0 12px">Interface language for this account. Mirrors the En | Hi toggle in Figma 293:10380.</p>
          <div class="seg" role="group" aria-label="Language"><button aria-pressed="${s.lang === "en"}" data-act="setLang" data-v="en">English</button><button aria-pressed="${s.lang === "hi"}" data-act="setLang" data-v="hi">हिन्दी</button></div></div>
        <div class="pcard"><h2>Notifications</h2>
          <label class="toggle"><input type="checkbox" class="checkbox" data-on-change="setNotify" data-k="email" ${s.notify.email ? "checked" : ""}> Email me new requests and forms</label>
          <label class="toggle"><input type="checkbox" class="checkbox" data-on-change="setNotify" data-k="sms" ${s.notify.sms ? "checked" : ""}> SMS for same-day check-ins</label>
          <label class="field inline" style="margin-top:10px"><span>Daily digest at</span><input class="input" type="time" value="${esc(s.notify.digest)}" data-on-change="setNotify" data-k="digest" style="width:120px"></label></div>
        <div class="pcard"><h2>Staff access</h2>
          <ul class="mini-list">${s.staff.map((p, i) => `<li><span>${esc(p.name)} <small class="muted">· ${esc(p.role)}</small><br><small class="muted">${esc(p.access)}</small></span>${i ? `<button class="btn btn-secondary" data-act="removeStaff" data-i="${i}">Remove</button>` : `<span class="badge badge-teal">You</span>`}</li>`).join("")}</ul>
          <button class="btn btn-primary" data-act="addStaff" style="margin-top:12px">${icon("plus")} Add staff</button></div>
      </div>
    </section>`;
  }
  return { render };
})();
