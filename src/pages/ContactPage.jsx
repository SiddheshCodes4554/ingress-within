import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

export default function ContactPage({ onOpenPolicy }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.message) {
      setErrorMsg('Please add your email and message before sending.');
      return;
    }
    // Simulate successful form submission
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-primary selection:bg-accent/30 font-sans">
      <Navbar isSubpage={true} />

      {/* Main split layout */}
      <div className="min-h-screen pt-[68px] grid grid-cols-1 lg:grid-cols-2">
        
        {/* LEFT COLUMN: INFO */}
        <div className="left py-16 md:py-24 px-6 md:px-12 lg:pl-[8%] lg:pr-[5%] flex flex-col justify-center bg-white">
          <ScrollReveal className="space-y-4">
            <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary block">
              Contact
            </span>
            <h1 className="font-serif text-[42px] sm:text-[48px] lg:text-[54px] leading-[1.12] tracking-tight font-normal text-primary">
              We read every<br />
              message. <em className="italic text-accent font-normal">All of them.</em>
            </h1>
            <div className="w-10 h-[1px] bg-accent my-6" />
            <p className="font-sans text-[16px] font-light text-mid leading-relaxed max-w-[400px]">
              No bots. No ticket queues. Someone who knows the product reads your message and writes back.
            </p>
          </ScrollReveal>

          {/* Email list */}
          <ScrollReveal className="email-list flex flex-col gap-7 mt-10" delay={0.1}>
            <div className="email-item space-y-1">
              <div className="font-sans text-[11px] font-medium tracking-[0.1em] uppercase text-mid">
                General
              </div>
              <a href="mailto:hello@ingresswithin.com" className="font-serif text-[19px] font-normal text-primary hover:text-accent transition-colors no-underline">
                hello@ingresswithin.com
              </a>
              <div className="font-sans text-[12.5px] font-light text-[#8AA8A4]">
                Questions, feedback, anything else
              </div>
            </div>

            <div className="email-item space-y-1">
              <div className="font-sans text-[11px] font-medium tracking-[0.1em] uppercase text-mid">
                Support
              </div>
              <a href="mailto:support@ingresswithin.com" className="font-serif text-[19px] font-normal text-primary hover:text-accent transition-colors no-underline">
                support@ingresswithin.com
              </a>
              <div className="font-sans text-[12.5px] font-light text-[#8AA8A4]">
                App issues, billing, account access
              </div>
            </div>

            <div className="email-item space-y-1">
              <div className="font-sans text-[11px] font-medium tracking-[0.1em] uppercase text-mid">
                Press &amp; grants
              </div>
              <a href="mailto:press@ingresswithin.com" className="font-serif text-[19px] font-normal text-primary hover:text-accent transition-colors no-underline">
                press@ingresswithin.com
              </a>
              <div className="font-sans text-[12.5px] font-light text-[#8AA8A4]">
                Media, partnerships, grant enquiries
              </div>
            </div>

            <div className="email-item space-y-1">
              <div className="font-sans text-[11px] font-medium tracking-[0.1em] uppercase text-mid">
                Founding 50 waitlist
              </div>
              <a href="mailto:founding@ingresswithin.com" className="font-serif text-[19px] font-normal text-primary hover:text-accent transition-colors no-underline">
                founding@ingresswithin.com
              </a>
              <div className="font-sans text-[12.5px] font-light text-[#8AA8A4]">
                Join the waitlist for spots that open up
              </div>
            </div>
          </ScrollReveal>

          {/* Response times note */}
          <ScrollReveal className="response-note mt-12 pt-8 border-t border-primary/8 space-y-4" delay={0.2}>
            <p className="font-sans text-[13px] font-light text-mid leading-relaxed">
              We are a small team. These are honest estimates.
            </p>
            <div className="response-times flex flex-wrap gap-8">
              <div className="rt-item flex flex-col">
                <span className="font-serif text-[24px] font-light text-accent leading-none">24hrs</span>
                <span className="font-sans text-[11px] font-light text-mid mt-1">Support &amp; billing</span>
              </div>
              <div className="rt-item flex flex-col">
                <span className="font-serif text-[24px] font-light text-accent leading-none">48hrs</span>
                <span className="font-sans text-[11px] font-light text-mid mt-1">General</span>
              </div>
              <div className="rt-item flex flex-col">
                <span className="font-serif text-[24px] font-light text-accent leading-none">72hrs</span>
                <span className="font-sans text-[11px] font-light text-mid mt-1">Press &amp; grants</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* RIGHT COLUMN: FORM */}
        <div className="right py-16 md:py-24 px-6 md:px-12 lg:pl-[5%] lg:pr-[8%] flex flex-col justify-center bg-primary text-mint-grey">
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div 
                key="contact-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 max-w-[480px]"
              >
                <div>
                  <h2 className="font-serif text-[26px] font-normal text-mint-grey">
                    Send a message
                  </h2>
                  <p className="font-sans text-[14px] font-light text-muted-text mt-1 leading-relaxed">
                    Use the dropdown to help us route it. Everything else — just tell us what you need.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[11px] font-medium tracking-[0.08em] uppercase text-muted-text" htmlFor="name">
                      Name
                    </label>
                    <input 
                      type="text" 
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="First name is fine"
                      className="bg-white/6 border border-white/15 rounded-md px-4 py-3 font-sans text-sm text-mint-grey placeholder-white/28 outline-none focus:border-secondary/50 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[11px] font-medium tracking-[0.08em] uppercase text-muted-text" htmlFor="email">
                      Email
                    </label>
                    <input 
                      type="email" 
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="We reply here"
                      className="bg-white/6 border border-white/15 rounded-md px-4 py-3 font-sans text-sm text-mint-grey placeholder-white/28 outline-none focus:border-secondary/50 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[11px] font-medium tracking-[0.08em] uppercase text-muted-text" htmlFor="category">
                      What is this about?
                    </label>
                    <div className="relative">
                      <select 
                        id="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="bg-white/6 border border-white/15 rounded-md px-4 py-3 font-sans text-sm text-mint-grey outline-none focus:border-secondary/50 transition-colors w-full cursor-pointer appearance-none"
                      >
                        <option value="" disabled className="bg-primary text-mint-grey">Select a category</option>
                        <option value="general" className="bg-primary text-mint-grey">General enquiry</option>
                        <option value="support" className="bg-primary text-mint-grey">Technical support</option>
                        <option value="billing" className="bg-primary text-mint-grey">Billing &amp; account</option>
                        <option value="press" className="bg-primary text-mint-grey">Press &amp; partnerships</option>
                        <option value="founding" className="bg-primary text-mint-grey">Founding 50 waitlist</option>
                        <option value="other" className="bg-primary text-mint-grey">Something else</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 text-[10px]">▼</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans text-[11px] font-medium tracking-[0.08em] uppercase text-muted-text" htmlFor="message">
                      Message
                    </label>
                    <textarea 
                      id="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us what you need. The more context, the faster we can help."
                      className="bg-white/6 border border-white/15 rounded-md px-4 py-3 font-sans text-sm text-mint-grey placeholder-white/28 outline-none focus:border-secondary/50 transition-colors w-full resize-y min-h-[130px] leading-relaxed"
                    />
                  </div>

                  {errorMsg && (
                    <div className="text-accent text-xs font-sans mt-2">
                      {errorMsg}
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-accent hover:bg-[#D49888] hover:translate-y-[-2px] text-primary border-none rounded-md font-sans text-sm font-medium tracking-wide transition-all duration-200 cursor-pointer mt-2"
                  >
                    Send message &rarr;
                  </button>
                </form>
                
                <p className="font-sans text-xs text-secondary/50 text-center leading-relaxed mt-4">
                  If something is urgent, say so in your message. We'll prioritise accordingly.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="contact-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-5 max-w-[420px] mx-auto py-12"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary flex items-center justify-center text-secondary text-2xl mx-auto">
                  ✓
                </div>
                <h2 className="font-serif text-3xl font-normal text-mint-grey">
                  Message sent.
                </h2>
                <p className="font-sans text-sm font-light text-light-mid leading-relaxed">
                  We've got it. You'll hear back within the timeframe for your category.<br /><br />
                  If something is urgent and you haven't heard back, write directly to{' '}
                  <a href="mailto:hello@ingresswithin.com" className="text-accent hover:underline no-underline font-medium">
                    hello@ingresswithin.com
                  </a>.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Separator Strip */}
      <section className="bg-mint-grey py-12 px-6 md:px-[8%] border-t border-primary/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="font-serif text-xl font-normal text-primary leading-snug">
          Not sure which email to use?<br />
          <span className="italic text-accent font-normal">hello@ingresswithin.com</span> gets to the right person.
        </div>
        <a 
          href="#/faq" 
          className="font-sans text-sm font-normal text-mid hover:text-primary transition-all flex items-center gap-1.5 no-underline"
        >
          Browse the FAQ &rarr;
        </a>
      </section>

      <Footer onOpenPolicy={onOpenPolicy} />
    </div>
  );
}
