import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Sparkles, 
  HelpCircle, 
  MapPin, 
  Activity, 
  BookOpen, 
  Loader2, 
  Compass, 
  TrendingUp, 
  Route, 
  Layers, 
  ArrowUpRight,
  Info,
  Calendar,
  CheckCircle,
  FileText
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';

// Icons mapping for categories
const CATEGORY_COLORS = {
  emotion_language: { bg: '#E6F1FB', text: '#0C447C', border: 'border-blue-200' },
  behaviour: { bg: '#FAECE7', text: '#712B13', border: 'border-orange-200' },
  growth: { bg: '#EAF3DE', text: '#3E660D', border: 'border-green-200' },
  relationships: { bg: '#EEEDFE', text: '#3C3489', border: 'border-indigo-200' },
  decision_making: { bg: '#FAECE7', text: '#712B13', border: 'border-orange-200' },
  recovery: { bg: '#E2F5F1', text: '#1A5F50', border: 'border-teal-200' },
  values: { bg: '#FDF0E6', text: '#8C4612', border: 'border-amber-200' },
  communication: { bg: '#EEEDFE', text: '#3C3489', border: 'border-indigo-200' }
};

const CATEGORY_LABELS = {
  emotion_language: 'Emotion & Language',
  behaviour: 'Behavioural Pattern',
  growth: 'Personal Growth',
  relationships: 'Relationships',
  decision_making: 'Decision Making',
  recovery: 'Recovery & Self-care',
  values: 'Values & Work',
  communication: 'Communication Style'
};

// Full built-in emotional dictionary for fallback/full listing (SECTION 2 / SECTION 6)
const DICTIONARY_FAMILIES = [
  {
    name: "Sadness",
    group: "difficult",
    color: "#378ADD",
    bg: "#E6F1FB",
    desc: "Loss · longing · heaviness",
    emotions: ["Sadness", "Grief", "Loneliness"]
  },
  {
    name: "Fear",
    group: "difficult",
    color: "#7F77DD",
    bg: "#EEEDFE",
    desc: "Worry · dread · pressure",
    emotions: ["Anxiety", "Fear", "Overwhelm"]
  },
  {
    name: "Anger",
    group: "difficult",
    color: "#E24B4A",
    bg: "#FCEBEB",
    desc: "Injustice · frustration · bitterness",
    emotions: ["Anger", "Frustration", "Resentment"]
  },
  {
    name: "Shame",
    group: "difficult",
    color: "#D85A30",
    bg: "#FAECE7",
    desc: "Honour · guilt · unworthiness",
    emotions: ["Shame", "Guilt", "Remorse"]
  },
  {
    name: "Joy",
    group: "positive",
    color: "#639922",
    bg: "#EAF3DE",
    desc: "Happiness · aliveness · delight",
    emotions: ["Joy", "Contentment", "Gratitude", "Excitement"]
  },
  {
    name: "Warmth",
    group: "positive",
    color: "#E07B3A",
    bg: "#FDF0E6",
    desc: "Love · pride · closeness · relief",
    emotions: ["Love", "Pride", "Relief"]
  },
  {
    name: "Peace",
    group: "positive",
    color: "#3A9E8A",
    bg: "#E2F5F1",
    desc: "Stillness · hope · wonder",
    emotions: ["Serenity", "Awe", "Hope", "Anticipation"]
  }
];

