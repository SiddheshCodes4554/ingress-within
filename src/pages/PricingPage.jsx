import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  X,
  HelpCircle,
  Plus,
  Minus,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  AlertCircle
} from 'lucide-react';

const ScrollReveal = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const FAQ_ITEMS = [
  {
    question: "What happens after the 7 free days?",
    answer: "Nothing automatic. You will be asked whether you want to continue. If you do, you pick a plan and add a card. If you don't, your entries remain accessible but no new reflections are generated. We don't charge you without you explicitly choosing to continue."
  },
  {
    question: "What is a cycle?",
    answer: "A cycle is roughly one month of daily entries. It is not a fixed countdown — it is however long it takes for a clear pattern to emerge from your writing. At the end of a cycle, you receive a full report of what surfaced. Most people start seeing real patterns after one cycle. The picture usually sharpens across two."
  },
  {
    question: "Can I cancel any time?",
    answer: "Yes. No minimum period, no cancellation fee. If you cancel mid-cycle you keep access until the end of your billing period. Your entries and reports remain accessible after cancellation. If you are a founding user, cancelling releases your ₹999 locked price — but you get one grace reinstatement. Return within 6 months and your founding price is restored. After 6 months or a second cancellation, standard rate applies."
  },
  {
    question: "What does the ₹799 founding price mean exactly?",
    answer: "₹799 is a launch discount available only to the first 50 users, for a limited time after launch. After the offer period ends, the price moves to ₹999 for everyone — including the founding 50. What founding users keep is ₹999 locked forever, even if the price rises further as costs grow. One condition: the subscription must stay continuous. If you cancel and miss a billing month, the founding price is released. One grace reinstatement: if you return within 6 months of cancelling, your founding price is restored — once. After that, standard rate applies. If a founding spot opens permanently, it goes to someone on our founding waitlist."
  },
  {
    question: "What if I miss a day?",
    answer: "Nothing happens. Missing a day doesn't reset anything or break the cycle. The practice works best with consistency but we don't penalise gaps. If you miss several days in a row, the system may note the gap when you return — not to judge it, but because gaps are sometimes part of the pattern too."
  },
  {
    question: "Is my writing private?",
    answer: "Yes. Your entries are private by design. They are not read by humans, not used to train models on other users, and not shared with anyone. The only thing that reads your writing is the system generating your reflection. Your writing stays yours."
  },
  {
    question: "What are add-ons?",
    answer: "Add-ons are features beyond the core practice that some users will want at certain points — structured reports for a counsellor, group reflection sessions, or therapist referrals. They are not part of the core subscription and will be priced separately. We are still working on the structure. Early users get first access."
  },
  {
    question: "Does this replace therapy?",
    answer: "No — and it is not designed to. This works before therapy, during it, after it, or entirely on its own. If you are in therapy, this gives you somewhere to put what happens between sessions — the thought you couldn't place, the moment after the hard conversation. If you are not in therapy and don't want to be, this still works as its own practice. Some people who use this will realise they want professional support. We will say so when we think it — clearly, directly, without drama."
  }
];

