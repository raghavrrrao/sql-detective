import { fileURLToPath } from 'node:url';
import { close, createCaseDatabase, insert, run } from './seedHelpers.js';

/**
 * Case 01 — The Dormitory Murder. The tutorial case.
 *
 * Solution (developer reference): Daniel Reed.
 *
 * Deliberately simple: one crime, one motive per suspect, one straight
 * timeline. The blackout from 10:13 to 10:23 PM is the murder window. Four of
 * the five suspects appear on a camera inside that window. Daniel does not,
 * and his own badge trail shows a nine-minute hole exactly where he claims to
 * have been working. A player can solve this with SELECT, WHERE, ORDER BY,
 * LIMIT and COUNT alone; JOINs are available but never required.
 */
export async function seedEasyDatabase() {
  const database = await createCaseDatabase('easy.db');

  try {
    await run(database, 'BEGIN TRANSACTION');

    await insert(database, 'suspects', ['id', 'name', 'occupation', 'age', 'relationship_to_victim', 'background', 'personality', 'motive', 'alibi', 'weakness', 'hidden_secret', 'timeline', 'status', 'last_seen'], [
      [1, 'Dr. Maya Patel', 'Research Assistant', 34, 'Ross’s lead research assistant for six years.', 'A systems researcher whose grant funding was cut this term.', 'Precise, guarded, and protective of the lab.', 'Ross removed her name from a grant application after a dispute.', 'Server room camera SERVER-03 holds her from 10:10 PM to 10:22 PM.', 'She takes criticism of her work personally.', 'She kept a private copy of the disputed dataset.', '10:10 PM entered the server room; 10:12 PM heard shouting; 10:24 PM called security.', 'Interviewed', '2026-10-14 22:24:00'],
      [2, 'Daniel Reed', 'Lab Technician', 29, 'Lab technician who held the equipment purchasing login.', 'A former scholarship student with large personal debts.', 'Friendly on the surface, defensive when questioned.', 'Ross traced altered equipment invoices to Daniel’s purchasing login and was sending an audit to the dean.', 'Claims he was working in the generator room from 10:13 PM.', 'He panics when money is mentioned.', 'He used the purchasing login to move lab funds to himself.', '10:02 PM called Ross; 10:12 PM badged out of the lab; no record of any kind until 10:21 PM.', 'Interviewed', '2026-10-14 22:21:00'],
      [3, 'Elena Morales', 'Graduate Student', 26, 'Doctoral student supervised by Ross.', 'A researcher waiting on approval to publish her thesis paper.', 'Blunt, impatient, and quick to argue.', 'Ross planned to delay her publication by another term.', 'Library camera LIBRARY-07 holds her at terminal L-7 from 10:14 PM to 10:26 PM.', 'Her temper makes her look worse than she is.', 'She recorded the 10:10 PM argument on her phone.', '10:06 PM entered Office 204; 10:10 PM argued with Ross; 10:11 PM left; 10:14 PM reached the library.', 'Interviewed', '2026-10-14 22:26:00'],
      [4, 'Victor Shaw', 'Security Officer', 41, 'Night security officer for North Hall.', 'A campus officer with eleven years on the night rota.', 'Observant, proud, and slow to admit a mistake.', 'Ross had complained in writing about gaps in his patrol logs.', 'Stairwell camera EAST-STAIR-01 places him on the east landing at 10:17 PM.', 'He cuts corners on paperwork.', 'He backdated two patrol entries the week before.', '10:05 PM scanned the hallway; 10:17 PM radioed dispatch and was filmed on the east landing; 10:22 PM reached the alarm panel.', 'Interviewed', '2026-10-14 22:22:00'],
      [5, 'Nora Fields', 'Department Secretary', 46, 'Department secretary and Ross’s closest colleague.', 'Keeps the department calendar and all staff correspondence.', 'Calm, discreet, and hard to read.', 'Ross asked her to prepare the paperwork that would dismiss Daniel Reed.', 'Corridor camera DEAN-CORR-01 places her outside the dean’s office at 10:16 PM.', 'She avoids saying anything that would embarrass a colleague.', 'She knew Ross intended to confront Daniel that night.', '10:07 PM entered the dean’s office; 10:16 PM in the dean’s corridor; 10:19 PM returned to North Hall.', 'Interviewed', '2026-10-14 22:19:00'],
    ]);

    await insert(database, 'victims', ['id', 'name', 'occupation', 'age', 'date_of_death', 'time_of_death', 'location_id', 'cause_of_death'], [
      [1, 'Professor Ethan Ross', 'Computer Science Professor', 48, '2026-10-14', '10:18 PM', 1, 'Single stab wound to the chest.'],
    ]);

    await insert(database, 'locations', ['id', 'name', 'address', 'description'], [
      [1, 'North Hall Office 204', 'Hawthorne University, North Hall', 'The victim’s office and the crime scene. There is no camera inside the room.'],
      [2, 'Server Room', 'North Hall basement', 'Covered by camera SERVER-03. Dr. Patel ran the nightly backup here.'],
      [3, 'East Stairwell', 'North Hall east wing', 'Covered by camera EAST-STAIR-01.'],
      [4, 'Hawthorne Library', 'Central campus', 'Covered by camera LIBRARY-07. Reached from North Hall in three minutes.'],
      [5, 'Loading Corridor', 'North Hall service exit', 'Unlit during the outage. Camera LOADING-02 covers one end of it.'],
    ]);

    await insert(database, 'evidence', ['id', 'title', 'category', 'description', 'location_found', 'discovered_at'], [
      [1, 'Stainless lab knife', 'Weapon', 'The murder weapon, found beside the victim. The blade carries Ross’s blood and the handle was wiped clean.', 'Office 204, beside the desk', '2026-10-14 22:27:00'],
      [2, 'Window fingerprint', 'Forensic', 'A fresh fingerprint on the inside of the Office 204 window frame. Only one person’s statement is contradicted by it.', 'Office 204 window', '2026-10-14 22:31:00'],
      [3, 'Hidden USB drive', 'Digital', 'A USB drive taped behind the bookshelf holding copies of the altered equipment invoices.', 'Office 204 bookshelf', '2026-10-14 22:33:00'],
      [4, 'Handwritten notebook', 'Document', 'Ross’s desk notebook. The last entry reads: “D.R. at 10:15. Bring the originals.”', 'Office 204 desk drawer', '2026-10-14 22:34:00'],
      [5, 'Blue nitrile gloves', 'Forensic', 'Gloves found in the boiler-room bin. Ross’s blood is on the outside cuff and a single person’s DNA is in the lining.', 'Boiler-room bin', '2026-10-14 22:41:00'],
      [6, 'Lab store sign-out sheet', 'Document', 'The lab store register. Blue nitrile gloves are not standard issue and were signed out once this term.', 'Laboratory store room', '2026-10-14 23:05:00'],
    ]);

    await insert(database, 'crime_scene', ['id', 'area', 'observation', 'recorded_at'], [
      [1, 'Office 204 doorway', 'The door was unlocked and undamaged. Ross either opened it himself or the visitor already had a key.', '2026-10-14 22:24:00'],
      [2, 'Victim desk', 'The notebook lies open and the monitor cable has been pulled from the back of the screen.', '2026-10-14 22:25:00'],
      [3, 'Office window', 'The window is closed and latched. There are fresh smear marks on the inside of the frame.', '2026-10-14 22:26:00'],
      [4, 'Boiler-room bin', 'Blue gloves discarded on top of the bin, still damp, placed there after the fire alarm cleared the corridor.', '2026-10-14 22:40:00'],
    ]);

    await insert(database, 'witnesses', ['id', 'name', 'relationship', 'statement', 'reliability'], [
      [1, 'Dr. Maya Patel', 'Research Assistant', '“I heard shouting at about ten past ten. I stayed with the backup — I could not leave it running alone.”', 'High'],
      [2, 'Daniel Reed', 'Lab Technician', '“I left the lab at ten past and went straight down to the generator room. I was there the whole time the lights were out.”', 'Disputed'],
      [3, 'Elena Morales', 'Graduate Student', '“We argued, yes. Then I left and went to the library. The turnstile will show you when I got there.”', 'High'],
      [4, 'Victor Shaw', 'Security Officer', '“I saw Daniel near the lab at about ten past ten. Just after quarter past I was answering a call on the east stairs.”', 'High'],
      [5, 'Nora Fields', 'Department Secretary', '“Professor Ross told me to keep Daniel’s quarter-past-ten meeting on the calendar even if Daniel tried to cancel.”', 'High'],
      [6, 'Liam Chen', 'Library Assistant', '“Elena was at terminal L-7 from about quarter past ten. She was still there when the fire alarm went off.”', 'High'],
    ]);

    await insert(database, 'phone_logs', ['id', 'caller', 'receiver', 'call_time', 'duration_seconds', 'summary'], [
      [1, 'Daniel Reed', 'Professor Ethan Ross', '2026-10-14 22:02:00', 122, 'Daniel asks to meet privately. Ross tells him to bring the original invoices.'],
      [2, 'Elena Morales', 'Dr. Maya Patel', '2026-10-14 22:07:00', 48, 'Elena complains that Ross is delaying her paper again.'],
      [3, 'Victor Shaw', 'Security Dispatch', '2026-10-14 22:17:00', 54, 'Victor reports he is checking the east stairwell after a door sensor alert.'],
      [4, 'Daniel Reed', 'Unknown Number', '2026-10-14 22:19:00', 9, 'A nine-second outgoing call placed one minute after the estimated time of death.'],
      [5, 'Dr. Maya Patel', 'Security Dispatch', '2026-10-14 22:24:00', 71, 'Maya reports that Ross is not answering inside Office 204.'],
    ]);

    await insert(database, 'cctv_logs', ['id', 'camera_id', 'observed_at', 'subject', 'observation'], [
      [1, 'NH-204-02', '2026-10-14 22:06:00', 'Elena Morales', 'Elena enters Office 204.'],
      [2, 'SERVER-03', '2026-10-14 22:10:00', 'Dr. Maya Patel', 'Maya enters the server room and starts the backup.'],
      [3, 'NH-204-02', '2026-10-14 22:11:00', 'Elena Morales', 'Elena leaves Office 204. Ross is visible and alive behind her.'],
      [4, 'LIBRARY-07', '2026-10-14 22:14:00', 'Elena Morales', 'Elena sits at terminal L-7 and stays in frame until 10:26 PM.'],
      [5, 'LOADING-02', '2026-10-14 22:15:00', 'Unidentified person', 'A figure in blue gloves enters the unlit loading corridor. The face is not visible.'],
      [6, 'DEAN-CORR-01', '2026-10-14 22:16:00', 'Nora Fields', 'Nora is in the dean’s corridor carrying a folder.'],
      [7, 'SERVER-03', '2026-10-14 22:17:00', 'Dr. Maya Patel', 'Maya is still at the backup console and has not left frame.'],
      [8, 'EAST-STAIR-01', '2026-10-14 22:17:00', 'Victor Shaw', 'Victor answers a radio call on the east stairwell landing.'],
      [9, 'GENERATOR-01', '2026-10-14 22:21:00', 'Daniel Reed', 'Daniel enters the generator room, three minutes after the estimated time of death.'],
    ]);

    await insert(database, 'access_logs', ['id', 'person_name', 'access_point', 'access_time', 'result'], [
      [1, 'Professor Ethan Ross', 'North Hall main entrance', '2026-10-14 21:55:00', 'Granted'],
      [2, 'Victor Shaw', 'North Hall patrol checkpoint', '2026-10-14 22:05:00', 'Granted'],
      [3, 'Nora Fields', 'Dean’s office', '2026-10-14 22:07:00', 'Granted'],
      [4, 'Dr. Maya Patel', 'Server room', '2026-10-14 22:10:00', 'Granted'],
      [5, 'Daniel Reed', 'Laboratory exit', '2026-10-14 22:12:00', 'Granted'],
      [6, 'Elena Morales', 'Library turnstile', '2026-10-14 22:14:00', 'Granted'],
      [7, 'Daniel Reed', 'Generator room', '2026-10-14 22:21:00', 'Granted'],
      [8, 'Victor Shaw', 'Fire alarm panel', '2026-10-14 22:22:00', 'Granted'],
    ]);

    await insert(database, 'security_logs', ['id', 'event_time', 'system_name', 'event_type', 'details'], [
      [1, '2026-10-14 22:13:00', 'Power Control', 'Scheduled outage', 'A planned generator test takes the North Hall corridor lighting offline. The blackout runs until 10:23 PM.'],
      [2, '2026-10-14 22:18:00', 'Office 204 monitor', 'Connection lost', 'The monitor cable in Office 204 is pulled at the estimated time of death.'],
      [3, '2026-10-14 22:20:00', 'Fire alarm', 'Manual pull', 'The loading-dock alarm is pulled by hand. No badge is needed, and it draws security away from the second floor.'],
      [4, '2026-10-14 22:21:00', 'Generator room', 'Door opened', 'A badge is read at the generator room three minutes after the estimated time of death.'],
      [5, '2026-10-14 22:23:00', 'Power Control', 'Power restored', 'Corridor lighting comes back on.'],
    ]);

    await insert(database, 'emails', ['id', 'sender', 'recipient', 'sent_at', 'subject', 'body_excerpt'], [
      [1, 'Elena Morales', 'Professor Ethan Ross', '2026-10-14 20:51:00', 'My paper', 'I am coming to see you tonight. I am not accepting another term of delay.'],
      [2, 'Professor Ethan Ross', 'Nora Fields', '2026-10-14 21:42:00', 'Meeting', 'Please keep Daniel’s quarter-past-ten appointment. I need the original invoices before I report this.'],
      [3, 'Dr. Maya Patel', 'Professor Ethan Ross', '2026-10-14 21:49:00', 'Backup', 'I am starting the archive at ten. The scheduled outage should not interrupt it.'],
      [4, 'Daniel Reed', 'Professor Ethan Ross', '2026-10-14 21:59:00', 'Please wait', 'Ethan, I can explain the equipment orders. Please do not send the audit tonight.'],
      [5, 'Professor Ethan Ross', 'Daniel Reed', '2026-10-14 22:11:00', 'Bring the originals', 'I know whose login placed those orders. Bring the original invoices to 204 now.'],
    ]);

    await insert(database, 'documents', ['id', 'title', 'document_type', 'author_name', 'summary', 'created_at'], [
      [1, 'Lab Store Sign-Out Register', 'Store record', 'Laboratory Store', 'Blue nitrile gloves were signed out once this term, on 12 October, by Daniel Reed.', '2026-10-12 09:15:00'],
      [2, 'Generator Test Work Order', 'Maintenance report', 'Campus Facilities', 'Authorises the 10:13 PM generator test and the ten-minute corridor blackout.', '2026-10-14 18:00:00'],
      [3, 'Equipment Audit Draft', 'Research document', 'Professor Ethan Ross', 'Invoice serial numbers do not match the equipment register. One purchasing login appears on every altered order: Daniel Reed’s.', '2026-10-14 21:33:00'],
      [4, 'Department Meeting Schedule', 'Meeting schedule', 'Nora Fields', 'One evening appointment is listed: Daniel Reed with Professor Ross, 10:15 PM, Office 204.', '2026-10-14 21:55:00'],
    ]);

    await insert(database, 'fingerprints', ['id', 'evidence_id', 'print_label', 'matched_to', 'match_confidence'], [
      [1, 1, 'FP-KNIFE-HANDLE', 'Unmatched', 0],
      [2, 2, 'FP-WINDOW-FRAME', 'Daniel Reed', 0.987],
      [3, 4, 'FP-NOTEBOOK', 'Professor Ethan Ross', 0.991],
      [4, 5, 'FP-GLOVE-CUFF', 'Daniel Reed', 0.964],
    ]);

    await insert(database, 'weapons', ['id', 'name', 'type', 'recovered_from', 'forensic_note'], [
      [1, 'Stainless laboratory knife', 'Sharp instrument', 'Office 204 floor', 'Ross’s blood on the blade. The handle was wiped, so no print survived.'],
      [2, 'Blue nitrile gloves', 'Concealment item', 'Boiler-room bin', 'Ross’s blood on the outside. The DNA in the lining is a single-source match to Daniel Reed.'],
    ]);

    await insert(database, 'vehicles', ['id', 'owner_name', 'vehicle_type', 'registration', 'last_seen'], [
      [1, 'Nora Fields', 'Sedan', 'HWP-611', 'Admin lot, 9:39 PM'],
      [2, 'Dr. Maya Patel', 'Hatchback', 'HWP-317', 'North lot, 9:48 PM'],
      [3, 'Elena Morales', 'Motorcycle', 'HWP-094', 'Library rack, 9:52 PM'],
      [4, 'Victor Shaw', 'Security SUV', 'CAMPUS-4', 'East gate, 10:16 PM'],
      [5, 'Daniel Reed', 'Blue sedan', 'HWP-822', 'Service lot, 10:28 PM'],
    ]);

    await insert(database, 'employees', ['id', 'name', 'department', 'role', 'shift'], [
      [1, 'Dr. Maya Patel', 'Computer Science', 'Research Assistant', 'Evening'],
      [2, 'Daniel Reed', 'Computer Science', 'Lab Technician', 'Evening'],
      [3, 'Elena Morales', 'Computer Science', 'Graduate Student', 'Evening'],
      [4, 'Victor Shaw', 'Campus Security', 'Security Officer', 'Night'],
      [5, 'Nora Fields', 'Computer Science', 'Department Secretary', 'Day'],
    ]);

    await run(database, 'COMMIT');
    console.info('Seeded easy.db with 79 authored investigation records.');
  } catch (error) {
    await run(database, 'ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await close(database);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await seedEasyDatabase();
