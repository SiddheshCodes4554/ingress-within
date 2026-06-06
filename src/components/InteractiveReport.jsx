import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, BarChart3, Lightbulb, CheckCircle2, Flame, Award, TrendingUp } from 'lucide-react';

const CALENDAR_DAYS = [
  { day: 1, logged: true, type: 'sage' },
  { day: 2, logged: true, type: 'sage' },
  { day: 3, logged: false, type: 'none' },
  { day: 4, logged: true, type: 'lavender' },
  { day: 5, logged: true, type: 'sage' },
  { day: 6, logged: true, type: 'terracotta' },
  { day: 7, logged: true, type: 'sage' },
  { day: 8, logged: true, type: 'sage' },
  { day: 9, logged: true, type: 'sage' },
  { day: 10, logged: false, type: 'none' },
  { day: 11, logged: true, type: 'lavender' },
  { day: 12, logged: true, type: 'sage' },
  { day: 13, logged: true, type: 'sage' },
  { day: 14, logged: true, type: 'terracotta' },
  { day: 15, logged: true, type: 'sage' },
  { day: 16, logged: true, type: 'sage' },
  { day: 17, logged: true, type: 'sage' },
  { day: 18, logged: true, type: 'lavender' },
  { day: 19, logged: true, type: 'sage' },
  { day: 20, logged: false, type: 'none' },
  { day: 21, logged: true, type: 'sage' },
  { day: 22, logged: true, type: 'sage' },
  { day: 23, logged: true, type: 'terracotta' },
  { day: 24, logged: true, type: 'sage' },
  { day: 25, logged: true, type: 'lavender' },
  { day: 26, logged: true, type: 'sage' },
  { day: 27, logged: true, type: 'sage' },
  { day: 28, logged: true, type: 'sage' },
  { day: 29, logged: true, type: 'sage' },
  { day: 30, logged: true, type: 'sage' },
];

const EMOTION_DATA = [
  { name: 'Reflective', pct: 45, color: '#8DBFB4', desc: 'State of mindful introspection and quiet observation.' },
  { name: 'Anxious', pct: 22, color: '#B8A8D4', desc: 'Heightened stress indicators, mostly linked to mid-week meetings.' },
  { name: 'Clarity', pct: 20, color: '#1E2A2E', desc: 'Periods of high agency, focus, and structured task resolution.' },
  { name: 'Gratitude', pct: 13, color: '#E0A898', desc: 'Expressions of appreciation, noted mostly during weekend logs.' },
];

const INSIGHTS = [
  { id: 1, title: 'Reflective Peak', detail: 'Morning journals correlate with a 35% higher Clarity Index than late-night entries. We suggest reflecting before checking devices.', tag: 'Routine Shift' },
  { id: 2, title: 'Stress Neutralizer', detail: 'Completing a Value Alignment exercise on Sunday evenings reduces your Monday morning Stress Indicators by 20%.', tag: 'Stress Pattern' },
  { id: 3, title: 'Anxiety Anchor', detail: 'Your primary anxiety triggers correlate with terms like "unclear expectations". Writing Narrative Reframing logs during these times accelerates mental recovery.', tag: 'Cognitive Pattern' }
];