const DICTIONARY_EMOTIONS = {
  Sadness: {
    aka: "low · heavy · weighed down",
    plain: "A response to loss, disappointment, or something that didn't go the way you hoped. It slows you down deliberately — your mind needs time to sit with what has changed.",
    body: ["Heaviness in chest", "No energy to do things", "Eyes that feel full", "Wanting to be still"],
    situations: [
      { s: "After an argument with a parent you love", f: "You're not angry anymore — just heavy. You didn't want it to go that way, and both of you are sitting in separate rooms carrying it." },
      { s: "When your life doesn't look like you imagined at this age", f: "Friends are getting settled, promotions are happening around you, and somewhere a quiet sadness settles in for what hasn't come yet." }
    ]
  },
  Grief: {
    aka: "loss · mourning · heartache",
    plain: "A response to significant loss — and this includes not just death but unfulfilled expectations, a life path closed off, or a version of yourself that was slowly set aside for the family's sake.",
    body: ["Physical aching", "Exhaustion", "Longing for past seasons"],
    situations: [
      { s: "Letting go of a dream career for stability", f: "You took the sensible job. You tell yourself you're okay with it, but some part of you is still mourning what didn't happen." }
    ]
  },
  Loneliness: {
    aka: "isolation · disconnected",
    plain: "Not about being physically alone — you can be surrounded by people and still lonely. It's the gap between the connections you have and the ones where you feel truly seen.",
    body: ["Hollow chest feeling", "Performance mask exhaustion", "Ache for understanding"],
    situations: [
      { s: "In a joint family where everyone is busy", f: "The house is full. Everyone is talking. And you are sitting in the middle of it, completely invisible." }
    ]
  },
  Anxiety: {
    aka: "tension · worry · unease",
    plain: "Your mind's alarm system running on overdrive — scanning for what could go wrong, what someone might think, what will happen if you fail.",
    body: ["Tightness in throat", "Racing mind", "Restlessness"],
    situations: [
      { s: "Preparing for family functions", f: "It's not the event you dread — it's the questions about your career, marriage, or future. You start preparing answers in advance." }
    ]
  },
  Fear: {
    aka: "terror · dread",
    plain: "A direct response to a real or perceived threat. It is a biological alarm that keeps you on guard.",
    body: ["Adrenaline surges", "Jaw clenching", "Shallower breathing"],
    situations: [
      { s: "Speaking up in front of authority figures", f: "You know what you want to say. But there is a fear of being dismissed or getting it wrong in front of people whose opinion matters." }
    ]
  },
  Overwhelm: {
    aka: "too much at once",
    plain: "The point where the demands being made of you — from family, work, society — exceed what you can realistically hold.",
    body: ["Brain fog", "Impulsivity", "Sighing frequently"],
    situations: [
      { s: " Eldest sibling burden", f: "Managing aging parents while handling a demanding job. Both are real needs. Neither can wait. And nobody is asking if you're okay with carrying both." }
    ]
  },
  Anger: {
    aka: "rage · irritation",
    plain: "A signal that something feels unfair, violated, or disrespected. It marks your boundaries.",
    body: ["Heat in face", "Jaw clenching", "Sudden quietness"],
    situations: [
      { s: "When your opinion is ignored in decisions", f: "They heard you, but they didn't count it. The anger is about being present but not included." }
    ]
  },
  Frustration: {
    aka: "blocked path",
    plain: "The feeling of being blocked — when effort doesn't lead where you expected it to.",
    body: ["Neck tension", "Impatience", "Heavy sighs"],
    situations: [
      { s: "Explaining boundaries to parents", f: "You've tried different ways. You've been patient. And they come back to the same position. The frustration is hitting a wall again." }
    ]
  },
  Resentment: {
    aka: "calcified anger",
    plain: "Anger that was never allowed to be expressed and has now settled in. It builds when sacrifice is expected without appreciation.",
    body: ["Emotional flatness", "Sarcastic thoughts", "Distance"],
    situations: [
      { s: "Always adjusting for others", f: "You never complained. You were 'the good one.' Now when they ask for favors you say yes, but feel empty inside." }
    ]
  },
  Shame: {
    aka: "disgrace · inadequacy",
    plain: "The belief that you are fundamentally flawed or unworthy of connection.",
    body: ["Urge to hide", "Sinking chest", "Gaze avoidance"],
    situations: [
      { s: "Not meeting family benchmarks", f: "It starts as questions at family functions. It becomes a background hum you carry into daily life. The shame isn't yours, but you're wearing it." }
    ]
  },
  Guilt: {
    aka: "self-blame",
    plain: "The feeling of having violated your own values or family expectations. Often about not sacrificing enough.",
    body: ["Stomach knots", "Overthinking past deeds", "Compulsive apologizing"],
    situations: [
      { s: "Prioritizing your rest over duties", f: "You stayed back instead of attending the family gathering. You needed it, but the guilt stays with you anyway." }
    ]
  }
};

