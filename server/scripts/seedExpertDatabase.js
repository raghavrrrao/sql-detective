import { fileURLToPath } from 'node:url';
import { close, createCaseDatabase, insert, run } from './seedHelpers.js';

/**
 * Case 05 — The Aurelian Job.
 *
 * Solution (developer reference): Renata Silva, systems engineer.
 *
 * One crime and one twist, but the twist is mechanical rather than narrative:
 * the Deck 7 badge reader's clock runs twelve minutes fast, because Renata set
 * it that way at 11:40 PM to push her own record clear of the murder window.
 *
 * Three people appear on both the Deck 7 badge log and the Deck 7 camera, and
 * every one of those pairs is exactly twelve minutes apart — that is how the
 * offset is found. Applying it moves Naomi Kade out of the window (stamped
 * 1:09 AM, actually 12:57 AM) and Renata into it (stamped 1:17 AM, actually
 * 1:05 AM, two minutes before the blow). Renata never appears on the camera at
 * all, so only the corrected badge log places her there.
 *
 * The case is built to require multi-table JOINs, subqueries, CTEs and
 * datetime arithmetic. The story stays a single sentence: she stole the
 * designs, Celia found out, and Celia was going to say so at nine.
 */
export async function seedExpertDatabase() {
  const database = await createCaseDatabase('expert.db');

  try {
    await run(database, 'BEGIN TRANSACTION');

    await insert(database, 'suspects', ['id', 'name', 'occupation', 'age', 'relationship_to_victim', 'background', 'personality', 'motive', 'alibi', 'weakness', 'hidden_secret', 'timeline', 'status', 'last_seen'], [
      [1, 'Adrian Voss', 'Chief Financial Officer', 49, 'Celia’s husband and the company’s CFO.', 'Married Celia twelve years ago and has run the company’s finances since.', 'Smooth, rehearsed, and uncomfortable when the subject changes.', 'Celia had asked a divorce solicitor what would happen to his shareholding.', 'Casino camera holds him in frame continuously from 12:40 AM to 1:30 AM.', 'He cannot bear to be laughed at in public.', 'He had already moved his shares into a holding company.', '11:50 PM argued with Celia at dinner; 12:40 AM entered the casino; still there when the alarm went.', 'Interviewed', '2026-12-19 01:30:00'],
      [2, 'Leila Moreau', 'Chief Designer', 41, 'Led the design team on the stolen prototype.', 'Nine years at Aurelian and the named designer on four patents.', 'Exacting, tired, and openly resentful of the board.', 'Celia removed her name from the prototype credit two weeks ago.', 'Signed onto the bridge at 12:50 AM and stayed until 1:15 AM; the Captain and the bridge log both confirm it.', 'She argues in writing when she should stay quiet.', 'She had already accepted an interview with a competitor.', '12:50 AM went up to the bridge; 1:15 AM left the bridge; 1:26 AM woken by the alarm.', 'Interviewed', '2026-12-19 01:15:00'],
      [3, 'Captain Elias Rios', 'Master of the M/V Aurelian', 58, 'Master of the vessel Celia chartered for the voyage.', 'Thirty-one years at sea and eleven in command of the Aurelian.', 'Formal, unhurried, and protective of his crew.', 'Celia had found a falsified safety drill record and said she would report it.', 'Bridge deck log carries his signed entries at 1:00 AM and 1:15 AM, fifteen minutes apart as required.', 'He signs things his officers put in front of him.', 'He signed the drill record without watching the drill.', '12:50 AM received Leila Moreau on the bridge; 1:00 AM and 1:15 AM signed the deck log.', 'Interviewed', '2026-12-19 01:15:00'],
      [4, 'Naomi Kade', 'Head of Security', 36, 'Ran shipboard security for the voyage.', 'Former military police, hired by Celia four years ago.', 'Direct, watchful, and impatient with passengers.', 'Celia had begun an audit of her department’s equipment spending.', 'Her Deck 7 badge record is stamped 1:09 AM, but the Deck 7 camera puts her there at 12:57 AM and gone by 1:02 AM.', 'She assumes her own systems cannot be wrong.', 'She had bought security hardware from a company her brother owns.', '12:57 AM went to Suite 7A to report a door fault; 1:02 AM left the deck; 1:26 AM took the emergency call.', 'Interviewed', '2026-12-19 01:02:00'],
      [5, 'Felix Dorn', 'Legal Counsel', 44, 'The company’s general counsel.', 'Fifteen years at Aurelian and the author of every supplier contract.', 'Careful, literal, and easily flustered.', 'Celia discovered he had back-dated a non-disclosure agreement.', 'A satellite call to the mainland from the comms room ran from 12:55 AM to 1:22 AM without dropping.', 'He fixes paperwork rather than admitting a mistake.', 'He back-dated the agreement to cover his own missed deadline, not anyone else’s.', '12:55 AM entered the comms room; 1:22 AM ended the satellite call.', 'Interviewed', '2026-12-19 01:22:00'],
      [6, 'Isla Bennet', 'Executive Assistant', 29, 'Celia’s executive assistant for two years.', 'Joined from a hotel group and travels everywhere with Celia.', 'Anxious, precise, and desperate to be kept on.', 'Celia had interviewed a replacement for her the week before the voyage.', 'Crew mess camera holds her from 12:40 AM until the alarm at 1:26 AM.', 'She would rather be useful than honest.', 'She had read the leak audit on Celia’s desk and told no one.', '12:32 AM delivered papers to Suite 7A; 12:36 AM left; 12:40 AM went to the crew mess.', 'Interviewed', '2026-12-19 01:26:00'],
      [7, 'Theo Markham', 'Investor', 52, 'The company’s largest outside investor.', 'Bought into Aurelian six years ago and has wanted control since.', 'Loud, genial, and used to being accommodated.', 'Celia had refused his buyout offer for the third time that evening.', 'Restaurant camera shows him at a table with two other investors from 12:35 AM to 1:20 AM.', 'He negotiates in public and sulks in private.', 'He had already approached two board members privately.', '11:40 PM made the buyout offer; 12:35 AM sat down to a late supper; 1:20 AM returned to his cabin.', 'Interviewed', '2026-12-19 01:20:00'],
      [8, 'Renata Silva', 'Systems Engineer', 38, 'Maintained the ship’s access control and network systems.', 'Contracted by Aurelian to run the shipboard systems for the voyage.', 'Quiet, competent, and rarely noticed by anyone senior.', 'The leak audit traced the exported prototype files to her engineering workstation.', 'States she was in the engineering control room from 12:50 AM to 1:40 AM. Her deputy says she stepped out for about twenty minutes.', 'She trusts a record more than a witness — including her own.', 'She sold the prototype design package to a competitor for a sum she has not been able to explain.', '11:40 PM opened the Deck 7 reader panel; badge stamped 1:17 AM and 1:24 AM; no camera records her anywhere on Deck 7.', 'Interviewed', '2026-12-19 01:24:00'],
      [9, 'Kieran Holt', 'Steward', 33, 'Deck 7 steward responsible for the owner’s suites.', 'Three seasons aboard the Aurelian on the owner’s deck.', 'Cheerful, talkative, and easily rattled by authority.', 'Celia had him written up for taking wine from the owner’s store.', 'Galley camera at 1:00 AM, then his service round; he reached Suite 7A at 1:22 AM and raised the alarm.', 'He talks his way into trouble.', 'He had taken the wine and had already been made to pay for it.', '1:00 AM in the galley; 1:22 AM entered Suite 7A on his round and found the body; 1:24 AM called the bridge.', 'Interviewed', '2026-12-19 01:24:00'],
    ]);

    await insert(database, 'victims', ['id', 'name', 'occupation', 'age', 'date_of_death', 'time_of_death', 'location_id', 'cause_of_death'], [
      [1, 'Celia Voss', 'Founder and Chief Executive, Aurelian Systems', 54, '2026-12-19', '1:07 AM', 1, 'A single blow to the head from a bronze award statuette.'],
    ]);

    await insert(database, 'locations', ['id', 'name', 'address', 'description'], [
      [1, 'Suite 7A', 'M/V Aurelian, Deck 7 forward', 'The owner’s suite and the crime scene. There is no camera inside the suite.'],
      [2, 'Deck 7 Corridor', 'M/V Aurelian, Deck 7', 'One badge reader at the aft door. Camera DECK7-AFT covers the aft end only; the forward stair is not covered.'],
      [3, 'Deck 7 Lobby', 'M/V Aurelian, Deck 7 aft', 'Contains the access controller panel for the deck. It is reached from the forward stair without passing the camera.'],
      [4, 'Engineering Control Room', 'M/V Aurelian, Deck 3', 'Renata Silva’s station. It is not covered by any camera.'],
      [5, 'Bridge', 'M/V Aurelian, Deck 9', 'The deck log is signed every fifteen minutes and the bridge camera runs continuously.'],
      [6, 'Casino', 'M/V Aurelian, Deck 5', 'Covered by camera CASINO-01 without interruption.'],
      [7, 'Crew Mess', 'M/V Aurelian, Deck 2', 'Covered by camera MESS-01 without interruption.'],
      [8, 'Comms Room', 'M/V Aurelian, Deck 9 aft', 'Satellite calls are logged automatically with start and end times.'],
    ]);

    await insert(database, 'evidence', ['id', 'title', 'category', 'description', 'location_found', 'discovered_at'], [
      [1, 'Bronze award statuette', 'Weapon', 'The murder weapon, taken from Celia’s own shelf. Her blood is on the base and the grip was wiped clean.', 'Suite 7A, floor', '2026-12-19 02:10:00'],
      [2, 'Access controller panel', 'Digital', 'The Deck 7 controller panel in the lobby was found unlatched. Its clock is running twelve minutes ahead of ship time.', 'Deck 7 Lobby', '2026-12-19 03:40:00'],
      [3, 'Celia Voss’s laptop', 'Digital', 'Open on the desk, showing the leak audit. The audit names the workstation the prototype files were exported from.', 'Suite 7A, desk', '2026-12-19 02:15:00'],
      [4, 'Missing source annex', 'Document', 'The audit’s source annex, which lists the exporting account by name, is gone from the suite safe. The safe was opened without force.', 'Suite 7A, safe', '2026-12-19 02:22:00'],
      [5, 'Celia Voss’s telephone', 'Digital', 'One message composed at 1:06 AM and never sent.', 'Suite 7A, desk', '2026-12-19 02:18:00'],
      [6, 'Hand-cleaner trace', 'Forensic', 'A smear of citrus engineering hand-cleaner on the outside handle of Suite 7A. It is issued only to the engineering department.', 'Suite 7A, door handle', '2026-12-19 02:30:00'],
      [7, 'Blue nitrile trace', 'Forensic', 'Blue nitrile glove polymer transferred onto the statuette base. Engineering is the only department issued blue nitrile gloves.', 'Suite 7A, floor', '2026-12-19 02:34:00'],
      [8, 'Deck 7 camera storage node', 'Digital', 'The DECK7-AFT storage node failed at 12:20 AM and recorded only intermittently afterwards. Four clips survived from the whole night.', 'Security office', '2026-12-19 04:05:00'],
      [9, 'Engineering keycard sleeve', 'Access', 'A discarded engineering keycard sleeve in the Deck 7 lobby bin. The lobby is not on any steward’s round.', 'Deck 7 Lobby bin', '2026-12-19 03:50:00'],
      [10, 'Competitor draft agreement', 'Document', 'A draft consultancy agreement recovered from the ship’s network, offering a payment for “navigation reference materials”. The counterparty name is redacted.', 'Ship network archive', '2026-12-19 05:20:00'],
      [11, 'Board session agenda', 'Document', 'Celia’s printed agenda for the 9:00 AM board session. Item one reads: “Prototype leak — naming and dismissal.”', 'Suite 7A, desk', '2026-12-19 02:20:00'],
      [12, 'Suite 7A door', 'Access', 'No forced entry and no damage to the lock. Celia either opened the door or the visitor was someone she let in without concern.', 'Suite 7A', '2026-12-19 02:05:00'],
    ]);

    await insert(database, 'crime_scene', ['id', 'area', 'observation', 'recorded_at'], [
      [1, 'Suite 7A doorway', 'The door was closed but not locked. There is no damage to the frame or the lock.', '2026-12-19 02:05:00'],
      [2, 'Suite 7A desk', 'The laptop is open at the leak audit and the printed board agenda lies beside it. The desk chair is pushed back hard.', '2026-12-19 02:12:00'],
      [3, 'Suite 7A shelf', 'A gap on the award shelf where the statuette stood. Nothing else on the shelf was disturbed.', '2026-12-19 02:14:00'],
      [4, 'Suite 7A safe', 'Standing open with no damage. Only the audit’s source annex is missing; the cash and passports are untouched.', '2026-12-19 02:22:00'],
      [5, 'Deck 7 lobby', 'The access controller panel cover is unlatched and hanging open. Nothing else in the lobby has been touched.', '2026-12-19 03:40:00'],
      [6, 'Deck 7 forward stair', 'The forward stair connects the lobby to the corridor and is not covered by the deck camera.', '2026-12-19 03:45:00'],
    ]);

    await insert(database, 'witnesses', ['id', 'name', 'relationship', 'statement', 'reliability'], [
      [1, 'Kieran Holt', 'Steward', '“I went in on my round at twenty past one and she was on the floor. I called the bridge straight away.”', 'High'],
      [2, 'Naomi Kade', 'Head of Security', '“I went up to 7A about one to tell her the door sensor was faulty. I was five minutes and then I went down. My badge says nine past — but I know what time I went.”', 'High'],
      [3, 'Marek Novak', 'Deputy Engineer', '“Renata was in control at about ten to one, then she stepped out. Twenty minutes, near enough. She did not say where.”', 'High'],
      [4, 'Captain Elias Rios', 'Master', '“Miss Moreau came up at ten to one and stayed until quarter past. I signed the log at one and again at quarter past.”', 'High'],
      [5, 'Ana Ruiz', 'Communications Officer', '“Mr Dorn was on the satellite line from five to one until twenty past. I was in the room with him the whole call.”', 'High'],
      [6, 'Isla Bennet', 'Executive Assistant', '“I took her papers up just after half twelve and I was in the mess from twenty to one. Everyone there will tell you.”', 'High'],
      [7, 'Renata Silva', 'Systems Engineer', '“I was in engineering control from ten to one until twenty to two. I did not go up to Deck 7 at all that night.”', 'Disputed'],
      [8, 'Dilan Sen', 'Purser', '“The Deck 7 controller panel is never left open. I walk that lobby twice a night and it was shut at midnight.”', 'High'],
      [9, 'Otto Lind', 'Bridge Officer', '“Nobody launched a tender and nobody came alongside. Whoever did it is still on this ship.”', 'High'],
      [10, 'Adrian Voss', 'Husband and CFO', '“We argued at dinner, everyone saw that. Then I went to the casino and I did not move until the alarm.”', 'Medium'],
    ]);

    await insert(database, 'phone_logs', ['id', 'caller', 'receiver', 'call_time', 'duration_seconds', 'summary'], [
      [1, 'Theo Markham', 'Celia Voss', '2026-12-18 23:40:00', 190, 'Markham repeats his buyout offer. Celia refuses it for the third time that evening.'],
      [2, 'Renata Silva', 'Shore Contact', '2026-12-18 23:52:00', 88, 'A short call to a shore number placed twelve minutes after the Deck 7 controller was opened.'],
      [3, 'Celia Voss', 'Aurelian Board Secretary', '2026-12-19 00:18:00', 145, 'Celia confirms that item one of the 9:00 AM agenda will name the person responsible for the leak.'],
      [4, 'Adrian Voss', 'Divorce Solicitor', '2026-12-19 00:26:00', 132, 'Voss asks what a divorce would mean for his shareholding. He is told to expect a valuation.'],
      [5, 'Felix Dorn', 'Mainland Office', '2026-12-19 00:55:00', 1620, 'A satellite call from the comms room that runs unbroken for twenty-seven minutes and clears at 1:22 AM.'],
      [6, 'Naomi Kade', 'Bridge', '2026-12-19 01:03:00', 47, 'Kade reports the Suite 7A door sensor as faulty and asks for an engineer in the morning.'],
      [7, 'Renata Silva', 'Shore Contact', '2026-12-19 01:15:00', 11, 'An eleven-second call to the same shore number, eight minutes after the estimated time of death.'],
      [8, 'Kieran Holt', 'Bridge', '2026-12-19 01:24:00', 96, 'Holt reports that Miss Voss is dead in Suite 7A.'],
      [9, 'Captain Elias Rios', 'Coastal Authority', '2026-12-19 01:31:00', 240, 'The Captain reports a death aboard and confirms that no tender has left the ship.'],
    ]);

    await insert(database, 'cctv_logs', ['id', 'camera_id', 'observed_at', 'subject', 'observation'], [
      [1, 'DECK7-AFT', '2026-12-19 00:32:00', 'Isla Bennet', 'Bennet enters the Deck 7 corridor carrying a folder.'],
      [2, 'MESS-01', '2026-12-19 00:40:00', 'Isla Bennet', 'Bennet enters the crew mess and stays in frame until the alarm at 1:26 AM.'],
      [3, 'CASINO-01', '2026-12-19 00:40:00', 'Adrian Voss', 'Voss enters the casino and remains in frame continuously until 1:30 AM.'],
      [4, 'RESTAURANT-01', '2026-12-19 00:35:00', 'Theo Markham', 'Markham sits down to a late supper with two other investors.'],
      [5, 'BRIDGE-01', '2026-12-19 00:50:00', 'Leila Moreau', 'Moreau signs onto the bridge and remains in frame.'],
      [6, 'DECK7-AFT', '2026-12-19 00:57:00', 'Naomi Kade', 'Kade enters the Deck 7 corridor and walks forward toward Suite 7A.'],
      [7, 'GALLEY-01', '2026-12-19 01:00:00', 'Kieran Holt', 'Holt collects a service tray in the galley and leaves on his round.'],
      [8, 'DECK7-AFT', '2026-12-19 01:02:00', 'Naomi Kade', 'Kade returns aft along the Deck 7 corridor and leaves the deck.'],
      [9, 'BRIDGE-01', '2026-12-19 01:04:00', 'Captain Elias Rios', 'The Captain is at the chart table with Moreau present.'],
      [10, 'RESTAURANT-01', '2026-12-19 01:06:00', 'Theo Markham', 'Markham is still at the supper table with the same two investors.'],
      [11, 'CASINO-01', '2026-12-19 01:10:00', 'Adrian Voss', 'Voss is at the same table he sat down at, in frame throughout.'],
      [12, 'MESS-01', '2026-12-19 01:05:00', 'Isla Bennet', 'Bennet is at the long table in the crew mess with four other crew.'],
      [13, 'BRIDGE-01', '2026-12-19 01:15:00', 'Leila Moreau', 'Moreau signs off the bridge and goes below.'],
      [14, 'DECK7-AFT', '2026-12-19 01:22:00', 'Kieran Holt', 'Holt enters the Deck 7 corridor with a service tray and goes forward.'],
      [15, 'MESS-01', '2026-12-19 01:26:00', 'Isla Bennet', 'Bennet is still in the crew mess when the general alarm sounds.'],
    ]);

    await insert(database, 'access_logs', ['id', 'person_name', 'access_point', 'access_time', 'result'], [
      [1, 'Celia Voss', 'Deck 7 corridor door', '2026-12-18 23:14:00', 'Granted'],
      [2, 'Renata Silva', 'Deck 7 lobby panel', '2026-12-18 23:40:00', 'Granted'],
      [3, 'Adrian Voss', 'Casino entrance', '2026-12-19 00:40:00', 'Granted'],
      [4, 'Isla Bennet', 'Deck 7 corridor door', '2026-12-19 00:44:00', 'Granted'],
      [5, 'Isla Bennet', 'Deck 7 corridor door', '2026-12-19 00:48:00', 'Granted'],
      [6, 'Isla Bennet', 'Crew mess door', '2026-12-19 00:40:00', 'Granted'],
      [7, 'Leila Moreau', 'Bridge door', '2026-12-19 00:50:00', 'Granted'],
      [8, 'Felix Dorn', 'Comms room door', '2026-12-19 00:55:00', 'Granted'],
      [9, 'Naomi Kade', 'Deck 7 corridor door', '2026-12-19 01:09:00', 'Granted'],
      [10, 'Naomi Kade', 'Deck 7 corridor door', '2026-12-19 01:14:00', 'Granted'],
      [11, 'Renata Silva', 'Deck 7 corridor door', '2026-12-19 01:17:00', 'Granted'],
      [12, 'Renata Silva', 'Deck 7 corridor door', '2026-12-19 01:24:00', 'Granted'],
      [13, 'Leila Moreau', 'Bridge door', '2026-12-19 01:15:00', 'Granted'],
      [14, 'Kieran Holt', 'Deck 7 corridor door', '2026-12-19 01:34:00', 'Granted'],
      [15, 'Felix Dorn', 'Comms room door', '2026-12-19 01:22:00', 'Granted'],
    ]);

    await insert(database, 'security_logs', ['id', 'event_time', 'system_name', 'event_type', 'details'], [
      [1, '2026-12-18 23:40:00', 'Access controller — Deck 7', 'Time sync disabled', 'Automatic time synchronisation is switched off on the Deck 7 reader from an engineering account.'],
      [2, '2026-12-18 23:41:00', 'Access controller — Deck 7', 'Manual clock offset', 'A manual offset of plus twelve minutes is written to the Deck 7 reader clock. No other reader on the ship is changed.'],
      [3, '2026-12-19 00:20:00', 'Camera storage', 'Node failure', 'The DECK7-AFT storage node fails. Recording continues only in short intermittent clips for the rest of the night.'],
      [4, '2026-12-19 01:06:00', 'Suite 7A', 'Door sensor', 'The Suite 7A door sensor registers an opening one minute before the estimated time of death.'],
      [5, '2026-12-19 01:07:00', 'Suite 7A', 'Estimated time of death', 'The pathologist places the blow at 1:07 AM, within two minutes either side.'],
      [6, '2026-12-19 01:12:00', 'Suite 7A', 'Door sensor', 'The Suite 7A door sensor registers a second opening five minutes after the estimated time of death.'],
      [7, '2026-12-19 01:24:00', 'Bridge', 'Emergency call', 'The Deck 7 steward reports a death in Suite 7A.'],
      [8, '2026-12-19 01:26:00', 'General alarm', 'Alarm raised', 'The general alarm sounds and the ship is sealed. No tender is launched and none is missing.'],
      [9, '2026-12-19 03:40:00', 'Access controller — Deck 7', 'Panel found open', 'The Deck 7 controller panel is found unlatched, and its clock is still twelve minutes ahead of ship time.'],
      [10, '2026-12-19 04:10:00', 'Access controller — all decks', 'Audit', 'Every other reader on the ship is verified against ship time. Only the Deck 7 reader is wrong.'],
    ]);

    await insert(database, 'emails', ['id', 'sender', 'recipient', 'sent_at', 'subject', 'body_excerpt'], [
      [1, 'Celia Voss', 'Aurelian Board', '2026-12-16 09:20:00', 'Prototype leak', 'The audit is finished. I will name the person responsible at the session on the nineteenth and I will not be taking questions before then.'],
      [2, 'Leila Moreau', 'Celia Voss', '2026-12-16 18:05:00', 'The credit', 'Taking my name off that prototype after nine years is the cheapest thing you have ever done.'],
      [3, 'Theo Markham', 'Celia Voss', '2026-12-17 11:30:00', 'Offer', 'The offer stands until the nineteenth. After that I will make the same case to your board without you.'],
      [4, 'Celia Voss', 'Felix Dorn', '2026-12-17 15:44:00', 'The agreement', 'Felix, the execution date on that agreement is wrong and I think you know it is wrong. We will discuss it after the board session.'],
      [5, 'Celia Voss', 'Renata Silva', '2026-12-18 10:02:00', 'Workstation access', 'Renata, I need the export history from every engineering workstation, including your own, before nine tomorrow.'],
      [6, 'Renata Silva', 'Celia Voss', '2026-12-18 10:41:00', 'Re: Workstation access', 'The export logs roll over every thirty days, so there may be nothing useful left to give you. I will look tonight.'],
      [7, 'Adrian Voss', 'Celia Voss', '2026-12-18 19:15:00', 'Tonight', 'Do not do this in front of the investors. Whatever you have decided about us, it can wait until we are home.'],
      [8, 'Isla Bennet', 'Celia Voss', '2026-12-18 20:30:00', 'Papers for tonight', 'I have left the annex in the suite safe as you asked. The agenda is printed and on the desk.'],
      [9, 'Naomi Kade', 'Celia Voss', '2026-12-19 00:40:00', 'Door sensor', 'The sensor on your suite door is reading intermittently. I will come up and look at it now rather than leave it overnight.'],
    ]);

    await insert(database, 'documents', ['id', 'title', 'document_type', 'author_name', 'summary', 'created_at'], [
      [1, 'Prototype Leak Audit', 'Forensic report', 'External Auditor', 'The prototype design package was exported to removable media on three occasions. All three exports came from a single engineering workstation.', '2026-12-15 17:00:00'],
      [2, 'Workstation Assignment Register', 'System record', 'Aurelian IT', 'Engineering workstation ENG-04, the machine named in the leak audit, is assigned to Renata Silva and to no one else.', '2026-11-02 09:00:00'],
      [3, 'Access Controller Change Log', 'System record', 'Shipboard Systems', 'Two changes were written to the Deck 7 reader at 11:40 PM and 11:41 PM from engineering account eng-rsilva. No other account made a change that night.', '2026-12-18 23:41:00'],
      [4, 'Controller Privilege List', 'System record', 'Shipboard Systems', 'Three accounts can write a clock offset to a deck reader: the master account, the security account, and the engineering account.', '2026-10-30 12:00:00'],
      [5, 'Phone Extraction Report', 'Digital forensics', 'Digital Forensics Unit', 'One message composed at 1:06 AM and never sent: “It was you all along. I have the annex and I am going to say so at nine.”', '2026-12-19 08:30:00'],
      [6, 'Bridge Deck Log', 'Ship record', 'Captain Elias Rios', 'Signed entries at 12:45 AM, 1:00 AM, 1:15 AM and 1:30 AM. Leila Moreau is recorded as present on the bridge from 12:50 AM to 1:15 AM.', '2026-12-19 01:30:00'],
      [7, 'Satellite Call Record', 'Ship record', 'Communications Office', 'One outbound satellite call from the comms room, 12:55 AM to 1:22 AM, twenty-seven minutes, no interruption.', '2026-12-19 01:22:00'],
      [8, 'Tender Movement Log', 'Ship record', 'Deck Department', 'No tender was launched and no vessel came alongside between 8:00 PM and 6:00 AM. All five boats are accounted for on their davits.', '2026-12-19 06:00:00'],
      [9, 'Glove and Hand-Cleaner Issue Register', 'Ship record', 'Ship’s Stores', 'Blue nitrile gloves and citrus hand-cleaner are issued to the engineering department only. No other department draws either item.', '2026-12-01 08:00:00'],
      [10, 'Engineering Watch Record', 'Ship record', 'Deputy Engineer', 'Renata Silva signed on watch at 12:50 AM. The deputy records her absent from control between approximately 1:00 AM and 1:20 AM.', '2026-12-19 02:00:00'],
    ]);

    await insert(database, 'fingerprints', ['id', 'evidence_id', 'print_label', 'matched_to', 'match_confidence'], [
      [1, 1, 'FP-STATUETTE-GRIP', 'Unmatched', 0],
      [2, 2, 'FP-PANEL-COVER', 'Renata Silva', 0.981],
      [3, 3, 'FP-LAPTOP', 'Celia Voss', 0.994],
      [4, 5, 'FP-PHONE', 'Celia Voss', 0.992],
      [5, 9, 'FP-CARD-SLEEVE', 'Renata Silva', 0.967],
      [6, 11, 'FP-AGENDA', 'Isla Bennet', 0.973],
    ]);

    await insert(database, 'weapons', ['id', 'name', 'type', 'recovered_from', 'forensic_note'], [
      [1, 'Bronze award statuette', 'Blunt instrument', 'Suite 7A floor', 'Celia’s blood on the base and an impact profile matching the wound. The grip was wiped, and blue nitrile polymer was transferred onto the base.'],
      [2, 'Blue nitrile gloves', 'Concealment item', 'Not recovered', 'Inferred from the polymer transfer on the statuette. Ship’s stores issue blue nitrile to the engineering department only.'],
    ]);

    await insert(database, 'vehicles', ['id', 'owner_name', 'vehicle_type', 'registration', 'last_seen'], [
      [1, 'M/V Aurelian', 'Tender 1', 'AUR-T1', 'On its davit all night; never launched'],
      [2, 'M/V Aurelian', 'Tender 2', 'AUR-T2', 'On its davit all night; never launched'],
      [3, 'M/V Aurelian', 'Captain’s launch', 'AUR-CL', 'On its davit all night; never launched'],
      [4, 'M/V Aurelian', 'Crew shuttle', 'AUR-CS', 'On its davit all night; never launched'],
      [5, 'M/V Aurelian', 'Rescue boat', 'AUR-RB', 'On its davit all night; never launched'],
    ]);

    await insert(database, 'employees', ['id', 'name', 'department', 'role', 'shift'], [
      [1, 'Captain Elias Rios', 'Deck', 'Master', 'Night'],
      [2, 'Naomi Kade', 'Security', 'Head of Security', 'Night'],
      [3, 'Renata Silva', 'Engineering', 'Systems Engineer', 'Night'],
      [4, 'Marek Novak', 'Engineering', 'Deputy Engineer', 'Night'],
      [5, 'Kieran Holt', 'Hotel', 'Deck 7 Steward', 'Night'],
      [6, 'Isla Bennet', 'Executive', 'Executive Assistant', 'Day'],
      [7, 'Ana Ruiz', 'Communications', 'Communications Officer', 'Night'],
      [8, 'Dilan Sen', 'Hotel', 'Purser', 'Night'],
      [9, 'Otto Lind', 'Deck', 'Bridge Officer', 'Night'],
    ]);

    await run(database, 'COMMIT');
    console.info('Seeded expert.db with 136 authored investigation records.');
  } catch (error) {
    await run(database, 'ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await close(database);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await seedExpertDatabase();
