import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BookOpen, ClipboardCheck, Clock, Database, Gavel, Lightbulb,
  ListOrdered, Search, Sigma, Table2, Trophy, Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { ActionButton } from '../components/ActionButton';
import { Footer } from '../components/Footer';
import { SectionHeading } from '../components/SectionHeading';

/**
 * How to Play.
 *
 * Written for somebody who has never written a line of SQL and has never
 * played this. It teaches the reasoning first and the syntax second: every
 * query below is one a player will genuinely want to run in Case 01, and every
 * one of them is explained in terms of what it tells you about the case rather
 * than what it does to a table.
 *
 * Nothing here names a culprit or reveals a solution for any case.
 */

function Query({ children, note }) {
  return (
    <div className="clip-corner-sm mt-3 border border-white/10 bg-black/45">
      <pre className="overflow-x-auto px-4 py-3 font-mono text-sm leading-6 text-gold-bright">{children}</pre>
      {note && <p className="border-t border-white/10 px-4 py-2.5 typo-body-secondary text-sm text-bone-dim">{note}</p>}
    </div>
  );
}

function Card({ icon: Icon, title, children, step }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
      className="clip-corner panel-surface p-6 sm:p-7"
    >
      <div className="flex items-center gap-3">
        {step && <span className="font-mono text-sm font-medium tracking-[0.2em] text-crimson-glow">{step}</span>}
        <Icon size={20} className="text-gold-bright" strokeWidth={1.9} aria-hidden="true" />
        <h3 className="font-display text-xl font-medium uppercase tracking-wide text-bone">{title}</h3>
      </div>
      <div className="mt-4 space-y-3 typo-body text-base text-bone-muted">{children}</div>
    </motion.section>
  );
}

