/**
 * Global investigation search.
 *
 * Searches only what the player can already see: their discoveries, journal,
 * timeline, suspect files, objectives, query history, the case-file material
 * they were handed at the briefing, and their own notes. Nothing is indexed
 * that is not already on screen somewhere.
 */

const MAX_PER_GROUP = 8;

const clip = (value, length = 160) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
};

function collect(term, items, mapper) {
  const matches = [];
  for (const item of items) {
    const entry = mapper(item);
    if (!entry) continue;
    if (!`${entry.title} ${entry.detail ?? ''}`.toLowerCase().includes(term)) continue;
    matches.push(entry);
    if (matches.length >= MAX_PER_GROUP) break;
  }
  return matches;
}

/**
 * @returns {{ total: number, groups: Array<{id,label,section,items}> }}
 */
export function searchInvestigation(rawTerm, sources) {
  const term = rawTerm.trim().toLowerCase();
  if (term === '') return { total: 0, groups: [] };

  const {
    discoveries = [], journal = [], timeline = [], intel = [],
    objectives = [], history = [], evidence = [], notebook = [], notes = '',
  } = sources;

  const groups = [
    {
      id: 'discoveries',
      label: 'Discoveries',
      section: 'discoveries',
      items: collect(term, discoveries, (record) => ({
        id: record.key,
        title: record.title,
        detail: `${record.table.replace(/_/g, ' ')} · ${record.confidence}${record.location ? ` · ${record.location}` : ''}`,
      })),
    },
    {
      id: 'timeline',
      label: 'Timeline',
      section: 'timeline',
      items: collect(term, timeline, (event) => ({
        id: event.id,
        title: `${event.clock} — ${event.title}`,
        detail: event.location ?? event.source.replace(/_/g, ' '),
      })),
    },
    {
      id: 'suspects',
      label: 'Suspects',
      section: 'suspects',
      items: collect(term, intel, (profile) => ({
        id: profile.name,
        title: profile.name,
        detail: `${profile.occupation} · ${profile.recordCount} ${profile.recordCount === 1 ? 'record' : 'records'} on file`,
      })),
    },
    {
      id: 'journal',
      label: 'Journal',
      section: 'journal',
      items: collect(term, journal, (entry) => ({
        id: entry.id,
        title: entry.title,
        detail: clip(entry.detail),
      })),
    },
    {
      id: 'objectives',
      label: 'Objectives',
      section: 'objectives',
      items: collect(term, objectives, (objective) => ({
        id: objective.id,
        title: objective.label,
        detail: objective.isDone ? 'Complete' : objective.hint,
      })),
    },
    {
      id: 'evidence',
      label: 'Case file',
      section: 'evidence',
      items: collect(term, evidence, (item) => ({
        id: `evidence:${item.id}`,
        title: item.title,
        detail: `${item.category} · ${clip(item.description)}`,
      })),
    },
    {
      id: 'briefing',
      label: 'Briefing',
      section: null,
      items: collect(term, notebook, (entry) => ({
        id: `briefing:${entry.slice(0, 40)}`,
        title: clip(entry, 90),
        detail: null,
      })),
    },
    {
      id: 'history',
      label: 'Query history',
      section: 'history',
      items: collect(term, history, (entry) => ({
        id: entry.id,
        title: clip(entry.sql, 110),
        detail: entry.ok ? `${entry.rowCount} ${entry.rowCount === 1 ? 'row' : 'rows'}` : 'Rejected',
      })),
    },
    {
      id: 'notes',
      label: 'Your notes',
      section: 'notes',
      items: collect(term, notes.trim() === '' ? [] : [notes], (value) => ({
        id: 'personal-notes',
        title: clip(value, 140),
        detail: null,
      })),
    },
  ].filter((group) => group.items.length > 0);

  return { total: groups.reduce((sum, group) => sum + group.items.length, 0), groups };
}
