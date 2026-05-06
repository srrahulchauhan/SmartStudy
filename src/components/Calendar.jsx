import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Target, Clock, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isSameMonth, isSameDay, addDays, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function Calendar({ historyTasks = [], onRestoreTask }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDay, setSelectedDay] = React.useState(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const buildCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];

    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayTasks = historyTasks.filter(t => 
           (t.historyDate && isSameDay(new Date(t.historyDate), day)) || 
           (t.taskDate && isSameDay(new Date(t.taskDate), day))
        );
        const dayHours = dayTasks.reduce((acc, t) => acc + (t.status === 'completed' ? (t.duration || 0) : 0), 0);

        // Calculate Heatmap Color
        let heatmapColor = 'transparent';
        if (dayHours > 0) heatmapColor = 'rgba(16,185,129,0.1)';
        if (dayHours > 2) heatmapColor = 'rgba(16,185,129,0.25)';
        if (dayHours > 5) heatmapColor = 'rgba(16,185,129,0.45)';
        if (dayHours > 8) heatmapColor = 'rgba(16,185,129,0.7)';

        days.push(
          <div
            className={clsx(
              "p-2 min-h-[60px] border-b border-r border-slate-700/30 relative group transition-all duration-300",
              !isSameMonth(day, monthStart) ? "text-slate-600 bg-slate-900/40 pointer-events-none" : "bg-transparent text-slate-300",
              isToday(day) && "bg-indigo-500/10",
              "hover:bg-indigo-500/20 cursor-pointer overflow-hidden"
            )}
            key={day}
            onClick={() => isSameMonth(cloneDay, monthStart) && setSelectedDay(cloneDay)}
          >
            {/* Heatmap Layer */}
            {isSameMonth(day, monthStart) && dayHours > 0 && (
              <div className="absolute inset-0 transition-opacity" style={{ background: heatmapColor }}></div>
            )}

            <div className="relative z-10 flex flex-col items-center justify-between h-full gap-1">
               <span className={clsx(
                  "flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black transition-all",
                  isToday(day) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-500 group-hover:text-white"
               )}>{formattedDate}</span>
               
               {isSameMonth(day, monthStart) && dayHours > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-emerald-400 opacity-80">{dayHours.toFixed(1)}h</span>
                    <div className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5 animate-pulse"></div>
                  </div>
               )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  return (
    <div className="rounded-3xl h-full flex flex-col overflow-hidden"
      style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
      
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-950/20">
         <h2 className="text-base font-black text-white flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/20">
               <CalendarIcon className="text-indigo-400 w-4 h-4" />
            </div>
            {format(currentDate, "MMMM yyyy")}
         </h2>
         <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
               <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
               <ChevronRight className="w-4 h-4" />
            </button>
         </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-slate-700/30 bg-slate-900/50 text-[10px] font-black uppercase tracking-widest text-slate-500 py-3">
         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center">{d}</div>
         ))}
      </div>
      
      <div className="flex-1 overflow-y-auto">
         {buildCalendar()}
      </div>

      {/* Day Details Popup */}
      <AnimatePresence>
        {selectedDay && (
          <div className="absolute inset-0 z-50 p-4">
            <div 
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
               onClick={() => setSelectedDay(null)}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative h-full w-full rounded-[2rem] bg-slate-900 border border-white/10 flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <div>
                    <h3 className="text-xl font-black text-white">{format(selectedDay, 'eeee, dd MMMM')}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Study Logs for this day</p>
                 </div>
                 <button 
                   onClick={() => setSelectedDay(null)}
                   className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 {historyTasks.filter(t => isSameDay(new Date(t.historyDate || t.actualStart), selectedDay)).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
                       <Target className="w-16 h-16" />
                       <p className="font-bold text-sm uppercase tracking-widest">No studies logged on this date</p>
                    </div>
                 ) : (
                    historyTasks
                      .filter(t => isSameDay(new Date(t.historyDate || t.actualStart), selectedDay))
                      .map((task, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5">
                           <div className="flex justify-between items-start mb-2">
                              <h4 className="font-black text-white text-lg">{task.subject}</h4>
                              <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                 task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                 {task.status}
                              </div>
                           </div>
                           {task.topic && <p className="text-xs text-slate-400 font-medium mb-1">{task.topic}</p>}
                           {task.goal && (
                              <div className="flex items-center gap-1.5 mb-3 opacity-80">
                                 <Target className="w-3 h-3 text-indigo-400" />
                                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{task.goal}</span>
                              </div>
                           )}
                           <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                 <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                 <span className="text-xs font-bold text-slate-300">{task.plannedStart} - {task.plannedEnd}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                 <span className="text-xs font-bold text-slate-300">{task.duration?.toFixed(2)}h Session</span>
                              </div>
                              {task.status !== 'completed' && onRestoreTask && (
                                <button
                                  onClick={() => onRestoreTask(task)}
                                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Retry Today
                                </button>
                              )}
                           </div>
                        </div>
                      ))
                 )}
              </div>

              {/* Footer Stat */}
              <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Total Hours: {historyTasks
                      .filter(t => isSameDay(new Date(t.historyDate || t.actualStart), selectedDay))
                      .reduce((acc, t) => acc + (t.duration || 0), 0)
                      .toFixed(2)}h
                 </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