export function HowToPlayPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }} className="relative min-h-screen overflow-hidden text-bone">
      <AnimatedBackground />

      <main className="relative z-10 px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-display text-sm font-medium uppercase tracking-[0.18em] text-bone-dim transition-colors hover:text-gold-bright"
          >
            <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" /> Return to briefing
          </Link>

          <div className="pt-14">
            <SectionHeading
              eyebrow="Training"
              title="How to play"
              description="You do not need to know any SQL to start. This page teaches you everything Case 01 asks for, in the order you will need it."
            />
          </div>

          <div className="space-y-5">
            <Card icon={Search} title="What this game is">
              <p>
                Every case is a real crime scene stored in a real database. The statements, the door
                logs, the camera entries and the forensic reports are all rows in tables, exactly as a
                police records system would hold them.
              </p>
              <p>
                Nobody hands you the answer and there is no scripted path. You ask the database
                questions, it answers honestly, and you work out what the answers mean. That is the
                whole game: <span className="text-bone">asking better questions.</span>
              </p>
            </Card>

            <Card icon={Table2} title="A table is a filing cabinet" step="01">
              <p>
                A table holds one kind of record. <span className="font-mono text-bone">suspects</span> holds
                one row per person. <span className="font-mono text-bone">access_logs</span> holds one row
                every time a card was presented to a door. A row is a single fact; a column is one detail
                of that fact.
              </p>
              <p>
                You never have to guess what exists. The <span className="text-bone">Evidence tables</span> panel
                on the right of the investigation screen lists every table in the case you are playing,
                with how many rows it holds. Click one and the query is written for you.
              </p>
            </Card>

            <Card icon={Database} title="SELECT — ask to see something" step="02">
              <p>
                <span className="font-mono text-bone">SELECT</span> means &ldquo;show me&rdquo;. The star means
                &ldquo;every column&rdquo;. This is the first query of nearly every case, and it is worth
                running before anything clever:
              </p>
              <Query note="Shows the whole suspect roster — every person and everything recorded about them.">SELECT * FROM suspects;</Query>
              <p>
                <span className="font-mono text-bone">SELECT *</span> is useful precisely because it is
                blunt. You do not yet know which column matters, so look at all of them once. When a table
                is long, cut it down while you get your bearings:
              </p>
              <Query note="LIMIT stops after the first three rows, so a long log is readable at a glance.">SELECT * FROM access_logs LIMIT 3;</Query>
              <p>Naming columns instead of the star gives you a narrower, easier read:</p>
              <Query>SELECT name, occupation FROM suspects;</Query>
            </Card>

            <Card icon={ListOrdered} title="WHERE — narrow it to what matters" step="03">
              <p>
                A door log with sixty entries is not evidence; the four entries after the theft are.
                <span className="font-mono text-bone"> WHERE</span> keeps only the rows that match a
                condition, and it is how an alibi gets broken.
              </p>
              <Query note="Only the card events at one door. Text values go inside single quotes.">SELECT * FROM access_logs WHERE access_point = 'Office N-118';</Query>
              <Query note="Only what happened after a moment a witness fixed for you. Timestamps compare like text, so this works.">SELECT * FROM access_logs WHERE access_time &gt; '2026-09-15 18:45:00';</Query>
              <p>
                Combine conditions with <span className="font-mono text-bone">AND</span> and
                <span className="font-mono text-bone"> OR</span>. The detective habit to build here is
                simple: read a statement, find the moment it fixes, then ask the records what happened
                after it.
              </p>
            </Card>

            <Card icon={Clock} title="ORDER BY — put the night in order" step="04">
              <p>
                Records come back in whatever order they were filed, which is rarely the order they
                happened. <span className="font-mono text-bone">ORDER BY</span> sorts them, and a sorted
                log is a timeline.
              </p>
              <Query note="Every camera sighting, earliest first. Add DESC to read it backwards.">SELECT * FROM cctv_logs ORDER BY observed_at;</Query>
              <p>
                Reading a log in order is how you notice the thing that matters most in this game:
                <span className="text-bone"> the stretch where somebody is not there.</span> An absence is
                evidence.
              </p>
            </Card>

            <Card icon={Sigma} title="COUNT and GROUP BY — turn a long log into an answer" step="05">
              <p>
                Sometimes you do not want the rows, you want the number of them.
                <span className="font-mono text-bone"> COUNT(*)</span> counts, and
                <span className="font-mono text-bone"> GROUP BY</span> counts separately for each person.
              </p>
              <Query note="One line per person, with how many times their card was used.">{`SELECT person_name, COUNT(*) AS events
FROM access_logs
GROUP BY person_name;`}</Query>
              <p>
                Be careful with a bare count: a night guard who walks the building all night will always
                top it, and that means nothing. Narrow the window first, and the count starts telling the
                truth:
              </p>
              <Query note="BETWEEN keeps only the hours the crime could have happened in.">{`SELECT person_name, COUNT(*) AS events
FROM access_logs
WHERE access_time BETWEEN '2026-06-10 23:00:00' AND '2026-06-11 07:40:00'
GROUP BY person_name;`}</Query>
              <p>
                Later cases add <span className="font-mono text-bone">JOIN</span>, which reads two tables
                together, and each case teaches what the next one expects. You will never meet a concept
                the case before it did not prepare you for.
              </p>
            </Card>

            <Card icon={Users} title="How clues actually connect">
              <p>
                Three kinds of record matter, and they are worth different amounts:
              </p>
              <ul className="ml-5 list-disc space-y-1.5">
                <li><span className="text-bone">Statements</span> are what people say. People forget, round times up, and lie.</li>
                <li><span className="text-bone">Machine records</span> — doors, cameras, phones, alarms — are what actually happened.</li>
                <li><span className="text-bone">Forensics</span> tie a person to a physical object.</li>
              </ul>
              <p>
                A case is made when a statement and a machine record disagree, and you can show which one
                is wrong. So the loop is always the same: read a statement, find the record that should
                back it up, and check whether it does.
              </p>
            </Card>

            <Card icon={BookOpen} title="Your notebook, board and locker">
              <p>
                Every row you successfully pull is filed automatically. Nothing is lost, and nothing has
                to be copied down by hand.
              </p>
              <ul className="ml-5 list-disc space-y-1.5">
                <li><span className="text-bone">Case board</span> (left) — the briefing evidence, statements, scene notes and leads you were given up front.</li>
                <li><span className="text-bone">Evidence tables</span> (right) — every table in this case. Click one to query it.</li>
                <li><span className="text-bone">Suspects</span> (right) — each person&rsquo;s file grows as your queries turn up records naming them. You can flag a prime suspect or mark someone accounted for; neither is checked against the answer.</li>
                <li><span className="text-bone">Notebook</span> (bottom of the screen) — objectives, discoveries, your reconstructed timeline, hints, query history and your own notes.</li>
              </ul>
              <p>
                Press <span className="font-mono text-bone">Ctrl</span>+<span className="font-mono text-bone">K</span> to
                search everything you hold, <span className="font-mono text-bone">Ctrl</span>+<span className="font-mono text-bone">Enter</span> to
                run a query, and <span className="font-mono text-bone">Ctrl</span>+<span className="font-mono text-bone">L</span> to clear the terminal.
              </p>
            </Card>

            <Card icon={ClipboardCheck} title="Objectives and hints">
              <p>
                <span className="text-bone">Objectives</span> tick themselves as you work. They watch which
                tables you have genuinely queried and which SQL you have genuinely used, so none of them
                can be clicked off. If you are stuck, the objectives list is the honest answer to
                &ldquo;what have I not looked at yet?&rdquo;
              </p>
              <p>
                <span className="text-bone">Hints</span> unlock one at a time in the notebook, each more
                specific than the last. No hint ever names a person or states a conclusion — the most one
                will do is point you at a table or at a way of narrowing it. Each hint you take costs
                score, so it is a real decision, and every case can be closed without any of them.
              </p>
            </Card>

            <Card icon={Gavel} title="When to accuse">
              <p>
                The accuse button stays shut until your own file is substantial enough — enough records,
                from enough different tables, on enough different people. It tells you how close you are,
                never what the requirements are.
              </p>
              <p>
                An accusation takes three steps: name the person, cite the records that prove it, and state
                your reasoning. The reasoning is for you; the game grades the name and the citations.
              </p>
              <p>
                <span className="text-bone">A wrong accusation never tells you it was the wrong person.</span> It
                says only that the evidence does not support it, because a message that distinguished the
                two could be used to work through the roster one name at a time. It costs score, and you
                will need to find something new before you can try again.
              </p>
              <p>
                You are ready when you can say, out loud, which record proves the person was where they
                said they were not.
              </p>
            </Card>

            <Card icon={Trophy} title="Scoring, replay and the leaderboard">
              <p>
                Each case has a base score. Being thorough, completing objectives, asking focused questions
                rather than dumping every table, and finishing inside the target time all add to it. Wrong
                accusations and hints take away. Nobody is ever penalised for being careful.
              </p>
              <p>
                Cases open in order, and each one is unlocked by solving the one before it. Replaying a
                solved case never takes progress away, and only ever improves your best time and score.
                Your closed-case report is kept even if you restart the investigation.
              </p>
            </Card>

            <Card icon={Lightbulb} title="Personal Mode and Festival Mode">
              <p>
                <span className="text-bone">Personal Mode</span> is the normal game: your progress is kept on
                this machine, cases unlock in order, and you can come back to a half-finished case later.
              </p>
              <p>
                <span className="text-bone">Festival Mode</span> is for a shared laptop. Each player enters a
                detective name, every case is unlocked so a visitor with ten minutes can pick the tutorial,
                and scores go to a local leaderboard. Handing over to the next player clears the session
                from inside the app — nobody has to touch browser settings or refresh anything.
              </p>
              <p>You can switch between them at any time in Settings.</p>
            </Card>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <ActionButton as="link" to="/difficulty" variant="primary" size="lg" iconRight={ArrowRight}>
              Open Case 01
            </ActionButton>
            <ActionButton as="link" to="/" variant="ghost" size="lg" icon={ArrowLeft}>
              Back to briefing
            </ActionButton>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}
