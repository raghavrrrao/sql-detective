import { fileURLToPath } from 'node:url';
import { close, createCaseDatabase, insert, run } from './seedHelpers.js';

/**
 * Case 02 — The Mansion at Blackwood Hill.
 *
 * Solution (developer reference): Marcus Vane, the family solicitor.
 *
 * One crime, one twist. Arthur Blackwood is struck once with the mantel clock
 * at 9:47 PM. The study door reader records the room being opened at 9:44 and
 * 9:49 on estate fob 7, which belongs to Sofia Marin — the twist is simply
 * that she lent it to Vane at 9:35 in front of two witnesses. Motive is a
 * single forged page: Vane inserted an executor clause into the new will and
 * Arthur had found it.
 *
 * Six of the seven suspects are placed elsewhere by a camera, a continuous
 * call, a gate record, or a service log. The case is built to reward JOIN,
 * LEFT JOIN, GROUP BY, HAVING, LIKE, BETWEEN and IN.
 */
export async function seedMediumDatabase() {
  const database = await createCaseDatabase('medium.db');

  try {
    await run(database, 'BEGIN TRANSACTION');

    await insert(database, 'suspects', ['id', 'name', 'occupation', 'age', 'relationship_to_victim', 'background', 'personality', 'motive', 'alibi', 'weakness', 'hidden_secret', 'timeline', 'status', 'last_seen'], [
      [1, 'Vivienne Blackwood', 'Widow', 54, 'Arthur’s wife of eleven years.', 'A former gallery director who gave up her own business when she married.', 'Poised in company and sharp in private.', 'The new will reduces her from half the estate to the use of the house alone.', 'One unbroken telephone call to her sister from 9:30 PM to 9:58 PM, and a conservatory camera at 9:46 PM.', 'She would rather look guilty than look foolish.', 'She had already asked a solicitor of her own to look at the new will.', '9:20 PM argued with Arthur in the study; 9:24 PM left; 9:30 PM began the call to her sister.', 'Alibi verified', '2026-11-03 21:58:00'],
      [2, 'Julian Blackwood', 'Son', 31, 'Arthur’s only son, living on an allowance.', 'Educated expensively, employed briefly, and in debt to four creditors.', 'Charming, evasive, and certain the money was always going to be his.', 'The new will disinherits him completely, a week after Arthur refused to clear his debts.', 'Cellar stair camera shows him going down at 9:38 PM and coming back up at 9:55 PM. The stair is the only way in or out.', 'He lies before he thinks.', 'He has already sold two paintings from the west landing.', '9:38 PM went down to the cellar; 9:55 PM came back up carrying two bottles.', 'Alibi verified', '2026-11-03 21:55:00'],
      [3, 'Clara Blackwood-Hart', 'Daughter', 38, 'Arthur’s daughter, estranged for six years.', 'A physiotherapist who has spent years trying to fund a rehabilitation clinic.', 'Controlled, methodical, and slow to forgive.', 'Arthur refused for the sixth time to fund her clinic.', 'Front gate camera and gate log show her car leaving at 9:28 PM; a roadside camera places her twelve miles south at 9:41 PM.', 'She plans too carefully to improvise.', 'She photographed the new will on Arthur’s desk before she left.', '9:12 PM took coffee to the study; 9:18 PM left the study; 9:28 PM drove out through the front gate.', 'Alibi verified', '2026-11-03 21:28:00'],
      [4, 'Marcus Vane', 'Family Solicitor', 61, 'Solicitor to the Blackwood family for forty years.', 'A senior partner whose firm has handled the family’s affairs since Arthur’s father died.', 'Courteous, unhurried, and practised at deflecting an awkward question.', 'Arthur had found the executor clause Vane added to the new will and was reporting him in the morning.', 'States he was in the library from 9:30 PM. No camera, badge record or witness supports it.', 'He believes forty years of service entitle him to be believed.', 'The fifteen per cent executor’s fee in the new will would have paid him more than his firm earns in a year.', '8:02 PM asked Arthur to postpone; 9:35 PM borrowed Sofia Marín’s fob; nothing until 9:52 PM in the drawing room.', 'Alibi unverified', '2026-11-03 21:52:00'],
      [5, 'Edmund Rooke', 'Butler', 68, 'Butler to the family for forty years.', 'Came to the house at twenty-eight and has lived in the service wing since.', 'Formal, watchful, and reluctant to embarrass the family.', 'The new will removes the gate cottage Arthur promised him in 2019.', 'The housekeeper places him in the pantry at 9:45 PM, and the dumbwaiter service log records the pantry car being worked at 9:46 PM.', 'He protects the family’s name ahead of his own.', 'He had already written to Arthur asking for the cottage promise in writing.', '8:40 PM lit the study fire; 9:45 PM heard raised voices; 9:46 PM worked the pantry dumbwaiter; 10:03 PM found the body.', 'Alibi disputed', '2026-11-03 22:06:00'],
      [6, 'Sofia Marín', 'Estate Manager', 43, 'Estate manager for nine years.', 'Runs the farms, the staff and the accounts, and knows the house better than the family.', 'Direct, capable, and impatient with being patronised.', 'Arthur was preparing to sell the estate, which would end her position.', 'Garage camera holds her from 9:43 PM to 9:56 PM with two ground staff, and she used the garage extension at 9:44 PM.', 'She assumes a written record will always speak for her.', 'She had already been offered a job by the buyer.', '9:35 PM handed her estate fob to Marcus Vane in the main hall; 9:43 PM in the garage; 9:44 PM telephoned the gate house.', 'Alibi verified', '2026-11-03 21:56:00'],
      [7, 'Gregor Pike', 'Business Partner', 59, 'Arthur’s partner in Pike & Blackwood Ltd for twenty-two years.', 'Put up the capital while Arthur put up the name, and has resented it since.', 'Blunt, loud, and inclined to threaten when he is losing.', 'Arthur was dissolving the partnership and calling in the money Pike owed.', 'Turned away at the front gate at 7:58 PM. His car is logged at a hotel car park forty miles away all evening.', 'He says the worst thing he can think of and means none of it.', 'He had already instructed a valuer to price his share.', '7:58 PM refused entry at the gate; 9:41 PM telephoned Arthur and threatened him; the call ended at 9:44 PM.', 'Alibi verified', '2026-11-03 21:44:34'],
    ]);

    await insert(database, 'victims', ['id', 'name', 'occupation', 'age', 'date_of_death', 'time_of_death', 'location_id', 'cause_of_death'], [
      [1, 'Arthur Blackwood', 'Owner of the Blackwood Estate', 67, '2026-11-03', '9:47 PM', 1, 'A single blow to the head from the mantel clock.'],
    ]);

    await insert(database, 'locations', ['id', 'name', 'address', 'description'], [
      [1, 'Private Study', 'Blackwood Mansion, east wing', 'The crime scene. The door is fob-controlled and there is no camera inside the room.'],
      [2, 'Wine Cellar', 'Blackwood Mansion, basement', 'Reached by a single stair, which is covered by a camera. There is no other way in or out.'],
      [3, 'Garage and Yard', 'Blackwood Mansion, north courtyard', 'Covered by one camera and staffed all evening by the grounds team.'],
      [4, 'Conservatory', 'Blackwood Mansion, south wing', 'Covered by one camera. Reached from the main hall without passing the east corridor.'],
      [5, 'Butler’s Pantry', 'Blackwood Mansion, service corridor', 'No camera. The dumbwaiter keeps its own service log, and its gate must be held by hand.'],
      [6, 'Library', 'Blackwood Mansion, west wing', 'No camera. It lies in the opposite direction from the east corridor.'],
    ]);

    await insert(database, 'evidence', ['id', 'title', 'category', 'description', 'location_found', 'discovered_at'], [
      [1, 'Broken mantel clock', 'Weapon', 'The murder weapon, face down on the hearth. The brass base is bloodstained and the mechanism stopped at 9:47 PM. One camel-wool fibre is caught in the works.', 'Private Study, hearth', '2026-11-03 22:20:00'],
      [2, 'New will, dated 28 October', 'Document', 'The will Arthur announced at dinner. Page three appoints the family solicitor as executor with a fifteen per cent fee. The paper of page three does not match the rest.', 'Private Study, desk', '2026-11-03 22:31:00'],
      [3, 'Old will, dated 2019', 'Document', 'Recovered from the study safe. It divides the estate between the widow and the two children and leaves the gate cottage to the butler.', 'Private Study, safe', '2026-11-03 22:33:00'],
      [4, 'Open wall safe', 'Access', 'Concealed behind a portrait and found open and undamaged, so it was opened by someone who knew the combination.', 'Private Study, north wall', '2026-11-03 22:35:00'],
      [5, 'Camel overcoat', 'Forensic', 'Hanging out of place at the far end of the cloakroom rail. Blood on the right cuff matches Arthur, and wearer DNA was recovered from the collar.', 'Cloakroom', '2026-11-03 23:02:00'],
      [6, 'Estate fob 7', 'Access', 'The fob that opened the study at 9:44 PM and again at 9:49 PM. It is issued to the estate manager, and it was not in her hand that evening.', 'Cloakroom fob tray', '2026-11-03 23:05:00'],
      [7, 'Arthur Blackwood’s telephone', 'Digital', 'Recovered from the desk. One message was composed at 9:46 PM and never sent.', 'Private Study, desk', '2026-11-03 22:40:00'],
      [8, 'Solicitor’s file copy of the will', 'Document', 'The copy retained by Vane’s firm. Its page three is identical to the one in the study and unlike the draft the firm’s own system recorded on 28 October.', 'Vane & Partners, Chichester', '2026-11-04 15:10:00'],
    ]);

    await insert(database, 'crime_scene', ['id', 'area', 'observation', 'recorded_at'], [
      [1, 'Study door', 'Fob-controlled and undamaged. The door was closed but not locked, and the reader records every opening from either side.', '2026-11-03 22:12:00'],
      [2, 'Hearth', 'The mantel clock lies face down on the hearth stone. Its base is bloodstained and its hands stand at 9:47.', '2026-11-03 22:16:00'],
      [3, 'Desk', 'The new will lies open at page three, next to the victim’s telephone. The desk chair is overturned.', '2026-11-03 22:18:00'],
      [4, 'North wall', 'The portrait swings clear of the wall. The safe behind it stands open with no damage to the dial.', '2026-11-03 22:22:00'],
      [5, 'Cloakroom', 'A camel overcoat hangs at the wrong end of the rail rather than on its owner’s peg. The right cuff is stained.', '2026-11-03 23:00:00'],
    ]);

    await insert(database, 'witnesses', ['id', 'name', 'relationship', 'statement', 'reliability'], [
      [1, 'Edmund Rooke', 'Butler', '“I heard the Master’s voice raised at about a quarter to ten. Only his voice — whoever he was speaking to never raised theirs.”', 'High'],
      [2, 'Beatrice Cole', 'Housekeeper', '“Mr Rooke was in his pantry when I went by at a quarter to ten. He was working the dumbwaiter, same as every night.”', 'Medium'],
      [3, 'Nell Hobbs', 'Cook', '“I saw Miss Marín give her fob to Mr Vane in the hall. He said Mr Blackwood wanted the trust file fetched from the study.”', 'High'],
      [4, 'Sofia Marín', 'Estate Manager', '“I gave Mr Vane my fob at about twenty-five to ten, then went straight out to the garage. I never used it again that night.”', 'High'],
      [5, 'Marcus Vane', 'Family Solicitor', '“I was in the library from half past nine until I came through to the drawing room. I never went near the east corridor.”', 'Disputed'],
      [6, 'Vivienne Blackwood', 'Widow', '“I was on the telephone to my sister the whole time. Ask her, or ask the telephone company.”', 'High'],
      [7, 'Julian Blackwood', 'Son', '“I was down in the cellar looking for the eighty-two. I was still there when the shouting started.”', 'High'],
      [8, 'Wilf Danby', 'Ground staff', '“Mr Vane came into the drawing room about ten to ten, red in the face and out of breath. He had no overcoat, and he had worn it all evening.”', 'High'],
      [9, 'Clara Blackwood-Hart', 'Daughter', '“I took him his coffee and I left. I was through the gate before half past nine and there are cameras the whole way down that road.”', 'High'],
    ]);

    await insert(database, 'phone_logs', ['id', 'caller', 'receiver', 'call_time', 'duration_seconds', 'summary'], [
      [1, 'Marcus Vane', 'Arthur Blackwood', '2026-11-03 20:02:00', 96, 'Vane asks Arthur to postpone the following morning’s meeting. Arthur refuses and ends the call.'],
      [2, 'Vivienne Blackwood', 'Margaret Ashe', '2026-11-03 21:30:00', 1680, 'A single unbroken call to her sister. The line does not drop at any point and clears at 9:58 PM.'],
      [3, 'Gregor Pike', 'Arthur Blackwood', '2026-11-03 21:41:00', 214, 'Pike demands his money and says he will “finish this properly”. His handset connects through a mast forty miles from the estate.'],
      [4, 'Sofia Marín', 'Estate Gate House', '2026-11-03 21:44:00', 55, 'Marín asks the gate house to hold the gate open. The call is placed from the garage extension.'],
      [5, 'Marcus Vane', 'Vane & Partners Answer Service', '2026-11-03 21:58:00', 41, 'Vane leaves an instruction to pull the Blackwood will file first thing, eleven minutes after the estimated time of death.'],
      [6, 'Edmund Rooke', 'Emergency Services', '2026-11-03 22:06:00', 268, 'Rooke reports that Mr Blackwood is dead in the study and that the door was closed but not locked.'],
      [7, 'Clara Blackwood-Hart', 'Julian Blackwood', '2026-11-03 22:14:00', 132, 'Clara asks Julian who else went into the study after she left.'],
    ]);

    await insert(database, 'cctv_logs', ['id', 'camera_id', 'observed_at', 'subject', 'observation'], [
      [1, 'EAST-CORR-01', '2026-11-03 21:12:00', 'Clara Blackwood-Hart', 'Clara walks the east corridor toward the study carrying a coffee tray.'],
      [2, 'EAST-CORR-01', '2026-11-03 21:18:00', 'Clara Blackwood-Hart', 'Clara returns along the east corridor with the empty tray.'],
      [3, 'EAST-CORR-01', '2026-11-03 21:20:00', 'Vivienne Blackwood', 'Vivienne walks toward the study. Raised voices follow within the minute.'],
      [4, 'EAST-CORR-01', '2026-11-03 21:24:00', 'Vivienne Blackwood', 'Vivienne returns to the main hall. Arthur is heard speaking behind her.'],
      [5, 'FRONT-GATE-01', '2026-11-03 21:28:00', 'Clara Blackwood-Hart', 'Clara’s car leaves through the front gate and turns south.'],
      [6, 'MAIN-HALL-02', '2026-11-03 21:35:00', 'Sofia Marín', 'Marín hands a small fob to Marcus Vane. She then walks toward the garage and he walks toward the east corridor.'],
      [7, 'CELLAR-STAIR-01', '2026-11-03 21:38:00', 'Julian Blackwood', 'Julian goes down the cellar stair, the only entrance to the cellar.'],
      [8, 'GARAGE-01', '2026-11-03 21:43:00', 'Sofia Marín', 'Marín is in the garage with two ground staff and stays in frame until 9:56 PM.'],
      [9, 'ROAD-A29', '2026-11-03 21:41:00', 'Clara Blackwood-Hart', 'Clara’s car passes the roadside camera twelve miles south of the estate.'],
      [10, 'HOTEL-CP-01', '2026-11-03 21:45:00', 'Gregor Pike', 'Pike crosses the hotel car park at Camberly, forty miles from the estate.'],
      [11, 'CELLAR-01', '2026-11-03 21:46:00', 'Julian Blackwood', 'Julian is at the far rack in the cellar with a torch, still below stairs.'],
      [12, 'CONSERV-01', '2026-11-03 21:46:00', 'Vivienne Blackwood', 'Vivienne is alone in the conservatory with a telephone to her ear.'],
      [13, 'CELLAR-STAIR-01', '2026-11-03 21:55:00', 'Julian Blackwood', 'Julian comes back up the cellar stair carrying two bottles.'],
    ]);

    await insert(database, 'access_logs', ['id', 'person_name', 'access_point', 'access_time', 'result'], [
      [1, 'Gregor Pike', 'Front gate', '2026-11-03 19:58:00', 'Denied'],
      [2, 'Arthur Blackwood', 'Study door', '2026-11-03 21:05:00', 'Granted'],
      [3, 'Clara Blackwood-Hart', 'Study door', '2026-11-03 21:12:00', 'Granted'],
      [4, 'Clara Blackwood-Hart', 'Study door', '2026-11-03 21:18:00', 'Granted'],
      [5, 'Vivienne Blackwood', 'Study door', '2026-11-03 21:20:00', 'Granted'],
      [6, 'Vivienne Blackwood', 'Study door', '2026-11-03 21:24:00', 'Granted'],
      [7, 'Clara Blackwood-Hart', 'Front gate', '2026-11-03 21:28:00', 'Granted'],
      [8, 'Estate fob 7 (Sofia Marín)', 'Study door', '2026-11-03 21:44:00', 'Granted'],
      [9, 'Estate fob 7 (Sofia Marín)', 'Study door', '2026-11-03 21:49:00', 'Granted'],
      [10, 'Edmund Rooke', 'Study door', '2026-11-03 22:03:00', 'Granted'],
    ]);

    await insert(database, 'security_logs', ['id', 'event_time', 'system_name', 'event_type', 'details'], [
      [1, '2026-11-03 20:50:00', 'House address system', 'Announcement', 'Arthur Blackwood tells his guests that he signed a new will on 28 October and that it is in the study safe.'],
      [2, '2026-11-03 21:36:00', 'Camera network', 'Signal lost', 'East corridor camera EAST-CORR-01 drops off the recorder. The recorder cabinet stands in the study lobby.'],
      [3, '2026-11-03 21:44:00', 'Study door reader', 'Access granted', 'Estate fob 7 opens the study door from the corridor side.'],
      [4, '2026-11-03 21:46:00', 'Dumbwaiter', 'Service call', 'The butler’s pantry car is worked between the pantry and the kitchen. Its gate must be held by hand for the car to move.'],
      [5, '2026-11-03 21:47:00', 'Mantel clock', 'Mechanism stopped', 'The study mantel clock stops at 9:47 PM, which the pathologist accepts as the time of the blow.'],
      [6, '2026-11-03 21:49:00', 'Study door reader', 'Access granted', 'Estate fob 7 opens the study door from the room side.'],
      [7, '2026-11-03 21:58:00', 'Camera network', 'Signal restored', 'EAST-CORR-01 returns to the recorder. The gap runs from 9:36 PM to 9:58 PM.'],
    ]);

    await insert(database, 'emails', ['id', 'sender', 'recipient', 'sent_at', 'subject', 'body_excerpt'], [
      [1, 'Arthur Blackwood', 'Marcus Vane', '2026-11-02 09:14:00', 'Page three', 'Marcus, I have read the engrossment properly at last. I did not instruct that executor clause and you know I did not. Be here on the third.'],
      [2, 'Marcus Vane', 'Arthur Blackwood', '2026-11-02 11:02:00', 'Re: Page three', 'There is a simple explanation and it will take me five minutes to show you. Let us not put anything in writing before we have spoken.'],
      [3, 'Arthur Blackwood', 'Julian Blackwood', '2026-10-30 20:41:00', 'Your debts', 'I will not clear them, Julian. Not this time and not again. You will have to find another way.'],
      [4, 'Julian Blackwood', 'Arthur Blackwood', '2026-10-30 22:16:00', 'Re: Your debts', 'Then you have decided it for me. I hope you understand exactly what you have done.'],
      [5, 'Clara Blackwood-Hart', 'Arthur Blackwood', '2026-11-01 18:33:00', 'The clinic', 'Six years I have asked you. I am coming on Tuesday and I will ask you once more in person.'],
      [6, 'Gregor Pike', 'Arthur Blackwood', '2026-11-03 17:40:00', 'The partnership', 'You cannot dissolve it and call the money in the same week. I will be at the house tonight whether you invite me or not.'],
      [7, 'Arthur Blackwood', 'Edmund Rooke', '2026-11-03 12:05:00', 'The cottage', 'Edmund, the cottage stays yours whatever that new document says. I will put it beyond doubt in writing on Wednesday.'],
      [8, 'Sofia Marín', 'Arthur Blackwood', '2026-11-02 21:15:00', 'The sale', 'If you are selling, tell me before you tell the staff. I would rather hear it from you than from the buyer’s agent.'],
    ]);

    await insert(database, 'documents', ['id', 'title', 'document_type', 'author_name', 'summary', 'created_at'], [
      [1, 'Will Engrossment Record', 'Legal document', 'Vane & Partners', 'The firm’s own system logged a four-page will on 28 October. The recorded page three contains no executor clause and no fee.', '2026-10-28 15:30:00'],
      [2, 'Document Examiner Report', 'Forensic report', 'Home Office Examiner', 'Pages one, two and four of the new will share a single paper stock and printer. Page three, which carries the executor clause, matches neither.', '2026-11-04 11:20:00'],
      [3, 'Phone Extraction Report', 'Digital forensics', 'Digital Forensics Unit', 'One message composed at 9:46 PM and never sent: “Marcus is here about page three. If anything hap”. Nothing else was drafted that evening.', '2026-11-04 09:45:00'],
      [4, 'Fibre and DNA Report', 'Forensic report', 'Home Office Examiner', 'The camel-wool fibre from the clock is indistinguishable from the cloakroom overcoat, and the DNA from that coat’s collar is a single-source match to Marcus Vane.', '2026-11-05 10:30:00'],
      [5, 'Estate Fob Register', 'Estate record', 'Sofia Marín', 'Estate fob 7 is issued to the estate manager. Fobs are personal and the register notes that lending one is against house rules.', '2026-01-08 09:00:00'],
    ]);

    await insert(database, 'fingerprints', ['id', 'evidence_id', 'print_label', 'matched_to', 'match_confidence'], [
      [1, 1, 'FP-CLOCK-BASE', 'Unmatched', 0],
      [2, 2, 'FP-WILL-PAGE3', 'Marcus Vane', 0.968],
      [3, 6, 'FP-FOB-7', 'Marcus Vane', 0.954],
      [4, 7, 'FP-PHONE', 'Arthur Blackwood', 0.992],
    ]);

    await insert(database, 'weapons', ['id', 'name', 'type', 'recovered_from', 'forensic_note'], [
      [1, 'Antique mantel clock', 'Blunt instrument', 'Private Study, hearth', 'Arthur’s blood on the brass base and an impact profile matching the wound. No usable print — the hands that held it were covered.'],
    ]);

    await insert(database, 'vehicles', ['id', 'owner_name', 'vehicle_type', 'registration', 'last_seen'], [
      [1, 'Vivienne Blackwood', 'Range Rover', 'BWD-1', 'North drive, parked from 6:40 PM and not moved'],
      [2, 'Julian Blackwood', 'Coupé', 'JB-77', 'North drive, parked from 7:05 PM and not moved'],
      [3, 'Clara Blackwood-Hart', 'Estate car', 'CBH-320', 'Left the front gate at 9:28 PM; roadside camera twelve miles south at 9:41 PM'],
      [4, 'Marcus Vane', 'Saloon', 'MV-4410', 'North drive from 7:20 PM until 11:40 PM'],
      [5, 'Edmund Rooke', 'Van', 'ER-118', 'Service yard, parked since 5:00 PM'],
      [6, 'Sofia Marín', 'Pickup', 'SM-206', 'Garage bay two, parked since 4:30 PM'],
      [7, 'Gregor Pike', 'Saloon', 'GP-51', 'Hotel car park at Camberly, forty miles away, from 8:20 PM until 11:15 PM'],
    ]);

    await insert(database, 'employees', ['id', 'name', 'department', 'role', 'shift'], [
      [1, 'Edmund Rooke', 'Household', 'Butler', 'Evening'],
      [2, 'Sofia Marín', 'Estate', 'Estate Manager', 'Day'],
      [3, 'Beatrice Cole', 'Household', 'Housekeeper', 'Evening'],
      [4, 'Nell Hobbs', 'Kitchen', 'Cook', 'Evening'],
      [5, 'Wilf Danby', 'Grounds', 'Ground Staff', 'Evening'],
    ]);

    await run(database, 'COMMIT');
    console.info('Seeded medium.db with 99 authored investigation records.');
  } catch (error) {
    await run(database, 'ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await close(database);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await seedMediumDatabase();
