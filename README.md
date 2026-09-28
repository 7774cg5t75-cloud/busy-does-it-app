# busy-does-it-app

Busy Does It mobile app prototype.

## v2.9 adaptive work-filling plan
- Turned an active work goal into a persistent closed-loop plan rather than a one-shot recommendation.
- Each work goal now stores approved actions that were actually tried, including previous-customer outreach, quiet-enquiry follow-ups, quote follow-ups, finished-job posts, limited offers, free profile checks and capped paid tests.
- Approved actions are tied to the specific goal and persist with it. Closing/cancelling the goal clears that plan naturally without creating another permanent campaign area.
- BUSY now removes already-tried goal actions from the goal-specific recommendation queue instead of repeatedly recommending the same quote, enquiry, post, customer batch, offer or paid test.
- Previous-customer reactivation is especially adaptive: customers already contacted for the current goal are excluded from later batches, so a second batch can use different suitable customers if more bookings are still needed.
- Quote and enquiry recommendations skip customers already followed up for the active goal. Finished-job post recommendations skip a post already approved for that goal.
- The work-goal card on Home now shows how many goal actions have been tried and the latest recorded outcomes.
- The Best Move screen becomes “Best next move” after the first approved action and includes a compact BUSY’S PLAN card showing target, booked count, remaining count, actions tried and their current outcomes.
- Existing outcome data is reused rather than duplicated: quote outcomes, enquiry outcomes, reactivation bookings and post outcomes are reflected back into the plan automatically.
- Limited offers and paid tests are recorded as tried only when the owner explicitly approves/uses them.
- Paid-test prototype results are now truthful: approving a paid test records the route and cap, but the prototype no longer invents spend, enquiries or jobs.
- Free profile/audit work is also treated as a tried route for the active goal so BUSY does not keep looping back to the same free check.
- If all currently sensible routes have already been tried and the goal is still open, BUSY shows a deliberate “No new action worth forcing” hold state with recommended additional spend of £0 rather than manufacturing activity.
- Capacity, service matching, evidence confidence, owner approval and the stop condition still outrank the adaptive sequence.
- Main navigation remains Home / Work / Results / Settings.

## v2.8 brand identity system
- Adopted the approved “Trusted Assistant” direction as the primary BUSY DOES IT identity and the approved B/check monogram as the compact app mark.
- Replaced the plain text-only header with a reusable BUSY DOES IT brand lockup: assistant-style stacked-card/check symbol, BUSY wordmark, DOES IT accent and the existing “More work. Less fuss.” tagline.
- Added a compact B/check mark for small brand moments where the full identity would be too heavy.
- Cards whose eyebrow begins with BUSY now show the compact mark beside the label, making assistant/explainer moments visually distinct without putting a logo on every card.
- Updated visible self-reference language from ambiguous “Busy” to “BUSY”, so sentences such as “BUSY has spread 3 bookings…” clearly refer to the product rather than the ordinary word busy.
- Full brand name references are now visually consistent as BUSY DOES IT.
- Added a branded loading state using the primary mark and wordmark.
- Added a restrained brand section in Settings showing the primary identity and compact mark, so the branding system is inspectable without introducing another navigation area.
- Kept the rest of the interface deliberately calm: no large visual redesign, no extra permanent tabs and no branding repeated on every card.
- All v2.7 evidence-aware opportunity logic, v2.6 capacity planning, earlier safety rules and the existing Home / Work / Results / Settings navigation remain unchanged.

## v2.7 evidence-aware opportunity engine
- Replaced the fixed “roughly three previous customers per required booking” rule with confidence-aware audience sizing when enough recorded evidence exists.
- Previous-customer outreach now stores a lightweight local history of simulated sends so later confirmed/completed bookings can be compared with the people actually contacted.
- Reactivation evidence prefers service-specific outcomes once at least three usable results exist. If the service sample is too small, Busy can fall back to broader recorded outcomes; if the overall sample is still too small, the cautious one-in-three planning baseline remains in force.
- Audience sizing uses a smoothed planning conversion rate rather than the raw observed percentage, so one lucky or unlucky small run cannot swing recommendations aggressively.
- Work-goal reactivation audiences are now service-aware: a driveway-cleaning capacity target is sized from eligible driveway-cleaning customers rather than unrelated due customers from other services.
- Quote follow-ups, quiet-enquiry follow-ups and finished-job posts now each expose their own recorded sample, outcome rate and confidence. Their evidence can gently adjust ranking without overriding stronger customer intent, capacity or stop rules.
- Service-specific evidence is preferred where the sample is usable; broader all-service evidence is used only when the specific sample is too small.
- Special Offers currently show “no recorded outcome evidence yet” instead of pretending an offer conversion rate exists.
- Check-before-sending now explains whether the selected previous-customer batch came from recorded evidence or the cautious fallback.
- Expert details show the sample, observed bookings, planning rate, evidence basis and confidence behind the recommended first batch.
- Results now includes an Opportunity Engine evidence card so learning remains inspectable without creating another permanent dashboard or navigation tab.
- The v2.6 multi-slot capacity planner remains authoritative: evidence can change how much activity Busy recommends, but it cannot create capacity that does not exist.
- The v2.3 stop condition remains authoritative: once the work target is filled, further promotion stops regardless of historical conversion evidence.
- Main navigation remains Home / Work / Results / Settings.

