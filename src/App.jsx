import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import WhatItIsPage from './pages/WhatItIsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PricingPage from './pages/PricingPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
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
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/what-it-is')) {
        setCurrentRoute('what-it-is');
        window.scrollTo(0, 0);
      } else if (hash.startsWith('#/how-it-works')) {
        setCurrentRoute('how-it-works');
        window.scrollTo(0, 0);
      } else if (hash.startsWith('#/pricing')) {
        setCurrentRoute('pricing');
        window.scrollTo(0, 0);
      } else if (hash.startsWith('#/faq')) {
        setCurrentRoute('faq');
        window.scrollTo(0, 0);
      } else if (hash.startsWith('#/contact')) {
        setCurrentRoute('contact');
        window.scrollTo(0, 0);
      } else {
        setCurrentRoute('home');
        // Handle section scroll deep link (e.g. #auth -> scroll to auth section)
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

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run initial check on load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    switch (currentRoute) {
      case 'what-it-is':
        return <WhatItIsPage onOpenPolicy={handleOpenPolicy} />;
      case 'how-it-works':
        return <HowItWorksPage onOpenPolicy={handleOpenPolicy} />;
      case 'pricing':
        return <PricingPage onOpenPolicy={handleOpenPolicy} />;
      case 'faq':
        return <FaqPage onOpenPolicy={handleOpenPolicy} />;
      case 'contact':
        return <ContactPage onOpenPolicy={handleOpenPolicy} />;
      case 'home':
      default:
        return <LandingPage onOpenPolicy={handleOpenPolicy} />;
    }
  };

  return (
    <>
      {renderPage()}
      
      <PolicyModal 
        isOpen={policyModalOpen} 
        onClose={() => setPolicyModalOpen(false)} 
        activeKey={activePolicyKey}
        setActiveKey={setActivePolicyKey}
      />
    </>
  );
}
