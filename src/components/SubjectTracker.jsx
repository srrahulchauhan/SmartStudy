import React from 'react';
import { BookMarked } from 'lucide-react';

export default function SubjectTracker({ tasks = [], historyTasks = [] }) {

  const allTasks = [...historyTasks, ...tasks].filter(t => t.status === 'completed');

  const subjectDataMap = {};
  let maxDuration = 0;

  allTasks.forEach(task => {
    const sub = task.subject ? task.subject.toLowerCase() : 'unknown';
    if (!subjectDataMap[sub]) {
      subjectDataMap[sub] = { subject: task.subject, duration: 0, count: 0 };
    }
    subjectDataMap[sub].duration += (task.duration || 0);
    subjectDataMap[sub].count += 1;
    if (subjectDataMap[sub].duration > maxDuration) maxDuration = subjectDataMap[sub].duration;
  });

  const sortedSubjects = Object.values(subjectDataMap).sort((a, b) => b.duration - a.duration);

  const colors = [
    { bar: 'linear-gradient(90deg, #2563EB, #6366F1)', glow: 'rgba(37,99,235,0.3)' },
    { bar: 'linear-gradient(90deg, #7C3AED, #9333EA)', glow: 'rgba(124,58,237,0.3)' },
    { bar: 'linear-gradient(90deg, #22C55E, #16A34A)', glow: 'rgba(34,197,94,0.3)' },
    { bar: 'linear-gradient(90deg, #F59E0B, #D97706)', glow: 'rgba(245,158,11,0.3)' },
    { bar: 'linear-gradient(90deg, #EF4444, #DC2626)', glow: 'rgba(239,68,68,0.3)' },
    { bar: 'linear-gradient(90deg, #06B6D4, #0284C7)', glow: 'rgba(6,182,212,0.3)' },
  ];

  return (
    <div className="rounded-3xl h-full flex flex-col overflow-hidden"
      style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>

      <div className="p-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(124,58,237,0.06)' }}>
        <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: '#F8FAFC' }}>
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(124,58,237,0.15)' }}>
            <BookMarked className="w-5 h-5" style={{ color: '#A78BFA' }} />
          </div>
          Subject Analytics
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {sortedSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="text-4xl mb-4">📊</div>
            <p className="font-bold" style={{ color: '#475569' }}>No data yet</p>
            <p className="text-sm mt-1" style={{ color: '#334155' }}>Complete tasks to see your analytics</p>
          </div>
        ) : (
          sortedSubjects.map((item, idx) => {
            const c = colors[idx % colors.length];
            const percent = maxDuration > 0 ? (item.duration / maxDuration) * 100 : 0;
            return (
              <div key={idx}>
                <div className="flex justify-between items-end mb-2">
                  <h3 className="font-bold text-sm capitalize" style={{ color: '#E2E8F0' }}>{item.subject}</h3>
                  <span className="font-black tabular-nums text-sm" style={{ color: '#F8FAFC' }}>
                    {item.duration.toFixed(1)}<span className="text-xs font-semibold ml-1" style={{ color: '#64748B' }}>hrs</span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.max(percent, 2)}%`,
                      background: c.bar,
                      boxShadow: `0 0 12px ${c.glow}`,
                    }}
                  />
                </div>
                <div className="text-xs font-semibold mt-1.5 text-right" style={{ color: '#475569' }}>
                  {item.count} session{item.count !== 1 ? 's' : ''} completed
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