## v2.6 multi-slot capacity planner
- Turned the v2.5 “spread this target across future openings” fallback into a real multi-slot capacity plan.
- When a requested target cannot fit one chosen slot, Busy now searches the next 21 days for clean morning/afternoon openings and allocates the required bookings across specific slots using the selected service’s editable planning duration.
- Each planned slot stores its own target allocation and visible label. A three-booking target can therefore become a concrete plan such as one booking Tuesday morning, one Tuesday afternoon and one Wednesday morning rather than collapsing into vague “any suitable work”.
- Work-goal booking matching is now tighter: spread goals count only confirmed/completed bookings that land inside one of the planned slots, and service-specific goals only count bookings for the selected planning service.
- Home shows the active multi-slot plan underneath the same existing work-goal card, including per-slot progress, without adding another permanent navigation area.
- Best first move shows the same plan before marketing recommendations so the owner can see where the requested work is expected to fit.
- If the current diary cannot provide enough clean capacity for the whole target within 21 days, Busy stops before marketing and states the shortfall. The owner can reduce the goal to the planned capacity or choose a different work goal.
- If another booking later occupies one of the planned openings, Busy flags the plan as stale and offers to rebuild it from the current diary instead of silently relying on outdated capacity.
- Multi-slot plans remain conservative: a confirmed booking anywhere in a morning/afternoon period makes that period unavailable to the planner unless it is one of the matching goal bookings already being tracked.
- The v2.5 capacity assumptions remain editable and visible. The v2.4 proportional audience logic, v2.3 stop condition, free-first ranking and paid-spend limits remain intact.
- The visible app stays simple. Main navigation remains Home / Work / Results / Settings.

## v2.5 capacity-aware work goals
- Added editable typical job length to service planning data so Busy can estimate whether a requested number of jobs can realistically fit into a selected diary slot.
- Exterior-cleaning and the other prototype vertical packs now include transparent starter duration assumptions; these are planning defaults only and can be corrected by the owner.
- Existing saved services are migrated safely: a saved duration is preserved, otherwise the current vertical default is used, with a conservative two-hour fallback for custom/unknown services.
- “Fill a spare day” now shows which priority service is being used for capacity planning when relevant and lets the owner choose between multiple wanted services before setting the booking target.
- Morning/afternoon slots use a simple four-hour planning window. This is deliberately transparent and is not presented as an exact real-world schedule.
- If a requested target exceeds the apparent slot capacity, Busy stops before recommending marketing and explains the mismatch.
- When some work can fit, the owner can reduce the goal to the realistic capacity of that slot or keep the larger target and spread it across the next suitable openings.
- If the typical job itself is longer than the selected slot, Busy does not pretend that a full job fits there; it instead offers to spread the target or correct the planning assumption.
- Added a “Typical job lengths” settings screen with simple 30-minute adjustments. The screen explicitly explains that travel, complexity and customer circumstances can change actual duration.
- Custom services now ask for an optional typical job length alongside rough job value.
- Home surfaces a capacity warning when an active goal conflicts with the selected slot instead of continuing to promote it.
- Fixed the proportional-batch explanation edge case: when the eligible customer pool is smaller than the planned cap, Busy now states that all available eligible customers are included rather than claiming it is holding some back.
- Centralised the visible prototype label so the app now shows v2.5 rather than the stale v2.1 badge.
- The v2.4 proportional ranking and v2.3 stop condition remain intact: capacity is checked before marketing, free/low-risk options still rank before paid reach, and promotion stops when the target is covered.
- Main navigation remains Home / Work / Results / Settings.

