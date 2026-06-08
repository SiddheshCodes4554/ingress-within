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

export default function AboutPage({ onOpenPolicy }) {
  const handleStartWriting = () => {
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary selection:bg-accent/30 font-sans">
      <Navbar />

      {/* HERO — light background, centered space consistent with other pages */}
      <section className="bg-white pt-[148px] pb-20 md:pt-[180px] md:pb-28 px-6 md:px-16 text-center border-b border-primary/5">
        <div className="max-w-[700px] mx-auto space-y-5">
          <ScrollReveal>
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              About
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              Why this exists.<br />
              <em className="italic text-accent font-normal">And who built it.</em>
            </h1>
          </ScrollReveal>
          <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
          <ScrollReveal delay={0.1}>
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[580px] mx-auto">
              Ingress Within was not built from a market analysis. It was built from the specific, accumulated experience of looking for something like this and not finding it.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* WHY IT EXISTS */}
      <section className="bg-mint-grey py-20 md:py-24 px-6 md:px-16 border-t border-primary/5">
        <div className="max-w-[740px] mx-auto space-y-8">
          <ScrollReveal className="flex items-center gap-3">
            <div className="w-6 h-[1px] bg-accent" />
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark">
              Why it exists
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <h2 className="font-serif text-[28px] sm:text-[36px] text-primary font-normal leading-snug">
              Most people who are struggling are not struggling in a way that has a clear next step.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="font-sans text-[15px] font-light text-mid leading-relaxed space-y-5">
            <p>
              They are not in crisis. They are not broken. They are carrying something — a recurring pattern, a feeling they keep pushing aside, a situation that never quite resolves — and they have no structured place to take it.
            </p>
            <p>
              Getting professional support is the right answer for many people. But knowing that and being ready to do it are not the same thing. And even for people who are already in some form of support, most of their week still happens outside of it. The things that come up between sessions rarely have anywhere to go.
            </p>
            <p>
              This product exists for that space. Not as a replacement for anything. As something that should have existed alongside everything else a long time ago.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="font-serif text-lg sm:text-[22px] font-normal italic text-primary leading-relaxed border-l-2 border-accent pl-5 my-8">
              "Being able to name what you are carrying — even partially — changes how you relate to it. That is what this product is trying to make possible."
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* WHAT WE KEPT SEEING — dark */}
      <section className="bg-primary text-mint-grey py-20 md:py-24 px-6 md:px-16">
        <div className="max-w-[900px] mx-auto space-y-10">
          <ScrollReveal className="flex items-center gap-3">
            <div className="w-6 h-[1px] bg-secondary" />
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary">
              What we kept seeing
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <h2 className="font-serif text-[28px] sm:text-[36px] text-mint-grey font-normal leading-snug">
              The same moments, across very different people.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/10 rounded-premium overflow-hidden mt-10">
              <div className="bg-white/5 p-7 hover:bg-white/10 transition-colors duration-200 flex flex-col justify-between">
                <div className="w-7 h-[2px] rounded-sm bg-accent mb-4" />
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  Having a name for what you are carrying — and still not knowing what to do with it. The diagnosis is the beginning, not the answer.
                </p>
              </div>

              <div className="bg-white/5 p-7 hover:bg-white/10 transition-colors duration-200 flex flex-col justify-between">
                <div className="w-7 h-[2px] rounded-sm bg-secondary mb-4" />
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  Knowing you need support and not being able to reach out for it. The gap between recognising something and doing something about it can be years wide.
                </p>
              </div>

              <div className="bg-white/5 p-7 hover:bg-white/10 transition-colors duration-200 flex flex-col justify-between">
                <div className="w-7 h-[2px] rounded-sm bg-supporting mb-4" />
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  Seeing something clearly in a session and losing the thread of it thirty minutes later. The insight is there — but it slips before it settles.
                </p>
              </div>

              <div className="bg-white/5 p-7 hover:bg-white/10 transition-colors duration-200 flex flex-col justify-between">
                <div className="w-7 h-[2px] rounded-sm bg-accent mb-4" />
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  Writing something down and feeling it shift — not because the situation changed, but because giving something language changes your relationship to it.
                </p>
              </div>

              <div className="bg-white/5 p-7 hover:bg-white/10 transition-colors duration-200 flex flex-col justify-between">
                <div className="w-7 h-[2px] rounded-sm bg-secondary mb-4" />
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  Being competent in every visible way. And still having no language for what was going on underneath — no emotional vocabulary for what you were actually feeling.
                </p>
              </div>

              <div className="bg-white/5 p-7 hover:bg-white/10 transition-colors duration-200 flex flex-col justify-between">
                <div className="w-7 h-[2px] rounded-sm bg-supporting mb-4" />
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  Telling someone about a diagnosis and smiling. Not because everything was fine. Just because no other response felt available in that moment.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* WHAT WE BUILT */}
      <section className="bg-white py-20 md:py-24 px-6 md:px-16">
        <div className="max-w-[900px] mx-auto space-y-10">
          <ScrollReveal className="flex items-center gap-3">
            <div className="w-6 h-[1px] bg-accent" />
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark">
              What we built
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <h2 className="font-serif text-[28px] sm:text-[36px] text-primary font-normal leading-snug">
              Something that holds the thread so you don't have to.
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal className="font-sans text-[15px] font-light text-mid leading-relaxed space-y-5" delay={0.1}>
              <p>
                Ingress Within is a daily writing practice with a system that reads what you write, remembers it across time, notices what keeps coming back, and reflects it plainly.
              </p>
              <p>
                It does not diagnose. It does not prescribe. It does not tell you what your patterns mean for your life. It asks the one question you were keeping vague — and it is there the next day, and the day after that, with the full context of everything you have shared.
              </p>
              <p>
                It works whether you are in therapy, have never been, or are still figuring out what kind of support you actually need.
              </p>
            </ScrollReveal>

            <ScrollReveal className="bg-primary rounded-premium p-8 space-y-6 text-mint-grey" delay={0.15}>
              <div className="flex gap-4 items-start pb-4 border-b border-white/8">
                <span className="font-serif text-2xl font-light text-accent shrink-0 w-8">01</span>
                <div className="space-y-0.5">
                  <h4 className="font-sans text-xs font-semibold text-mint-grey">Reads what you write</h4>
                  <p className="font-sans text-[13px] font-light text-light-mid opacity-80 leading-relaxed">
                    In full. Not summarised, not reduced to keywords. What you actually said.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start pb-4 border-b border-white/8">
                <span className="font-serif text-2xl font-light text-secondary shrink-0 w-8">02</span>
                <div className="space-y-0.5">
                  <h4 className="font-sans text-xs font-semibold text-mint-grey">Remembers across time</h4>
                  <p className="font-sans text-[13px] font-light text-light-mid opacity-80 leading-relaxed">
                    Tracks what keeps coming back. Never starts from scratch.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start pb-4 border-b border-white/8">
                <span className="font-serif text-2xl font-light text-supporting shrink-0 w-8">03</span>
                <div className="space-y-0.5">
                  <h4 className="font-sans text-xs font-semibold text-mint-grey">Reflects, does not interpret</h4>
                  <p className="font-sans text-[13px] font-light text-light-mid opacity-80 leading-relaxed">
                    Names what it sees. Leaves what it means with you.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <span className="font-serif text-2xl font-light text-accent shrink-0 w-8">04</span>
                <div className="space-y-0.5">
                  <h4 className="font-sans text-xs font-semibold text-mint-grey">Asks one honest question</h4>
                  <p className="font-sans text-[13px] font-light text-light-mid opacity-80 leading-relaxed">
                    Specific to what you wrote. No easy answer intended.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* VALUES — dark */}
      <section className="bg-primary text-mint-grey py-20 md:py-24 px-6 md:px-16">
        <div className="max-w-[900px] mx-auto space-y-10">
          <ScrollReveal className="flex items-center gap-3">
            <div className="w-6 h-[1px] bg-secondary" />
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary">
              What will not move
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <h2 className="font-serif text-[28px] sm:text-[36px] text-mint-grey font-normal leading-snug">
              Four things this product will not compromise on.
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
              <div className="p-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:translate-y-[-3px] transition-all duration-300 group">
                <h3 className="font-serif text-lg font-medium text-mint-grey mb-2 group-hover:text-accent transition-colors duration-200">
                  Honesty over comfort.
                </h3>
                <p className="font-sans text-[13.5px] font-light text-light-mid opacity-85 leading-relaxed">
                  The product will not agree with everything you write. If a pattern keeps appearing, it will name it. That is not unkindness. That is the point.
                </p>
              </div>

              <div className="p-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:translate-y-[-3px] transition-all duration-300 group">
                <h3 className="font-serif text-lg font-medium text-mint-grey mb-2 group-hover:text-secondary transition-colors duration-200">
                  Memory over starting from scratch.
                </h3>
                <p className="font-sans text-[13.5px] font-light text-light-mid opacity-85 leading-relaxed">
                  It reads across everything you have written and does not forget. The thread accumulates because accumulation is how the picture forms.
                </p>
              </div>

              <div className="p-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:translate-y-[-3px] transition-all duration-300 group">
                <h3 className="font-serif text-lg font-medium text-mint-grey mb-2 group-hover:text-supporting transition-colors duration-200">
                  Privacy without exceptions.
                </h3>
                <p className="font-sans text-[13.5px] font-light text-light-mid opacity-85 leading-relaxed">
                  What you write is yours. Not a dataset. Not training material. The privacy promise is the foundation, not a line in a policy document.
                </p>
              </div>

              <div className="p-7 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:translate-y-[-3px] transition-all duration-300 group">
                <h3 className="font-serif text-lg font-medium text-mint-grey mb-2 group-hover:text-accent transition-colors duration-200">
                  Alongside, not instead of.
                </h3>
                <p className="font-sans text-[13.5px] font-light text-light-mid opacity-85 leading-relaxed">
                  This is not a replacement for professional support. It works before therapy, during it, after it, or on its own. It knows what it is and what it is not.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FOUNDER — mint */}
      <section className="bg-mint-grey py-20 md:py-24 px-6 md:px-16 border-t border-primary/5">
        <div className="max-w-[740px] mx-auto space-y-10">
          <ScrollReveal className="flex items-center gap-3">
            <div className="w-6 h-[1px] bg-accent" />
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark">
              The founder
            </span>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-10 items-start">
            <ScrollReveal className="w-[180px] h-[180px] rounded-premium bg-primary/5 flex items-center justify-center shrink-0 mx-auto md:mx-0">
              <span className="text-6xl text-primary/15 font-light select-none">◎</span>
            </ScrollReveal>

            <ScrollReveal delay={0.1} className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl font-normal text-primary">
                  [Your name]
                </h3>
                <div className="font-sans text-xs font-semibold text-secondary-dark tracking-wider uppercase mt-1">
                  Founder, Ingress Within
                </div>
              </div>

              <div className="font-sans text-[14.5px] font-light text-mid leading-relaxed space-y-4">
                <p>
                  I built this during one of the harder periods of my life. I was not looking for a product idea. I was just trying to understand why the same things kept happening to me — and looking for some relief from it.
                </p>
                <p>
                  Like most people, I started with what felt accessible. Spirituality. Astrology. The idea that there is a map of who you are and why you are the way you are. It helped in some ways but it always felt like borrowed answers — things that fit loosely but never quite explained it.
                </p>
                <p>
                  Then I got into psychology. I started reading seriously and running tests on myself — not in a clinical setting, just trying things, going deeper, seeing what landed. Some results felt too boxed in. Others were sharper. The first one that actually hit gave me a name for something I had sensed for a long time but never said out loud.
                </p>
                <p>
                  I was not ready to go to a therapist yet. Not because I thought it was wrong — I could see people around me doing it and it was clearly helping them. I just did not know where I fit in that picture, or whether what I was carrying was serious enough. On the harder nights I would just type things out — sometimes to an AI, sometimes just to myself — because it did not require me to explain myself from scratch to another person when I barely had the energy to function.
                </p>
                <p>
                  Eventually I did start therapy. About three months in, my therapist pointed out patterns that were exactly what those late night sessions had already started uncovering. That moment stayed with me. The work I had done alone, without guidance, with tools not built for it — it had been pointing at something real.
                </p>
                <p>
                  That is what I am trying to build properly. A space that holds what you are finding, remembers it, and helps you see it clearly. So that if you do move towards professional support, you go in with more clarity about what you actually want to work on — rather than spending months just finding the words. And if you don't, that is fine too. Because you know yourself better, and that is enough to take better care of yourself.
                </p>
              </div>

              <div className="font-serif text-[15px] font-normal italic text-primary leading-relaxed border-l-2 border-accent pl-4">
                "I wanted someone to tell me why it keeps happening. This product is an attempt to build that space — properly, honestly, for anyone who needs it."
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 px-6 text-center border-t border-primary/5">
        <ScrollReveal className="max-w-xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl md:text-4xl text-primary font-normal leading-snug">
            If any part of this resonates,<br />
            the first seven days are free.
          </h2>
          <p className="font-sans text-sm md:text-base text-mid max-w-sm mx-auto leading-relaxed">
            No card. No commitment. Write without editing yourself.
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
