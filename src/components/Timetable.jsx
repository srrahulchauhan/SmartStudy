import React, { useState } from 'react';
import { Play, CheckCircle2, Clock, XCircle, AlertCircle, PlusCircle, Trash2, Repeat, Activity, ListChecks, Target, RefreshCw } from 'lucide-react';

import { calculateDelayMinutes, formatTime, calculateEndTime, formatDisplayTime, formatFullDateTime } from '../utils/timeUtils';

export default function Timetable({ tasks, onStartTask, onStopTask, onMarkMissed, onCompleteAll, activeTaskId, onLoadRoutine, onEditTask, onAddTask, onDeleteTask, onClearAll, onRestoreTask }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'completed'

  const getStatusConfig = (status) => {
    switch (status) {
      case 'running':
        return {
          bg: 'rgba(34,197,94,0.08)',
          border: 'rgba(34,197,94,0.25)',
          textColor: '#22C55E',
          icon: <Play className="w-5 h-5" style={{ color: '#22C55E' }} />
        };
      case 'completed':
        return {
          bg: 'rgba(34,197,94,0.06)',
          border: 'rgba(34,197,94,0.15)',
          textColor: '#22C55E',
          icon: <CheckCircle2 className="w-5 h-5" style={{ color: '#22C55E' }} />
        };
      case 'pending':
        return {
          bg: 'rgba(245,158,11,0.06)',
          border: 'rgba(245,158,11,0.2)',
          textColor: '#F59E0B',
          icon: <Clock className="w-5 h-5" style={{ color: '#F59E0B' }} />
        };
      case 'missed':
      case 'skipped':
        return {
          bg: 'rgba(239,68,68,0.06)',
          border: 'rgba(239,68,68,0.2)',
          textColor: '#EF4444',
          icon: <XCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
        };
      default:
        return {
          bg: 'rgba(148,163,184,0.06)',
          border: 'rgba(148,163,184,0.15)',
          textColor: '#94A3B8',
          icon: <Clock className="w-5 h-5" style={{ color: '#94A3B8' }} />
        };
    }
  };

  const handleStart = (task, index) => {
    const now = new Date();
    const delayMinutes = calculateDelayMinutes(task.plannedStart, now);
    onStartTask(task.id, index, delayMinutes, now);
  };

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return t.status === 'pending' || t.status === 'running';
    if (activeTab === 'completed') return t.status === 'completed';
    return true;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center h-full rounded-3xl"
        style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div className="w-20 h-20 flex items-center justify-center rounded-full mb-6"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <AlertCircle className="w-9 h-9" style={{ color: '#6366F1' }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#E2E8F0' }}>No tasks for today</h3>
        <p className="text-sm mb-6" style={{ color: '#64748B' }}>Add subjects to build your timetable.</p>
        <button
          onClick={onLoadRoutine}
          className="px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.25)' }}>
          ⚡ Load 6-Hour Deep Focus Challenge
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl h-full flex flex-col overflow-hidden"
      style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>

      <div className="p-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(99,102,241,0.06)' }}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: '#F8FAFC' }}>
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <ListChecks className="w-5 h-5" style={{ color: '#818CF8' }} />
              </div>
              Tasks Management
              <button 
                onClick={onAddTask}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                title="Add New Task"
              >
                <PlusCircle className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
              </button>
              <button 
                onClick={onCompleteAll}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors group"
                title="Mark All as Completed"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:text-white transition-colors" />
              </button>
              <button 
                onClick={onClearAll}
                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors group"
                title="Clear All Tasks"
              >
                <Trash2 className="w-5 h-5 text-red-400/50 group-hover:text-red-400 transition-colors" />
              </button>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
              {tasks.length} Total
            </span>
          </div>

          <div className="flex p-1 rounded-2xl bg-black/20 gap-1 border border-white/5">
            {[
              { id: 'all', label: 'All', icon: <ListChecks className="w-3.5 h-3.5" /> },
              { id: 'pending', label: 'Pending', icon: <Clock className="w-3.5 h-3.5" /> },
              { id: 'completed', label: 'Done', icon: <CheckCircle2 className="w-3.5 h-3.5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                style={{ 
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeTab === tab.id ? '#FFF' : '#64748B',
                  border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent'
                }}
              >
                {tab.icon}
                {tab.label}
                <span className="opacity-40">{counts[tab.id]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center opacity-50 flex flex-col items-center gap-4">
             <div className="p-6 rounded-full bg-white/5 border border-white/5">
                <ListChecks className="w-12 h-12 text-slate-500" />
             </div>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No {activeTab} tasks found</p>
          </div>
        ) : filteredTasks.map((task, index) => {
          const cfg = getStatusConfig(task.status);
          const isTaskActive = activeTaskId === task.id;
          const isAnyTaskActive = !!activeTaskId;          return (
            <div
              key={task.id}
              onClick={() => task.status === 'pending' && !isAnyTaskActive && handleStart(task, index)}
              className={`group relative flex flex-col gap-4 p-5 rounded-[1.75rem] transition-all duration-300 ${task.status === 'pending' ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
              style={{
                background: isTaskActive ? 'rgba(34,197,94,0.08)' : cfg.bg,
                border: `1px solid ${isTaskActive ? 'rgba(34,197,94,0.3)' : cfg.border}`,
                boxShadow: isTaskActive ? '0 10px 40px rgba(34,197,94,0.1)' : 'none',
              }}
            >
              {/* Header: Title & Quick Actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5 transition-colors group-hover:border-white/10">
                    {cfg.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-lg md:text-xl capitalize tracking-tight" style={{
                      color: task.status === 'completed' ? '#22C55E' : '#E2E8F0',
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      opacity: task.status === 'completed' ? 0.7 : 1
                    }}>
                      {task.subject}
                    </h3>
                    {task.topic && (
                      <p className="text-xs font-semibold mt-1 opacity-60 flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
                         <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                         {task.topic}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditTask(task.id); }}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all"
                    title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                    title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Details: Time, Duration, Status */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-black text-slate-300 tabular-nums whitespace-nowrap">
                    {formatDisplayTime(task.plannedStart)} – {formatDisplayTime(task.plannedEnd)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-black text-slate-300">
                    {task.duration ? task.duration.toFixed(2) : 0}h
                  </span>
                </div>

                {task.isDaily && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <Repeat className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Daily</span>
                  </div>
                )}

                 {task.status === 'completed' && task.actualEnd && (
                   <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                          Done: {formatFullDateTime(task.actualEnd)}
                        </span>
                     </div>
                     {task.goal && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 w-fit">
                           <Target className="w-3.5 h-3.5 text-indigo-400" />
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                             Goal: {task.goal}
                           </span>
                        </div>
                     )}
                   </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center gap-3 pt-2">
                {task.status === 'pending' && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStart(task, index); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] shadow-xl shadow-indigo-600/20"
                      style={{ background: isAnyTaskActive ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                      <Play className="w-4 h-4 fill-current" />
                      {isAnyTaskActive ? 'SWITCH TO THIS' : 'START SESSION'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onStopTask(task.id); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all hover:bg-emerald-500/10 border border-emerald-500/20"
                      style={{ color: '#10B981' }}>
                      <CheckCircle2 className="w-4 h-4" />
                      DONE
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMarkMissed(task.id); }}
                      className="px-6 py-3 rounded-2xl font-black text-sm transition-all hover:bg-red-500/10 border border-white/5"
                      style={{ color: '#EF4444' }}>
                      SKIP
                    </button>
                  </>
                )}

                {task.status === 'running' && (
                  <div className="flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl font-black text-sm"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22C55E' }}></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#22C55E' }}></span>
                    </span>
                    IN PROGRESS
                  </div>
                )}

                {task.status === 'completed' && (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm"
                    style={{ background: 'rgba(34,197,94,0.06)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <CheckCircle2 className="w-4 h-4" /> SUCCESSFUL
                  </div>
                )}

                {(task.status === 'missed' || task.status === 'skipped') && (
                  <>
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm"
                      style={{ background: 'rgba(239,68,68,0.06)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <XCircle className="w-4 h-4" /> TASK MISSED
                    </div>
                    {onRestoreTask && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRestoreTask(task); }}
                        className="px-6 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all hover:bg-indigo-500/20"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.2)' }}
                      >
                        <RefreshCw className="w-4 h-4" /> RETRY
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
