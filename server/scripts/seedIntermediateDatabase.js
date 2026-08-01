import { fileURLToPath } from 'node:url';
import { close, createCaseDatabase, insert, run } from './seedHelpers.js';

/**
 * Case 03 — The Gallery Theft.
 *
 * Solution (developer reference): Ruben Castellanos.
 *
 * The step between filtering one table and joining two. Everything here is
 * solvable with GROUP BY, LIKE, BETWEEN and DISTINCT on single tables — no
 * JOIN is required at any point.
 *
 * The teaching moment is deliberate. Counting door events across the whole
 * night puts Peter Halloran on top by a wide margin, because a night guard
 * walks the building all night; he is the red herring an unfiltered aggregate
 * hands you. Narrowing the same count to the swap window with BETWEEN moves him
 * to the far side of the gallery and leaves Ruben Castellanos on the loading
 * bay four times while nobody else is there more than once.
 *
 * Two further herrings hold up for a while: Ivy Zhang's card opens the bay at
 * 01:12 for a legitimate crate return, and Marta Lindqvist is the outsider with
 * the market contacts. Both are cleared by records the player already has.
 *
 * `suspects.status` is identical for everyone, as in the tutorial.
 */
export async function seedIntermediateDatabase() {
  const database = await createCaseDatabase('intermediate.db');

  try {
    await run(database, 'BEGIN TRANSACTION');

    await insert(database, 'suspects', ['id', 'name', 'occupation', 'age', 'relationship_to_victim', 'background', 'personality', 'motive', 'alibi', 'weakness', 'hidden_secret', 'timeline', 'status', 'last_seen'], [
      [1, 'Nadia Okonkwo', 'Head Curator', 52, 'Runs the Ashcroft Gallery.', 'Twenty years in public collections. Signed off the loan that brought the painting in.', 'Formal, exacting, and slow to trust.', 'The gallery’s insurance valuation is far above what the board thinks the work is worth.', 'At the patrons’ dinner across the square until half past midnight.', 'She hates being seen to have made a mistake.', 'She has already drafted the insurance claim wording.', 'Left the dinner at 12:30 AM and used the staff entrance once.', 'Interviewed', '2026-06-11 00:41:00'],
      [2, 'Ruben Castellanos', 'Conservator', 44, 'Restores and re-varnishes the gallery’s holdings.', 'Trained in Madrid. The only person on staff who can match a nineteenth-century palette.', 'Quiet, meticulous, and rarely explains himself.', 'A private collector has been asking after the work for two years and paying well for access.', 'Says he was in the conservation workshop until eleven and then went home.', 'He signs out materials he does not log.', 'He has been building the copy in the workshop for eleven weeks.', 'Says he left the building before midnight.', 'Interviewed', '2026-06-11 02:38:00'],
      [3, 'Ivy Zhang', 'Registrar', 31, 'Catalogues every work that enters or leaves.', 'Handles condition reports, crates and courier paperwork.', 'Organised, chatty, and openly stressed about money.', 'She is behind on a large personal debt and the board knows it.', 'Returning an empty crate to the loading bay after a late courier.', 'She takes shortcuts with paperwork when she is tired.', 'She has been quietly selling her own prints through the gift shop.', 'Signed a crate back in shortly after one and left.', 'Interviewed', '2026-06-11 01:15:00'],
      [4, 'Peter Halloran', 'Night Security Officer', 38, 'Walks the building through the night.', 'Eleven years on the night rota. Knows every door in the place.', 'Talkative, proud of his rounds, defensive about the logs.', 'He owes money to people who are not patient about it.', 'His patrol round is logged door by door across the whole night.', 'He rounds his timings up when he writes them by hand.', 'He has twice let a friend in after hours to look at the collection.', 'On patrol all night; the east wing between one and three.', 'Interviewed', '2026-06-11 05:58:00'],
      [5, 'Marta Lindqvist', 'Visiting Appraiser', 47, 'Valuing the collection for the insurers.', 'An independent appraiser flown in for the week. Knows exactly what the work would fetch.', 'Brisk, expensive, and impatient with amateurs.', 'She knows which private buyers want this painter and what they will pay.', 'At her hotel across the river from midnight.', 'She is careless about who she talks to about valuations.', 'She has an undeclared commission arrangement with a dealer.', 'Left the building at 8:40 PM and did not return.', 'Interviewed', '2026-06-10 20:40:00'],
      [6, 'Colin Beaumont', 'Facilities Supervisor', 59, 'Responsible for the loading bay and the plant rooms.', 'Thirty years with the building, most of them alone at night.', 'Blunt, unhurried, and hard to hurry.', 'He was told this month that his post is being cut.', 'Working on the failed bay shutter motor until half past midnight.', 'He props doors when the shutter sticks.', 'He has been taking scrap fittings home for years.', 'Working on the bay shutter until 12:30 AM.', 'Interviewed', '2026-06-11 00:34:00'],
    ]);

    await insert(database, 'locations', ['id', 'name', 'address', 'description'], [
      [1, 'Gallery Room 3', 'Ashcroft Gallery, Riverside', 'The long room where the nineteenth-century collection hangs.'],
      [2, 'Loading Bay', 'Ashcroft Gallery, Riverside', 'Goods entrance with a roller shutter and a card reader. No public access.'],
      [3, 'Conservation Workshop', 'Ashcroft Gallery, Riverside', 'Restoration studio with solvent storage and a extraction hood.'],
      [4, 'East Wing Corridor', 'Ashcroft Gallery, Riverside', 'Runs the length of the building away from the loading bay.'],
      [5, 'Staff Entrance', 'Ashcroft Gallery, Riverside', 'Card-controlled side door onto the square.'],
      [6, 'Registrar’s Office', 'Ashcroft Gallery, Riverside', 'Where condition reports and crate paperwork are filed.'],
    ]);

    await insert(database, 'witnesses', ['id', 'name', 'relationship', 'statement', 'reliability'], [
      [1, 'Nadia Okonkwo', 'Head curator', 'I checked Room 3 myself at eleven o’clock. Harbour at Dusk was on the wall and it was the real thing.', 'Reported the theft'],
      [2, 'Sam Petrides', 'Morning porter', 'When I opened Room 3 at twenty to eight the varnish was wrong. You could see it from the doorway.', 'Consistent'],
      [3, 'Peter Halloran', 'Night security officer', 'I was in the east wing from about one until nearly three. That is the far end of the building from the bay.', 'Consistent'],
      [4, 'Ivy Zhang', 'Registrar', 'I brought an empty crate back to the bay after the courier. I was in and out inside five minutes.', 'Consistent'],
      [5, 'Colin Beaumont', 'Facilities supervisor', 'The bay shutter motor has been failing for a fortnight. I gave up on it about half past midnight.', 'Consistent'],
      [6, 'Dr Anjali Rao', 'Independent conservator', 'The copy is good. Whoever made it had the original in front of them for weeks, not hours.', 'Expert opinion'],
      [7, 'Tomas Weir', 'Courier driver', 'My last drop was quarter to one. The bay was empty when I left and the shutter was propped.', 'Consistent'],
    ]);

    await insert(database, 'evidence', ['id', 'title', 'category', 'description', 'location_found', 'discovered_at'], [
      [1, 'Forged Harbour at Dusk', 'Physical', 'A copy of the painting hanging in the original frame. The varnish was still faintly tacky at eight in the morning.', 'Gallery Room 3', '2026-06-11 08:05:00'],
      [2, 'Solvent trace on the frame edge', 'Forensic', 'Fresh conservation solvent on the inner frame, of a kind held only in the workshop.', 'Gallery Room 3', '2026-06-11 08:20:00'],
      [3, 'Crate with a false base', 'Physical', 'A shipping crate in the bay with a lined compartment exactly the depth of a stretched canvas.', 'Loading Bay', '2026-06-11 08:35:00'],
      [4, 'Workshop materials book', 'Document', 'Pigment and canvas signed out over eleven weeks against no catalogued restoration job.', 'Conservation Workshop', '2026-06-11 09:10:00'],
      [5, 'Propped shutter wedge', 'Physical', 'A wooden wedge holding the bay roller shutter clear of its seat.', 'Loading Bay', '2026-06-11 08:40:00'],
      [6, 'Room 3 hanging wire', 'Physical', 'The wire was unhooked and rehung rather than cut. Whoever did it had handled the work before.', 'Gallery Room 3', '2026-06-11 08:25:00'],
      [7, 'Bay reader log printout', 'Digital', 'Every card presented to the loading bay reader through the night, printed by facilities.', 'Loading Bay', '2026-06-11 09:30:00'],
      [8, 'Camera index for the night', 'Digital', 'The overnight index for every camera in the building. Bay cameras are prefixed BAY.', 'Registrar’s Office', '2026-06-11 09:40:00'],
      [9, 'Empty courier crate', 'Physical', 'The crate Ivy Zhang signed back in. Standard base, nothing concealed.', 'Loading Bay', '2026-06-11 08:45:00'],
    ]);

    await insert(database, 'crime_scene', ['id', 'area', 'observation', 'recorded_at'], [
      [1, 'Gallery Room 3', 'No forced entry and no damage. The work was lifted off its wire and a copy hung in its place.', '2026-06-11 08:10:00'],
      [2, 'Gallery Room 3', 'Dust on the wall shows the frame was off the wire for less than an hour.', '2026-06-11 08:15:00'],
      [3, 'Loading Bay', 'The roller shutter was wedged clear of its seat. The card reader still logged every card presented.', '2026-06-11 08:38:00'],
      [4, 'Conservation Workshop', 'An extraction hood left running and a bench cleared to bare wood.', '2026-06-11 09:05:00'],
      [5, 'East Wing Corridor', 'Nothing disturbed. The patrol log for this corridor is unbroken through the night.', '2026-06-11 09:20:00'],
    ]);

    await insert(database, 'access_logs', ['id', 'person_name', 'access_point', 'access_time', 'result'], [
      [1, 'Peter Halloran', 'Staff Entrance', '2026-06-10 21:00:00', 'Granted'],
      [2, 'Marta Lindqvist', 'Staff Entrance', '2026-06-10 20:40:00', 'Granted'],
      [3, 'Peter Halloran', 'Gallery Room 3', '2026-06-10 22:10:00', 'Granted'],
      [4, 'Nadia Okonkwo', 'Gallery Room 3', '2026-06-10 23:00:00', 'Granted'],
      [5, 'Ruben Castellanos', 'Conservation Workshop', '2026-06-10 23:14:00', 'Granted'],
      [6, 'Peter Halloran', 'East Wing Corridor', '2026-06-10 23:40:00', 'Granted'],
      [7, 'Colin Beaumont', 'Loading Bay', '2026-06-11 00:05:00', 'Granted'],
      [8, 'Nadia Okonkwo', 'Staff Entrance', '2026-06-11 00:41:00', 'Granted'],
      [9, 'Colin Beaumont', 'Loading Bay', '2026-06-11 00:34:00', 'Granted'],
      [10, 'Ivy Zhang', 'Loading Bay', '2026-06-11 01:12:00', 'Granted'],
      [11, 'Peter Halloran', 'East Wing Corridor', '2026-06-11 01:20:00', 'Granted'],
      [12, 'Ruben Castellanos', 'Loading Bay', '2026-06-11 01:31:00', 'Granted'],
      [13, 'Ruben Castellanos', 'Gallery Room 3', '2026-06-11 01:48:00', 'Granted'],
      [14, 'Peter Halloran', 'East Wing Corridor', '2026-06-11 02:02:00', 'Granted'],
      [15, 'Ruben Castellanos', 'Loading Bay', '2026-06-11 02:11:00', 'Granted'],
      [17, 'Ruben Castellanos', 'Loading Bay', '2026-06-11 02:38:00', 'Granted'],
      [18, 'Peter Halloran', 'East Wing Corridor', '2026-06-11 02:44:00', 'Granted'],
      [19, 'Peter Halloran', 'Gallery Room 3', '2026-06-11 03:30:00', 'Granted'],
      [20, 'Peter Halloran', 'Staff Entrance', '2026-06-11 05:58:00', 'Granted'],
    ]);

    await insert(database, 'cctv_logs', ['id', 'camera_id', 'observed_at', 'subject', 'observation'], [
      [1, 'ROOM3-01', '2026-06-10 23:00:00', 'Nadia Okonkwo', 'Nadia stands in front of Harbour at Dusk and writes on a clipboard.'],
      [2, 'STAFF-01', '2026-06-10 20:40:00', 'Marta Lindqvist', 'Marta leaves by the staff entrance carrying a document case.'],
      [3, 'BAY-01', '2026-06-11 00:05:00', 'Colin Beaumont', 'Colin works on the shutter motor with a torch in his teeth.'],
      [4, 'BAY-01', '2026-06-11 00:34:00', 'Colin Beaumont', 'Colin gathers his tools and leaves the bay.'],
      [5, 'BAY-02', '2026-06-11 00:45:00', 'Tomas Weir', 'A courier reverses out of the bay. The shutter is wedged open behind him.'],
      [6, 'BAY-01', '2026-06-11 01:12:00', 'Ivy Zhang', 'Ivy wheels an empty crate into the bay.'],
      [7, 'BAY-01', '2026-06-11 01:15:00', 'Ivy Zhang', 'Ivy leaves the bay empty-handed.'],
      [8, 'EAST-01', '2026-06-11 01:20:00', 'Peter Halloran', 'Peter walks the east wing corridor checking door handles.'],
      [9, 'BAY-02', '2026-06-11 01:31:00', 'Ruben Castellanos', 'A figure carries a flat wrapped panel in from the bay. The face is turned away.'],
      [10, 'ROOM3-01', '2026-06-11 01:49:00', 'Ruben Castellanos', 'Someone lifts the frame off its wire in Room 3.'],
      [11, 'EAST-01', '2026-06-11 02:02:00', 'Peter Halloran', 'Peter is still in the east wing.'],
      [12, 'BAY-02', '2026-06-11 02:12:00', 'Ruben Castellanos', 'A wrapped panel goes out through the bay into a crate.'],
      [13, 'EAST-01', '2026-06-11 02:44:00', 'Peter Halloran', 'Peter reaches the far end of the east wing.'],
      [14, 'BAY-01', '2026-06-11 02:38:00', 'Ruben Castellanos', 'The bay shutter is lifted and lowered again from inside.'],
    ]);

    await insert(database, 'security_logs', ['id', 'event_time', 'system_name', 'event_type', 'details'], [
      [1, '2026-06-10 20:00:00', 'Gallery alarm panel', 'Night mode', 'Public rooms set to night mode. Staff cards remain active.'],
      [2, '2026-06-11 00:05:00', 'Loading bay shutter', 'Fault', 'Shutter motor reported an obstruction fault and stopped mid-travel.'],
      [3, '2026-06-11 00:47:00', 'Loading bay shutter', 'Held open', 'Shutter held clear of its seat. The alarm zone for the bay stayed suppressed.'],
      [4, '2026-06-11 01:48:00', 'Room 3 hanging sensor', 'Weight change', 'Hanging wire sensor in Room 3 recorded a weight change.'],
      [5, '2026-06-11 02:14:00', 'Room 3 hanging sensor', 'Weight change', 'Hanging wire sensor in Room 3 recorded a second weight change.'],
      [6, '2026-06-11 07:40:00', 'Gallery alarm panel', 'Day mode', 'Building opened for staff. Morning porter reported a problem in Room 3.'],
    ]);

    await insert(database, 'phone_logs', ['id', 'caller', 'receiver', 'call_time', 'duration_seconds', 'summary'], [
      [1, 'Ruben Castellanos', 'Withheld number', '2026-06-10 18:12:00', 96, 'A short call to a withheld number before the building closed.'],
      [2, 'Ivy Zhang', 'Tomas Weir', '2026-06-11 00:38:00', 54, 'Ivy confirms she will meet the courier at the bay.'],
      [3, 'Nadia Okonkwo', 'Marta Lindqvist', '2026-06-10 21:30:00', 240, 'The curator and the appraiser discuss the valuation schedule.'],
      [4, 'Peter Halloran', 'Gallery control room', '2026-06-11 01:19:00', 30, 'Peter books on for the east wing round.'],
      [5, 'Ruben Castellanos', 'Withheld number', '2026-06-11 02:52:00', 143, 'A second call to the same withheld number after the bay went quiet.'],
      [6, 'Colin Beaumont', 'Shutter maintenance line', '2026-06-11 00:31:00', 210, 'Colin reports the motor fault and is told it will be Monday.'],
    ]);

    await insert(database, 'documents', ['id', 'title', 'document_type', 'author_name', 'summary', 'created_at'], [
      [1, 'Loan agreement: Harbour at Dusk', 'Agreement', 'Nadia Okonkwo', 'Terms of the loan that brought the painting to the Ashcroft for the summer.', '2026-04-02 10:00:00'],
      [2, 'Insurance valuation schedule', 'Valuation', 'Marta Lindqvist', 'Independent valuation of the collection, filed the week before the theft.', '2026-06-05 15:20:00'],
      [3, 'Conservation materials requisition', 'Requisition', 'Ruben Castellanos', 'Eleven weeks of pigment, canvas and varnish signed out against no catalogued job.', '2026-06-09 09:15:00'],
      [4, 'Courier delivery note', 'Delivery note', 'Tomas Weir', 'Last drop of the evening, signed for at the loading bay at 12:45 AM.', '2026-06-11 00:45:00'],
      [5, 'Facilities fault report', 'Report', 'Colin Beaumont', 'The bay shutter motor fault, reported and deferred to the following week.', '2026-06-11 00:31:00'],
      [6, 'Condition report: Harbour at Dusk', 'Condition report', 'Ivy Zhang', 'The last catalogued inspection of the original, three days before it was taken.', '2026-06-08 11:00:00'],
    ]);

    await insert(database, 'fingerprints', ['id', 'evidence_id', 'print_label', 'matched_to', 'match_confidence'], [
      [1, 3, 'Crate false base, inner lip', 'Ruben Castellanos', 0.94],
      [2, 5, 'Shutter wedge', 'Colin Beaumont', 0.91],
      [3, 6, 'Room 3 hanging wire', 'Ruben Castellanos', 0.88],
      [4, 9, 'Empty courier crate handle', 'Ivy Zhang', 0.96],
    ]);

    await run(database, 'COMMIT');
    console.info('Seeded intermediate.db with 87 authored investigation records.');
  } catch (error) {
    await run(database, 'ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await close(database);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await seedIntermediateDatabase();