export default function PricingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleStartWriting = () => {
    window.location.hash = '#/auth';
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary selection:bg-accent/30 font-body-md pt-20">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-surface/90 glass-nav border-b border-primary/5 py-3 shadow-[0_2px_12px_rgba(30,42,46,0.02)]">
        <div className="flex justify-between items-center w-full max-w-container-max mx-auto px-6 md:px-16">
          <a href="#/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <svg className="w-8 h-8 text-primary" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="2" fill="currentColor" />
              <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" className="text-secondary" />
              <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="0.9" fill="none" opacity="0.65" className="text-secondary" />
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.35" className="text-secondary" />
            </svg>
            <div className="flex flex-col">
              <span className="font-headline-md text-lg font-bold tracking-tight text-primary leading-none">
                ingress <span className="font-normal text-secondary italic font-headline-md">within</span>
              </span>
              <span className="text-[9px] font-label-md tracking-[0.12em] uppercase text-primary/45 mt-0.5 leading-none font-bold">
                The way within
              </span>
            </div>
          </a>

          <div className="flex items-center gap-4">
            <a
              href="#/"
              className="font-label-md text-xs font-bold uppercase tracking-wider text-primary/70 hover:text-primary transition-colors flex items-center gap-1.5 px-4 py-2 border border-primary/10 rounded-lg hover:bg-primary/5 transition-all duration-300"
            >
              <ArrowLeft size={13} /> Back
            </a>
            <button
              onClick={handleStartWriting}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-md text-xs tracking-wider uppercase hover:bg-primary/95 hover:shadow-lg transition-all duration-300 cursor-pointer font-bold"
            >
              Start writing free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white py-20 md:py-28 px-6 md:px-16 text-center border-b border-primary/5">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.18em] block">Pricing</span>
          <h1 className="font-headline-md text-4xl md:text-5xl lg:text-6xl text-primary leading-tight font-medium">
            Start free. Continue only<br />
            <span className="italic text-accent">if it's honest enough to.</span>
          </h1>
          <div className="w-12 h-[1.5px] bg-accent mx-auto" />
          <p className="font-body-lg text-base md:text-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto opacity-90">
            We don't ask for commitment before we've earned it. The first seven days are free, unrestricted, and require no card. If the reflections aren't honest enough to make you want to continue, they shouldn't.
          </p>
        </div>
      </section>

      {/* Pricing Cards Grid & Spots Counter */}
      <section className="py-20 px-6 md:px-16 max-w-container-max mx-auto space-y-16">

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">

          {/* Plan 1: Free */}
          <ScrollReveal className="h-full flex" delay={0.05}>
            <div className="bg-white border border-primary/5 rounded-premium p-8 md:p-10 flex flex-col justify-between shadow-sm hover:shadow-md transition-all w-full text-left">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.25em] block">First 7 days</span>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="font-headline-md text-4xl md:text-5xl font-bold text-primary">Free</span>
                  </div>
                  <p className="font-body-md text-xs text-primary/50 pt-2 font-bold uppercase tracking-wider">No card required</p>
                </div>
                <div className="h-[1px] bg-primary/5" />
                <ul className="space-y-4 text-sm font-body-md text-on-surface-variant leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>Full access, no restrictions</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>One entry a day with AI reflection</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>One question per day</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>Pattern tracking begins</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>If it's not honest enough, stop</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleStartWriting}
                className="w-full bg-white hover:bg-primary hover:text-white border border-primary/15 hover:border-primary hover:scale-[1.02] text-primary font-label-md text-xs font-bold tracking-wider uppercase py-4 rounded-xl mt-8 transition-all shadow-xs cursor-pointer duration-300 text-center"
              >
                Start free &rarr;
              </button>
            </div>
          </ScrollReveal>

          {/* Plan 2: Founding 50 */}
          <ScrollReveal className="h-full flex" delay={0.15}>
            <div className="bg-primary text-on-primary border border-primary rounded-premium p-8 md:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden pricing-glow w-full text-left">
              <div className="absolute top-4 right-4 bg-accent text-primary px-3.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.1em]">
                Founding 50 only
              </div>
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-semibold text-accent uppercase tracking-[0.25em] block">Launch discount</span>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="font-headline-md text-4xl md:text-5xl font-bold text-white">₹799</span>
                    <span className="text-xs opacity-50 font-label-md">/ month</span>
                  </div>
                  <p className="font-body-md text-xs text-white/50 pt-2 font-bold uppercase tracking-wider">for a limited time</p>
                  <p className="text-[11px] text-accent/80 line-through mt-1">Then ₹999 / month, locked for you forever</p>
                </div>
                <div className="h-[1px] bg-white/10" />
                <ul className="space-y-4 text-sm font-body-md opacity-95 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>One entry a day, every day</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>AI reflection after every entry</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>One question per day</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>Weekly summary &amp; monthly report</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>₹999 locked even if price rises</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleStartWriting}
                className="w-full bg-accent hover:opacity-95 hover:scale-[1.02] text-primary font-label-md text-xs font-bold tracking-wider uppercase py-4 rounded-xl mt-8 transition-all shadow-md cursor-pointer duration-300 text-center"
              >
                Get early access &rarr;
              </button>
            </div>
          </ScrollReveal>

          {/* Plan 3: Standard */}
          <ScrollReveal className="h-full flex" delay={0.25}>
            <div className="bg-white border border-primary/5 rounded-premium p-8 md:p-10 flex flex-col justify-between shadow-sm hover:shadow-md transition-all w-full text-left">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.25em] block">Standard</span>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="font-headline-md text-4xl md:text-5xl font-bold text-primary">₹999</span>
                    <span className="text-xs text-primary/50 font-label-md">/ month</span>
                  </div>
                  <p className="font-body-md text-xs text-primary/50 pt-2 font-bold uppercase tracking-wider">Price may increase as costs grow</p>
                </div>
                <div className="h-[1px] bg-primary/5" />
                <ul className="space-y-4 text-sm font-body-md text-on-surface-variant leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>One entry a day, every day</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>AI reflection after every entry</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>One question per day</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>Weekly summary &amp; monthly report</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-accent mt-0.5">→</span>
                    <span>Cancel any time</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleStartWriting}
                className="w-full bg-white hover:bg-primary hover:text-white border border-primary/15 hover:border-primary hover:scale-[1.02] text-primary font-label-md text-xs font-bold tracking-wider uppercase py-4 rounded-xl mt-8 transition-all shadow-xs cursor-pointer duration-300 text-center"
              >
                Get started &rarr;
              </button>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-white py-20 px-6 md:px-16 border-t border-b border-primary/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.18em] block">What you get</span>
            <h2 className="font-headline-md text-3xl md:text-4xl text-primary font-medium">Free vs paid, clearly.</h2>
            <div className="w-10 h-[1px] bg-accent mx-auto" />
            <p className="font-body-md text-sm md:text-base text-on-surface-variant max-w-md mx-auto">
              No hidden differences. Everything that changes between free and paid, laid out plainly.
            </p>
          </div>

          <div className="border border-primary/10 rounded-2xl overflow-hidden shadow-xs">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-primary text-white font-label-md text-[10px] md:text-xs font-bold uppercase tracking-wider p-4 text-center items-center">
              <div className="text-left pl-2 text-white/60">Feature</div>
              <div>Free</div>
              <div className="text-accent bg-white/5 py-1 rounded">₹799 / ₹999</div>
              <div>Notes</div>
            </div>

            {/* Daily Practice Group */}
            <div className="bg-primary/5 text-primary font-label-md text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 text-left border-b border-primary/5">
              Daily practice
            </div>
            <div className="divide-y divide-primary/5">
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Daily entry</div>
                <div className="flex justify-center"><Check size={18} className="text-secondary" /></div>
                <div className="flex justify-center bg-primary/[0.01] h-full items-center"><Check size={18} className="text-secondary" /></div>
                <div className="text-xs text-primary/60 text-left md:text-center">One entry per day</div>
              </div>
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">AI reflection</div>
                <div className="flex justify-center"><Check size={18} className="text-secondary" /></div>
                <div className="flex justify-center bg-primary/[0.01] h-full items-center"><Check size={18} className="text-secondary" /></div>
                <div className="text-xs text-primary/60 text-left md:text-center">After every entry</div>
              </div>
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Daily question</div>
                <div className="flex justify-center"><Check size={18} className="text-secondary" /></div>
                <div className="flex justify-center bg-primary/[0.01] h-full items-center"><Check size={18} className="text-secondary" /></div>
                <div className="text-xs text-primary/60 text-left md:text-center">One question, no easy answer</div>
              </div>
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Pattern tracking</div>
                <div className="text-xs text-accent italic font-medium">Starts</div>
                <div className="flex justify-center bg-primary/[0.01] h-full items-center"><Check size={18} className="text-secondary" /></div>
                <div className="text-xs text-primary/60 text-left md:text-center">Builds across the full cycle</div>
              </div>
            </div>

            {/* Summaries Group */}
            <div className="bg-primary/5 text-primary font-label-md text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 text-left border-b border-primary/5 border-t border-primary/5">
              Summaries and reports
            </div>
            <div className="divide-y divide-primary/5">
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Weekly summary</div>
                <div className="flex justify-center"><X size={15} className="text-primary/20" /></div>
                <div className="flex justify-center bg-primary/[0.01] h-full items-center"><Check size={18} className="text-secondary" /></div>
                <div className="text-xs text-primary/60 text-left md:text-center">Themes &amp; shifts in the week</div>
              </div>
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Monthly cycle report</div>
                <div className="flex justify-center"><X size={15} className="text-primary/20" /></div>
                <div className="flex justify-center bg-primary/[0.01] h-full items-center"><Check size={18} className="text-secondary" /></div>
                <div className="text-xs text-primary/60 text-left md:text-center">Full picture at end of cycle</div>
              </div>
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Assessments</div>
                <div className="flex justify-center"><X size={15} className="text-primary/20" /></div>
                <div className="flex justify-center bg-primary/[0.01] h-full items-center"><Check size={18} className="text-secondary" /></div>
                <div className="text-xs text-primary/60 text-left md:text-center">Surfaced when pattern warrants</div>
              </div>
            </div>

            {/* Other Group */}
            <div className="bg-primary/5 text-primary font-label-md text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 text-left border-b border-primary/5 border-t border-primary/5">
              Other
            </div>
            <div className="divide-y divide-primary/5">
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Duration</div>
                <div className="text-xs text-accent font-medium italic">7 days</div>
                <div className="text-xs text-accent font-medium italic bg-primary/[0.01] h-full flex items-center justify-center">Ongoing</div>
                <div className="text-xs text-primary/60 text-left md:text-center">No minimum commitment</div>
              </div>
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Card required</div>
                <div className="text-xs text-secondary font-semibold">No</div>
                <div className="text-xs text-accent italic font-medium bg-primary/[0.01] h-full flex items-center justify-center">After day 7</div>
                <div className="text-xs text-primary/60 text-left md:text-center">Cancel any time</div>
              </div>
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Data privacy</div>
                <div className="flex justify-center"><Check size={18} className="text-secondary" /></div>
                <div className="flex justify-center bg-primary/[0.01] h-full items-center"><Check size={18} className="text-secondary" /></div>
                <div className="text-xs text-primary/60 text-left md:text-center">Your writing stays yours</div>
              </div>
              <div className="grid grid-cols-4 px-6 py-4 text-center items-center font-body-md text-sm text-on-surface-variant">
                <div className="text-left font-semibold text-primary">Add-ons</div>
                <div className="flex justify-center"><X size={15} className="text-primary/20" /></div>
                <div className="text-xs text-accent font-medium italic bg-primary/[0.01] h-full flex items-center justify-center">Coming soon</div>
                <div className="text-xs text-primary/60 text-left md:text-center">Early users get first access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personas / Tendencies */}
      <section className="py-20 px-6 md:px-16 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.18em] block">Before you pay</span>
          <h2 className="font-headline-md text-3xl md:text-4xl text-primary font-medium">Is this the right moment to start?</h2>
          <div className="w-10 h-[1px] bg-accent mx-auto" />
          <p className="font-body-md text-sm md:text-base text-on-surface-variant max-w-md mx-auto">
            The free week will tell you. But these are the signs it tends to work — and the signs it doesn't.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <ScrollReveal className="flex h-full">
            <div className="bg-white border-l-4 border-accent rounded-xl p-8 flex flex-col justify-between shadow-xs hover:translate-y-[-2px] transition-transform duration-300">
              <div className="space-y-4">
                <span className="font-label-md text-[10px] font-bold tracking-wider text-accent uppercase block">This tends to work if</span>
                <h3 className="font-headline-md text-xl font-bold text-primary leading-snug">You are willing to write the version before you edited it.</h3>
                <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                  Not the polished version. Not the story you have constructed around what happened. The thought before you made it make sense. Most people believe they are already doing this. The practice helps you see where you are not — without judging it.
                </p>
              </div>
              <p className="font-headline-md text-sm italic text-primary bg-primary/5 p-4 rounded-lg mt-6 leading-relaxed border border-primary/5">
                "Something is genuinely not working and I am tired of circling it."
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal className="flex h-full" delay={0.1}>
            <div className="bg-white border-l-4 border-secondary rounded-xl p-8 flex flex-col justify-between shadow-xs hover:translate-y-[-2px] transition-transform duration-300">
              <div className="space-y-4">
                <span className="font-label-md text-[10px] font-bold tracking-wider text-secondary uppercase block">This tends not to work if</span>
                <h3 className="font-headline-md text-xl font-bold text-primary leading-snug">You want confirmation that you're handling things well.</h3>
                <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                  If you write entries designed to produce reassurance, you will get reassurance — and leave knowing nothing you didn't know when you arrived. The product can only deliver clarity. It cannot deliver comfort on demand.
                </p>
              </div>
              <p className="font-headline-md text-sm italic text-primary bg-primary/5 p-4 rounded-lg mt-6 leading-relaxed border border-primary/5">
                "The gap between writing what happened and writing what is actually going on is where this product lives."
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Accordion FAQs Section */}
      <section className="bg-primary text-on-primary py-20 px-6 md:px-16 border-t border-b border-white/5">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.18em] block">Questions</span>
            <h2 className="font-headline-md text-3xl md:text-4xl text-white font-medium">Things people ask before they start.</h2>
            <div className="w-10 h-[1px] bg-accent mx-auto" />
          </div>

          <div className="space-y-4 pt-6">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.08] transition-colors duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                  >
                    <span className="font-headline-md text-base md:text-lg font-medium text-white group-hover:text-accent transition-colors duration-300">
                      {item.question}
                    </span>
                    <span className="text-accent font-bold text-xl transition-transform duration-300 flex-shrink-0 ml-4">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 font-body-md text-sm md:text-base text-white/70 leading-relaxed border-t border-white/5 pt-4">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-primary border-b border-white/5 py-10 px-6 md:px-16 text-center text-white/80">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 flex-wrap text-xs md:text-sm font-label-md font-medium tracking-wide">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-secondary" size={16} />
            <span>Private by design. Your writing stays yours.</span>
          </div>
          <div className="hidden md:block w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <AlertCircle className="text-accent" size={16} />
            <span>No card for the first 7 days.</span>
          </div>
          <div className="hidden md:block w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <RotateCcw className="text-secondary" size={16} />
            <span>Cancel any time, no questions.</span>
          </div>
          <div className="hidden md:block w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <HelpCircle className="text-accent" size={16} />
            <span>Not therapy. A different thing entirely.</span>
          </div>
        </div>
      </section>

      {/* Page CTA */}
      <section className="bg-mint-grey py-20 px-6 md:px-16 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="font-headline-md text-3xl md:text-4xl text-primary font-medium leading-snug">
            Seven days to find out<br />
            <span className="italic text-accent">if it's honest enough.</span>
          </h2>
          <p className="font-body-md text-sm md:text-base text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            No card. No commitment. Write without editing yourself — or don't bother.
          </p>
          <button
            onClick={handleStartWriting}
            className="bg-primary hover:bg-primary/95 text-white px-8 py-3.5 rounded-xl font-label-md text-xs font-bold tracking-wider uppercase inline-block shadow-sm transition-all duration-300 cursor-pointer mt-4"
          >
            Start writing free &rarr;
          </button>
        </div>
      </section>

      {/* Simple Subpage Footer */}
      <footer className="bg-primary text-white/50 text-xs py-10 px-6 md:px-16 border-t border-white/5">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white/80">
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="2" fill="currentColor" />
              <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" className="text-secondary" />
            </svg>
            <span className="font-headline-md text-sm font-bold tracking-tight text-white leading-none">
              ingress <span className="font-normal text-secondary italic font-headline-md">within</span>
            </span>
          </div>

          <div className="flex gap-6 font-label-md font-bold uppercase tracking-wider text-[10px]">
            <a href="#/" className="hover:text-white transition-colors">Home</a>
            <a href="#/#what" className="hover:text-white transition-colors">What it is</a>
            <a href="#/#trust" className="hover:text-white transition-colors">How it works</a>
            <a href="#/faq" className="hover:text-white transition-colors text-white">FAQ</a>
          </div>

          <div>
            &copy; 2025 Ingress Within. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
