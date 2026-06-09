import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Plus, Minus, ChevronRight } from 'lucide-react';
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

const PROMISES = [
  {
    num: "01",
    label: "No human ever reads your entries",
    note: "Not us, not support staff, not anyone.",
    colorClass: "text-accent"
  },
  {
    num: "02",
    label: "Your entries are never used to train AI",
    note: "Not ours. Not the model provider's.",
    colorClass: "text-secondary"
  },
  {
    num: "03",
    label: "Delete your account and it's gone. Permanently.",
    note: "Within 30 days. No backups kept.",
    colorClass: "text-supporting"
  }
];

const FLOW_STEPS = [
  {
    num: "1",
    title: "Your entry is stored encrypted on our servers",
    body: "Associated with your account by an internal ID — not your name, phone number, or email. Encrypted at rest.",
    tag: "Stored encrypted",
    tagType: "stored"
  },
  {
    num: "2",
    title: "Your entry text is sent to the AI model",
    body: "Along with a structured prompt describing what to look for. Your name, phone number, and email are stripped before sending. The model receives only your text and an anonymous session ID.",
    tag: "Name, phone, email stripped",
    tagType: "stripped"
  },
  {
    num: "3",
    title: "The model generates your reflection and returns it",
    body: "The model processes your entry and writes a reflection. The model does not store your entry after processing — it processes and discards. We have a zero data retention agreement with our model provider.",
    tag: "Not retained by model provider",
    tagType: "deleted"
  },
  {
    num: "4",
    title: "The reflection is stored alongside your entry",
    body: "Only the output — the reflection text — comes back to our servers. This is what you see in the app. It is stored encrypted and associated with your account.",
    tag: "Stored encrypted",
    tagType: "stored"
  },
  {
    num: "5",
    title: "Your entry is never used to train any AI model",
    body: "Not ours. Our model provider agreement explicitly prohibits use of API inputs for training. Your entries are not fine-tuning data, evaluation data, or anything else.",
    tag: "Never used for training",
    tagType: "never"
  }
];

const QA_DATA = [
  {
    q: "Which AI model processes my entries?",
    tag: null,
    a: [
      "We use a large language model via API from a major provider. We are not building or fine-tuning our own model. The provider processes your entry text, generates the reflection, and returns it. The provider is contractually bound by a zero data retention agreement — they do not store your entries after responding.",
      "We do not name the specific model in this document because we may change providers. When we do, this page will be updated and you will be notified. The contractual commitments — zero retention, no training use — will remain in place regardless of which provider we use."
    ]
  },
  {
    q: "Can Ingress Within staff read my entries?",
    tag: "No",
    tagType: "no",
    a: [
      "No employee or contractor has access to individual user entries. We have no internal dashboard, admin panel, or tooling that surfaces your writing. Customer support is handled without access to entry content. If a support issue required looking at your data, we would ask for your explicit permission first — and tell you exactly what we looked at."
    ]
  },
  {
    q: "Is my data shared with any third party?",
    tag: "Never sold. Never shared for advertising.",
    tagType: "never",
    a: [
      "Your entry text is sent to our AI model provider as part of generating your reflection — that is described above. This is a processing arrangement, not a data sharing one. Outside of this, your data is not shared with any third party for any purpose.",
      "We use Razorpay for payment processing. Razorpay receives your payment details — they do not receive your entry content, your name as linked to entries, or anything else from the app."
    ]
  },
  {
    q: "Where is my data stored?",
    tag: null,
    a: [
      "Your data is stored on servers located in India. It is encrypted at rest and in transit. We use industry-standard encryption. Your entry text, reflections, and reports are stored associated with your internal account ID — not your phone number or name directly."
    ]
  },
  {
    q: "What does \"zero data retention\" actually mean?",
    tag: null,
    a: [
      "It means our model provider processes your entry and generates the reflection in a single operation, then discards your input. They do not store it in logs, in caches, or anywhere else. This is a contractual agreement — not just a setting we toggled on. It is the same arrangement used by organisations handling sensitive data like medical records and legal documents.",
      "<strong>In plain terms:</strong> your entry goes in, a reflection comes out, and your entry is gone from their systems immediately."
    ]
  },
  {
    q: "Could my entries appear in a data breach?",
    tag: null,
    a: [
      "We take security seriously and use encryption at rest and in transit. In the event of a breach, we would notify affected users promptly and clearly, describe exactly what was accessed, and tell you what we are doing about it. We would not obscure or delay this disclosure.",
      "Reducing the impact of a breach is part of why we strip identifying information before sending entries to the AI model — even if a breach occurred at the model provider's end, they would not have entries linked to your identity."
    ]
  },
  {
    q: "How do I delete everything?",
    tag: "Settings → Delete account",
    tagType: "yes",
    a: [
      "Go to Settings and choose \"Delete account.\" You can request a download of your data first — we'll send a link to your phone number within 7 days. Once you confirm deletion, your account and all associated data is permanently deleted within 30 days. After that window, there is nothing left to retrieve.",
      "We do not keep anonymised versions, aggregate your entries, or retain them in any form after deletion."
    ]
  },
  {
    q: "What if I stop paying but don't delete my account?",
    tag: null,
    a: [
      "Your account goes dormant. Your entries and reflections are preserved — you can come back and read them, and resubscribe to continue writing. We do not delete dormant accounts automatically. If you want your data deleted, you need to explicitly delete your account from Settings."
    ]
  },
  {
    q: "Can I delete specific entries or old ones after a few months?",
    tag: "Not individually",
    tagType: "no",
    a: [
      "Individual entries can't be deleted while your account is active — and this is intentional, not an oversight.",
      "The reflections, patterns, and reports the app surfaces are built from your <strong>full history</strong>. An entry from three months ago might be the reason a pattern shows up in your report today. If that entry is gone, the pattern disappears with it — and worse, could appear distorted in future reflections without the context that explains it.",
      "The practice only works if it can see the whole picture. Selectively removing entries would be like tearing pages out of the middle of a book and asking someone to summarise it accurately.",
      "If you want a clean slate, the only option is to delete your account and start over. Your old entries are gone permanently. Your new cycle starts fresh. Many users do this intentionally at the end of a year or a major life chapter.",
      "If you want your data gone entirely and permanently, go to <strong>Settings → Delete account</strong>."
    ]
  },
  {
    q: "Is Ingress Within subject to Indian data protection law?",
    tag: null,
    a: [
      "Yes. We are an Indian product, storing data on servers in India, serving users in India. We comply with the Digital Personal Data Protection Act, 2023 (DPDPA). Our full privacy policy is available in Settings.",
      "Under the DPDPA, you have the right to access, correct, and erase your personal data. All three are available directly in the app — no need to contact us."
    ]
  }
];

