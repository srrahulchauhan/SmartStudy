import React from 'react';
import { Target, CheckCircle2, Clock, Activity } from 'lucide-react';
import { subDays, isAfter } from 'date-fns';

export default function StatsCards({ tasks = [], historyTasks = [], timeframe = 'daily' }) {

  let relevantTasks = [];
  const now = new Date();

  if (timeframe === 'daily') {
    relevantTasks = [...tasks];
  } else {
    const daysToSubtract = timeframe === 'weekly' ? 7 : timeframe === 'monthly' ? 30 : timeframe === 'yearly' ? 365 : 99999;
    const cutoffDate = subDays(now, daysToSubtract);
    const filteredHistory = historyTasks.filter(t => t.historyDate && isAfter(new Date(t.historyDate), cutoffDate));
    relevantTasks = [...filteredHistory, ...tasks];
  }

  const totalHoursPlanned = relevantTasks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const completedTasksList = relevantTasks.filter(t => t.status === 'completed');
  const totalHoursCompleted = completedTasksList.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalTasks = relevantTasks.length;
  const completedTasks = completedTasksList.length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const runningTask = tasks.find(t => t.status === 'running');
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const cardBase = {
    background: '#1E293B',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: '0.75rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'transform 0.2s',
    cursor: 'default'
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Study Hours */}
      <div style={cardBase}>
        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Clock className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="text-lg font-black tabular-nums text-white leading-none">
            {totalHoursCompleted.toFixed(1)}<span className="text-[10px] text-slate-500 ml-1">/{totalHoursPlanned.toFixed(1)}h</span>
          </div>
          <div className="text-[9px] uppercase font-black tracking-tighter text-slate-500 mt-1">Study Hours</div>
        </div>
      </div>

      {/* Completion */}
      <div style={cardBase}>
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Target className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-end mb-1">
             <div className="text-lg font-black tabular-nums text-white leading-none">{completionRate}%</div>
             <div className="text-[9px] uppercase font-black tracking-tighter text-slate-500">Progress</div>
          </div>
          <div className="w-full rounded-full h-1 overflow-hidden bg-white/5">
            <div className="h-full bg-emerald-500" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* Tasks Done */}
      <div style={cardBase}>
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <div className="text-lg font-black tabular-nums text-white leading-none">{completedTasks}</div>
          <div className="text-[9px] uppercase font-black tracking-tighter text-slate-500 mt-1">Tasks Done</div>
        </div>
      </div>

      {/* Status */}
      <div style={cardBase}>
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Activity className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex gap-4">
          <div>
            <div className="text-lg font-black tabular-nums text-white leading-none">{pendingTasks}</div>
            <div className="text-[9px] uppercase font-black tracking-tighter text-slate-500 mt-1">Pending</div>
          </div>
          <div className="w-px h-6 bg-white/10 self-center"></div>
          <div>
            <div className="text-lg font-black tabular-nums text-white leading-none flex items-center gap-1">
               {runningTask ? '1' : '0'}
               {runningTask && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
            </div>
            <div className="text-[9px] uppercase font-black tracking-tighter text-slate-500 mt-1">Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
