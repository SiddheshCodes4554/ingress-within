import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import WhatItIsPage from './pages/WhatItIsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import PolicyModal from './components/PolicyModal';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [activePolicyKey, setActivePolicyKey] = useState('privacy');

  const handleOpenPolicy = (key) => {
    setActivePolicyKey(key || 'privacy');
    setPolicyModalOpen(true);
  };

  useEffect(() => {
    // Define global navigate function so pages/components can trigger programmatically
    window.navigateTo = (path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/what-it-is' || path === '/what-it-is/') {
        setCurrentRoute('what-it-is');
        window.scrollTo(0, 0);
      } else if (path === '/how-it-works' || path === '/how-it-works/') {
        setCurrentRoute('how-it-works');
        window.scrollTo(0, 0);
      } else if (path === '/about' || path === '/about/') {
        setCurrentRoute('about');
        window.scrollTo(0, 0);
      } else if (path === '/pricing' || path === '/pricing/') {
        setCurrentRoute('pricing');
        window.scrollTo(0, 0);
      } else if (path === '/faq' || path === '/faq/') {
        setCurrentRoute('faq');
        window.scrollTo(0, 0);
      } else if (path === '/contact' || path === '/contact/') {
        setCurrentRoute('contact');
        window.scrollTo(0, 0);
      } else if (path === '/auth' || path === '/auth/') {
        setCurrentRoute('auth');
        window.scrollTo(0, 0);
      } else {
        setCurrentRoute('home');
        // Handle section scroll deep link (e.g. /#auth -> scroll to auth section)
        const hash = window.location.hash;
        const anchor = hash.replace(/^#\/?/, '');
        if (anchor && ['what', 'how', 'trust', 'pricing', 'faq', 'auth', 'problem', 'approach', 'who'].includes(anchor)) {
          setTimeout(() => {
            const el = document.getElementById(anchor);
            if (el) {
              const yOffset = -80;
              const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }, 150);
        }
      }
    };

    const handleGlobalClick = (e) => {
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      // If it's a local path or hash link
      if (href && (href.startsWith('/') || href.startsWith('#')) && !href.startsWith('//') && !anchor.target) {
        // Handle in-page hash scroll for Home route
        if (href.startsWith('#') && window.location.pathname === '/') {
          const anchorId = href.replace(/^#\/?/, '');
          const el = document.getElementById(anchorId);
          if (el) {
            e.preventDefault();
            window.history.pushState({}, '', href);
            const yOffset = -80;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
          return;
        }

        e.preventDefault();
        window.history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('click', handleGlobalClick);
    handleLocationChange(); // Run initial check on load

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const renderPage = () => {
    switch (currentRoute) {
      case 'what-it-is':
        return <WhatItIsPage onOpenPolicy={handleOpenPolicy} />;
      case 'how-it-works':
        return <HowItWorksPage onOpenPolicy={handleOpenPolicy} />;
      case 'about':
        return <AboutPage onOpenPolicy={handleOpenPolicy} />;
      case 'pricing':
        return <PricingPage onOpenPolicy={handleOpenPolicy} />;
      case 'faq':
        return <FaqPage onOpenPolicy={handleOpenPolicy} />;
      case 'contact':
        return <ContactPage onOpenPolicy={handleOpenPolicy} />;
      case 'auth':
        return <AuthPage onOpenPolicy={handleOpenPolicy} />;
      case 'home':
      default:
        return <LandingPage onOpenPolicy={handleOpenPolicy} />;
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRoute}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      
      <PolicyModal 
        isOpen={policyModalOpen} 
        onClose={() => setPolicyModalOpen(false)} 
        activeKey={activePolicyKey}
        setActiveKey={setActivePolicyKey}
      />
    </>
  );
}
