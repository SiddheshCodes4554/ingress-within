import React from 'react';
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

export default function WhatItIsPage({ onOpenPolicy }) {
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
      <section className="bg-white pt-[148px] pb-20 md:pt-[180px] md:pb-28 px-6 md:px-16 text-center border-b border-primary/5">
        <div className="max-w-[700px] mx-auto">
          <ScrollReveal className="space-y-5">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              What it is
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              A space that pays attention to <br></br><em className="italic text-accent font-normal">what you keep circling.</em>
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[580px] mx-auto">
              You write. It reads. Over time, a picture forms, not of who you should be, but of what is actually going on with you.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* BLOCK 1: The entry */}
      <section className="max-w-[1060px] mx-auto px-6 md:px-[8%] py-20 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <ScrollReveal className="space-y-5">
          <span className="font-serif text-6xl font-light text-primary/80 leading-none block">01</span>
          <span className="font-sans text-[11px] font-medium tracking-[0.12em] uppercase text-secondary-dark block">
            The entry
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Write what is actually in your head.
          </h2>
          <p className="font-sans text-[14.5px] font-light text-mid leading-relaxed">
            No prompts to complete. No mood to log. Just whatever is true today, in whatever order it comes out.
          </p>
          <div className="border-l-2 border-accent pl-4">
            <p className="font-serif text-[15px] font-normal italic text-primary leading-relaxed">
              The version before you made it make sense is usually the one worth writing.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          {/* Today's Entry UI Card */}
          <div className="bg-white rounded-premium overflow-hidden shadow-[0_8px_36px_rgba(30,42,46,0.11)] border border-primary/5 flex flex-col">
            <div className="bg-primary px-5 py-3.5 flex items-center justify-between">
              <span className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary">
                Today's entry
              </span>
              <span className="font-serif text-[12px] text-mint-grey">
                Day 9
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="font-serif text-sm text-primary leading-relaxed p-4 bg-mint-grey rounded-lg">
                "I've been thinking about the conversation with Priya again. I said the right things. But I said them to end the conversation, not because I meant them. She looked relieved and I felt nothing. Or maybe I'm calling it nothing because it's easier."
              </div>
              <div className="border-l-2 border-secondary bg-secondary/8 rounded-r-lg p-4 space-y-1">
                <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary-dark">
                  Noticed
                </div>
                <div className="font-serif text-sm font-normal italic text-primary leading-relaxed">
                  "You've used the phrase 'I said the right things' twice this week — both times after someone else walked away satisfied. Worth sitting with what that means for you."
                </div>
              </div>
              <div className="bg-supporting/12 rounded-lg p-4 space-y-1">
                <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-supporting">
                  Today's question
                </div>
                <div className="font-serif text-[15px] font-medium text-primary leading-snug">
                  "When you say you felt nothing — is that true, or is it easier than figuring out what you actually felt?"
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* BLOCK 2: Patterns (dark) */}
      <section className="bg-primary text-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <ScrollReveal className="order-2 md:order-1" delay={0.1}>
            {/* Pattern Card */}
            <div className="bg-white/5 border border-white/18 rounded-premium p-6 shadow-[0_8px_36px_rgba(30,42,46,0.25)] space-y-5">
              <div>
                <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-secondary mb-1">
                  Pattern thread
                </div>
                <div className="font-serif text-lg text-mint-grey italic font-normal">
                  What keeps surfacing
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white/8 border border-white/18 rounded-lg p-4 flex gap-3.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-[6px] shrink-0" />
                  <div>
                    <div className="font-sans text-[10px] text-secondary/80">Day 3</div>
                    <div className="font-serif text-xs font-normal italic text-light-mid leading-relaxed">
                      "I ended the call before she could finish. I told myself I was saving her the trouble."
                    </div>
                  </div>
                </div>

                <div className="bg-white/8 border border-white/18 rounded-lg p-4 flex gap-3.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/65 mt-[6px] shrink-0" />
                  <div>
                    <div className="font-sans text-[10px] text-secondary/80">Day 7</div>
                    <div className="font-serif text-xs font-normal italic text-light-mid leading-relaxed">
                      "I said yes to the project. I didn't want to. I'm not sure I knew that until I wrote it just now."
                    </div>
                  </div>
                </div>

                <div className="bg-white/8 border border-white/18 rounded-lg p-4 flex gap-3.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/40 mt-[6px] shrink-0" />
                  <div>
                    <div className="font-sans text-[10px] text-secondary/80">Day 9</div>
                    <div className="font-serif text-xs font-normal italic text-light-mid leading-relaxed">
                      "She looked relieved and I felt nothing. Or maybe I'm calling it nothing because it's easier."
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-supporting/15 rounded-lg p-4 space-y-1">
                <div className="font-sans text-[10px] font-medium tracking-[0.1em] uppercase text-supporting">
                  What it sees
                </div>
                <div className="font-serif text-[13.5px] font-normal italic text-mint-grey leading-relaxed">
                  "In each of these situations, someone else got what they needed. You consistently describe your own response as nothing, or saving them trouble. You are the one who keeps disappearing from the equation."
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="space-y-5 order-1 md:order-2">
            <span className="font-serif text-6xl font-light text-secondary leading-none block">02</span>
            <span className="font-sans text-[11px] font-medium tracking-[0.12em] uppercase text-secondary block">
              The pattern
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey font-normal leading-snug">
              What you keep circling becomes visible over time.
            </h2>
            <p className="font-sans text-[14.5px] font-light text-light-mid leading-relaxed">
              A single entry is a moment. A thread of entries is a picture. It reads across everything you have written — not just today — and names what keeps coming back.
            </p>
            <div className="border-l-2 border-secondary pl-4">
              <p className="font-serif text-[15px] font-normal italic text-[#C8DDD9] leading-relaxed">
                "Most patterns take a full cycle to fully surface. Some take two."
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* BLOCK 3: How it works (vague) */}
      <section className="bg-mint-grey py-20 md:py-24">
        <div className="max-w-[1060px] mx-auto px-6 md:px-[8%] grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <ScrollReveal className="space-y-5">
            <span className="font-serif text-6xl font-light text-primary/80 leading-none block">03</span>
            <span className="font-sans text-[11px] font-medium tracking-[0.12em] uppercase text-secondary-dark block">
              How it works
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
              Built to understand context, not just words.
            </h2>
            <p className="font-sans text-[14.5px] font-light text-mid leading-relaxed">
              It is not keyword matching. It reads what you meant, not just what you said — and it gets sharper the more you write without editing yourself first.
            </p>
            <p className="font-sans text-[14.5px] font-light text-mid leading-relaxed">
              Your entries are yours. Nothing you write is used for anything other than your own reflection.
            </p>
            <div className="border-l-2 border-accent pl-4">
              <p className="font-serif text-[15px] font-normal italic text-primary leading-relaxed">
                The quality of what you get back is a direct reflection of what you put in.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            {/* Human Card */}
            <div className="bg-white rounded-premium p-6 shadow-[0_8px_36px_rgba(30,42,46,0.1)] space-y-6">
              <div className="font-sans text-[10px] font-medium tracking-[0.15em] uppercase text-mid block pb-2 border-b border-mint-grey">
                What it works with
              </div>

              <div className="space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center text-sm shrink-0">
                    📝
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-sans text-xs font-semibold text-primary">What you write today</h4>
                    <p className="font-sans text-xs font-light text-mid leading-relaxed">
                      Each entry is read in full. Not summarised, not reduced to tags or categories.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-sm shrink-0">
                    🔗
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-sans text-xs font-semibold text-primary">What you wrote before</h4>
                    <p className="font-sans text-xs font-light text-mid leading-relaxed">
                      It holds everything you have written and reads across it. A single entry is a moment. A thread is a picture.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-supporting/15 flex items-center justify-center text-sm shrink-0">
                    🔒
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-sans text-xs font-semibold text-primary">Nothing else</h4>
                    <p className="font-sans text-xs font-light text-mid leading-relaxed">
                      No other data. No inferences from outside what you chose to share. Your entries, your picture.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* BOUNDARY SECTION 1 */}
      <section className="bg-primary text-mint-grey py-20 md:py-24 px-6 md:px-[8%]">
        <div className="max-w-[860px] mx-auto space-y-12">
          <ScrollReveal>
            <h2 className="font-serif text-3xl md:text-4xl text-mint-grey leading-tight font-normal">
              How this sits alongside everything else.
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ScrollReveal className="bg-white/8 border border-white/15 rounded-lg p-6 space-y-3 hover:bg-accent/15 hover:border-accent group transition-all duration-300" delay={0.05}>
              <h3 className="font-serif text-lg font-medium text-mint-grey group-hover:text-accent transition-colors duration-200">Before therapy</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                Most people arrive at a first session not knowing what to say. This gives you language for what you are carrying before you get there — so you don't spend the first few sessions just finding words.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/8 border border-white/15 rounded-lg p-6 space-y-3 hover:bg-secondary/15 hover:border-secondary group transition-all duration-300" delay={0.15}>
              <h3 className="font-serif text-lg font-medium text-mint-grey group-hover:text-secondary transition-colors duration-200">During therapy</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                A weekly session covers one hour. This covers the other 167. What surfaces between sessions — the moment after the conversation, the thought at 2am — now has somewhere to go.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/8 border border-white/15 rounded-lg p-6 space-y-3 hover:bg-supporting/15 hover:border-supporting group transition-all duration-300" delay={0.25}>
              <h3 className="font-serif text-lg font-medium text-mint-grey group-hover:text-supporting transition-colors duration-200">After therapy</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                The patterns you worked on don't disappear when therapy ends. This keeps the practice alive — a way to catch things early, before they accumulate again.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white/8 border border-white/15 rounded-lg p-6 space-y-3 hover:bg-accent/10 hover:border-accent/50 group transition-all duration-300" delay={0.35}>
              <h3 className="font-serif text-lg font-medium text-mint-grey group-hover:text-accent transition-colors duration-200">Without therapy</h3>
              <p className="font-sans text-[13.5px] font-light text-light-mid leading-relaxed">
                Not everyone needs professional support right now. For the space between "I should probably think about this" and "I need help" — this is what should have existed a long time ago.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* BOUNDARY SECTION 2 */}
      <section className="bg-mint-grey text-primary py-20 md:py-24 px-6 md:px-[8%] border-t border-primary/5">
        <div className="max-w-[860px] mx-auto space-y-12">
          <ScrollReveal>
            <h2 className="font-serif text-3xl md:text-4xl text-primary leading-tight font-normal">
              Where this sits and where it doesn't.
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3 hover:bg-accent/8 hover:border-accent group transition-all duration-300" delay={0.05}>
              <h3 className="font-serif text-lg font-medium text-primary group-hover:text-accent transition-colors duration-200">What we hold</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                A record of what you have written, and what patterns have surfaced across it. There is no human on the other side thinking about you between sessions. That is an honest description of what this is.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3 hover:bg-secondary/8 hover:border-secondary group transition-all duration-300" delay={0.15}>
              <h3 className="font-serif text-lg font-medium text-primary group-hover:text-secondary transition-colors duration-200">What we don't hold</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                A relationship. Legal or ethical responsibility for your wellbeing. The ability to adapt the way another person can. Those things belong to professionals who are trained for them.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3 hover:bg-supporting/8 hover:border-supporting group transition-all duration-300" delay={0.25}>
              <h3 className="font-serif text-lg font-medium text-primary group-hover:text-supporting transition-colors duration-200">What we observe</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                What keeps coming up. What you keep saying differently. Where the story doesn't quite hold. We describe what we see in plain language and leave the meaning with you.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-white border border-primary/8 rounded-lg p-6 space-y-3 hover:bg-accent/6 hover:border-accent/40 group transition-all duration-300" delay={0.35}>
              <h3 className="font-serif text-lg font-medium text-primary group-hover:text-accent transition-colors duration-200">What we don't interpret</h3>
              <p className="font-sans text-[13.5px] font-light text-mid leading-relaxed">
                What your patterns mean for your life, where they come from, or what you should do about them. That is not our call to make.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 px-6 text-center border-t border-primary/5">
        <ScrollReveal className="max-w-xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            Bring the version that doesn't know<br />
            what to do with what it's carrying.
          </h2>
          <p className="font-sans text-sm md:text-base text-mid max-w-sm mx-auto leading-relaxed">
            That is who this was built for.
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
