import { fileURLToPath } from 'node:url';
import { close, createCaseDatabase, insert, run } from './seedHelpers.js';

/**
 * Case 01 — The Locked Office. The tutorial case.
 *
 * Solution (developer reference): Daniel Okafor.
 *
 * A theft, not a killing: nobody is hurt, nothing is broken, and the papers
 * were copied and put back. The whole case is solvable with SELECT, WHERE and
 * LIMIT. No ORDER BY, no aggregate and no JOIN is required at any point.
 *
 * The chain is deliberately three steps long:
 *
 *   1. Sarah Collins states the papers were still locked in the drawer when
 *      she left at 6:45 PM. That fixes the earliest possible moment.
 *   2. Two cards opened Office N-118 that evening — Priya Raman's at 6:10 PM
 *      and Daniel Okafor's at 6:52 PM. Priya is the single red herring, and
 *      she is cleared by the time alone, not by anything the player has to
 *      infer.
 *   3. Daniel's card then opens the copy room five minutes later, where the
 *      photocopier counted exactly the 48 pages the research file runs to.
 *
 * Marcus Webb never approaches the office at all; he is there so that the
 * roster has someone with an obvious motive and no opportunity, which is the
 * first thing a detective learns to separate.
 *
 * Note on `suspects.status`: every suspect carries the same value. The older
 * cases use this column for alibi state, which correlates exactly with guilt —
 * this case does not repeat that.
 */