## v2.4 proportional opportunity engine
- Added a simple work-amount choice to the spare-capacity journey: one, two or three bookings.
- The chosen amount becomes the work-goal target, so Busy now tracks both the original target and how many bookings are still needed.
- Recommendation strength now changes with the remaining gap rather than treating every quiet period the same.
- One missing booking keeps the intervention deliberately narrow: strongest live intent first, then only a small previous-customer action if needed.
- Two missing bookings can justify a small targeted customer batch while broad promotion remains unnecessary unless cheaper routes fail.
- Three missing bookings can make a wider reactivation action or a limited offer proportionate before paid reach.
- Previous-customer reactivation now uses a proportional first batch instead of automatically selecting every eligible customer. The initial batch is capped at roughly three suitable customers per remaining booking and prioritises customers who are more overdue, then higher saved job value.
- The Check before sending and simulated-send flow now respects that selected batch and explains why the audience was deliberately limited.
- Special Offers are ranked more strongly only as the remaining capacity grows, and the offer booking cap uses the remaining requirement rather than the original target.
- Paid-test sizing is also proportional: Busy suggests a smaller cap for a small gap while never exceeding the owner's existing prototype maximum.
- Home now shows how many bookings are still needed and keeps the active goal aligned with the proportional engine.
- The stop condition from v2.3 remains unchanged: once the target is covered, Busy stops escalating and recommends £0 additional spend.
- No extra permanent navigation or marketing dashboard was added. Main navigation remains Home / Work / Results / Settings.

## v2.3 goal-aware opportunity engine
- Turned a chosen spare-capacity slot into a persistent work goal instead of a one-off screen choice.
- A specific suggested morning/afternoon goal now retains its date and daypart, so Busy can compare later confirmed bookings with the capacity the owner asked it to fill.
- The default target is deliberately simple: one suitable confirmed booking. The front end stays small while the stop condition is explicit underneath.
- Home now shows an active work-goal card with target, matching confirmed bookings and recorded booked value.
- When the target is reached, the Opportunity Engine promotes “Goal reached” above marketing and recommends £0 additional spend instead of continuing to manufacture activity.
- The Best first move screen also changes into a stop-state once the goal is covered.
- Closing a completed/cancelled work goal removes the active capacity target without adding another permanent tab or dashboard.
- Added a controlled Special Offer route to the same ranked opportunity ladder. It sits behind stronger existing demand / £0 customer opportunities and ahead of paid advertising.
- A work-goal offer starts at the normal saved service price rather than assuming a discount is necessary. The owner can deliberately change the price if an incentive is justified.
- Work-goal offers inherit the selected quiet slot and booking cap so the offer is tied to the actual capacity problem.
- Removed invented “24 contacted / 5 replied / 2 booked” figures from the offer-running screen. Offer progress now uses saved booking records when tied to an active work goal and otherwise clearly states that the prototype has not really sent anything.
- Paid reach remains the final escalation with a fixed maximum exposure and no guaranteed-results language.
- Trusted Autopilot remains record administration only; it does not gain authority to message customers, publish publicly or spend money.
- Main navigation remains Home / Work / Results / Settings.

## v2.2 spare-capacity opportunity engine
- Rebalanced the prototype away from adding more CRM/admin surface area and back toward the core Busy Does It promise: identify a business need, compare the lowest-risk ways to solve it and surface one simple next move.
- “Fill a spare day” now checks the saved booking diary and suggests likely open morning/afternoon slots instead of relying on a hard-coded Thursday example.
- Spare-slot detection is deliberately transparent: it uses only confirmed bookings currently saved in the prototype and does not pretend a live external calendar is connected.
- Choosing a gap now activates a clear spare-capacity goal and keeps the selected slot consistent with prepared customer wording.
- The Best first move screen now ranks several routes underneath: live enquiries, sent quote follow-ups, quiet enquiries, due previous customers, approved finished-job content, free profile improvements and finally a capped paid test.
- Existing customer intent outranks cold marketing. £0 and prepared actions normally outrank paid reach.
- Paid advertising is explicitly kept as an escalation and retains a visible maximum amount at risk with no guaranteed-results wording.
- Home now gives direct access to “I NEED MORE WORK” without adding another permanent navigation tab.
- A legacy saved quiet-slot value is no longer treated as confirmed spare capacity unless the owner deliberately selects/activates a work goal.
- Trusted Autopilot remains narrow record administration only; v2.2 does not expand automatic authority to customer messages, public publishing or spend.
- Main navigation remains Home / Work / Results / Settings.

