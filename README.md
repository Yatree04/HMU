# HMU — Hostel Management System, IIT Bombay

One system that replaces today's mix of webmail, paper, Excel sheets and the old
portal for hostel allotment. Each stakeholder gets their own portal on shared data.

Sources (group Figma team):
- IA / sitemap — FigJam `WTbfKcPH3Gop5Xp4xFDHBy`
- Research, interviews and current workflows — Figma `W8pJfHJeop1TZinVuB2IP1` ("Workflow" page)
- Hall Manager UI — Figma "HM Intern Work", section "Hostel Manager"

## Portals

| Portal | URL (per IA) | Who | Status |
|---|---|---|---|
| Hall Manager | `/hm` | One hostel's manager: rooms, residents, guests, allotment | **Prototype** → [`hall-manager/index.html`](hall-manager/index.html) |
| HCU Office | `/hcu` | All hostels, all students: global queue, batches, reports | Not started |
| Associate Dean SA | — | Approvals queue (IRCC, department, IR, individual) | Not started |
| Student | — | Own data: room, roommate, requests, forms | Not started |
| Department Office | — | Visitor bookings (interviewees, interns, researchers, workshops) | Not started |
| IRCC & Event Council | — | Mass/batch bookings and extensions | Not started |

## Request flow (what the system digitises)

Requester (Student / Department / IRCC / Event council)
→ Dean SA approval → HCU picks the hostel → Hall Manager allots the room → requester is notified.

Pain points from interviews: approval takes too long, HCU has no live status,
allotment done by hand in lists, extensions happen on the ground without HCU knowing,
the same data is entered four times (paper, Excel, guest sheet, portal).

## Hall Manager prototype

Single HTML file, no build step. Open `hall-manager/index.html` in a browser.

- Dashboard, Residents (+ profile), Requests, Hostel Map (date-aware allot/vacate/maintenance)
- Actions and Settings are stubs (not designed yet)
- Data is seeded, deterministic and kept in the browser; `HMS.store` is the only data
  layer, so its function signatures are the contract for a future backend.