export default function AiDataPage({ onOpenPolicy }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleQA = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const getTagClass = (type) => {
    switch (type) {
      case 'no':
        return 'bg-accent/12 text-[#8A3020] border border-accent/25';
      case 'yes':
        return 'bg-secondary/12 text-secondary-dark border border-secondary/25';
      case 'never':
        return 'bg-primary/7 text-primary border border-primary/15';
      default:
        return 'bg-primary/5 text-primary border border-primary/10';
    }
  };

  const getFlowTagClass = (type) => {
    switch (type) {
      case 'stored':
        return 'bg-supporting/10 text-[#4A3A6A] border border-supporting/25';
      case 'stripped':
        return 'bg-secondary/12 text-secondary-dark border border-secondary/25';
      case 'deleted':
        return 'bg-accent/10 text-[#8A3020] border border-accent/25';
      default:
        return 'bg-primary/6 text-mid border border-primary/15';
    }
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary selection:bg-accent/30 font-sans">
      <Navbar />

      {/* HERO (Light Themed with Circles Overlay) */}
      <section className="bg-white text-primary pt-[148px] pb-20 md:pt-[180px] md:pb-28 px-6 md:px-16 text-center border-b border-primary/5 relative overflow-hidden">
        {/* Subtle Decorative Rings */}
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full border border-secondary/20 pointer-events-none" />
        <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[360px] h-[360px] rounded-full border border-secondary/35 pointer-events-none" />

        <div className="max-w-[700px] mx-auto relative z-10 space-y-6">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Your data &amp; AI
            </span>
            <h1 className="font-serif text-[40px] md:text-[54px] lg:text-[60px] leading-[1.15] font-normal text-primary">
              Your writing stays <em className="italic text-accent font-normal">yours.</em><br />Full stop.
            </h1>
            <div className="w-10 h-[1px] bg-accent mx-auto my-6" />
            <p className="font-sans text-[17px] font-light text-mid leading-relaxed max-w-[580px] mx-auto">
              Three hard promises we make before anything else. Not buried in a policy document — right here, at the top.
            </p>
          </ScrollReveal>

          {/* Promises Grid */}
          <ScrollReveal delay={0.2} className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 border border-primary/8 rounded-xl bg-white overflow-hidden divide-y md:divide-y-0 md:divide-x divide-primary/8 max-w-[680px] mx-auto shadow-[0_4px_20px_rgba(30,42,46,0.03)]">
              {PROMISES.map((promise, index) => (
                <div key={index} className="p-6 flex flex-col items-center text-center justify-start space-y-2">
                  <div className={`font-serif text-3xl font-bold ${promise.colorClass}`}>
                    {promise.num}
                  </div>
                  <h3 className="font-sans text-xs md:text-[13px] font-semibold text-primary leading-snug">
                    {promise.label}
                  </h3>
                  <p className="font-sans text-[11px] text-mid leading-normal">
                    {promise.note}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="max-w-[700px] mx-auto px-6 py-14 md:py-20 space-y-16">

        {/* SECTION 1: The human question */}
        <ScrollReveal className="space-y-4">
          <span className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
            The question everyone actually has
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-primary font-normal leading-snug">
            Can anyone at Ingress Within read what I write?
          </h2>
          <div className="font-sans text-[14.5px] font-light text-mid leading-relaxed space-y-4">
            <p>
              <strong className="text-primary font-semibold">No.</strong> No employee, contractor, or support agent has access to your entries. We have no internal tooling that surfaces individual user entries. Your writing is not reviewed for moderation, quality assurance, or any other purpose.
            </p>
            <p>
              The only thing that reads your entries is the AI — automatically, as part of generating your reflection. That process is described below in full.
            </p>
          </div>
        </ScrollReveal>

        <hr className="border-none border-t border-primary/10" />

        {/* SECTION 2: Exactly what happens */}
        <ScrollReveal className="space-y-6">
          <div className="space-y-2">
            <span className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Exactly what happens when you write
            </span>
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-normal leading-snug">
              What the AI sees, step by step.
            </h2>
          </div>

          <div className="bg-white border border-primary/8 rounded-premium overflow-hidden shadow-[0_4px_20px_rgba(30,42,46,0.03)]">
            <div className="bg-primary text-light-mid px-5 py-3.5 text-[10px] md:text-[11px] font-semibold tracking-[0.12em] uppercase">
              What happens to your entry after you tap "Complete session"
            </div>
            <div className="divide-y divide-primary/8">
              {FLOW_STEPS.map((step, idx) => (
                <div key={idx} className="flex items-stretch">
                  <div className="w-12 shrink-0 flex items-center justify-center font-serif text-[18px] font-bold text-primary/12 border-r border-primary/8 py-5">
                    {step.num}
                  </div>
                  <div className="p-5 flex flex-col items-start gap-1.5 flex-1">
                    <h4 className="font-sans text-[13.5px] font-semibold text-primary">
                      {step.title}
                    </h4>
                    <p className="font-sans text-[12.5px] font-light text-mid leading-relaxed">
                      {step.body}
                    </p>
                    <div className={`mt-1.5 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getFlowTagClass(step.tagType)}`}>
                      {step.tag}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <hr className="border-none border-t border-primary/10" />

        {/* SECTION 3: Addressed directly */}
        <ScrollReveal className="space-y-6">
          <div className="space-y-2">
            <span className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              The three things people worry about most
            </span>
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-normal leading-snug">
              Addressed directly.
            </h2>
          </div>

          <div className="space-y-4">
            {/* Callout 1 (Terra) */}
            <div className="bg-accent/7 border-l-3 border-accent rounded-premium p-6 md:p-7 space-y-2">
              <h4 className="font-sans text-[13.5px] md:text-[14px] font-bold text-primary tracking-wide">
                Will my writing end up in an AI's training data?
              </h4>
              <p className="font-sans text-[13px] md:text-[13.5px] font-light text-mid leading-relaxed">
                <strong className="text-primary font-semibold">No. Never.</strong> We use an API with a zero data retention agreement. This means our model provider is contractually prohibited from using your entries for any purpose other than returning the response — including training, evaluation, or improving their models. Your words do not make the AI smarter for anyone else.
              </p>
            </div>

            {/* Callout 2 (Sage) */}
            <div className="bg-secondary/7 border-l-3 border-secondary rounded-premium p-6 md:p-7 space-y-2">
              <h4 className="font-sans text-[13.5px] md:text-[14px] font-bold text-primary tracking-wide">
                Does the AI "remember" what I wrote?
              </h4>
              <p className="font-sans text-[13px] md:text-[13.5px] font-light text-mid leading-relaxed">
                The AI model itself has no memory between sessions. Each time your entries are processed, they are sent fresh. The model that generates your weekly reflection does not "know" what it processed last week — <strong className="text-primary font-semibold">we send the relevant entries each time, and the model discards them after responding.</strong> What persists is stored on our servers, under your account, encrypted. That's it.
              </p>
            </div>

            {/* Callout 3 (Iris) */}
            <div className="bg-supporting/7 border-l-3 border-supporting rounded-premium p-6 md:p-7 space-y-2">
              <h4 className="font-sans text-[13.5px] md:text-[14px] font-bold text-primary tracking-wide">
                What happens if I delete my account?
              </h4>
              <p className="font-sans text-[13px] md:text-[13.5px] font-light text-mid leading-relaxed">
                <strong className="text-primary font-semibold">Everything is permanently deleted within 30 days.</strong> Your entries, your reflections, your reports, your account record. We do not keep backups of deleted accounts. We do not keep anonymised or aggregated versions of your entries. After deletion, there is nothing to retrieve — including in response to a legal request made after the 30-day window closes.
              </p>
            </div>

            {/* Callout 4 (Neutral Dark) */}
            <div className="bg-primary/4 border-l-3 border-primary/50 rounded-premium p-6 md:p-7 space-y-2">
              <h4 className="font-sans text-[13.5px] md:text-[14px] font-bold text-primary tracking-wide">
                Can I delete individual entries while staying on the platform?
              </h4>
              <p className="font-sans text-[13px] md:text-[13.5px] font-light text-mid leading-relaxed">
                No — and this is by design. The reflections and patterns the app surfaces depend on your <strong className="text-primary font-semibold">full unbroken history</strong>. Removing entries mid-journey would corrupt the patterns built from them, making future reflections inaccurate or misleading.
                <br /><br />
                Think of your entries as the raw data your reports are built from. If you want a clean slate, delete your account and start a new cycle from scratch. If you want everything gone permanently, <strong className="text-primary font-semibold">Settings → Delete account</strong> does that within 30 days.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <hr className="border-none border-t border-primary/10" />

        {/* SECTION 4: Full Q&A Accordions */}
        <ScrollReveal className="space-y-6">
          <div className="space-y-2">
            <span className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-secondary-dark block">
              Full detail
            </span>
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-normal leading-snug">
              Every question, answered plainly.
            </h2>
          </div>

          <div className="border border-primary/8 rounded-premium overflow-hidden bg-white shadow-[0_4px_20px_rgba(30,42,46,0.03)]">
            <div className="divide-y divide-primary/8">
              {QA_DATA.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={idx} className="transition-all duration-300">
                    <button
                      onClick={() => toggleQA(idx)}
                      className="w-full px-5 py-4.5 flex justify-between items-center text-left focus:outline-none cursor-pointer group hover:bg-primary/[0.01]"
                    >
                      <span className="font-serif text-[15px] md:text-base font-medium text-primary group-hover:text-secondary-dark transition-colors duration-200 pr-4">
                        {item.q}
                      </span>
                      <ChevronRight
                        size={16}
                        className={`text-primary/30 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-90 text-accent' : ''}`}
                      />
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
                          <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-mid leading-relaxed space-y-3 border-t border-primary/5 pt-3 bg-mint-grey/25">
                            {item.tag && (
                              <div className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit ${getTagClass(item.tagType)}`}>
                                {item.tag}
                              </div>
                            )}
                            {item.a.map((paragraph, pIdx) => (
                              <p
                                key={pIdx}
                                dangerouslySetInnerHTML={{ __html: paragraph }}
                                className="last:mb-0"
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* SECTION 5: Contact Strip */}
        <ScrollReveal>
          <div className="bg-primary rounded-premium p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-[0_8px_30px_rgba(30,42,46,0.15)]">
            {/* Soft background glow */}
            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-accent/10 filter blur-xl pointer-events-none" />

            <div className="font-sans text-xs md:text-sm font-light text-light-mid leading-relaxed relative z-10 max-w-[380px]">
              <strong className="text-white font-semibold">Still not sure?</strong><br />
              Ask us anything. We'll answer plainly, in writing, without boilerplate.
            </div>
            <a
              href="mailto:hello@ingresswithin.com"
              className="font-serif text-[15px] md:text-base text-accent hover:text-accent/80 italic transition-colors whitespace-nowrap border-b border-accent/20 pb-0.5 relative z-10"
            >
              hello@ingresswithin.com
            </a>
          </div>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