## v0.6 big sweep
- Reply actions now open real prototype workflows instead of being simple labels.
- Interested customers can move into a quote-preparation flow.
- Booked customers can move into a booking date/time flow.
- “Not now” customers can get a future follow-up date.
- The built-in UK calendar now supports both past dates and future booking/reminder dates.
- Customer records can be edited.
- Customer deletion now requires confirmation and cleans up related follow-up state.
- The global “Contact previous customers” control now actually changes eligibility.
- Results now includes locally calculated customer-action activity.
- Old v0.6 marked-done actions are migrated back to pending so the richer workflows can be tested.
- Simulation wording has been tightened so prototype actions are not mistaken for real sends or live account connections.
- Testing workflow remains GitHub → clean Snack preview → direct Expo QR.


### Latest v0.6 sweep
- Slot-aware booking suggestions now match weekday wording such as “Thursday afternoon”.
- Booking time uses quick-select choices, with manual time entry still available.
- Quote suggestions explain whether the figure came from the customer's previous job or the saved service price.
- Completed quote / booking / reminder actions can be reopened and edited.
- Results now surfaces recent completed customer actions with their saved summaries.

### v0.6 bookings + action hub sweep
- Added a permanent Bookings screen for saved local prototype bookings.
- Added exact date/time clash detection with a suggested alternative time.
- Improved saved-booking correction so the warning changes to a green “ready to save” state once fixed.
- Added Customer Activity filters for To do, Quotes, Bookings, Reminders and Completed.
- Home now surfaces the next upcoming booking before generic marketing suggestions.
- Results is now local-activity-first; illustrative marketing figures are kept on a separate demo screen.
- Bookings and completed actions remain reopenable/editable from Home, Results, Settings and Customer Activity.

## v0.7 customer + work pipeline
- Added a dedicated customer detail screen with contact details, current action and job history.
- Added quote lifecycle states: Prepared → Sent (simulated) → Accepted / Declined.
- Accepted quotes can be converted directly into booking work.
- Added booking lifecycle states: Confirmed → Completed / Cancelled, with reopen support for cancelled bookings.
- Completing a booking updates the customer’s last-job date/value and appends a local job-history entry.
- Added due follow-up reminders that surface back on Home when their date arrives.
- Added a work diary split into Today, Upcoming, Past / completed and Cancelled.
- Added local pipeline metrics for active quote value, confirmed bookings, completed jobs and due follow-ups.
- Home now puts due customer follow-ups and booked work ahead of generic marketing suggestions.
- Customer records now open into a persistent customer history instead of being isolated rows.

## v0.8 flexible service-business core
- Moved industry-specific behaviour into business-type / vertical packs while keeping the customer, quote, booking, reminder, work and results core reusable.
- Added starter packs for exterior cleaning, window cleaning, gardening & landscaping, plumbing & heating, electrical, mobile hair & beauty and a generic service business.
- Repeat-customer eligibility is now service-specific instead of using one blanket 9-month rule.
- Added business-type selection during setup and a Business type & services control in Settings.
- Turned the Work tab into a real work hub with enquiries, active quotes, bookings, follow-ups and pipeline values ahead of marketing.
- Added a New enquiry flow for customers with no previous completed job.
- Added direct customer actions: create a quote, book a job or set a follow-up without needing a simulated marketing reply first.
- Added customer notes and an activity timeline alongside completed job history.
- Added repeat customer journeys so finished or cancelled actions do not trap a customer in one old workflow.
- Home now prioritises due follow-ups, upcoming bookings and active quotes before general marketing opportunities.
- Results now includes open enquiries and booked-work value alongside quotes, completed jobs and follow-ups.
- Existing customer records and job history are preserved when business-type rules change.

## v0.9 customer pipeline + work diary
- Fixed New enquiry so the custom-service field starts blank instead of duplicating the selected service.
- Added clearer customer pipeline statuses for new enquiries, active quotes, bookings and follow-ups.
- Added new-enquiry priority cards to Home and Work so fresh leads do not disappear behind general marketing suggestions.
- Strengthened the Work hub with pipeline value and open-action totals.
- Improved the work diary with overdue-job detection, clash warnings, booked values, separate completed and cancelled sections, and clearer diary health.
- Added a customer stage readout to each customer detail screen.
- Added a combined customer pipeline value across active quotes and confirmed booked work.
- Changed quote handling from a purely simulated-send label to a local operational status: users can mark a quote as sent while the prototype remains explicit that it sends nothing automatically.
- Results now uses operational wording for quotes marked as sent and shows total customer work in the pipeline.
- Preserved the v0.8 flexible service-business architecture and vertical packs; no exterior-cleaning logic was promoted into the reusable core.

