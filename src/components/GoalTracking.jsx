import React, { useState, useEffect } from 'react';
import { Trophy, Target, Award, Star, ChevronRight, CheckCircle2, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoalTracking({ lifetimeHours = 0, targetHours = 100, onSetTarget, goalStats = {} }) {
  const [showCongrats, setShowCongrats] = useState(false);
  const [lastCheck, setLastCheck] = useState(lifetimeHours);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(targetHours.toString());

  const progress = Math.min((lifetimeHours / targetHours) * 100, 100);
  
  const getLevel = (hours) => {
    if (hours >= 300) return { name: 'Gold', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '🏆' };
    if (hours >= 200) return { name: 'Silver', color: 'text-slate-300', bg: 'bg-slate-300/10', border: 'border-slate-300/20', icon: '🥈' };
    if (hours >= 100) return { name: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '🥉' };
    return { name: 'Novice', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: '✨' };
  };

  const level = getLevel(lifetimeHours);
  const goalEntries = Object.entries(goalStats || {}).sort((a, b) => (b[1].hours || 0) - (a[1].hours || 0));

  useEffect(() => {
    if (lifetimeHours >= targetHours && lastCheck < targetHours) {
      setShowCongrats(true);
    }
    setLastCheck(lifetimeHours);
  }, [lifetimeHours, targetHours, lastCheck]);

  const targets = [100, 200, 300];

  return (
    <div className="relative p-8 rounded-[2.5rem] border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col gap-6 h-full">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Trophy className="w-48 h-48 text-white rotate-12" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <Target className="w-6 h-6 text-indigo-400" />
              Strategic Goals
            </h3>
            <p className="text-slate-400 text-sm font-medium">Define your target, master your craft.</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl ${level.bg} ${level.border} border flex items-center gap-2`}>
            <span className="text-xl">{level.icon}</span>
            <span className={`text-xs font-black uppercase tracking-widest ${level.color}`}>{level.name} Tier</span>
          </div>
        </div>

        {/* Target Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {targets.map(t => (
            <button
              key={t}
              onClick={() => { onSetTarget(t); setEditValue(t.toString()); setIsEditing(false); }}
              className={`py-3 rounded-2xl font-black text-sm transition-all border ${
                targetHours === t && !isEditing
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              {t}h
            </button>
          ))}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`py-3 rounded-2xl font-black text-sm transition-all border ${
              isEditing || !targets.includes(targetHours)
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' 
              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8 p-4 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Custom Target (Hours)</label>
              <input 
                type="number" 
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xl font-black text-white"
                placeholder="0"
                autoFocus
              />
            </div>
            <button 
              onClick={() => {
                const val = parseInt(editValue);
                if (!isNaN(val) && val > 0) {
                  onSetTarget(val);
                  setIsEditing(false);
                }
              }}
              className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20"
            >
              Set Goal
            </button>
          </motion.div>
        )}

        {/* Progress Display */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">{lifetimeHours.toFixed(1)}h</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Completed</span>
            </div>
            <div className="sm:text-right">
              <span className="text-lg font-black text-indigo-400">{progress.toFixed(0)}%</span>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target: {targetHours}h</div>
            </div>
          </div>

          <div className="h-4 w-full bg-white/5 rounded-full p-1 overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            />
          </div>
        </div>

        {/* Goal-wise Breakdown */}
        {goalEntries.length > 0 && (
          <div className="mt-8 space-y-3">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Goal breakdown (Completed)</h4>
            <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
              {goalEntries.map(([name, data]) => (
                <div key={name} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3 group hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <Target className="w-4 h-4 text-indigo-400" />
                      </div>
                      <span className="text-sm font-bold text-white truncate max-w-[180px]">{name}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-sm font-black text-indigo-400">{(data.hours || 0).toFixed(1)}h</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 pl-12">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Total Tasks</span>
                      <span className="text-xs font-bold text-slate-300">{data.tasks || 0}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Engagement</span>
                      <span className="text-xs font-bold text-slate-300">{data.daysCount || 0} Days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rewards Preview */}
        <div className="mt-8 pt-8 border-t border-white/5">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Milestone Rewards</h4>
          <div className="grid grid-cols-3 gap-4">
            {[100, 200, 300].map(h => {
              const milestoneLevel = getLevel(h);
              const isLocked = lifetimeHours < h;
              return (
                <div key={h} className={`p-4 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                  isLocked ? 'bg-white/5 border-white/5 opacity-50' : `${milestoneLevel.bg} ${milestoneLevel.border} scale-105 shadow-xl`
                }`}>
                  <span className={`text-2xl ${isLocked ? 'grayscale opacity-50' : ''}`}>
                    {h === 100 ? '🥉' : h === 200 ? '🥈' : '🏆'}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${isLocked ? 'text-slate-500' : milestoneLevel.color}`}>
                    {h} Hours
                  </span>
                  {!isLocked && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Congrats Overlay */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowCongrats(false)} />
            <div className="relative w-full max-w-md p-10 rounded-[3rem] bg-slate-900 border border-indigo-500/30 text-center shadow-[0_0_100px_rgba(99,102,241,0.4)] overflow-hidden">
               {/* Animated Confetti Effect */}
               <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="absolute top-0 left-1/4 w-1 h-2 bg-yellow-400 rounded-full animate-bounce" />
                  <div className="absolute top-1/2 left-3/4 w-1 h-2 bg-blue-400 rounded-full animate-bounce delay-700" />
                  <div className="absolute bottom-1/4 left-1/2 w-1 h-2 bg-pink-400 rounded-full animate-bounce delay-500" />
               </div>

               <div className="relative z-10">
                  <div className="w-24 h-24 bg-indigo-600/20 border border-indigo-500/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <PartyPopper className="w-12 h-12 text-indigo-400" />
                  </div>
                  <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Phenomenal!</h2>
                  <p className="text-slate-400 mb-8 font-medium leading-relaxed">
                    Congratulations! You completed your <span className="text-indigo-400 font-black">{targetHours}-hour</span> goal. Your dedication is inspiring.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setShowCongrats(false)}
                      className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Collect Reward
                    </button>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Mastery is within reach</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