export default function KnowledgeBankPage({ user, profile: authProfile, onSignOut }) {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'patterns' | 'trail'
  const [innerPatternTab, setInnerPatternTab] = useState('by-pattern'); // 'by-pattern' | 'by-situation'
  
  // Data loading states
  const [profile, setProfile] = useState(null);
  const [cards, setCards] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Reframe banner indices
  const [reframeIndex, setReframeIndex] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Detail Drawer state
  const [selectedDetail, setSelectedDetail] = useState(null); // { type: 'card' | 'word' | 'pattern', data: any }

  // Dictionary state
  const [expandedFamilies, setExpandedFamilies] = useState({});

  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      try {
        const [profRes, cardsRes, relsRes, snapsRes] = await Promise.all([
          fetch('/api/knowledge/profile').then(r => r.json()).catch(() => ({ profile: null })),
          fetch('/api/knowledge/cards').then(r => r.json()).catch(() => ({ cards: [] })),
          fetch('/api/knowledge/relationships').then(r => r.json()).catch(() => ({ relationships: [] })),
          fetch('/api/knowledge/snapshots').then(r => r.json()).catch(() => ({ snapshots: [] }))
        ]);

        if (profRes.success) setProfile(profRes.profile);
        if (cardsRes.success) setCards(cardsRes.cards);
        if (relsRes.success) setRelationships(relsRes.relationships);
        if (snapsRes.success) setSnapshots(snapsRes.snapshots);
      } catch (err) {
        console.error('Failed to load Knowledge Bank data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  // Filter profile dimensions with Medium or High confidence (Overview section)
  const confidenceDimensions = useMemo(() => {
    if (!profile) return [];
    const keys = [
      'identity_model', 'emotion_model', 'vocabulary_model', 'pattern_model', 
      'agency_model', 'relationship_model', 'decision_model', 'growth_model', 
      'communication_model', 'stress_model', 'values_model'
    ];
    return keys
      .map(k => ({ key: k, model: profile[k] }))
      .filter(item => item.model && (item.model.confidence === 'High' || item.model.confidence === 'Medium'));
  }, [profile]);

  // Insights extracted from profile for the Reframe Banner
  const profileInsights = useMemo(() => {
    return confidenceDimensions.map(d => ({
      title: d.key.replace('_model', '').toUpperCase(),
      text: d.model.summary,
      sub: `Based on your written patterns in ${d.model.supporting_vocabulary.join(', ') || 'history'}.`
    }));
  }, [confidenceDimensions]);

  // Instant Search Engine
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    
    // Search cards
    const matchedCards = cards.filter(c => 
      c.title.toLowerCase().includes(query) || 
      c.body.toLowerCase().includes(query) || 
      c.card_type.toLowerCase().includes(query)
    );

    // Search relationships
    const matchedRels = relationships.filter(r => 
      r.source_node.toLowerCase().includes(query) || 
      r.target_node.toLowerCase().includes(query) || 
      r.relationship_type.toLowerCase().includes(query)
    );

    // Search dictionary words
    const matchedDict = Object.keys(DICTIONARY_EMOTIONS)
      .filter(name => name.toLowerCase().includes(query) || DICTIONARY_EMOTIONS[name].aka.includes(query))
      .map(name => ({ name, ...DICTIONARY_EMOTIONS[name] }));

    return {
      cards: matchedCards,
      relationships: matchedRels,
      words: matchedDict
    };
  }, [searchQuery, cards, relationships]);

  // Format cycle snapshots for Patterns list
  const activePatterns = useMemo(() => {
    if (!profile || !profile.pattern_model) return [];
    // Extract nodes from pattern model referenced_nodes
    return profile.pattern_model.referenced_nodes || [];
  }, [profile]);

  // Renders the progressive loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECEFF0] text-[#1E2A2E] font-sans pb-20">
        <DashboardNavbar activeTab="knowledge" />
        <main className="max-w-[680px] mx-auto px-6 pt-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-primary/10 rounded" />
            <div className="h-24 w-full bg-white border border-[#1E2A2E]/10 rounded-xl" />
            <div className="h-6 w-40 bg-primary/10 rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-28 bg-white border border-[#1E2A2E]/10 rounded-xl" />
              <div className="h-28 bg-white border border-[#1E2A2E]/10 rounded-xl" />
            </div>
            <div className="h-40 w-full bg-white border border-[#1E2A2E]/10 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  // Calm Empty State for new users
  if (!profile || confidenceDimensions.length === 0) {
    return (
      <div className="min-h-screen bg-[#ECEFF0] text-[#1E2A2E] font-sans pb-20">
        <DashboardNavbar activeTab="knowledge" />
        <main className="max-w-[680px] mx-auto px-6 pt-12 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-white border border-[#1E2A2E]/10 flex items-center justify-center text-[#8DBFB4]">
            <Compass size={32} />
          </div>
          <div className="max-w-[400px] mx-auto space-y-3">
            <h1 className="font-serif text-2xl font-normal tracking-tight">We're still learning from your writing</h1>
            <p className="text-sm text-[#4A6A64] leading-relaxed">
              As you complete your daily journals, reflect with the guide, and unlock weekly summaries, the Knowledge Engine compiles observations about your patterns and emotional vocabulary.
            </p>
          </div>
          <div className="p-4 bg-white border border-[#1E2A2E]/10 rounded-xl text-left max-w-[460px] mx-auto space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">How to unlock</span>
            <ul className="text-xs text-[#4A6A64] space-y-1.5 list-disc pl-4">
              <li>Write a journal entry for at least 3 cycle days</li>
              <li>Address at least 2 conversational threads from the guide</li>
              <li>Generate your first weekly report</li>
            </ul>
          </div>
          <button 
            onClick={() => window.navigateTo('/write')}
            className="px-5 py-2.5 rounded-lg bg-[#1E2A2E] text-white text-xs font-semibold hover:opacity-90 transition-all cursor-pointer border-none shadow-sm uppercase tracking-wider"
          >
            Start Writing Today
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECEFF0] text-[#1E2A2E] font-sans pb-20">
      <DashboardNavbar activeTab="knowledge" />
      
      {/* Sticky Tab bar */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-[#1E2A2E]/10">
        <div className="max-w-[680px] mx-auto flex">
          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 transition-all border-none bg-transparent cursor-pointer ${
              activeTab === 'explore' ? 'text-[#1E2A2E] border-b-[#E0A898]' : 'text-[#4A6A64] hover:text-[#1E2A2E] border-b-transparent'
            }`}
          >
            <Compass size={14} /> Explore
          </button>
          <button 
            onClick={() => setActiveTab('patterns')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 transition-all border-none bg-transparent cursor-pointer ${
              activeTab === 'patterns' ? 'text-[#1E2A2E] border-b-[#E0A898]' : 'text-[#4A6A64] hover:text-[#1E2A2E] border-b-transparent'
            }`}
          >
            <TrendingUp size={14} /> Patterns
          </button>
          <button 
            onClick={() => setActiveTab('trail')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 transition-all border-none bg-transparent cursor-pointer ${
              activeTab === 'trail' ? 'text-[#1E2A2E] border-b-[#E0A898]' : 'text-[#4A6A64] hover:text-[#1E2A2E] border-b-transparent'
            }`}
          >
            <Route size={14} /> Your Trail
          </button>
        </div>
      </div>

      <main className="max-w-[680px] mx-auto px-6 pt-6">
        
        {/* ================= EXPLORE TAB ================= */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            
            {/* Reframe banner cycling */}
            {profileInsights.length > 0 && (
              <div 
                onClick={() => setReframeIndex((reframeIndex + 1) % profileInsights.length)}
                className="bg-[#1E2A2E] rounded-xl p-5 flex items-start gap-4 cursor-pointer hover:opacity-95 transition-opacity"
              >
                <div className="w-8 h-8 rounded-lg bg-[#8DBFB4]/15 flex items-center justify-center text-[#8DBFB4] shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold tracking-widest text-[#8DBFB4] uppercase block">
                    Did you know ({reframeIndex + 1}/{profileInsights.length})
                  </span>
                  <p className="text-sm font-medium text-white leading-relaxed font-serif italic">
                    "{profileInsights[reframeIndex].text}"
                  </p>
                  <span className="text-[11px] text-[#A8D4CE] block pt-1">
                    {profileInsights[reframeIndex].sub}
                  </span>
                </div>
              </div>
            )}

            {/* Instant Search Bar */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] flex items-center gap-1.5">
                <Search size={12} /> Find a starting word
              </span>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Type your own word - e.g. "burnt out", "on edge", "lonely"...' 
                  className="w-full bg-white border border-[#1E2A2E]/10 rounded-xl px-4 py-3 text-xs placeholder-[#4A6A64] focus:outline-none focus:border-[#8DBFB4] transition-colors"
                />
              </div>
            </div>

            {/* Render Search Results if query exists */}
            {searchQuery.trim() !== '' && searchResults && (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold text-[#1E2A2E] border-b pb-2">Search Results for "{searchQuery}"</h3>
                
                {searchResults.cards.length === 0 && searchResults.relationships.length === 0 && searchResults.words.length === 0 && (
                  <p className="text-xs text-[#4A6A64] italic">No exact matches found. Try spelling the concept differently.</p>
                )}

                {searchResults.cards.map((c, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDetail({ type: 'card', data: c })}
                    className="p-3 bg-[#ECEFF0]/50 rounded-lg hover:bg-[#ECEFF0] cursor-pointer border border-[#1E2A2E]/5"
                  >
                    <span className="text-[9px] font-bold text-[#8DBFB4] uppercase block mb-1">{CATEGORY_LABELS[c.card_type]}</span>
                    <h4 className="text-xs font-semibold text-[#1E2A2E]">{c.title}</h4>
                    <p className="text-xs text-[#4A6A64] line-clamp-2 mt-1">{c.body}</p>
                  </div>
                ))}

                {searchResults.words.map((w, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDetail({ type: 'word', data: w })}
                    className="p-3 bg-[#ECEFF0]/50 rounded-lg hover:bg-[#ECEFF0] cursor-pointer border border-[#1E2A2E]/5"
                  >
                    <span className="text-[9px] font-bold text-[#B8A8D4] uppercase block mb-1">Vocabulary Word</span>
                    <h4 className="text-xs font-semibold text-[#1E2A2E]">{w.name}</h4>
                    <p className="text-xs text-[#4A6A64] line-clamp-2 mt-1">{w.plain}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Explore Section (Knowledge Cards) */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] flex items-center gap-1.5">
                <BookOpen size={12} /> Stored Knowledge Cards
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card, i) => {
                  const theme = CATEGORY_COLORS[card.card_type] || { bg: '#fff', text: '#1E2A2E', border: 'border-[#1E2A2E]/10' };
                  return (
                    <div 
                      key={i}
                      onClick={() => setSelectedDetail({ type: 'card', data: card })}
                      className={`bg-white border rounded-xl p-5 cursor-pointer hover:shadow-sm transition-all flex flex-col justify-between ${theme.border}`}
                    >
                      <div className="space-y-2">
                        <span 
                          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider block w-fit"
                          style={{ backgroundColor: theme.bg, color: theme.text }}
                        >
                          {CATEGORY_LABELS[card.card_type] || card.card_type}
                        </span>
                        <h3 className="text-sm font-bold text-[#1E2A2E] leading-snug">{card.title}</h3>
                        <p className="text-xs text-[#4A6A64] leading-relaxed line-clamp-3">{card.body}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8DBFB4] font-semibold pt-4">
                        <span>See cited evidence</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split surface grid for positive vs difficult */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#ECEFF0]/60 border border-[#1E2A2E]/10 rounded-xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7F77DD] block mb-3">Difficult States</span>
                <div className="space-y-2">
                  {DICTIONARY_FAMILIES.filter(f => f.group === 'difficult').slice(0, 3).map((f, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedDetail({ type: 'word', data: { name: f.emotions[0], ...DICTIONARY_EMOTIONS[f.emotions[0]] } })}
                      className="p-2.5 bg-white border border-[#1E2A2E]/5 rounded-lg cursor-pointer hover:bg-[#ECEFF0]/80 transition-colors flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-[#1E2A2E]">{f.emotions[0]}</span>
                      <ChevronRight size={12} className="text-[#4A6A64]" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#ECEFF0]/60 border border-[#1E2A2E]/10 rounded-xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A9E8A] block mb-3">Positive States</span>
                <div className="space-y-2">
                  {DICTIONARY_FAMILIES.filter(f => f.group === 'positive').slice(0, 3).map((f, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedDetail({ type: 'word', data: { name: f.emotions[0], ...DICTIONARY_EMOTIONS[f.emotions[0]] } })}
                      className="p-2.5 bg-white border border-[#1E2A2E]/5 rounded-lg cursor-pointer hover:bg-[#ECEFF0]/80 transition-colors flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-[#1E2A2E]">{f.emotions[0]}</span>
                      <ChevronRight size={12} className="text-[#4A6A64]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* The Full Dictionary */}
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">The Full Dictionary</span>
                <p className="text-xs text-[#4A6A64]">The built-in reference library for emotional grounding.</p>
              </div>
              <div className="space-y-2">
                {DICTIONARY_FAMILIES.map((family, idx) => {
                  const isExpanded = expandedFamilies[family.name];
                  return (
                    <div key={idx} className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden">
                      <div 
                        onClick={() => setExpandedFamilies(prev => ({ ...prev, [family.name]: !prev[family.name] }))}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#ECEFF0]/20"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-[#1E2A2E]">{family.name}</h4>
                          <span className="text-[10px] text-[#4A6A64]">{family.desc}</span>
                        </div>
                        <ChevronDown size={16} className={`text-[#4A6A64] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 bg-[#ECEFF0]/20 border-t border-[#1E2A2E]/5 flex flex-wrap gap-2">
                          {family.emotions.map((emo, eIdx) => (
                            <div 
                              key={eIdx}
                              onClick={() => setSelectedDetail({ type: 'word', data: { name: emo, ...DICTIONARY_EMOTIONS[emo] } })}
                              className="px-3 py-1.5 bg-white border border-[#1E2A2E]/10 rounded-lg text-xs font-medium cursor-pointer hover:border-[#8DBFB4] hover:bg-white"
                            >
                              {emo}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ================= PATTERNS TAB ================= */}
        {activeTab === 'patterns' && (
          <div className="space-y-6">
            <div className="flex border-b border-[#1E2A2E]/10 mb-4">
              <button 
                onClick={() => setInnerPatternTab('by-pattern')}
                className={`py-2 px-4 text-xs font-semibold border-b-2 border-none bg-transparent cursor-pointer ${
                  innerPatternTab === 'by-pattern' ? 'text-[#1E2A2E] border-b-[#8DBFB4]' : 'text-[#4A6A64] hover:text-[#1E2A2E] border-b-transparent'
                }`}
              >
                By Pattern
              </button>
              <button 
                onClick={() => setInnerPatternTab('by-situation')}
                className={`py-2 px-4 text-xs font-semibold border-b-2 border-none bg-transparent cursor-pointer ${
                  innerPatternTab === 'by-situation' ? 'text-[#1E2A2E] border-b-[#8DBFB4]' : 'text-[#4A6A64] hover:text-[#1E2A2E] border-b-transparent'
                }`}
              >
                By Situation
              </button>
            </div>

            {innerPatternTab === 'by-pattern' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Your Active Patterns</span>
                  <p className="text-xs text-[#4A6A64]">Key behavioral trends observed in your recent diaries.</p>
                </div>

                <div className="space-y-3">
                  {activePatterns.map((pat, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedDetail({ type: 'pattern', data: { name: pat } })}
                      className="p-4 bg-white border border-l-4 border-l-[#E0A898] border-[#1E2A2E]/10 rounded-r-xl cursor-pointer hover:bg-[#ECEFF0]/30 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#1E2A2E]">{pat}</h4>
                        <span className="text-[10px] text-[#4A6A64]">Identified in your active profile</span>
                      </div>
                      <ChevronRight size={16} className="text-[#4A6A64]" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {innerPatternTab === 'by-situation' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Pattern Situations</span>
                  <p className="text-xs text-[#4A6A64]">Real-world triggers identified behind your patterns.</p>
                </div>

                <div className="space-y-3">
                  {relationships.filter(r => r.source_type === 'Stress Trigger' || r.source_type === 'Situation').map((rel, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-white border border-[#1E2A2E]/10 rounded-xl space-y-2"
                    >
                      <h4 className="text-xs font-bold text-[#1E2A2E]">{rel.source_node}</h4>
                      <p className="text-xs text-[#4A6A64] leading-relaxed">
                        Frequently triggers <span className="font-semibold text-[#1E2A2E]">{rel.target_node}</span> ({rel.relationship_type.toLowerCase()}).
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        <span className="px-2 py-0.5 bg-[#ECEFF0] rounded text-[9px] text-[#4A6A64] font-medium border border-[#1E2A2E]/5">
                          Strength: {Number(rel.strength).toFixed(2)}
                        </span>
                        <span className="px-2 py-0.5 bg-[#ECEFF0] rounded text-[9px] text-[#4A6A64] font-medium border border-[#1E2A2E]/5">
                          Confidence: {rel.confidence}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= YOUR TRAIL TAB ================= */}
        {activeTab === 'trail' && (
          <div className="space-y-6">
            
            {/* Trail Analysis Overview */}
            <div className="bg-[#1E2A2E] rounded-xl p-5 text-white space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Your Trail Analysis</span>
              <p className="text-sm font-serif italic text-[#D8ECEA] leading-relaxed">
                "We trace the emotional language, patterns, and growth markers appearing in your writing over time."
              </p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                  <span className="text-[9px] text-[#A8D4CE] uppercase block font-semibold">Active Words</span>
                  <span className="text-xl font-bold text-[#8DBFB4]">{profile?.vocabulary_model?.supporting_vocabulary?.length || 0}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#A8D4CE] uppercase block font-semibold">Milestones Hit</span>
                  <span className="text-xl font-bold text-[#8DBFB4]">{snapshots.length}</span>
                </div>
              </div>
            </div>

            {/* Emerging Vocabulary */}
            {profile?.vocabulary_model && (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] flex items-center gap-1.5">
                  <Activity size={12} /> Emerging Vocabulary
                </span>
                <p className="text-xs text-[#4A6A64] leading-relaxed">{profile.vocabulary_model.summary}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {profile.vocabulary_model.supporting_vocabulary.map((vocab, i) => (
                    <div 
                      key={i}
                      onClick={() => setSelectedDetail({ type: 'word', data: { name: vocab, ...DICTIONARY_EMOTIONS[vocab] } })}
                      className="px-2.5 py-1 bg-[#ECEFF0] hover:bg-[#ECEFF0]/80 rounded border border-[#1E2A2E]/5 text-xs text-[#1E2A2E] font-medium cursor-pointer"
                    >
                      {vocab}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Knowledge Graph Visualization */}
            {relationships.length > 0 && (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] flex items-center gap-1.5">
                  <Layers size={12} /> Connected Knowledge Graph
                </span>
                <p className="text-xs text-[#4A6A64]">Dynamic connections between triggers, behaviors, and emotional states.</p>
                
                <div className="space-y-3 pt-2">
                  {relationships.slice(0, 5).map((rel, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 p-2 bg-[#ECEFF0] rounded-lg border border-[#1E2A2E]/5 text-center text-xs font-semibold text-[#1E2A2E] truncate">
                        {rel.source_node}
                        <span className="text-[9px] font-medium block text-[#4A6A64]">{rel.source_type}</span>
                      </div>
                      <div className="flex flex-col items-center shrink-0 min-w-[70px]">
                        <span className="text-[9px] font-bold text-[#E0A898] uppercase tracking-wider text-center">{rel.relationship_type}</span>
                        <div className="h-[2px] bg-[#E0A898]/40 w-full relative">
                          <div className="absolute right-0 top-[-3px] w-2 h-2 rounded-full bg-[#E0A898]" />
                        </div>
                        <span className="text-[8px] text-[#4A6A64] block">{Number(rel.strength).toFixed(2)}</span>
                      </div>
                      <div className="flex-1 p-2 bg-[#ECEFF0] rounded-lg border border-[#1E2A2E]/5 text-center text-xs font-semibold text-[#1E2A2E] truncate">
                        {rel.target_node}
                        <span className="text-[9px] font-medium block text-[#4A6A64]">{rel.target_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Growth Over Time */}
            {snapshots.length > 0 && (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] flex items-center gap-1.5">
                  <Calendar size={12} /> Knowledge Growth Timeline
                </span>
                <div className="border-l-2 border-[#8DBFB4]/30 pl-4 space-y-6 pt-2">
                  {snapshots.map((snap, i) => (
                    <div key={i} className="relative">
                      <div className="absolute left-[-21px] top-1 w-2 h-2 rounded-full bg-[#8DBFB4] border-2 border-white" />
                      <h4 className="text-xs font-bold text-[#1E2A2E]">Week {snap.week_number} Milestone</h4>
                      <span className="text-[9px] text-[#4A6A64] block mb-1">
                        Completed at {new Date(snap.generated_at).toLocaleDateString()}
                      </span>
                      <p className="text-xs text-[#4A6A64] leading-relaxed line-clamp-3">
                        {snap.snapshot.identity_model?.summary || snap.snapshot.emotion_model?.summary || 'Stable timeline compiled.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Overlay Slide-over Detail Drawer */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-[#1E2A2E]/60 backdrop-blur-xs" onClick={() => setSelectedDetail(null)} />

            <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white shadow-xl flex flex-col"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#1E2A2E]/10 flex items-center justify-between bg-[#ECEFF0]">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedDetail(null)}
                      className="text-[#4A6A64] hover:text-[#1E2A2E] border-none bg-transparent cursor-pointer"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#4A6A64]">
                      {selectedDetail.type === 'card' ? 'Knowledge Card' : selectedDetail.type === 'word' ? 'Dictionary Word' : 'Pattern Detail'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedDetail(null)}
                    className="text-xs font-semibold text-[#4A6A64] hover:text-[#1E2A2E] border-none bg-transparent cursor-pointer uppercase tracking-wider"
                  >
                    Close
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {selectedDetail.type === 'card' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit block bg-[#ECEFF0] text-[#1E2A2E]">
                          {CATEGORY_LABELS[selectedDetail.data.card_type] || selectedDetail.data.card_type}
                        </span>
                        <h2 className="text-lg font-bold text-[#1E2A2E] leading-snug">{selectedDetail.data.title}</h2>
                        <p className="text-xs text-[#4A6A64] font-medium leading-relaxed italic border-l-2 border-[#E0A898]/40 pl-3">
                          "{selectedDetail.data.subtitle}"
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Observation</span>
                        <p className="text-xs text-[#1E2A2E] leading-relaxed">{selectedDetail.data.body}</p>
                      </div>

                      {/* Cited Evidence */}
                      <div className="space-y-3 pt-4 border-t border-[#1E2A2E]/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Supporting Evidence</span>
                        
                        {selectedDetail.data.supporting_vocabulary?.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] text-[#4A6A64] uppercase block">Supporting Vocabulary</span>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedDetail.data.supporting_vocabulary.map((vocab, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-[#ECEFF0] rounded text-[10px] text-[#1E2A2E] font-medium border border-[#1E2A2E]/5">
                                  {vocab}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedDetail.data.supporting_entries?.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-[#4A6A64] uppercase block">Supporting Journal Entries</span>
                            <div className="space-y-1">
                              {selectedDetail.data.supporting_entries.map((id, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => window.navigateTo(`/entry/${id}`)}
                                  className="w-full text-left p-2.5 bg-[#ECEFF0]/50 hover:bg-[#ECEFF0] rounded-lg border border-[#1E2A2E]/5 text-xs text-[#1E2A2E] flex items-center justify-between cursor-pointer"
                                >
                                  <span className="truncate">Journal Entry {idx + 1} ({id.substring(0, 8)}...)</span>
                                  <ArrowUpRight size={14} className="text-[#4A6A64] shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedDetail.data.supporting_reports?.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-[#4A6A64] uppercase block">Supporting Reports</span>
                            <div className="space-y-1">
                              {selectedDetail.data.supporting_reports.map((id, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => window.navigateTo(`/reports`)}
                                  className="w-full text-left p-2.5 bg-[#ECEFF0]/50 hover:bg-[#ECEFF0] rounded-lg border border-[#1E2A2E]/5 text-xs text-[#1E2A2E] flex items-center justify-between cursor-pointer"
                                >
                                  <span className="truncate">Weekly Report {idx + 1} ({id.substring(0, 8)}...)</span>
                                  <ArrowUpRight size={14} className="text-[#4A6A64] shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDetail.type === 'word' && (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-[#1E2A2E]">{selectedDetail.data.name}</h2>
                        <span className="text-xs text-[#4A6A64] block">{selectedDetail.data.aka || 'vocabulary concept'}</span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">What this really is</span>
                        <p className="text-xs text-[#1E2A2E] leading-relaxed font-serif">{selectedDetail.data.plain || 'Emotional ground state.'}</p>
                      </div>

                      {selectedDetail.data.body?.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">In your body</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDetail.data.body.map((b, i) => (
                              <span key={i} className="px-2.5 py-1 bg-[#ECEFF0] border border-[#1E2A2E]/5 rounded-lg text-xs text-[#4A6A64]">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedDetail.data.situations?.length > 0 && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Real-life Situations</span>
                          <div className="space-y-2">
                            {selectedDetail.data.situations.map((sit, i) => (
                              <div key={i} className="p-3 bg-[#ECEFF0]/60 border border-[#1E2A2E]/5 rounded-xl space-y-1">
                                <h4 className="text-xs font-bold text-[#1E2A2E]">{sit.s}</h4>
                                <p className="text-xs text-[#4A6A64] leading-relaxed">{sit.f}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDetail.type === 'pattern' && (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-[#1E2A2E]">{selectedDetail.data.name}</h2>
                        <span className="text-xs text-[#4A6A64] block">Behavioral Pattern</span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Pattern Definition</span>
                        <p className="text-xs text-[#1E2A2E] leading-relaxed">
                          Holding yourself to rigid expectations or behavioral loops based on cycles of obligation or external stress.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Signs & Manifestations</span>
                        <p className="text-xs text-[#4A6A64] leading-relaxed italic">
                          - Treating a single result as a verdict on ability.<br/>
                          - Preparing far past the point of returns.<br/>
                          - Over-identifying with family obligations.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4] block">Linked Emotions</span>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 bg-[#ECEFF0] rounded-lg text-xs text-[#1E2A2E] font-medium border border-[#1E2A2E]/5">Anxiety</span>
                          <span className="px-2.5 py-1 bg-[#ECEFF0] rounded-lg text-xs text-[#1E2A2E] font-medium border border-[#1E2A2E]/5">Shame</span>
                          <span className="px-2.5 py-1 bg-[#ECEFF0] rounded-lg text-xs text-[#1E2A2E] font-medium border border-[#1E2A2E]/5">Guilt</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