## v1.0 customer workflow + pipeline
- Added a single Customer pipeline screen covering new enquiries, active quotes, bookings, follow-ups and recently completed jobs.
- Work and Settings now link directly to the customer pipeline.
- Results links back into the live customer pipeline instead of acting as a dead-end report.
- Home now shows one clear top-priority customer task instead of stacking duplicate or competing priority cards.
- Past bookings that still need an outcome are surfaced ahead of general marketing suggestions.
- Follow-up reminders now have quick 1-week, 2-week, 1-month and 2-month choices, plus a one-tap 7-day snooze when overdue.
- Customer detail now shows service-specific repeat timing and whether the customer is due now.
- Quote wording now records “marked as sent” rather than implying the prototype actually sent anything.
- Preserved the flexible service-business architecture so the workflow remains reusable beyond exterior cleaning.

## v1.1 faster customer workflow
- Added customer search to both Customer records and Customer pipeline using name, phone or service.
- Added direct quote, booking and follow-up shortcuts for fresh enquiries inside the pipeline.
- Added a one-step “Save & mark quote as sent” option so simple quotes do not need reopening before moving on.
- Added separate active quote value and booked-work value to the pipeline summary.
- Added overdue / due-now status highlighting inside the pipeline.
- Expanded the Work dashboard with overdue bookings, next-7-days job count and next-7-days booked value.
- Fresh enquiries now surface in Work when no overdue booking or follow-up is taking priority.
- Added optional job address / postcode capture to new enquiries and customer records, and surfaced it on customer and booking detail.
- Simplified the Work navigation label so Customer pipeline remains a stable destination even when empty.
- Kept all new workflow logic service-business-generic; exterior cleaning remains a test pack rather than a hard-coded product boundary.

## v1.2 daily operations + follow-up
- Added 7-day quote follow-up detection so sent quotes that have gone quiet return to the Work priority queue.
- Work now prioritises overdue bookings, due reminders, stale sent quotes and unanswered enquiries before general marketing.
- New-enquiry cards show how long the customer has been waiting, with the oldest unanswered enquiry surfaced first.
- Customer pipeline search now also matches job address / postcode.
- Added pipeline stage filters for enquiries, quotes, bookings, follow-ups and completed work.
- Sent quotes that have waited 7+ days are highlighted as “Follow up” in the pipeline.
- Booking completion now captures an optional completion note alongside the actual / expected job value.
- Completed-job notes flow into the permanent customer job history and activity timeline.
- Results now counts completed jobs from permanent customer history instead of relying only on the current live action.
- Results also shows quote follow-ups due.
- Preserved the “simple by default, depth on demand” principle and kept the workflow generic across service-business verticals.


## v1.3 job photos + reusable assets
- Completing a booked job now offers an optional job-photo step instead of ending the workflow abruptly.
- Job photos are chosen explicitly with the system photo picker; Busy Does It never silently browses the camera roll.
- Selected photos attach to the completed customer job and can stay private to that job.
- A separate permission toggle controls whether those exact photos may be suggested for future marketing; attaching a photo never means it is automatically public.
- Approved job photos can trigger a £0 finished-job content opportunity before paid promotion.
- Busy Does It can prepare an editable finished-job post draft from approved photos, but the prototype does not publish anything.
- Customer job history now shows photo counts and saved post-draft status.
- Results now counts attached job photos, reusable-with-permission photos and prepared finished-job drafts.
- The photo workflow stays service-business-generic and uses the customer’s real saved service rather than exterior-cleaning assumptions.



## v1.4 business opportunity engine home
- Reworked Home around one ranked “Best thing to do today” instead of showing a wall of competing opportunities by default.
- Customer commitments rank first: overdue bookings, due reminders, stale sent quotes and unanswered enquiries are surfaced before general marketing.
- Useful £0 moves then rank underneath, including approved job-photo content, due previous customers, profile fixes and old-quote follow-up.
- Added the missing stale-quote follow-up signal to Home so the same operational priority can surface outside the Work hub.
- Secondary opportunities are hidden behind “See other opportunities” so more intelligence underneath does not create more visible complexity.
- Added a genuine “Nothing worth doing right now” state with recommended spend £0 instead of manufacturing activity.
- Upgraded the explanation ladder to “Why this?” followed by “Expert details” for the underlying evidence.
- Kept customer-control and permission rules intact: no messages are really sent, no public post is published and no paid spend happens automatically in this prototype.
- Preserved the service-business-generic core; the ranking logic uses customer/work signals rather than exterior-cleaning-only assumptions.


