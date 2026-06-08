import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Plus, Minus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ScrollReveal = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const FAQ_CATEGORIES = [
  { id: 'product', label: 'The product', introTitle: 'The product', introSub: 'What Ingress Within is, how it works, what you actually get from it — and what it is not.' },
  { id: 'privacy', label: 'Privacy & data', introTitle: 'Privacy & data', introSub: 'What happens to what you write, who can see it, and how your data is handled. These are not small questions for a product like this.' },
  { id: 'pricing', label: 'Pricing & billing', introTitle: 'Pricing & billing', introSub: 'What things cost, what the founding 50 offer actually means, and how cancellation works.' },
  { id: 'mental', label: 'Mental health & crisis', introTitle: 'Mental health & crisis', introSub: 'Where the product sits in relation to professional support, what happens in a crisis, and what we will and won\'t do.' }
];

const FAQ_DATA = {
  product: [
    {
      q: "What exactly is Ingress Within?",
      a: [
        "Ingress Within is a daily writing practice with an AI that reads what you write, notices what keeps coming back, and asks you one question at the end of each entry. Over time, it builds a picture of your patterns — not by diagnosing you, but by reflecting what you keep showing it.",
        "It is not therapy. It is not a journaling app. It is not a wellness tool. It is closer to rigorous, continuous reflection with an honest reader who never gets tired of you and never forgets what you said last week."
      ]
    },
    {
      q: "How is this different from just journaling?",
      a: [
        "Journaling gives you a blank page and nothing else. No one is paying attention. No pattern is being tracked. You write into a void and the void writes nothing back.",
        "Ingress Within reads what you write, connects it to what you wrote before, and names what you keep circling without quite landing on. The reflection and the question that come back are specific to your entry — not generic prompts, not affirmations, not a summary of what you said. Something you recognise immediately as true."
      ],
      note: "The goal is not to help you feel better about what you are carrying. It is to help you see it more clearly."
    },
    {
      q: "What does \"writing without editing yourself\" mean?",
      a: [
        "Most people believe they are already writing the truth. What they are usually writing is their narrative — the story they have constructed around what happened. It feels true because they believe it. The practice is not about catching you in a lie. It is about helping you see underneath the story you are already telling yourself.",
        "Writing without editing yourself means writing the version before you made it make sense. The thought before you qualified it. The feeling before you renamed it as something more acceptable. That is what gives the system something real to work with."
      ],
      note: "The gap between what you write and what is actually going on becomes its own pattern over time. And that gap is usually more revealing than anything you intended to share."
    },
    {
      q: "What is the AI actually doing?",
      a: [
        "It reads your entry in full — not summarised, not reduced to keywords. It then reads across everything you have written before. From that, it names what you keep returning to, draws connections across entries, and generates a reflection and one question.",
        "It does not diagnose. It does not tell you what your patterns mean for your life. It does not prescribe action. It describes what it observes in plain language and leaves the meaning with you."
      ]
    },
    {
      q: "What is a cycle?",
      a: [
        "A cycle is roughly one month of daily entries. It is not a fixed countdown — it is however long it takes for a clear picture to emerge from your writing. At the end of a cycle you receive a full report of what surfaced: patterns identified, questions that kept returning, how your entries shifted over time.",
        "Most people start seeing real patterns after one cycle. The picture usually sharpens across two. The first cycle surfaces the shape. The second shows what sits underneath it."
      ]
    },
    {
      q: "What do I receive and when?",
      a: [
        "<strong>Every day</strong> — a reflection after your entry and one question to sit with.",
        "<strong>Every week</strong> — a brief summary of what surfaced across the week's entries. Themes that repeated, shifts in tone, things that came up more than once.",
        "<strong>When the pattern warrants it</strong> — an in-between assessment. Not scheduled. When the system sees a pattern developing strongly enough to name, it surfaces a deeper look. You don't ask for it — it arrives when it's earned.",
        "<strong>End of each cycle</strong> — a full monthly cycle report. The clearest picture of what you've been carrying that you will have had on paper."
      ]
    },
    {
      q: "What if I miss a day?",
      a: [
        "Nothing happens. Missing a day doesn't reset anything or break the cycle. The practice works best with consistency but we don't penalise gaps.",
        "If you miss several days in a row, the system may note the gap when you return — not to judge it, but because gaps are sometimes part of the pattern too."
      ]
    },
    {
      q: "Can I write more than once a day?",
      a: [
        "The practice is designed around one entry a day. Not because of a technical limit, but because the value comes from showing up consistently over time — not from processing every moment as it happens.",
        "One entry a day gives you enough distance from what happened to write about it with some clarity. Writing multiple times a day tends to produce reactivity, not reflection."
      ]
    },
    {
      q: "Is my writing private?",
      a: [
        "Yes. Your entries are private by design. They are not read by humans, not used to train models on other users, and not shared with anyone. The only thing that reads your writing is the system generating your reflection. Your writing stays yours."
      ]
    },
    {
      q: "Is this designed to work alongside therapy?",
      a: [
        "Yes — and it works without therapy too. This is not a substitute for professional support, but it is also not positioned against it.",
        "<strong>Before therapy</strong> — it gives you language for what you are carrying, so you don't spend the first few sessions just finding words.",
        "<strong>During therapy</strong> — a weekly session covers one hour. This covers the other 167. What surfaces between sessions now has somewhere to go.",
        "<strong>After therapy</strong> — it keeps the practice alive, so patterns don't quietly rebuild after the work stops.",
        "<strong>Without therapy</strong> — it works as its own complete practice for people who are not in professional support and don't need to be right now."
      ]
    },
    {
      q: "Will this tell me what to do?",
      a: [
        "No. The moment we start telling you what to do, we have removed you from the equation. People don't build self-awareness by following instructions — they build it by sitting with hard questions long enough to find their own answers.",
        "Our job is the question, not the answer. What your patterns mean for your life, where they come from, or what you should do about them — that is not our call to make."
      ]
    },
    {
      q: "What if I don't know what to write?",
      a: [
        "Write that. \"I don't know what to write today\" is an entry. What comes after it — the reason you don't know, or the thing you're avoiding by not knowing — is usually the entry worth having.",
        "You don't need to be articulate. You don't need to be ready. You don't need to know what you're feeling before you open the app. You just need to write what is true right now."
      ]
    }
  ],
  privacy: [
    {
      q: "Is my writing private?",
      a: [
        "Yes. Your entries are private by design. They are not read by humans at Ingress Within. They are not shared with third parties. They are not used to train models on other users.",
        "The only thing that reads your writing is the system generating your reflection. Your writing stays yours."
      ],
      note: "We built this product for people who need a space that is honest and private. Violating that would be both ethically wrong and practically self-defeating."
    },
    {
      q: "Who can see my entries?",
      a: [
        "Only you. No one at Ingress Within reads your entries. No counsellor, no support team member, no one. The system reads them to generate your reflection — but that is an automated process, not a human one.",
        "The only exception is if you explicitly choose to share something — for example, if you export a therapy report to take to a counsellor. That is always your choice, never ours."
      ]
    },
    {
      q: "Is my data used to train AI models?",
      a: [
        "Your personal entries are not used to train models on other users. What you write is processed to generate your own reflections — it does not feed into a shared training dataset.",
        "If this ever changes, we will tell you clearly before it happens and give you the option to opt out. We will not change this policy retroactively."
      ]
    },
    {
      q: "Where is my data stored?",
      a: [
        "Your data is stored on secured servers. We use encryption in transit and at rest. Specific infrastructure details are available in our full privacy policy.",
        "We do not store data in jurisdictions with weak privacy laws by design. If you have a specific compliance question, write to us directly."
      ]
    },
    {
      q: "Can I delete my data?",
      a: [
        "Yes. You can request full deletion of your account and all associated data at any time. This includes your entries, reflections, reports, and any profile information. Deletion is permanent and cannot be reversed.",
        "To request deletion, contact us at the email in the footer. We will process it within 14 days."
      ]
    },
    {
      q: "What happens to my data if I cancel?",
      a: [
        "Your entries and reports remain accessible after you cancel — we don't delete your data when you stop paying. You can still read everything you wrote and download your reports.",
        "No new reflections are generated after cancellation, but your record stays intact. If you want it deleted, you can request that separately."
      ]
    },
    {
      q: "Do you share data with third parties?",
      a: [
        "We do not sell your data. We do not share your entries with advertisers, partners, or third parties. We use third-party services for infrastructure (hosting, payments, email) — those providers have their own privacy policies, but they do not receive your entry content.",
        "Full details of what third-party services we use and what they receive are in our privacy policy."
      ]
    },
    {
      q: "What if there is a data breach?",
      a: [
        "If a breach occurs that affects your data, we will notify you directly and promptly — not buried in a terms update. We will tell you what was affected, what we are doing about it, and what you should do.",
        "We take security seriously. The nature of what people write here means a breach would be a serious harm, not just a compliance issue. We design accordingly."
      ]
    }
  ],
  pricing: [
    {
      q: "What does the free trial include?",
      a: [
        "The first seven days are completely free — full access, no card required, no restrictions. You get one entry a day with a full AI reflection and question. Pattern tracking begins from day one.",
        "If the reflections aren't honest enough to make you want to continue, they shouldn't. We don't ask for commitment before we've earned it."
      ]
    },
    {
      q: "What happens after the 7 free days?",
      a: [
        "Nothing automatic. You will be asked whether you want to continue. If you do, you pick a plan and add a card. If you don't, your entries remain accessible but no new reflections are generated.",
        "We do not charge you without you explicitly choosing to continue."
      ]
    },
    {
      q: "What is the Founding 50 offer exactly?",
      a: [
        "The first 50 users get access at ₹799 per month — a launch discount available for a limited time after launch. After the offer period ends, the price moves to ₹999 for everyone, including the founding 50.",
        "<strong>What founding users keep:</strong> ₹999 locked forever, even if the price rises further as costs grow.",
        "<strong>One condition:</strong> the subscription must stay continuous. If you cancel and miss a billing month, the founding price is released and you rejoin at the standard rate.",
        "<strong>One grace reinstatement:</strong> if you cancel and return within 6 months, your founding price is restored — once. A second cancellation or a return after 6 months means you rejoin at the standard rate. Life happens. We account for it once.",
        "<strong>If a founding spot opens up:</strong> when a founding member leaves permanently, their spot reopens. We refill from a dedicated waitlist — people who specifically signed up for a founding slot. If you want to be on that waitlist, write to us."
      ],
      warn: "The founding price requires an unbroken subscription beyond the one grace reinstatement. If you need to pause, consider that before cancelling."
    },
    {
      q: "What does the standard ₹999 plan include?",
      a: [
        "Everything in the core practice: one entry a day, full AI reflection after every entry, one question per day, weekly summary, in-between assessments when patterns warrant it, and a monthly cycle report at the end of each cycle.",
        "Cancel any time. No minimum commitment. Your data stays accessible after cancellation."
      ]
    },
    {
      q: "Can I cancel any time?",
      a: [
        "Yes. No minimum period, no cancellation fee. If you cancel mid-cycle you keep access until the end of your billing period.",
        "<strong>If you are a founding user:</strong> cancelling releases your ₹999 locked price. However, you get one grace reinstatement — if you return within 6 months of cancelling, your founding price is restored. A second cancellation or a return after 6 months means you rejoin at the standard rate.",
        "<strong>If your founding spot opens permanently</strong> — because you deleted your account or didn't return — that spot goes to someone on the founding waitlist."
      ]
    },
    {
      q: "Will the price go up?",
      a: [
        "Possibly, as costs grow. The standard ₹999 rate may increase in future. We will give existing subscribers at least 30 days notice before any price change takes effect.",
        "Founding users are locked at ₹999 as long as their subscription stays continuous — regardless of what the standard price becomes."
      ]
    },
    {
      q: "What are add-ons?",
      a: [
        "Add-ons are features beyond the core practice — things like structured reports formatted for a counsellor, group reflection sessions, and therapist referrals. They are not part of the core subscription and will be priced separately.",
        "We are still working on the structure for these. Early users will get first access when they launch. We will not release them until they are ready — not as a placeholder feature."
      ]
    },
    {
      q: "How do I get a refund?",
      a: [
        "If you feel the product did not deliver what was described, write to us. We review refund requests case by case. We do not have a blanket no-refund policy — if we got something wrong, we will make it right.",
        "Refund requests within the first 7 days of a paid cycle are generally approved without question. After that, we look at the circumstances."
      ]
    }
  ],
  mental: [
    {
      q: "Is this a mental health product?",
      a: [
        "It is a self-reflection product that operates in the mental wellness space. It is not a clinical tool, not a therapy platform, and not a crisis service. It does not diagnose, treat, or prescribe.",
        "What it does is help you see patterns in your own thinking and behaviour more clearly over time. That is genuinely useful — and genuinely different from clinical care."
      ]
    },
    {
      q: "Does this replace therapy?",
      a: [
        "No — and it is not designed to. It works before therapy, during it, after it, or entirely on its own depending on where you are.",
        "A therapist holds a relationship. They know your history, track change over time, and carry legal and ethical responsibility for your wellbeing inside that relationship. We hold a record. There is no human on the other side thinking about you between sessions. That is an honest description of what this is.",
        "If you are in therapy, this gives the other 167 hours somewhere to go. If you are not in therapy and don't want to be, this still works as its own complete practice."
      ]
    },
    {
      q: "What happens if I write something that suggests I'm in crisis?",
      a: [
        "If the system detects language or patterns that suggest you may be in crisis — expressions of self-harm, suicidal ideation, or acute distress — it will flag this directly and provide information on appropriate support resources. This is not a routine check-in. It only surfaces when the writing genuinely warrants it.",
        "This product is not a crisis service. If you are in immediate danger, please contact emergency services or a crisis line directly."
      ],
      warn: "If you are in crisis right now: iCall (India) — 9152987821. Vandrevala Foundation — 1860-2662-345 (24/7). These services are confidential and free."
    },
    {
      q: "Will you tell me to see a therapist?",
      a: [
        "Only when we think it is genuinely warranted — not reflexively, not as a disclaimer, not because it is the safe default. We earn the right to say it by not saying it to everyone.",
        "In much of the world this product operates in, recommending therapy carries weight it does not carry elsewhere. Saying it without reason is not just lazy — it damages trust and is culturally tone-deaf. We take that seriously."
      ]
    },
    {
      q: "Who should not use this product?",
      a: [
        "This product is not appropriate for people who are currently in acute crisis, experiencing active psychosis or severe dissociation, or who need immediate clinical support. If you are in that situation, please seek professional help directly.",
        "This product is designed for people who are struggling but not in crisis — people who sense something is off, who have things to process, who want a structured space to examine what is going on with them. If that describes you, it may be worth trying."
      ]
    },
    {
      q: "Will this make things worse?",
      a: [
        "Honest self-reflection can surface things that are uncomfortable. That is not a side effect — it is the point. Someone can complete a full cycle and feel worse, because they are now honest about something they were successfully avoiding. That is still success. The goal is clarity, not comfort.",
        "That said, if the process feels destabilising rather than just uncomfortable, that is worth paying attention to. There is a difference between the productive discomfort of seeing something clearly and distress that signals you need more support than this product can offer. If you are unsure, speaking to a professional is the right call."
      ]
    },
    {
      q: "Does the product pathologise what I write?",
      a: [
        "No. We do not tell you that you have abandonment issues, an anxious attachment style, or a fear of intimacy. Even when a pattern is recognisable, labelling it clinically does two things: it gives you an identity to hide behind instead of a pattern to examine, and it implies a clinical authority we do not have.",
        "We describe what we observe in plain language. \"You've written about this situation three times and each time the ending is the same\" is honest. \"You display avoidant attachment\" is not our call to make."
      ]
    },
    {
      q: "Can I use this if I have a diagnosed mental health condition?",
      a: [
        "Many people with diagnosed conditions use reflective practices as part of their overall care. Whether this product is appropriate for you depends on your specific situation and, if you are working with a professional, their view.",
        "We recommend discussing it with your therapist or psychiatrist if you have one. If you are stable and managing well, it may be a useful complement to your existing support. If you are in an acute phase, this is probably not the right moment."
      ],
      note: "When in doubt, ask the person who knows your situation. We are not in a position to make that call for you."
    }
  ]
};

