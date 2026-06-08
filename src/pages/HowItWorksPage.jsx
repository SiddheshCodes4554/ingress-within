import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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

export default function HowItWorksPage({ onOpenPolicy }) {
  const [cycleProgress, setCycleProgress] = useState(14); // starts at Day 4 (14% progress)

  const handleStartWriting = () => {
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary selection:bg-accent/30 font-sans">
      <Navbar isSubpage={true} />

      {/* HERO */}
      <section className="bg-white">
        <div className="py-24 md:py-36 px-6 md:px-16 max-w-[700px] mx-auto text-center">
          <ScrollReveal className="space-y-5">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              The practice
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              One entry a day.<br />
              <em className="italic text-accent font-normal">A picture that builds itself.</em>
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[580px] mx-auto">
              Not because we interpret it. Because you kept writing without editing yourself first — and the thread accumulated into something you could finally see.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* STEP 1: WRITE — mint */}
      <section className="bg-mint-grey py-20 md:py-24 border-t border-primary/5">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <ScrollReveal className="space-y-6">
            <div className="space-y-3">
              <span className="font-serif text-6xl font-light text-primary/10 leading-none block">01</span>
              <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-[#5A9E94] block">
                Write
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
                Whatever is actually true right now.
              </h2>
              <p className="font-sans text-[14.5px] font-light text-mid leading-relaxed">
                No prompts. No structure. You open the app once a day and write whatever is in your head — in whatever order it comes out. Not the polished version. Not the version that makes you look reasonable.
              </p>
            </div>

            {/* Timeline arc */}
            <div className="space-y-0 border-l border-primary/10 pl-5 ml-1">
              <div className="relative pb-6 last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-accent bg-accent" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-accent">Day 1</div>
                <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed mt-1">
                  You write the version you'd tell a friend. The situation, the other person, what happened. That is fine. The thread begins.
                </p>
              </div>
              
              <div className="relative pb-6 last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-secondary bg-mint-grey" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-[#5A9E94]">A week in</div>
                <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed mt-1">
                  The entries get more honest without you deciding to make them so. You stop editing before you type.
                </p>
              </div>

              <div className="relative last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-supporting bg-mint-grey" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-supporting">Later</div>
                <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed mt-1">
                  You start writing the thing you immediately wanted to qualify. The thought before you made it acceptable.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            {/* UI Card Write */}
            <div className="bg-white rounded-premium overflow-hidden shadow-[0_8px_36px_rgba(30,42,46,0.11)] border border-primary/5">
              <div className="bg-primary px-5 py-3.5 flex items-center justify-between">
                <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">
                  Today's entry
                </span>
                <span className="font-serif text-[12px] text-mint-grey">
                  Day 4
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="font-serif text-base text-primary">
                  What's on your mind right now?
                </div>
                <div className="bg-mint-grey rounded-lg p-4 font-serif text-sm text-primary leading-relaxed min-h-[90px] relative">
                  "I've been putting off calling my sister back for three days. I keep telling myself I'm busy. But I think I'm actually avoiding something she said last week that I haven't fully thought about yet."
                  <span className="inline-block w-[2px] h-[16px] bg-accent animate-[blink_1.1s_infinite] ml-[2px] align-middle" />
                </div>
                <button className="w-full bg-accent text-primary border-none rounded-lg py-2.5 font-sans text-[13px] font-medium tracking-wide cursor-default transition-all duration-200">
                  Reflect &rarr;
                </button>
                <div className="bg-mint-grey rounded-lg p-4 space-y-3.5">
                  <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-mid">
                    Previous entries
                  </div>
                  <div className="space-y-2.5 divide-y divide-primary/8 font-serif text-[13px] text-mid leading-relaxed">
                    <div className="pb-2 flex justify-between items-start gap-4">
                      <span>"I said I was fine. I don't know if that was true."</span>
                      <span className="font-sans text-[10px] text-primary/30 whitespace-nowrap">Day 1</span>
                    </div>
                    <div className="pt-2.5 flex justify-between items-start gap-4">
                      <span>"I keep editing what I say before I say it."</span>
                      <span className="font-sans text-[10px] text-primary/30 whitespace-nowrap">Day 3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* STEP 2: REFLECT — dark */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <ScrollReveal className="order-2 md:order-1" delay={0.1}>
            {/* Reflection UI Card */}
            <div className="bg-white/5 border border-white/14 rounded-premium overflow-hidden shadow-none">
              <div className="bg-primary px-5 py-3.5 flex items-center justify-between border-b border-white/8">
                <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">
                  Reflection
                </span>
                <span className="font-serif text-[12px] text-mint-grey">
                  Day 4
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-white/6 border border-white/12 rounded-lg p-4 font-serif text-sm text-light-mid leading-relaxed min-h-[50px]">
                  "I think I'm avoiding something she said that I haven't fully thought about yet."
                </div>
                <div className="border-l-2 border-secondary bg-secondary/8 rounded-r-lg p-4 space-y-1">
                  <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">
                    Noticed
                  </div>
                  <div className="font-serif text-sm font-normal italic text-light-mid leading-relaxed">
                    "You've described yourself as 'not ready' or 'avoiding' three times this week — each time in a situation where someone close to you said something you didn't fully respond to. There may be a pattern worth looking at here."
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2.5">
                  <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-muted-text">
                    Also this week
                  </div>
                  <div className="font-serif text-[13px] font-normal italic text-light-mid leading-relaxed">
                    "You described yourself as 'saving them the trouble' on Day 1 and 'not wanting to make it worse' on Day 3. Each time, someone else walked away satisfied."
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="space-y-6 order-1 md:order-2">
            <div className="space-y-3">
              <span className="font-serif text-6xl font-light text-mint-grey/10 leading-none block">02</span>
              <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
                Reflect
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
                It names what you were circling without landing on.
              </h2>
              <p className="font-sans text-[14.5px] font-light text-light-mid leading-relaxed">
                Not a summary. Not encouragement. Something you hadn't quite said yet but recognise immediately as true. If you wrote the unedited version, it lands before you finish reading it.
              </p>
            </div>

            {/* Timeline arc */}
            <div className="space-y-0 border-l border-white/10 pl-5 ml-1">
              <div className="relative pb-6 last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-accent bg-primary" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-accent">Early</div>
                <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed mt-1">
                  Reflections read back what you wrote, slightly reframed. Useful. Not yet surprising.
                </p>
              </div>
              
              <div className="relative pb-6 last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-secondary bg-primary" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-secondary">With more entries</div>
                <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed mt-1">
                  Reflections start drawing connections across days. Something you wrote last week appears in what you wrote today.
                </p>
              </div>

              <div className="relative last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-supporting bg-primary" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-supporting">Over time</div>
                <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed mt-1">
                  The reflection names the shape underneath the entries — not the event, but the pattern that keeps producing the event.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* STEP 3: QUESTION — white */}
      <section className="bg-white py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <ScrollReveal className="space-y-6">
            <div className="space-y-3">
              <span className="font-serif text-6xl font-light text-primary/10 leading-none block">03</span>
              <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
                Question
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
                One question. No easy answer.
              </h2>
              <p className="font-sans text-[14.5px] font-light text-mid leading-relaxed">
                Not five things to consider. One question that points directly at what you were keeping vague. It comes with you through the day — surfaces in a meeting, making chai, before you fall asleep.
              </p>
            </div>

            {/* Timeline arc */}
            <div className="space-y-0 border-l border-primary/10 pl-5 ml-1">
              <div className="relative pb-6 last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-accent bg-white" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-accent">At first</div>
                <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed mt-1">
                  The question feels answerable. You answer it quickly and move on. That is the surface answer.
                </p>
              </div>
              
              <div className="relative pb-6 last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-secondary bg-white" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-secondary-dark">A week in</div>
                <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed mt-1">
                  The questions stop being easy to dismiss. They surface at inconvenient times. You find yourself thinking about them without choosing to.
                </p>
              </div>

              <div className="relative last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-supporting bg-white" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-supporting">Later</div>
                <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed mt-1">
                  You start writing tomorrow's entry partly in response to a question you haven't been able to let go of. The practice becomes self-feeding.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            {/* Question Card */}
            <div className="bg-white rounded-premium overflow-hidden shadow-[0_8px_36px_rgba(30,42,46,0.11)] border border-primary/5">
              <div className="bg-primary px-5 py-3.5 flex items-center justify-between">
                <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">
                  Today's question
                </span>
                <span className="font-serif text-[12px] text-mint-grey">
                  Day 4
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-supporting/12 rounded-lg p-4 space-y-1">
                  <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-supporting">
                    Sit with this
                  </div>
                  <div className="font-serif text-[15px] font-medium text-primary leading-snug">
                    "What did your sister say that you haven't let yourself fully hear yet?"
                  </div>
                </div>
                
                <div className="bg-mint-grey rounded-lg p-4 space-y-3">
                  <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-mid">
                    Previous questions
                  </div>
                  <div className="space-y-2.5 divide-y divide-primary/8 font-serif text-[13px] text-mid leading-relaxed">
                    <div className="pb-2 flex justify-between items-start gap-4">
                      <span>"When you say you're tired, what are you actually tired of?"</span>
                      <span className="font-sans text-[10px] text-primary/30 whitespace-nowrap">Day 1</span>
                    </div>
                    <div className="py-2 flex justify-between items-start gap-4">
                      <span>"What would you have said if you hadn't thought about it first?"</span>
                      <span className="font-sans text-[10px] text-primary/30 whitespace-nowrap">Day 3</span>
                    </div>
                    <div className="pt-2 flex justify-between items-start gap-4">
                      <span>"Who were you protecting when you said you were fine?"</span>
                      <span className="font-sans text-[10px] text-primary/30 whitespace-nowrap">Day 2</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-supporting/6 rounded-lg p-4 font-sans text-xs italic text-mid leading-relaxed">
                  Notice how the questions get more specific over time. Day 1 is broad. Day 4 goes directly to the thing you were keeping vague.
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* STEP 4: PATTERN — dark */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <ScrollReveal className="order-2 md:order-1" delay={0.1}>
            {/* Pattern visual */}
            <div className="bg-white/5 border border-white/15 rounded-premium p-6 space-y-5">
              <div>
                <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary mb-1">
                  Pattern thread
                </div>
                <div className="font-serif text-lg text-mint-grey italic font-normal">
                  What keeps surfacing
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white/8 border border-white/18 rounded-lg p-3 flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-[6px] shrink-0" />
                  <div>
                    <div className="font-sans text-[10px] text-[#A8D4CE]">Day 1</div>
                    <div className="font-serif text-xs font-normal italic text-light-mid leading-relaxed">
                      "I said I was fine. I don't know if that was true."
                    </div>
                  </div>
                </div>

                <div className="bg-white/8 border border-white/18 rounded-lg p-3 flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/70 mt-[6px] shrink-0" />
                  <div>
                    <div className="font-sans text-[10px] text-[#A8D4CE]">Day 3</div>
                    <div className="font-serif text-xs font-normal italic text-light-mid leading-relaxed">
                      "I keep editing what I say before I say it. I don't know when I started doing that."
                    </div>
                  </div>
                </div>

                <div className="bg-white/8 border border-white/18 rounded-lg p-3 flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/45 mt-[6px] shrink-0" />
                  <div>
                    <div className="font-sans text-[10px] text-[#A8D4CE]">Day 4</div>
                    <div className="font-serif text-xs font-normal italic text-light-mid leading-relaxed">
                      "I think I'm avoiding something she said that I haven't fully thought about yet."
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-supporting/15 rounded-lg p-4 space-y-1">
                <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-supporting">
                  Pattern emerging
                </div>
                <div className="font-serif text-[13.5px] font-normal italic text-light-mid leading-relaxed">
                  "Across these entries, you consistently describe yourself managing what others receive — editing, avoiding, saying fine. The pattern seems to be about what you allow yourself to actually feel versus what you present."
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                <div className="font-sans text-[10px] font-medium tracking-[0.08em] uppercase text-[#A8D4CE]">
                  Cycle progress
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="bg-accent h-full rounded-full" style={{ width: '14%' }} />
                  </div>
                  <span className="font-sans text-[11px] text-[#A8D4CE]">Day 4</span>
                </div>
                <p className="font-sans text-[11px] font-light text-muted-text leading-relaxed">
                  Pattern is early. Most become fully visible by mid-cycle. Some take two cycles.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="space-y-6 order-1 md:order-2">
            <div className="space-y-3">
              <span className="font-serif text-6xl font-light text-mint-grey/10 leading-none block">04</span>
              <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
                Pattern
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
                The picture builds across time, not in a single session.
              </h2>
              <p className="font-sans text-[14.5px] font-light text-light-mid leading-relaxed">
                A single entry is a moment. A thread of entries is a picture. It reads across everything you have written and names what keeps coming back — not the event, but the shape that keeps producing it.
              </p>
            </div>

            {/* Timeline arc */}
            <div className="space-y-0 border-l border-white/10 pl-5 ml-1">
              <div className="relative pb-6 last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-accent bg-primary" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-accent">Early</div>
                <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed mt-1">
                  Single patterns begin to emerge within a week. Something you keep saying differently. An ending that keeps repeating.
                </p>
              </div>
              
              <div className="relative pb-6 last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-secondary bg-primary" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-secondary">Mid-cycle</div>
                <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed mt-1">
                  You start to see the pattern before the reflection names it. That recognition — not the system catching it, but you seeing it — is the point.
                </p>
              </div>

              <div className="relative last:pb-0">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full border-2 border-supporting bg-primary" />
                <div className="font-sans text-[10px] font-medium uppercase tracking-wider text-supporting">End of cycle</div>
                <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed mt-1">
                  The picture is clear enough to sit with. Not solved. Not fixed. But visible — and visible is what gives you a choice you didn't have before.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* WHAT YOU RECEIVE */}
      <section className="bg-white py-20 md:py-24 px-6 md:px-[8%]">
        <div className="max-w-[900px] mx-auto text-center space-y-12">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              What you receive
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Not just a space to write.<br />Things that come back to you.
            </h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-base md:text-lg text-mid max-w-[520px] mx-auto">
              The practice delivers at different rhythms — daily, weekly, and when the system sees something worth surfacing.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <ScrollReveal className="bg-mint-grey border-t-2 border-accent rounded-b-lg p-8 space-y-4">
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-accent block">
                Every day
              </span>
              <h3 className="font-serif text-xl font-medium text-primary">
                Reflection + one question
              </h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                After every entry, a reflection that names what you were circling — and one question with no easy answer that comes with you through the day.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-mint-grey border-t-2 border-secondary rounded-b-lg p-8 space-y-4" delay={0.05}>
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-[#5A9E94] block">
                Every week
              </span>
              <h3 className="font-serif text-xl font-medium text-primary">
                A brief weekly summary
              </h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                A short summary of what surfaced across the week — themes that repeated, shifts in what you wrote about, things that came up more than once. Not an analysis. A mirror.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-mint-grey border-t-2 border-supporting rounded-b-lg p-8 space-y-4" delay={0.1}>
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-supporting block">
                When the pattern warrants it
              </span>
              <h3 className="font-serif text-xl font-medium text-primary">
                An in-between assessment
              </h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                Not scheduled. When the system sees a pattern developing strongly enough to name, it surfaces a deeper look. You don't ask for it. It arrives when it's earned.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-mint-grey border-t-2 border-accent rounded-b-lg p-8 space-y-4" delay={0.15}>
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-accent block">
                End of each cycle
              </span>
              <h3 className="font-serif text-xl font-medium text-primary">
                A monthly cycle report
              </h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                A full picture of what surfaced across the cycle — patterns identified, questions that kept returning, how your entries shifted over time. The clearest view of yourself you will have had on paper.
              </p>
            </ScrollReveal>
          </div>

          {/* Note block */}
          <ScrollReveal className="bg-primary/5 border border-primary/10 rounded-lg p-6 flex gap-4 text-left max-w-[900px] mx-auto">
            <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-mid shrink-0 pt-0.5">
              Note
            </span>
            <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
              If the system detects language or patterns that suggest you may be in crisis, it will flag this directly and point you toward appropriate support. This is not a routine check-in — it only surfaces when the writing genuinely warrants it.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* TWO CYCLES */}
      <section className="bg-mint-grey py-20 md:py-24 px-6 md:px-[8%] border-t border-primary/5">
        <div className="max-w-[900px] mx-auto space-y-12 text-center">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Why two cycles
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Most patterns take two cycles<br />to fully lock.
            </h2>
            <div className="w-12 h-[1px] bg-accent mx-auto" />
            <p className="font-sans text-base md:text-lg text-mid max-w-[520px] mx-auto">
              The first cycle surfaces the pattern. The second cycle confirms it — and shows you what sits underneath it.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <ScrollReveal className="bg-white rounded-lg p-8 flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
              <div className="space-y-4">
                <span className="font-serif text-5xl font-light text-accent block leading-none">01</span>
                <h3 className="font-serif text-xl font-medium text-primary">
                  The first cycle surfaces the shape.
                </h3>
                <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                  You start to see what keeps coming back — the situations, the responses, the endings that repeat. The pattern becomes visible enough to name. You get a choice you didn't have before.
                </p>
              </div>
              <p className="font-serif text-[13.5px] italic text-mid mt-6 pt-4 border-t border-primary/5">
                "Something I keep doing that I didn't have a word for before."
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white rounded-lg p-8 flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300" delay={0.1}>
              <div className="space-y-4">
                <span className="font-serif text-5xl font-light text-supporting block leading-none">02</span>
                <h3 className="font-serif text-xl font-medium text-primary">
                  The second cycle shows what sits under it.
                </h3>
                <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                  With the pattern named, the entries go deeper. You are no longer circling the surface — you are writing about what the pattern is protecting, what it costs, and whether you want to keep paying that cost.
                </p>
              </div>
              <p className="font-serif text-[13.5px] italic text-mid mt-6 pt-4 border-t border-primary/5">
                "The second time around it got harder. Which meant it was working."
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* WHAT WE ASK */}
      <section className="bg-primary text-mint-grey py-20 md:py-24 px-6 md:px-[8%]">
        <div className="max-w-[760px] mx-auto space-y-12">
          <ScrollReveal className="text-center space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Before you start
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              This product will be honest with you.<br />It needs one thing in return.
            </h2>
            <p className="font-sans text-base text-light-mid max-w-[580px] mx-auto leading-relaxed">
              Not consistency. Not articulacy. Not certainty about what you're feeling before you open the app. Just writing without editing yourself before you start.
            </p>
          </ScrollReveal>

          <div className="space-y-8 pt-4">
            <ScrollReveal className="flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bg-accent/12 flex items-center justify-center text-lg shrink-0 mt-1">
                ✍️
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-lg font-medium text-mint-grey">
                  Write the version before you made it make sense.
                </h3>
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  Most people believe they are already writing the truth. What they are usually writing is their narrative — the story they have constructed around what happened. It feels true because they believe it. The practice is not about catching you in a lie. It is about helping you see underneath the story you are already telling yourself. They describe the fight without mentioning what they said that started it. They write about feeling unseen without acknowledging how hard they make it for people to see them. The AI will not call you out on day one. But the gap between what you write and what is actually true becomes its own pattern — and that gap is usually more revealing than anything you intended to share.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal className="flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bg-secondary/12 flex items-center justify-center text-lg shrink-0 mt-1">
                🔄
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-lg font-medium text-mint-grey">
                  Come back the next day, not to resolve — to continue.
                </h3>
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  The practice is not about finishing a thought. It is about keeping the thread open. You do not need to have figured something out before you write again. You need to show up and write what is true today — even if today it is "I don't know" or "same as yesterday but angrier."
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal className="flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bg-supporting/12 flex items-center justify-center text-lg shrink-0 mt-1">
                🪞
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-lg font-medium text-mint-grey">
                  Let the reflection land before you argue with it.
                </h3>
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  When something you read back feels wrong or uncomfortable, that discomfort is worth sitting with before dismissing. The reflection is not a diagnosis. It is an observation. You are always the one who decides what it means.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Honest callout */}
          <ScrollReveal className="bg-accent/10 border border-accent/25 rounded-lg p-8 mt-10 space-y-3">
            <h4 className="font-serif text-xl font-medium text-accent">
              The honest question to ask yourself first.
            </h4>
            <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
              Do you actually want to know what is going on with you — or do you want to feel like you looked? Because those are different things and this product can only deliver one of them. If you are here for confirmation that you are handling things well, you will not find it. If you are here because something is genuinely not working and you are tired of circling it — write that. That is who this was built for.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-mint-grey py-20 px-6 text-center">
        <ScrollReveal className="max-w-xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            The only way to see the picture<br />
            is to start showing up.
          </h2>
          <p className="font-sans text-sm md:text-base text-mid max-w-sm mx-auto leading-relaxed">
            Seven days free. One entry a day. Write without editing yourself — or don't bother.
          </p>
          <button 
            onClick={handleStartWriting}
            className="bg-primary hover:bg-[#2A3A3E] text-[#ECEFF0] px-8 py-3.5 rounded font-sans text-xs font-bold tracking-wider uppercase inline-block shadow-sm transition-all duration-200 cursor-pointer mt-4"
          >
            Start writing free &rarr;
          </button>
        </ScrollReveal>
      </section>

      <Footer onOpenPolicy={onOpenPolicy} />
    </div>
  );
}
