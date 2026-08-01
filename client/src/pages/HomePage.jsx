import { motion } from 'framer-motion';
import { Clock3, DatabaseZap, Layers, ShieldQuestion } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { DifficultyCard } from '../components/DifficultyCard';
import { FeatureCard } from '../components/FeatureCard';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { SectionHeading } from '../components/SectionHeading';
import { CareerSummary } from '../components/CareerSummary';
import { availableCases, displayCases } from '../catalog/caseCatalog';

const features = [
  { title: 'Real SQL, real database', description: 'Every query runs against a live read-only SQLite case file. Nothing is faked or scripted.', icon: DatabaseZap },
  { title: 'Evidence that connects', description: 'Sixteen linked tables — statements, badge logs, cameras, forensics — all pointing at one person.', icon: Layers },
  { title: 'Beat the clock', description: 'Each case carries a target time. Ask sharper questions and you finish with time to spare.', icon: Clock3 },
  { title: 'Fair every time', description: 'No guesswork and no trick endings. The killer can always be proved from the data.', icon: ShieldQuestion },
];

/** Landing-page previews stay in sync with the real case dossiers. */
const difficulties = availableCases.map((entry) => ({
  difficulty: entry.tier,
  rank: entry.tierRank,
  time: entry.estimatedTime,
  concepts: entry.sqlConcepts,
  story: entry.preview,
}));

export function HomePage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="relative isolate overflow-hidden text-bone">
      <AnimatedBackground />
      <main className="relative z-10">
        <Hero />
        <CareerSummary />

        <section className="px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="The assignment"
              title="Every record leaves a trace"
              description="SQL Detective turns a relational database into a crime scene. It only gives up the truth to the right question."
            />
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {features.map((feature, index) => <FeatureCard key={feature.title} {...feature} index={index} />)}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Case clearance"
              title={`${displayCases.length} cases. One case file each.`}
              description="Difficulty comes from the SQL you need, not from a more confusing story. Each file opens once the one before it is closed."
            />
            <div className="grid gap-6 lg:grid-cols-3">
              {difficulties.map((difficulty, index) => <DifficultyCard key={difficulty.difficulty} {...difficulty} index={index} />)}
            </div>
          </div>
        </section>

        <HowItWorks />
      </main>
      <Footer />
    </motion.div>
  );
}