## v1.5 prepared actions + learning
- Home ranking now weighs urgency, existing customer intent, recorded value, cost and how ready the next action already is instead of relying on one fixed display order.
- Recorded outcomes now feed back into ranking: finished-job content can move up or down based on saved post outcomes, while completed prototype reactivation value can strengthen future reactivation recommendations.
- Finished-job content now runs through a complete prototype chain: approved job photos → prepared editable post → connected destination selection → explicit owner approval → simulated publish → business outcome capture.
- Facebook / Instagram and Google Business prototype destinations must be deliberately connected before they can be selected for the simulated publish.
- Prepared post drafts can return to Home as a ready-for-approval opportunity instead of disappearing after the draft is saved.
- Approved posts with no recorded outcome can return later as a low-priority learning task rather than outranking live customer work.
- Post outcomes are recorded as No enquiry yet / Enquiry / Quote / Booking, with optional booked value, and are explicitly labelled as user-entered attribution rather than guaranteed causation.
- Completed jobs now retain whether the underlying customer workflow originated from the prototype reactivation flow or a direct/manual customer action.
- Results adds separate traceable value buckets for completed work, live pipeline, prototype-reactivation completed value and post-attributed booking value without adding them into a potentially misleading headline total.
- The visible navigation remains Home / Work / Results / Settings. Social, CRM-style follow-up, attribution and learning continue to behave as capabilities underneath the opportunity engine rather than becoming new permanent tabs.


## v1.6 closed-loop opportunity engine
- Extended the v1.5 prepare → approve → outcome → learn pattern beyond finished-job posts.
- Live sent quotes that have gone quiet for 7+ days can now surface as a prepared quote follow-up rather than just an instruction to “follow up”.
- Quote follow-up flow: Busy Does It drafts a polite message from the saved customer/quote data → owner edits/reviews → explicit simulated send approval → outcome recorded as No reply yet / Still considering / Accepted / Declined.
- Once a quote follow-up has been approved, the same quote is no longer repeatedly surfaced as a stale quote while its outcome is unresolved.
- Quote follow-up outcomes feed gently back into future ranking. Accepted follow-ups and accepted quote value are tracked separately.
- Completed jobs can now create a prepared review-request opportunity when customer contact is allowed.
- Review-request flow: completed job → low-pressure editable request → explicit simulated send approval → outcome recorded as No response yet / Review left.
- Review-request outcomes also feed gently back into future ranking, with small-sample restraint.
- Previous-customer reactivation on Home now opens directly into the already-prepared service-group message review rather than adding an extra advice screen.
- Home can surface low-priority learning tasks for unresolved quote-follow-up, review-request and finished-job-post outcomes without letting them outrank live customer work.
- Customer job history now exposes review-request preparation / outcome controls for completed jobs.
- Results now has an Opportunity Engine learning section covering quote follow-ups, review requests, reactivation value and related outcomes.
- Results continues to keep overlapping value buckets separate rather than manufacturing one inflated total.
- The visible navigation remains Home / Work / Results / Settings.
- Added a JSX syntax gate to the automatic Snack preview pipeline so invalid JS/JSX fails before a preview link is published.


## v1.7 record-based opportunities
- Removed the legacy typed opportunity totals for previous customers, eligible customers, old enquiries, old quotes and highest old quote value from the active prototype data model.
- New enquiries now store the date the enquiry actually arrived. This lets Busy Does It distinguish fresh enquiries from quiet enquiries using the customer record itself.
- A quiet enquiry is currently defined as an unresolved enquiry that is at least 7 days old, has no quote / booking / reminder in progress, has contact permission and has not already had a prepared follow-up approved.
- Quiet enquiries now have a complete closed loop: record detected → low-pressure message prepared → owner edits/reviews → simulated send approval → outcome recorded as No reply yet / Still interested / Not interested → outcome gently influences later ranking.
- Quote records now capture an editable sent date, allowing imported / pre-existing sent quotes to be represented accurately instead of assuming every quote was sent today.
- Quote follow-ups due are calculated from real sent quote status and sent date (7+ days) rather than a typed old-quote count.
- Added record-based Quiet Enquiries and Quote Follow-ups Due screens listing the actual customers, services, ages and quote values behind each opportunity.
- Home now separates fresh enquiries from quiet enquiries and ranks a record-derived quiet-enquiry follow-up as an existing-intent opportunity.
- Work and the customer pipeline now show age-aware enquiry states such as New enquiry, Quiet enquiry and Follow-up sent.
- Customer detail shows the enquiry received date and exposes the prepared quiet-enquiry follow-up / outcome flow when relevant.
- Other Opportunities now recalculates from saved enquiries, sent quotes, due previous customers and completed jobs rather than hard-coded counts.
- The old fixed demo funnel no longer advances automatically from previous customers to invented old-enquiry and old-quote totals. After a £0 action, Busy Does It reassesses the current records.
- Business Data now displays calculated opportunity counts. The only remaining manual profile inputs are explicitly labelled prototype-only because no live Google Business / social account is being read yet.
- Manual profile-test numbers no longer participate in Home ranking.
- Results now includes quiet-enquiry learning and removes the illustrative marketing-results totals from the main Results screen.
- Main visible navigation remains Home / Work / Results / Settings.