export default function FaqPage({ onOpenPolicy }) {
  const [activeTab, setActiveTab] = useState('product');
  const [openIndex, setOpenIndex] = useState(null);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setOpenIndex(null); // Reset accordion state when changing tabs
  };

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const currentCategory = FAQ_CATEGORIES.find(c => c.id === activeTab);
  const currentFaqList = FAQ_DATA[activeTab] || [];

  return (
    <div className="min-h-screen bg-mint-grey text-primary selection:bg-accent/30 font-body-md pt-20">
      
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white py-20 md:py-28 px-6 md:px-16 text-center border-b border-primary/5">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="font-label-md text-xs font-semibold text-secondary-dark uppercase tracking-[0.18em] block">FAQ</span>
          <h1 className="font-headline-md text-4xl md:text-5xl lg:text-6xl text-primary leading-tight font-medium">
            Everything you want to know<br/>
            <span className="italic text-accent">before you start.</span>
          </h1>
          <div className="w-12 h-[1.5px] bg-accent mx-auto" />
          <p className="font-body-lg text-base md:text-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto opacity-90">
            Honest answers. If something isn't covered here, write to us.
          </p>
        </div>
      </section>

      {/* Tabs list (Sticky-like sub-nav) */}
      <div className="bg-white border-b border-primary/5 sticky top-[68px] z-40 overflow-x-auto no-scrollbar shadow-[0_1px_3px_rgba(30,42,46,0.01)]">
        <div className="max-w-3xl mx-auto px-6 flex justify-start md:justify-center gap-8 md:gap-12">
          {FAQ_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => handleTabChange(category.id)}
              className={`py-5 text-sm font-label-md font-bold uppercase tracking-wider transition-all relative cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === category.id 
                  ? 'border-accent text-primary font-extrabold' 
                  : 'border-transparent text-primary/50 hover:text-primary'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Questions Content */}
      <section className="py-16 md:py-24 px-6 md:px-16 max-w-3xl mx-auto space-y-12">
        
        {/* Active Category Intro */}
        {currentCategory && (
          <ScrollReveal className="space-y-3" key={activeTab + "-intro"}>
            <h2 className="font-headline-md text-2xl md:text-3xl text-primary font-bold">{currentCategory.introTitle}</h2>
            <p className="font-body-md text-sm md:text-base text-on-surface-variant leading-relaxed opacity-85">
              {currentCategory.introSub}
            </p>
          </ScrollReveal>
        )}

        {/* Accordions */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {currentFaqList.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div 
                    key={index}
                    className="bg-white border border-primary/5 rounded-xl overflow-hidden hover:border-primary/15 hover:shadow-xs transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                    >
                      <span className="font-headline-md text-base md:text-lg font-semibold text-primary group-hover:text-secondary-dark transition-colors duration-300 pr-4">
                        {item.q}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isOpen ? 'bg-accent/10 text-accent rotate-180' : 'bg-primary/5 text-primary/60 group-hover:bg-primary/10'
                      }`}>
                        {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                      </div>
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
                          <div className="px-6 pb-6 pt-2 font-body-md text-sm md:text-base text-on-surface-variant leading-relaxed space-y-4 border-t border-primary/5 pt-4">
                            {item.a.map((paragraph, pIdx) => (
                              <p key={pIdx} dangerouslySetInnerHTML={{ __html: paragraph }} />
                            ))}

                            {/* Optional Callout Notes */}
                            {item.note && (
                              <div className="bg-mint-grey/50 border-l-2 border-secondary rounded-r-lg p-4 mt-4 text-xs md:text-sm text-primary italic leading-relaxed">
                                {item.note}
                              </div>
                            )}

                            {/* Optional Callout Warnings */}
                            {item.warn && (
                              <div className="bg-accent/5 border-l-2 border-accent rounded-r-lg p-4 mt-4 text-xs md:text-sm text-primary leading-relaxed">
                                {item.warn}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Still Have Questions Banner */}
      <section className="bg-primary text-on-primary py-20 px-6 md:px-16 text-center border-t border-b border-white/5">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="font-headline-md text-2xl md:text-3xl text-white font-medium">Still have a question?</h2>
          <p className="font-body-md text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
            Write to us directly. We read every message and reply to all of them.
          </p>
          <a 
            href="mailto:hello@ingresswithin.com" 
            className="bg-accent hover:opacity-95 text-primary py-3 px-8 rounded-xl font-label-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-md transition-all duration-300"
          >
            <Mail size={14} /> hello@ingresswithin.com
          </a>
        </div>
      </section>

      {/* Footer */}
      <Footer onOpenPolicy={onOpenPolicy} />
    </div>
  );
}
