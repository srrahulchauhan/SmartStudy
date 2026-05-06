import React, { useState } from 'react';
import { Play, Square, BellOff, Zap, Pause, ListTodo, ChevronRight, Clock, BookOpen, CheckCircle2, Pencil, X, Save } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import { formatDisplayTime, formatDisplayDate } from '../utils/timeUtils';

export default function TimerDisplay({ activeTask, pendingTasks = [], onComplete, onStartTask, onStopTimer, onCompleteAll, onPauseTask, onResumeTask, onModifyTask }) {
  const { remainingTime, formatTime, isRunning, stopAlert } = useTimer(activeTask, onComplete);
  const [showPending, setShowPending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editGoal, setEditGoal] = useState('');

  const openEdit = () => {
    setEditSubject(activeTask.subject || '');
    setEditTopic(activeTask.topic || '');
    setEditGoal(activeTask.goal || '');
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!editSubject.trim()) return;
    if (onModifyTask) {
      onModifyTask(activeTask.id, {
        subject: editSubject.trim(),
        topic: editTopic.trim(),
        goal: editGoal.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleQuickStart = (task) => {
    const now = new Date();
    onStartTask(task.id, undefined, 0, now);
  };

  if (!activeTask) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl text-center"
        style={{
          background: 'rgba(30,41,59,0.6)',
          border: '1px dashed rgba(255,255,255,0.1)',
          minHeight: 140
        }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <Play className="w-7 h-7" style={{ color: '#4B5563' }} />
        </div>
        <h3 className="text-base font-bold mb-1" style={{ color: '#475569' }}>No Active Task</h3>
        <p className="text-sm" style={{ color: '#334155' }}>Start a task from your timetable below</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="p-5 md:p-6 rounded-[2.5rem] transition-all duration-500 overflow-hidden"
        style={{
          background: isRunning ? 'rgba(34,197,94,0.06)' : '#1E293B',
          border: `1px solid ${isRunning ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isRunning ? '0 0 40px rgba(34,197,94,0.08)' : '0 10px 30px rgba(0,0,0,0.2)'
        }}>
        <div className="flex flex-col xl:flex-row justify-between items-center gap-6 xl:gap-4">

          <div className="flex-1 text-center xl:text-left w-full max-w-sm mx-auto xl:mx-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold mb-3 uppercase tracking-widest"
              style={{
                background: isRunning ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.12)',
                color: isRunning ? '#22C55E' : '#818CF8',
                border: `1px solid ${isRunning ? 'rgba(34,197,94,0.25)' : 'rgba(99,102,241,0.2)'}`
              }}>
              {isRunning && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22C55E' }}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#22C55E' }}></span>
                </span>
              )}
              <Zap className="w-3 h-3" />
              {activeTask.isPaused ? 'Session Paused' : (isRunning ? 'Session Active' : 'Timer Stopped')}
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-3xl font-black capitalize line-clamp-1" style={{ color: '#F8FAFC' }}>{activeTask.subject}</h2>
              <button
                onClick={openEdit}
                className="p-2 rounded-xl transition-all hover:scale-110 shrink-0"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
                title="Modify Task"
              >
                <Pencil className="w-4 h-4" style={{ color: '#A78BFA' }} />
              </button>
            </div>
            {activeTask.topic && (
              <p className="text-xs md:text-base mt-2 font-semibold" style={{ color: '#94A3B8' }}>{activeTask.topic}</p>
            )}
            {activeTask.goal && (
              <p className="text-[10px] md:text-xs mt-2 font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/10 w-fit inline-block" style={{ color: '#818CF8' }}>
                Goal: {activeTask.goal}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-4 justify-center xl:justify-start">
              <span className="px-3 py-1 rounded-lg bg-white/5 text-[10px] md:text-xs font-black text-slate-400 border border-white/5">
                {formatDisplayTime(activeTask.plannedStart)} – {formatDisplayTime(activeTask.plannedEnd)}
              </span>
              <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-[10px] md:text-xs font-black text-indigo-400 border border-indigo-500/10">
                {activeTask.duration?.toFixed(2)} HOURS TOTAL
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center shrink-0 my-4 xl:my-0">
            <div className="text-6xl md:text-7xl 2xl:text-8xl font-black tabular-nums tracking-tighter"
              style={{ color: isRunning ? '#22C55E' : '#E2E8F0', textShadow: isRunning ? '0 0 50px rgba(34,197,94,0.3)' : 'none' }}>
              {formatTime(remainingTime)}
            </div>
            <div className="text-[10px] md:text-xs font-black mt-2 tracking-[0.3em] uppercase text-slate-500">REMAINING FOCUS TIME</div>
          </div>

          <div className="flex-1 flex flex-row justify-center xl:justify-end gap-3 w-full max-w-sm mx-auto xl:mx-0">
            <button
              onClick={stopAlert}
              className="p-3 md:p-4 rounded-2xl transition-all hover:scale-110 shrink-0 bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center"
              title="Stop Alarm">
              <BellOff className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div className="flex gap-2 flex-1 w-full">
              {activeTask.isPaused ? (
                <button
                  onClick={() => onResumeTask(activeTask.id)}
                  className="group flex-1 flex items-center justify-center gap-2 px-4 py-3 md:py-4 rounded-2xl font-black text-white text-xs md:text-sm transition-all hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #2563EB, #4F46E5)', 
                    boxShadow: '0 8px 30px rgba(79,70,229,0.4)' 
                  }}>
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-current group-hover:scale-110" />
                  RESUME
                </button>
              ) : (
                <button
                  onClick={() => onPauseTask(activeTask.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 md:py-4 rounded-2xl font-black text-white text-xs md:text-sm transition-all hover:scale-105 bg-white/10 border border-white/10 hover:bg-white/15"
                  style={{ color: '#E2E8F0' }}>
                  <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                  PAUSE
                </button>
              )}

              <button
                onClick={() => { stopAlert(); onStopTimer(activeTask.id); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 md:py-4 rounded-2xl font-black text-white text-xs md:text-sm transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)', boxShadow: '0 8px 30px rgba(239,68,68,0.4)' }}>
                <Square className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                FINISH
              </button>
            </div>
          </div>
        </div>

        {/* Inline Edit Panel */}
        {isEditing && (
          <div className="mt-4 p-5 rounded-2xl border transition-all animate-in slide-in-from-top-4 duration-300"
            style={{ background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 8px 30px rgba(124,58,237,0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black uppercase tracking-widest" style={{ color: '#A78BFA' }}>Modify Task</h4>
              <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Subject *</label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-purple-500/40"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0' }}
                  placeholder="Subject name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Topic</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-purple-500/40"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0' }}
                    placeholder="Topic"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Goal</label>
                  <input
                    type="text"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-purple-500/40"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0' }}
                    placeholder="Goal"
                  />
                </div>
              </div>
              <button
                onClick={saveEdit}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm transition-all hover:scale-[1.02] mt-1"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Tasks Quick View */}
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] overflow-hidden transition-all duration-300">
        <button 
          onClick={() => setShowPending(!showPending)}
          className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <ListTodo className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-left">
              <h3 className="font-black text-white tracking-tight">Pending Tasks</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{pendingTasks.length} tasks remaining for today</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingTasks.length > 0 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleQuickStart(pendingTasks[0]); }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Start Next
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onCompleteAll(); }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Complete All
                </button>
              </>
            )}
            <div className={`p-2 rounded-full bg-white/5 transition-transform duration-300 ${showPending ? 'rotate-90' : ''}`}>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </button>

        {showPending && (
          <div className="p-6 pt-0 animate-in slide-in-from-top-4 duration-300">
            {pendingTasks.length === 0 ? (
                <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="text-sm font-bold text-slate-500">No more pending tasks! Great job.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pendingTasks.slice(0, 6).map((task) => (
                        <div 
                          key={task.id} 
                          onClick={() => handleQuickStart(task)}
                          className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 group hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden"
                        >
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="p-2.5 rounded-xl bg-slate-800 border border-white/5 group-hover:border-indigo-500/30 transition-colors relative z-10">
                                <BookOpen className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0 relative z-10">
                                <h4 className="font-bold text-sm text-white truncate group-hover:text-indigo-300 transition-colors">{task.subject}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span className="text-[10px] font-black text-slate-500">{formatDisplayDate(task.taskDate) === formatDisplayDate(new Date()) ? formatDisplayTime(task.plannedStart) : task.plannedStart}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 relative z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleQuickStart(task); }}
                                    className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all transform hover:scale-110"
                                    title="Start Now"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onStopTimer(task.id); }}
                                    className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-110"
                                    title="Mark Complete"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {pendingTasks.length > 6 && (
                        <div className="p-4 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-xs font-bold text-slate-500">
                            + {pendingTasks.length - 6} more tasks
                        </div>
                    )}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