## v1.8 automatic admin underneath
- Kept v1.7 record-based opportunity discovery, but moved more routine administration into the records themselves.
- New enquiries now receive an automatic 7-day next-check date when they are captured. Busy can use that stored lifecycle date to decide when an unresolved enquiry becomes a quiet-enquiry opportunity.
- Sent quotes now receive an automatic 7-day follow-up due date. Quote-follow-up detection prefers that stored due date rather than repeatedly recalculating an invented demo rule.
- Customer records now maintain lightweight lifecycle and last-activity pointers as quotes, bookings, follow-ups and outcomes change.
- Completing a job now automatically updates the customer’s latest job date/value, stores repeat-service timing when the service has a sensible repeat interval, and pre-drafts a low-pressure review request when customer contact is allowed.
- Post-job repeat timing is service-specific. Non-repeatable services do not receive a fake repeat reminder.
- Saving job photos with marketing permission now automatically prepares the finished-job post wording and opens the editable draft. The owner no longer has to ask Busy to create the draft after already approving the photos.
- Public posting still requires a separate owner approval; automatic preparation does not mean automatic publishing.
- Review-request opportunities are deduplicated to the customer’s latest completed job and are suppressed while that customer has active customer work, reducing contradictory or repetitive asks.
- Added a compact Home card showing how many next steps are ready and how many timelines Busy is maintaining in the background.
- Added a non-tab Background Work screen showing quiet enquiries, due quote follow-ups, prepared review drafts, prepared post drafts and future repeat-service dates.
- Work shows the number of background next steps ready without adding another permanent navigation item.
- Completed-job confirmation now tells the owner which follow-on admin Busy has already prepared.
- New-enquiry and quote screens show the automatic future check date before the record is saved/sent.
- Results now includes the amount of routine admin prepared / watched underneath the Opportunity Engine.
- Main navigation remains Home / Work / Results / Settings.
- Busy still does not send a real customer message, publish publicly or spend money without the required approval in this prototype.


## v1.9 smart intake + duplicate prevention
- Added the first real intake layer so business information can enter Busy without field-by-field manual entry.
- Work now has Quick Capture as the lowest-friction intake path. The owner can paste a customer message, email / quote note, phone note, calendar / booking note or invoice / job note.
- Quick Capture locally extracts a draft customer name, phone, email, address, service, event date, booking time, value and lifecycle stage where those details can be inferred from the pasted text.
- Extraction is explicitly treated as a draft. Busy always shows a review screen before changing records.
- The owner can change the inferred stage between Enquiry / Quote sent / Booking / Completed job and edit every extracted field before approval.
- Busy checks phone first, then email, then exact full name for possible duplicate customers.
- A likely match is merged into the existing customer rather than silently creating another record.
- The owner can override a proposed match with “This is a different customer”, so duplicate prevention never becomes forced merging.
- Quick Capture prevents lifecycle downgrades: weaker imported information cannot overwrite stronger active work such as a confirmed booking.
- New enquiries from existing previous customers now use a current-enquiry field, allowing the same customer record to re-enter the pipeline without creating a duplicate customer.
- Imported Enquiry records enter the normal 7-day enquiry lifecycle watch.
- Imported Quote sent records create/update the sent quote, value and automatic follow-up due date.
- Imported Booking records create/update confirmed Work bookings.
- Imported Completed job records update job history/value, calculate sensible service-specific repeat timing, and prepare post-job review admin.
- Completed imported work can also close an existing active booking rather than leaving contradictory open work behind.
- Source metadata is stored against the customer and Quick Capture keeps a local intake audit trail showing source, stage, extraction confidence and whether the item created or merged a customer.
- Customer search now includes imported email/address data and customer detail shows how many captured source items are attached.
- Results includes Quick Capture counts, created-vs-merged customer totals and captured lifecycle stages.
- Connected Accounts now explains the intended future architecture: real email, calendar, CRM and invoicing integrations should feed candidate data into this same parse → match → review → merge/create pathway rather than bypassing owner review.
- No real external inbox, calendar, CRM or invoicing account is read in v1.9.
- Main navigation remains Home / Work / Results / Settings.


