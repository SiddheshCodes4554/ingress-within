import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PolicyModal from './components/PolicyModal';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const WhatItIsPage = lazy(() => import('./pages/WhatItIsPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AiDataPage = lazy(() => import('./pages/AiDataPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WritePage = lazy(() => import('./pages/WritePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const PatternsPage = lazy(() => import('./pages/PatternsPage'));
const VocabPage = lazy(() => import('./pages/VocabPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const SessionFlowPage = lazy(() => import('./pages/SessionFlowPage'));
const ThreadDetailPage = lazy(() => import('./pages/ThreadDetailPage'));





function LoadingScreen() {
  return (
    <div className="min-h-screen bg-mint-grey flex flex-col justify-center items-center font-sans space-y-4 text-center">
      <div className="relative w-20 h-20 flex items-center justify-center pointer-events-none mb-2">
        <div className="absolute w-16 h-16 rounded-full border border-secondary/20 animate-ping" />
        <div className="absolute w-12 h-12 rounded-full border border-accent/20 animate-pulse" />
        <svg className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="2" fill="currentColor"/>
          <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        </svg>
      </div>
      <p className="text-mid font-serif italic text-sm animate-pulse">Settle in. Let the mind arrive...</p>
    </div>
  );
}

function DatabaseErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-mint-grey p-8 flex flex-col justify-center items-center font-sans space-y-6 text-center">
      <div className="relative w-20 h-20 flex items-center justify-center pointer-events-none mb-2">
        <svg className="w-12 h-12 text-[#b45309] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="font-serif text-2xl text-primary font-normal">Connection Interrupted</h1>
      <p className="text-mid font-light max-w-sm leading-relaxed text-[14px]">
        We encountered a temporary database or network issue checking your session state.
      </p>
      <div className="bg-[#fef3c7] border border-[#f59e0b]/20 text-[#92400e] text-[11px] font-mono p-3 rounded max-w-md w-full break-all text-left">
        <strong>Error Code:</strong> {error.code || 'UNKNOWN'}<br />
        <strong>Status:</strong> {error.status || '0'}<br />
        <strong>Message:</strong> {error.message || 'Check database connection or credentials.'}
      </div>
      <button 
        onClick={onRetry}
        className="px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
      >
        Retry Connection
      </button>
    </div>
  );
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [activePolicyKey, setActivePolicyKey] = useState('privacy');

  // Authenticated user state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setProfile(null);
      setAuthError(null);
      window.navigateTo('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleOpenPolicy = (key) => {
    setActivePolicyKey(key || 'privacy');
    setPolicyModalOpen(true);
  };

  // Check auth and profile status from the server
  const checkUserStatus = async (silent = false) => {
    console.log(`[App.jsx] checkUserStatus started... silent: ${silent}`);
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const res = await fetch('/api/auth/me');
      console.log(`[App.jsx] checkUserStatus API response status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[App.jsx] checkUserStatus user resolved:', data.user ? data.user.id : null);
        console.log('[App.jsx] checkUserStatus profile resolved:', data.profile ? {
          id: data.profile.id,
          consent_completed: data.profile.consent_completed,
          profile_completed: data.profile.profile_completed,
          onboarding_completed: data.profile.onboarding_completed
        } : null);
        setUser(data.user);
        setProfile(data.profile);
        setAuthError(null); // Clear any previous auth errors
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('[App.jsx] checkUserStatus API error response:', errData);
        
        const errorCode = errData.error?.code || 'UNKNOWN';
        const errorStatus = res.status;
        
        // If it's a transient server error or database query issue (500)
        if (errorStatus >= 500 || errorCode === 'DATABASE_ERROR' || errorCode === 'INTERNAL_ERROR') {
          console.warn('[App.jsx] checkUserStatus: Transient server/database error. Retaining current user states, setting authError.');
          setAuthError({
            code: errorCode,
            status: errorStatus,
            message: errData.error?.message || 'A database or connection error occurred.'
          });
        } else {
          // Actual authentication failure (401, etc. - e.g., AUTH_REQUIRED, AUTH_INVALID_TOKEN, AUTH_SESSION_EXPIRED)
          console.warn('[App.jsx] checkUserStatus: True authentication invalidity. Clearing user session. Error Code:', errorCode);
          setUser(null);
          setProfile(null);
          setAuthError(null);
        }
      }
    } catch (err) {
      console.error('[App.jsx] checkUserStatus network or execution error:', err);
      // Catch network/cors offline errors as transient
      setAuthError({
        code: 'NETWORK_ERROR',
        status: 0,
        message: 'Could not connect to the server. Please check your network connection.'
      });
    } finally {
      console.log('[App.jsx] checkUserStatus complete. Setting isLoading(false) and authChecked(true)');
      if (!silent) {
        setIsLoading(false);
      }
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    // Check user state on initial load and route shifts
    // Run background checks silently to avoid visual layout flashing if auth is already checked
    const silent = authChecked;
    checkUserStatus(silent);
  }, [currentRoute]);

  // Protective Redirect Engine
  useEffect(() => {
    const path = window.location.pathname;
    console.log('[App.jsx] Redirect Engine evaluated with states:', {
      authChecked,
      isLoading,
      authErrorExists: !!authError,
      authErrorCode: authError?.code || null,
      userExists: !!user,
      userId: user?.id || null,
      profileExists: !!profile,
      onboardingCompleted: profile?.onboarding_completed,
      path,
      currentRoute
    });

    if (!authChecked || isLoading) {
      console.log('[App.jsx] Redirect Engine: auth not checked or currently loading, skipping redirects.');
      return;
    }

    // If there is a transient database/network error on a pointer/protected route, prevent redirect loops to /auth
    if (authError && (path.startsWith('/onboarding') || path.startsWith('/dashboard') || path.startsWith('/settings') || path.startsWith('/write') || path.startsWith('/reports') || path.startsWith('/patterns') || path.startsWith('/vocab') || path.startsWith('/support') || path.startsWith('/session') || path.startsWith('/thread'))) {
      console.warn('[App.jsx] Redirect Engine: Database/Network error detected on protected path. Preventing redirect to /auth. Reason: TRANSIENT_ERROR_SHIELD');
      return;
    }

    const isProtectedRoute = path.startsWith('/onboarding') || path.startsWith('/dashboard') || path.startsWith('/settings') || path.startsWith('/write') || path.startsWith('/reports') || path.startsWith('/patterns') || path.startsWith('/vocab') || path.startsWith('/support') || path.startsWith('/session') || path.startsWith('/thread');


    if (isProtectedRoute) {
      if (!user) {
        console.warn('[App.jsx] Redirect Engine: User is not authenticated on protected route. Redirecting to /auth. Reason: SESSION_INVALID');
        window.navigateTo('/auth');
      } else if (profile) {
        console.log('[App.jsx] Redirect Engine: Authenticated user with profile on protected route. Onboarding state:', {
          consent_completed: profile.consent_completed,
          profile_completed: profile.profile_completed,
          orientation_completed: profile.orientation_completed,
          assessment_completed: profile.assessment_completed,
          onboarding_completed: profile.onboarding_completed
        });
        if (!profile.onboarding_completed) {
          if (!profile.consent_completed && path !== '/onboarding/consent') {
            console.log('[App.jsx] Redirect Engine: consent_completed is false. Redirecting to /onboarding/consent. Reason: ONBOARDING_INCOMPLETE');
            window.navigateTo('/onboarding/consent');
          } else if (profile.consent_completed && !profile.profile_completed && path !== '/onboarding/profile') {
            console.log('[App.jsx] Redirect Engine: profile_completed is false. Redirecting to /onboarding/profile. Reason: ONBOARDING_INCOMPLETE');
            window.navigateTo('/onboarding/profile');
          } else if (profile.consent_completed && profile.profile_completed && !profile.orientation_completed && path !== '/onboarding/welcome') {
            console.log('[App.jsx] Redirect Engine: orientation_completed is false. Redirecting to /onboarding/welcome. Reason: ONBOARDING_INCOMPLETE');
            window.navigateTo('/onboarding/welcome');
          } else if (profile.consent_completed && profile.profile_completed && profile.orientation_completed && !profile.assessment_completed && path !== '/onboarding/assessment') {
            console.log('[App.jsx] Redirect Engine: assessment_completed is false. Redirecting to /onboarding/assessment. Reason: ONBOARDING_INCOMPLETE');
            window.navigateTo('/onboarding/assessment');
          } else {
            console.log('[App.jsx] Redirect Engine: User is on their correct current onboarding step page:', path);
          }
        } else {
          // Onboarding complete: prevent getting stuck on onboarding pages
          if (path.startsWith('/onboarding')) {
            console.log('[App.jsx] Redirect Engine: Onboarding is already complete. Redirecting from onboarding path to /dashboard. Reason: ONBOARDING_ALREADY_COMPLETE');
            window.navigateTo('/dashboard');
          } else {
            console.log('[App.jsx] Redirect Engine: Onboarding complete, user is on allowed protected page:', path);
          }
        }
      } else {
        // User is authenticated but profile is null: fallback redirect to onboarding/consent if not already there
        console.warn('[App.jsx] Redirect Engine: User is authenticated but profile is null! Redirecting to /onboarding/consent. Reason: PROFILE_MISSING');
        if (path !== '/onboarding/consent') {
          window.navigateTo('/onboarding/consent');
        }
      }
    } else if (path.startsWith('/auth') && user) {
      console.log('[App.jsx] Redirect Engine: Authenticated user attempting to access /auth. Redirecting forward.');
      if (profile && !profile.onboarding_completed) {
        if (!profile.consent_completed) {
          console.log('[App.jsx] Redirect Engine: Redirecting to /onboarding/consent. Reason: ONBOARDING_INCOMPLETE');
          window.navigateTo('/onboarding/consent');
        } else if (!profile.profile_completed) {
          console.log('[App.jsx] Redirect Engine: Redirecting to /onboarding/profile. Reason: ONBOARDING_INCOMPLETE');
          window.navigateTo('/onboarding/profile');
        } else if (!profile.orientation_completed) {
          console.log('[App.jsx] Redirect Engine: Redirecting to /onboarding/welcome. Reason: ONBOARDING_INCOMPLETE');
          window.navigateTo('/onboarding/welcome');
        } else if (!profile.assessment_completed) {
          console.log('[App.jsx] Redirect Engine: Redirecting to /onboarding/assessment. Reason: ONBOARDING_INCOMPLETE');
          window.navigateTo('/onboarding/assessment');
        }
      } else {
        console.log('[App.jsx] Redirect Engine: Redirecting to /dashboard. Reason: ONBOARDING_ALREADY_COMPLETE');
        window.navigateTo('/dashboard');
      }
    } else {
      console.log('[App.jsx] Redirect Engine: Public route or unauthenticated user on /auth. No redirect needed.');
    }
  }, [authChecked, isLoading, user, profile, currentRoute, authError]);

  useEffect(() => {
    // Define global navigate function so pages/components can trigger programmatically
    window.navigateTo = (path) => {
      console.log('[App.jsx] window.navigateTo called with path:', path);
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleLocationChange = () => {
      const path = window.location.pathname;
      console.log('[App.jsx] handleLocationChange fired. Path:', path);
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
      } else if (path.startsWith('/auth')) {
        setCurrentRoute('auth');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/onboarding')) {
        setCurrentRoute('onboarding');
        window.scrollTo(0, 0);
      } else if (path === '/dashboard' || path === '/dashboard/') {
        setCurrentRoute('dashboard');
        window.scrollTo(0, 0);
      } else if (path === '/settings' || path === '/settings/') {
        setCurrentRoute('settings');
        window.scrollTo(0, 0);
      } else if (path === '/write' || path === '/write/') {
        setCurrentRoute('write');
        window.scrollTo(0, 0);
      } else if (path === '/reports' || path === '/reports/') {
        setCurrentRoute('reports');
        window.scrollTo(0, 0);
      } else if (path === '/patterns' || path === '/patterns/') {
        setCurrentRoute('patterns');
        window.scrollTo(0, 0);
      } else if (path === '/vocab' || path === '/vocab/') {
        setCurrentRoute('vocab');
        window.scrollTo(0, 0);
      } else if (path === '/support' || path === '/support/') {
        setCurrentRoute('support');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/session')) {
        setCurrentRoute('session');
        window.scrollTo(0, 0);
      } else if (path.startsWith('/thread/')) {
        setCurrentRoute('thread');
        window.scrollTo(0, 0);
      } else if (path === '/ai-data' || path === '/ai-data/') {
        setCurrentRoute('ai-data');
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
    const path = window.location.pathname;
    const isProtectedRoute = path.startsWith('/onboarding') || path.startsWith('/dashboard') || path.startsWith('/settings') || path.startsWith('/write') || path.startsWith('/reports') || path.startsWith('/patterns') || path.startsWith('/vocab') || path.startsWith('/support') || path.startsWith('/session') || path.startsWith('/thread');

    if (isProtectedRoute && (!authChecked || isLoading)) {
      return <LoadingScreen />;
    }

    if (isProtectedRoute && authError) {
      return <DatabaseErrorScreen error={authError} onRetry={checkUserStatus} />;
    }

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
      case 'onboarding':
        return <OnboardingPage onComplete={() => window.navigateTo('/dashboard')} />;
      case 'dashboard':
        return <DashboardPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'settings':
        return <SettingsPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'write':
        return <WritePage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'reports':
        return <ReportsPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'patterns':
        return <PatternsPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'vocab':
        return <VocabPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'support':
        return <SupportPage />;
      case 'session':
        return <SessionFlowPage user={user} profile={profile} onSignOut={handleSignOut} />;
      case 'thread': {
        const threadId = window.location.pathname.split('/thread/')[1]?.replace(/\/$/, '') || '';
        return <ThreadDetailPage user={user} profile={profile} threadId={threadId} onSignOut={handleSignOut} />;
      }
      case 'ai-data':
        return <AiDataPage onOpenPolicy={handleOpenPolicy} />;
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
          <Suspense fallback={<LoadingScreen />}>
            {renderPage()}
          </Suspense>
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
