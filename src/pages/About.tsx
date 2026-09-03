import { useSEO } from '../lib/useSEO';
import PageHeader from '../components/ui/PageHeader';
import Reveal from '../components/ui/Reveal';
import Button from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';

const pillars = [
  { n: '01', title: 'Subtraction', body: 'Every design begins with more than it needs. We remove until only the essential remains, then finish that essential by hand.' },
  { n: '02', title: 'Tolerance', body: 'Our atelier machines to a hundredth of a millimetre. A watch case, a speaker enclosure and an eyewear hinge are held to the same standard.' },
  { n: '03', title: 'Permanence', body: 'Objects are serialised, documented and guaranteed for the lifetime of their owner. We service what we make — indefinitely.' },
  { n: '04', title: 'Silence', body: 'No logos. No noise. The only mark is a single engraved line — our signature of restraint.' },
];

const timeline = [
  { year: '2019', text: 'Two engineers and a watchmaker begin prototyping in a converted Geneva foundry.' },
  { year: '2021', text: 'The first Chronos calibre, AE-01, completes 4,000 hours of torture testing.' },
  { year: '2023', text: 'Resonance ceramic acoustics unveiled; Optik and Kinetic studios established in Tokyo.' },
  { year: '2025', text: 'AETHER opens its New York atelier and releases five collections under one standard.' },
];

export default function About() {
  useSEO('The maison', 'The story and philosophy of AETHER — objects for the next century.');
  return (
    <>
      <PageHeader eyebrow="The maison" title={<>Engineered like instruments. <span className="italic text-muted">Worn like heirlooms.</span></>} description="AETHER is an atelier of engineers, watchmakers, acousticians and opticians working under a single roof and a single standard." crumbs={[{ label: 'Maison' }]} />

      <section className="wrap pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-sm border border-edge">
            <img src="/images/atelier.jpg" alt="The AETHER atelier" className="aspect-[21/9] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent" aria-hidden="true" />
            <p className="absolute bottom-6 left-6 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-muted md:bottom-10 md:left-10">The atelier — New York, 2025</p>
          </div>
        </Reveal>

        <div className="mt-24 grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow mb-5">Manifesto</p>
            <h2 className="font-display text-4xl font-light leading-tight md:text-5xl">We believe the objects we live with should be as considered as the architecture we live in.</h2>
          </Reveal>
          <Reveal delay={0.1} className="prose-luxe lg:col-span-6 lg:col-start-7">
            <p>
              Most products are designed to be replaced. Ours are designed to be repaired, re-finished and passed on. That single decision shapes everything — the materials we choose, the way each component is fastened, the documentation that accompanies every series.
            </p>
            <p>
              We work in five disciplines because they share a foundation: precision machining, honest materials, and a refusal to decorate. A Chronos movement and a Resonance driver are built by people who sit ten metres apart and speak the same language of tolerance.
            </p>
            <p>
              Each series is limited not for scarcity’s sake but because our atelier can only finish so many pieces to our standard. When a series is complete, its tooling is archived and the design moves forward.
            </p>
          </Reveal>
        </div>

        <div className="mt-28 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.08}>
              <div className="glass card-hover h-full rounded-sm p-8 hover:-translate-y-1 hover:border-gold/40">
                <p className="font-mono text-[0.62rem] tracking-[0.3em] text-gold">{p.n}</p>
                <h3 className="mt-5 font-display text-3xl">{p.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-28 grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow mb-5">Chronology</p>
            <h2 className="font-display text-4xl font-light md:text-5xl">A short history of a long view.</h2>
          </Reveal>
          <div className="lg:col-span-7 lg:col-start-6">
            <ol className="relative border-l border-edge">
              {timeline.map((t, i) => (
                <Reveal key={t.year} delay={i * 0.08}>
                  <li className="relative pb-12 pl-10 last:pb-0">
                    <span className="absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full border border-gold bg-obsidian" aria-hidden="true" />
                    <p className="font-mono text-sm text-gold">{t.year}</p>
                    <p className="mt-2 text-base leading-relaxed text-muted">{t.text}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>

        <Reveal className="mt-28">
          <div className="relative overflow-hidden rounded-sm border border-edge bg-surface px-8 py-16 text-center md:py-24">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(212,180,131,0.16),transparent_60%)]" aria-hidden="true" />
            <p className="eyebrow">Begin</p>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-light md:text-6xl">Choose an object that will outlast its era.</h2>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button to="/shop" size="lg" iconRight={<ArrowRight size={14} />}>Explore the catalogue</Button>
              <Button to="/contact" size="lg" variant="secondary">Speak to the concierge</Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
