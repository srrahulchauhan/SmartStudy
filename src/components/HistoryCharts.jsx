import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';
import { subDays, subMonths, format, isAfter, startOfDay, isSameDay } from 'date-fns';

export default function HistoryCharts({ historyTasks = [], tasks = [], timeframe = 'daily' }) {
  
  const data = useMemo(() => {
     const now = new Date();
     const startOfToday = startOfDay(now);
     
     // Combine tasks
     const allTracked = [
        ...historyTasks.filter(t => t.status === 'completed'),
        ...tasks.filter(t => t.status === 'completed')
     ];

     if (timeframe === 'yearly' || timeframe === 'all') {
         // Aggregate by month for the last 12 months
         const monthsData = [];
         for (let i = 11; i >= 0; i--) {
            const mDate = subMonths(now, i);
            monthsData.push({ 
               name: format(mDate, 'MMM'), 
               monthIndex: mDate.getMonth(),
               year: mDate.getFullYear(),
               hours: 0 
            });
         }
         
         allTracked.forEach(t => {
            const d = new Date(t.historyDate || t.actualEndTarget || t.plannedEnd || startOfToday); // fallback approximation
            const block = monthsData.find(m => m.monthIndex === d.getMonth() && m.year === d.getFullYear());
            if (block) block.hours += (t.duration || 0);
         });
         return monthsData;
     }

     if (timeframe === 'monthly') {
          // Aggregate casually by dividing exactly 30 days into 5 chunks or just show 30 days lines?
          // showing 30 days on a bar chart is crowded but possible. Let's do 4 weeks.
          // Actually, standard is to show 4 weeks.
          const weeksData = [
             { name: 'Week 1', startDay: subDays(now, 28), endDay: subDays(now, 21), hours: 0 },
             { name: 'Week 2', startDay: subDays(now, 21), endDay: subDays(now, 14), hours: 0 },
             { name: 'Week 3', startDay: subDays(now, 14), endDay: subDays(now, 7), hours: 0 },
             { name: 'Week 4', startDay: subDays(now, 7), endDay: now, hours: 0 },
          ];
          allTracked.forEach(t => {
            const d = new Date(t.historyDate || t.actualEndTarget || t.plannedEnd || startOfToday);
            for(let w of weeksData) {
                if (isAfter(d, w.startDay) && !isAfter(d, w.endDay)) {
                   w.hours += (t.duration || 0);
                   break;
                }
            }
          });
          return weeksData;
     }
     
     // Default 'daily' or 'weekly': show last 7 days
     const daysData = [];
     for (let i = 6; i >= 0; i--) {
        const d = subDays(startOfToday, i);
        daysData.push({
           name: format(d, 'EEE'), // Mon, Tue
           dateObj: d,
           hours: 0
        });
     }

     allTracked.forEach(t => {
         const tDate = t.historyDate ? new Date(t.historyDate) : startOfToday;
         // Match against days
         const block = daysData.find(d => isSameDay(d.dateObj, tDate));
         if (block) block.hours += (t.duration || 0);
     });
     
     return daysData;

  }, [historyTasks, tasks, timeframe]);

  const chartTitle = timeframe === 'yearly' || timeframe === 'all' ? 'Yearly Overview' :
                     timeframe === 'monthly' ? 'Monthly Overview' : 'Weekly Overview';

  return (
    <div className="rounded-3xl h-full flex flex-col overflow-hidden"
      style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
       <div className="p-5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(37,99,235,0.06)' }}>
         <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: '#F8FAFC' }}>
           <div className="p-1.5 rounded-lg" style={{ background: 'rgba(37,99,235,0.15)' }}>
             <BarChartIcon className="w-5 h-5" style={{ color: '#3B82F6' }} />
           </div>
           {chartTitle}
         </h2>
       </div>
      
      <div className="flex-1 min-h-[200px] w-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} dx={-10} />
            <Tooltip 
               cursor={{fill: 'rgba(255,255,255,0.03)'}}
               contentStyle={{background: '#0F172A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}
               labelStyle={{ color: '#94A3B8', fontWeight: 700 }}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.hours > 3 ? 'url(#barGradient)' : 'rgba(99,102,241,0.25)'} />
                ))}
            </Bar>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