## v2.0 Busy Inbox + automatic triage
- Built the first Busy Inbox layer on top of v1.9 Quick Capture. Incoming candidate information can now be queued and triaged before it changes customer/work records.
- Quick Capture now defaults to “Add to Busy Inbox & triage”, while keeping an optional immediate Analyse & Review route.
- Busy Inbox stores pending candidate items locally and recalculates their triage against the current customer database and active work before review.
- Triage considers detected lifecycle stage, extraction confidence, missing required information, possible duplicate matches and conflicts with stronger active customer work.
- Pending items are separated into Needs attention and Ready to review instead of being shown as one unsorted list.
- Candidate priority favours live bookings, quotes and enquiries over lower-urgency completed-job admin, while uncertainty/conflicts increase review priority.
- The top Inbox candidate can participate in the Home Opportunity Engine ranking, so genuinely important incoming information can become the single best next move.
- Busy Inbox does not silently file records in v2.0. Owner review remains required before an Inbox item creates or merges a customer/work record.
- Reviewing an Inbox item reuses the v1.9 duplicate-prevention and lifecycle-protection rules: strong phone/email matches can merge, name-only matches are treated cautiously, owners can override a proposed match, and weaker incoming data cannot move a customer backwards.
- Filing an Inbox item marks it Filed and keeps the existing Intake History audit trail. Dismissed items remain visible as processed and can be returned to the Inbox.
- After filing one item, Busy can offer the next pending Inbox item to reduce repeated navigation.
- Added a clearly labelled four-item test Inbox batch so triage ordering and exception handling can be tested without pretending those items are real business data.
- Corrected stage inference so “Can I get a quote?” remains an Enquiry; only evidence that a quote was actually sent/provided is classified as Quote sent.
- Carried forward the v1.9 safeguard that an undetected service stays blank and must be confirmed rather than inheriting a default service.
- Work now leads with Busy Inbox, then Quick Capture/manual entry. Home and Settings expose Inbox access without adding another permanent tab.
- Results now reports Inbox items waiting, Needs attention vs Ready to review, filed items and dismissals separately from already-filed Quick Capture records.
- Connected Accounts now defines the intended future architecture: email, calendar, CRM and invoicing integrations should feed candidate events into Busy Inbox for triage/matching before filing.
- No real email, calendar, CRM, social inbox or invoicing system is read in v2.0.
- Main navigation remains Home / Work / Results / Settings.


## v2.1 Trusted Autopilot + exceptions only
- Added a separate Automatic Record Filing control with two modes: Review everything and Safe items only.
- Safe items only is intentionally narrow. It can only file into an already-known customer when the customer is matched exactly by phone or email, the extracted record is high-confidence, the customer name matches exactly, the service is explicitly detected and matches the existing record, and there is no active-work conflict.
- Existing phone/email/address data must stay consistent. A conflicting phone, email, service or saved address blocks automatic filing and leaves the item for review.
- Safe Autopilot never trusts a name-only match and never creates a brand-new customer automatically in v2.1.
- Duplicate source text is detected before automatic filing so the same Inbox item cannot quietly be filed twice.
- Stage-specific evidence is required: sent quotes need an explicit sent date and value; bookings need an explicit future date and time; completed jobs need an explicit non-future date and must not duplicate an existing completed job.
- Existing open enquiries and active customer work block automatic filing where they could create contradictory records.
- Safe Autopilot can file trusted Enquiry / Quote sent / Booking / Completed job record updates into the existing customer lifecycle, while reusing the v2.0 follow-up dates, Work booking records and completed-job admin.
- Automatic filing is record administration only. It never sends a customer message, publishes publicly or approves/spends advertising money.
- Every auto-filed item produces an Inbox receipt, Intake History record, customer activity entry and visible reason explaining why Busy had authority to file it.
- Busy Inbox now separates Auto-filed safely from Filed after owner review, and shows why Safe Autopilot stopped when a candidate failed a rule.
- Existing pending items that now pass the safe rules can be explicitly handed to Busy with “Let Busy file this safely”.
- Added a Safe Autopilot test using an existing prototype customer so the narrow automatic path can be verified deliberately.
- Results, Work and Settings expose the automatic-filing mode and auto-file counts.
- Connected Accounts now describes the same future trust architecture for email/calendar/CRM/invoicing feeds.
- Main navigation remains Home / Work / Results / Settings.
