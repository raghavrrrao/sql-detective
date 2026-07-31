-- Shared schema for each read-only investigation case database.
PRAGMA foreign_keys = ON;

CREATE TABLE suspects (id INTEGER PRIMARY KEY, name TEXT NOT NULL, occupation TEXT NOT NULL, age INTEGER, relationship_to_victim TEXT, background TEXT, personality TEXT, motive TEXT, alibi TEXT, weakness TEXT, hidden_secret TEXT, timeline TEXT, status TEXT NOT NULL, last_seen TEXT);
CREATE TABLE victims (id INTEGER PRIMARY KEY, name TEXT NOT NULL, occupation TEXT, age INTEGER, date_of_death TEXT, time_of_death TEXT, location_id INTEGER, cause_of_death TEXT);
CREATE TABLE evidence (id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, location_found TEXT, discovered_at TEXT);
CREATE TABLE crime_scene (id INTEGER PRIMARY KEY, area TEXT NOT NULL, observation TEXT NOT NULL, recorded_at TEXT);
CREATE TABLE witnesses (id INTEGER PRIMARY KEY, name TEXT NOT NULL, relationship TEXT, statement TEXT NOT NULL, reliability TEXT);
CREATE TABLE phone_logs (id INTEGER PRIMARY KEY, caller TEXT NOT NULL, receiver TEXT NOT NULL, call_time TEXT NOT NULL, duration_seconds INTEGER, summary TEXT);
CREATE TABLE cctv_logs (id INTEGER PRIMARY KEY, camera_id TEXT NOT NULL, observed_at TEXT NOT NULL, subject TEXT, observation TEXT);
CREATE TABLE access_logs (id INTEGER PRIMARY KEY, person_name TEXT NOT NULL, access_point TEXT NOT NULL, access_time TEXT NOT NULL, result TEXT NOT NULL);
CREATE TABLE locations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, address TEXT, description TEXT);
CREATE TABLE vehicles (id INTEGER PRIMARY KEY, owner_name TEXT NOT NULL, vehicle_type TEXT, registration TEXT, last_seen TEXT);
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT NOT NULL, department TEXT, role TEXT, shift TEXT);
CREATE TABLE fingerprints (id INTEGER PRIMARY KEY, evidence_id INTEGER, print_label TEXT NOT NULL, matched_to TEXT, match_confidence REAL);
CREATE TABLE weapons (id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT, recovered_from TEXT, forensic_note TEXT);
CREATE TABLE documents (id INTEGER PRIMARY KEY, title TEXT NOT NULL, document_type TEXT, author_name TEXT, summary TEXT, created_at TEXT);
CREATE TABLE emails (id INTEGER PRIMARY KEY, sender TEXT NOT NULL, recipient TEXT NOT NULL, sent_at TEXT NOT NULL, subject TEXT, body_excerpt TEXT);
CREATE TABLE security_logs (id INTEGER PRIMARY KEY, event_time TEXT NOT NULL, system_name TEXT NOT NULL, event_type TEXT, details TEXT);