export default function InteractiveReport() {
  const [activeTab, setActiveTab] = useState('consistency');

  return (
    <div className="w-full bg-white rounded-premium p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.04)] border border-primary/5 min-h-[500px] flex flex-col justify-between">
      {/* Dashboard Top bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-primary/5 pb-6 mb-6 gap-4">
        <div>
          <span className="text-[10px] font-label-sm text-primary/45 font-bold uppercase tracking-widest block mb-1">MONTHLY REFLECTION REPORT</span>
          <h3 className="font-display text-2xl font-medium text-primary">October Synthesis.</h3>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-1 bg-primary/5 p-1 rounded-xl w-full sm:w-auto border border-primary/5">
          <button
            onClick={() => setActiveTab('consistency')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-label-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'consistency' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            <Calendar size={12} />
            <span>Consistency</span>
          </button>
          <button
            onClick={() => setActiveTab('emotions')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-label-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'emotions' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            <BarChart3 size={12} />
            <span>Patterns</span>
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-label-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'insights' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            <Lightbulb size={12} />
            <span>Insights</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col justify-center min-h-[280px]">
        <AnimatePresence mode="wait">
          {activeTab === 'consistency' && (
            <motion.div
              key="consistency"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* Grid block */}
              <div className="md:col-span-7 space-y-4">
                <span className="text-xs font-label-md text-primary/70 block font-semibold">Reflection Calendar</span>
                <div className="grid grid-cols-7 gap-2 max-w-[340px]">
                  {CALENDAR_DAYS.map((dayObj) => {
                    let bgClass = 'bg-primary/5 hover:bg-primary/10';
                    if (dayObj.logged) {
                      if (dayObj.type === 'sage') bgClass = 'bg-secondary';
                      if (dayObj.type === 'lavender') bgClass = 'bg-supporting';
                      if (dayObj.type === 'terracotta') bgClass = 'bg-accent';
                    }
                    return (
                      <div
                        key={dayObj.day}
                        className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-label-sm font-bold transition-all relative group cursor-pointer ${bgClass} ${
                          dayObj.logged ? 'text-primary' : 'text-primary/30'
                        }`}
                      >
                        {dayObj.day}
                        {dayObj.logged && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats block */}
              <div className="md:col-span-5 flex flex-col justify-center gap-4">
                <div className="p-4 bg-primary/5 rounded-2xl flex items-center gap-4 border border-primary/5">
                  <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center text-secondary">
                    <Flame size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-label-sm text-primary/45 uppercase tracking-widest block font-bold">Reflection Streak</span>
                    <span className="font-display text-xl font-bold text-primary">12 Days Active</span>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl flex items-center gap-4 border border-primary/5">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary">
                    <Award size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-label-sm text-primary/45 uppercase tracking-widest block font-bold">Consistency Score</span>
                    <span className="font-display text-xl font-bold text-primary">86% (Highly Active)</span>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl flex items-center gap-4 border border-primary/5">
                  <div className="w-10 h-10 bg-[#b9ede1]/30 rounded-xl flex items-center justify-center text-secondary">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-label-sm text-primary/45 uppercase tracking-widest block font-bold">Self-Awareness Lift</span>
                    <span className="font-display text-xl font-bold text-primary">+28% Cognitive Balance</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'emotions' && (
            <motion.div
              key="emotions"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* Bar charts */}
              <div className="md:col-span-6 space-y-4">
                <span className="text-xs font-label-md text-primary/70 block font-semibold">Emotion Distribution</span>
                <div className="space-y-4 pr-0 md:pr-4">
                  {EMOTION_DATA.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-label-md text-primary">
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-primary/60">{item.pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-primary/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanations */}
              <div className="md:col-span-6 flex flex-col justify-center gap-3">
                {EMOTION_DATA.map((item) => (
                  <div key={item.name} className="flex gap-3 items-start p-2.5 rounded-xl hover:bg-primary/5 transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <h4 className="text-xs font-label-md font-bold text-primary">{item.name}</h4>
                      <p className="text-[11px] font-body-md text-primary/60 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <span className="text-xs font-label-md text-primary/70 block font-semibold">Linguistic & Behavioral Insights</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {INSIGHTS.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-[#FBFBFB] border border-primary/5 flex flex-col justify-between hover:border-secondary transition-all">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-label-sm px-2 py-0.5 bg-primary/5 text-primary/60 rounded-full font-bold uppercase tracking-wider">{item.tag}</span>
                      </div>
                      <h4 className="font-display font-semibold text-sm text-primary mb-1">{item.title}</h4>
                      <p className="font-body-md text-xs text-primary/60 leading-relaxed mt-2">{item.detail}</p>
                    </div>
                    <div className="border-t border-primary/5 pt-3 mt-4 text-[10px] font-label-md text-secondary font-bold hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5">
                      <span>Explore this pattern</span>
                      <TrendingUp size={10} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conversion CTA inside Report Explorer */}
      <div className="border-t border-primary/5 pt-6 mt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-secondary" />
          <span className="text-xs font-body-md text-primary/75">Sample data generated based on standard cognitive assessments.</span>
        </div>
        <button className="bg-primary hover:bg-primary/95 text-on-primary font-label-md text-xs tracking-wider uppercase font-semibold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
          <span>View Sample Full Report</span>
        </button>
      </div>
    </div>
  );
}