export async function seedBeginnerDatabase() {
  const database = await createCaseDatabase('beginner.db');

  try {
    await run(database, 'BEGIN TRANSACTION');

    await insert(database, 'suspects', ['id', 'name', 'occupation', 'age', 'relationship_to_victim', 'background', 'personality', 'motive', 'alibi', 'weakness', 'hidden_secret', 'timeline', 'status', 'last_seen'], [
      [1, 'Marcus Webb', 'Postgraduate Researcher', 27, 'Supervised by Professor Collins.', 'A second-year postgraduate who shares a lab with two of Collins’s students.', 'Blunt, and easily flustered when questioned.', 'His own funding application covers the same ground as the missing research.', 'Says he was in Seminar Room B all evening.', 'He talks himself into trouble when he is nervous.', 'He missed the funding deadline a week ago and has not told his supervisor.', 'Says he was in Seminar Room B from six until half past seven.', 'Interviewed', '2026-09-15 19:20:00'],
      [2, 'Priya Raman', 'Evening Cleaner', 41, 'Cleans the North Wing on the evening rota.', 'Eleven years with Facilities. Holds a master card that opens every office in the wing.', 'Direct, unbothered, and precise about her rota.', 'None on record.', 'Signed the cleaning rota for the whole North Wing that evening.', 'She is careless about doors that should stay shut.', 'She props the store cupboard open to save walking, against policy.', 'Cleaning round through the North Wing from six o’clock.', 'Interviewed', '2026-09-15 19:05:00'],
      [3, 'Daniel Okafor', 'Department Administrator', 35, 'Handles the department’s funding paperwork, including Collins’s.', 'Runs the department office and keeps its records meticulously.', 'Helpful, organised, and very hard to rattle.', 'He is named on a competing funding bid that needs Collins’s unpublished results.', 'Says he was at his desk in the main office all evening.', 'His own record-keeping is thorough enough to place him.', 'He has been passing draft departmental bids to a contact at another university.', 'Says he was at his desk in the main office from six o’clock.', 'Interviewed', '2026-09-15 18:57:00'],
    ]);

    await insert(database, 'locations', ['id', 'name', 'address', 'description'], [
      [1, 'Office N-118', 'North Wing, Hawthorne University', 'Professor Collins’s office. Card-controlled door, one locked desk drawer.'],
      [2, 'Copy Room N-120', 'North Wing, Hawthorne University', 'Shared copy room two doors along the corridor from N-118.'],
    ]);

    await insert(database, 'witnesses', ['id', 'name', 'relationship', 'statement', 'reliability'], [
      [1, 'Professor Sarah Collins', 'Reported the theft', 'The papers were in the locked drawer when I left at 6:45 PM. I checked, because I was taking them to the review on Wednesday.', 'Reported the theft herself'],
      [2, 'Aisha Bello', 'Research assistant', 'I walked past N-118 just before seven and the light was on. Professor Collins had already gone home by then.', 'Consistent'],
      [3, 'Tom Reilly', 'Night porter', 'The copy room was still warm when I locked up at half past seven. That machine had been running.', 'Consistent'],
    ]);

    await insert(database, 'evidence', ['id', 'title', 'category', 'description', 'location_found', 'discovered_at'], [
      [1, 'Undamaged desk drawer', 'Physical', 'The drawer lock shows no scratches and no tool marks. It was opened with its own key, or it was never forced at all.', 'Office N-118', '2026-09-15 20:10:00'],
      [2, 'Door reader log', 'Digital', 'The N-118 door reader recorded every card presented to it that evening. Nothing was overridden.', 'Office N-118', '2026-09-15 20:15:00'],
      [3, 'Photocopier page counter', 'Digital', 'The copy room machine counted 48 pages between 6:57 PM and 7:08 PM. The research file runs to 48 pages.', 'Copy Room N-120', '2026-09-15 20:20:00'],
      [4, 'Papers returned to the drawer', 'Document', 'Nothing was carried away. The papers were copied and put back, which is why nobody noticed until the Wednesday review.', 'Office N-118', '2026-09-15 20:25:00'],
    ]);

    await insert(database, 'access_logs', ['id', 'person_name', 'access_point', 'access_time', 'result'], [
      [1, 'Priya Raman', 'Office N-118', '2026-09-15 18:10:00', 'Granted'],
      [2, 'Marcus Webb', 'Seminar Room B', '2026-09-15 18:15:00', 'Granted'],
      [3, 'Sarah Collins', 'Office N-118', '2026-09-15 18:40:00', 'Granted'],
      [4, 'Daniel Okafor', 'Office N-118', '2026-09-15 18:52:00', 'Granted'],
      [5, 'Daniel Okafor', 'Copy Room N-120', '2026-09-15 18:57:00', 'Granted'],
      [6, 'Marcus Webb', 'Seminar Room B', '2026-09-15 19:20:00', 'Granted'],
    ]);

    await insert(database, 'documents', ['id', 'title', 'document_type', 'author_name', 'summary', 'created_at'], [
      [1, 'Confidential research file', 'Research', 'Sarah Collins', 'Forty-eight pages of unpublished results, due for review on the Wednesday.', '2026-09-01 09:00:00'],
      [2, 'North Wing card register', 'Register', 'Facilities Office', 'Lists which access card is issued to whom. Every card in the North Wing is accounted for.', '2026-09-14 16:00:00'],
      [3, 'Funding bid GR-2291', 'Funding bid', 'Daniel Okafor', 'A competing bid submitted the following morning, covering the same ground as the Collins file.', '2026-09-16 08:40:00'],
    ]);

    await insert(database, 'crime_scene', ['id', 'area', 'observation', 'recorded_at'], [
      [1, 'Office N-118', 'The door is undamaged and the lock works normally. Entry was by card.', '2026-09-15 20:05:00'],
      [2, 'Office N-118', 'The drawer was closed and locked when Facilities opened the room. Nothing is missing from it.', '2026-09-15 20:08:00'],
      [3, 'Copy Room N-120', 'The photocopier was still warm to the touch. A single staple lies on the floor beside it.', '2026-09-15 20:12:00'],
    ]);

    await insert(database, 'security_logs', ['id', 'event_time', 'system_name', 'event_type', 'details'], [
      [1, '2026-09-15 18:00:00', 'North Wing door controller', 'Shift start', 'Evening access period begins. All North Wing card readers active.'],
      [2, '2026-09-15 18:57:00', 'Copy Room N-120', 'Machine wake', 'Photocopier woke from standby and stayed awake for eleven minutes.'],
      [3, '2026-09-15 19:30:00', 'North Wing door controller', 'Lock-up', 'Night porter completed the North Wing lock-up round.'],
    ]);

    await run(database, 'COMMIT');
    console.info('Seeded beginner.db with 27 authored investigation records.');
  } catch (error) {
    await run(database, 'ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await close(database);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await seedBeginnerDatabase();
