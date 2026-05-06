import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { shiftSubsequentTasks, formatDisplayDate, formatTime, parseTime } from './utils/timeUtils';
import TaskForm from './components/TaskForm';
import Timetable from './components/Timetable';
import TimerDisplay from './components/TimerDisplay';
import LiveClock from './components/LiveClock';
import StatsCards from './components/StatsCards';
import HistoryCharts from './components/HistoryCharts';
import Calendar from './components/Calendar';
import SubjectTracker from './components/SubjectTracker';
import GoalTracking from './components/GoalTracking';
import Auth from './components/Auth/Auth';
import { exportTasksToExcel, exportTasksToPDF } from './utils/exportUtils';
import { 
  BookOpen, GraduationCap, CalendarDays, X, Bell, AlertCircle, 
  PlusCircle, Download, CalendarHeart, Menu, LayoutDashboard,
  ChevronDown, Zap, Activity, BookMarked, CheckCircle2, Clock, Home, Radio,
  FileSpreadsheet, FileText
} from 'lucide-react';
import { isBefore, parse, differenceInMinutes, isSameDay, parseISO } from 'date-fns';

// ═══════════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════════
const analysisStyles = `
  @keyframes scan {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 0.5; }
    100% { transform: translateY(100%); opacity: 0; }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.8; }
  }
  .animate-scan {
    animation: scan 3s linear infinite;
  }
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  @keyframes float-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  .animate-float-subtle {
    animation: float-subtle 3s ease-in-out infinite;
  }
  @keyframes shimmer-text {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .animate-shimmer-text {
    background: linear-gradient(90deg, rgba(129,140,248,0.5) 0%, #FFF 50%, rgba(129,140,248,0.5) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer-text 4s linear infinite;
  }
`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useLocalStorage('study-tasks-today', []);
  const [historyTasks, setHistoryTasks] = useLocalStorage('study-tasks-history', []);
  const [activeTaskId, setActiveTaskId] = useLocalStorage('active-task-id', null);
  const [lastActiveDate, setLastActiveDate] = useLocalStorage('last-active-date', new Date().toDateString());
  const [dashboardTimeframe, setDashboardTimeframe] = useLocalStorage('dashboard-timeframe', 'daily');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [targetHours, setTargetHours] = useLocalStorage('study-target-hours', 100);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error

  const todayISO = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => 
    t.taskDate === todayISO || 
    (t.status === 'pending' && t.taskDate <= todayISO) ||
    (!t.taskDate && lastActiveDate === new Date().toDateString())
  );

  // Gamification Logic
  const completedTasksCount = todayTasks.filter(t => t.status === 'completed').length;
  const totalTasksCount = todayTasks.length;
  const dailyProgress = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;
  
  const getDailyRank = () => {
    if (dailyProgress === 100) return { title: 'Academic Titan', icon: '🏆', color: '#F59E0B' };
    if (dailyProgress >= 70) return { title: 'Focus Elite', icon: '🥇', color: '#6366F1' };
    if (dailyProgress >= 40) return { title: 'Steady Scholar', icon: '🥈', color: '#10B981' };
    return { title: 'Aspiring Mind', icon: '✨', color: '#94A3B8' };
  };
  const rank = getDailyRank();

  // Lifetime Stats
  const lifetimeCompletedTasks = historyTasks.filter(t => t.status === 'completed');
  const lifetimeHours = lifetimeCompletedTasks.reduce((acc, t) => acc + (t.duration || 0), 0) + (tasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + (t.duration || 0), 0));
  
  // Streak Calculation
  const calculateStreak = () => {
     if (!historyTasks.length) return 0;
     const dates = [...new Set(historyTasks.map(t => t.historyDate))].sort((a,b) => new Date(b) - new Date(a));
     return dates.length + (completedTasksCount > 0 ? 1 : 0);
  };
  const currentStreak = calculateStreak();

  // Auto day-reset logic
  useEffect(() => {
    const today = new Date().toDateString();
    const lastISO = new Date(lastActiveDate).toISOString().split('T')[0];

    if (lastActiveDate !== today) {
      // 1. Move today's done/missed tasks to history
      const tasksToHistory = tasks.filter(t => (t.taskDate === lastISO || !t.taskDate) && t.status !== 'pending');
      const newHistory = [...historyTasks];
      tasksToHistory.forEach(task => {
        newHistory.push({ ...task, historyDate: lastActiveDate });
      });
      setHistoryTasks(newHistory);

      // 2. Remove non-recurring old tasks, reset recurring ones
      const updatedTasks = tasks.map(t => {
        if (t.isDaily) {
          return { 
            ...t, 
            status: 'pending', 
            actualStart: null, 
            actualEnd: null, 
            actualEndTarget: null,
            isPaused: false,
            pauseStartTime: null,
            taskDate: new Date().toISOString().split('T')[0] // Roll forward to today
          };
        }
        return t;
      }).filter(t => {
         // Keep if it's daily (already rolled forward) OR if it's in the future OR if it's still pending
         if (t.isDaily) return true;
         if (t.status === 'pending') return true;
         if (t.taskDate && t.taskDate >= new Date().toISOString().split('T')[0]) return true;
         return false;
      });

      setTasks(updatedTasks);
      setActiveTaskId(null);
      setLastActiveDate(today);
    }
  }, [tasks, lastActiveDate, setTasks, setActiveTaskId, setLastActiveDate, historyTasks, setHistoryTasks]);

  // Backend Sync Logic
  useEffect(() => {
    const syncData = async () => {
      if (tasks.length === 0 && historyTasks.length === 0) return;
      
      setSyncStatus('syncing');
      try {
        const allTasks = [...tasks, ...historyTasks];
        const response = await fetch('http://localhost:5000/api/tasks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks: allTasks })
        });
        
        if (response.ok) {
          setSyncStatus('success');
          setTimeout(() => setSyncStatus('idle'), 3000);
        } else {
          setSyncStatus('error');
        }
      } catch (error) {
        console.error('Backup failed:', error);
        setSyncStatus('error');
      }
    };

    const timer = setTimeout(syncData, 5000); // Sync after 5s of inactivity
    return () => clearTimeout(timer);
  }, [tasks, historyTasks]);

  const handleSaveTask = (taskData) => {
    let updatedTasks;
    const existingIndex = tasks.findIndex(t => t.id === taskData.id);
    if (existingIndex >= 0) {
      updatedTasks = tasks.map(t => t.id === taskData.id ? taskData : t);
    } else {
      updatedTasks = [...tasks, { ...taskData, id: Date.now().toString() }];
    }
    updatedTasks.sort((a, b) => a.plannedStart.localeCompare(b.plannedStart));
    setTasks(updatedTasks);
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      setTasks(updatedTasks);
      if (activeTaskId === taskId) setActiveTaskId(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Delete every task in your schedule? This cannot be undone.')) {
      setTasks([]);
      setActiveTaskId(null);
    }
  };

  const handleEditTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleModifyTask = (taskId, updates) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ));
  };

  const handleRestoreTask = (task) => {
    // Check if task is already in today's list (from Timetable), then just set to pending
    const existing = tasks.find(t => t.id === task.id);
    if (existing) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: 'pending', actualStart: null, actualEnd: null } : t));
    } else {
      // It's from history, add a copy to today's tasks
      const newTask = {
        ...task,
        id: Date.now().toString(),
        status: 'pending',
        taskDate: new Date().toISOString().split('T')[0],
        historyDate: null,
        actualStart: null,
        actualEnd: null,
        actualEndTarget: null
      };
      setTasks(prev => [...prev, newTask].sort((a, b) => a.plannedStart.localeCompare(b.plannedStart)));
      setIsCalendarOpen(false);
      setIsTaskDrawerOpen(true);
    }
  };

  const handleLoadRoutine = () => {
    const routine = [
      { id: Date.now().toString() + '1', subject: 'CHALLENGE: React Core [Focus]', topic: 'Advanced Hooks & Perf Optimization', plannedStart: '13:00', plannedEnd: '13:50', duration: 50/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '2', subject: 'Recovery: Deep Breathing', plannedStart: '13:50', plannedEnd: '14:00', duration: 10/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '3', subject: 'CHALLENGE: Logic Building [Build]', topic: 'Algorithm Practice & System Design', plannedStart: '14:00', plannedEnd: '14:50', duration: 50/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '4', subject: 'Recovery: Stretch & Walk', plannedStart: '14:50', plannedEnd: '15:05', duration: 15/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '5', subject: 'CHALLENGE: Node Mastery [Server]', topic: 'Streaming APIs & Database Indexing', plannedStart: '15:05', plannedEnd: '15:55', duration: 50/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '6', subject: 'Recovery: Hydration', plannedStart: '15:55', plannedEnd: '16:05', duration: 10/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '7', subject: 'CHALLENGE: System Review [Analyze]', topic: 'Testing & Documentation Audit', plannedStart: '16:05', plannedEnd: '16:40', duration: 35/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '8', subject: 'Recovery: Mind Refresh', plannedStart: '16:40', plannedEnd: '16:50', duration: 10/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '9', subject: 'CHALLENGE: Project Lab [Finish]', topic: 'End-to-End Implementation', plannedStart: '16:50', plannedEnd: '17:40', duration: 50/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '10', subject: 'Recovery: Final Stretch', plannedStart: '17:40', plannedEnd: '17:55', duration: 15/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '11', subject: 'CHALLENGE: Integration Hub', topic: 'Full Stack Deployment Sync', plannedStart: '17:55', plannedEnd: '18:35', duration: 40/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '12', subject: 'Recovery: Log Update', plannedStart: '18:35', plannedEnd: '18:45', duration: 10/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null },
      { id: Date.now().toString() + '13', subject: 'CHALLENGE COMPLETE: Review', plannedStart: '18:45', plannedEnd: '19:30', duration: 45/60, isDaily: true, status: 'pending', actualStart: null, actualEnd: null, actualEndTarget: null }
    ];
    setTasks(routine);
  };

  const handleStartTask = (taskId, index, delayMinutes, now) => {
    if (!taskId) return;
    
    const taskIdx = index !== undefined ? index : tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return;

    const delay = delayMinutes !== undefined ? delayMinutes : 0;

    // 1. If there's an active task, stop it first
    let currentTasks = [...tasks];
    if (activeTaskId) {
      const activeIdx = currentTasks.findIndex(t => t.id === activeTaskId);
      if (activeIdx !== -1) {
        const task = currentTasks[activeIdx];
        const plannedEnd = parseTime(task.plannedEnd);
        let diffMinutes = 0;
        if (plannedEnd) {
          diffMinutes = differenceInMinutes(now, plannedEnd);
        }
        
        currentTasks = shiftSubsequentTasks(currentTasks, activeIdx, diffMinutes);
        currentTasks = currentTasks.map(t => {
          if (t.id === activeTaskId) {
            let finalDuration = t.duration || 0;
            if (t.actualStart) {
              const startTime = new Date(t.actualStart);
              let pauseMs = t.totalPauseTimeMs || 0;
              if (t.isPaused && t.pauseStartTime) {
                pauseMs += (now.getTime() - new Date(t.pauseStartTime).getTime());
              }
              const actualHours = (now.getTime() - startTime.getTime() - pauseMs) / (1000 * 3600);
              finalDuration = Math.max(0, actualHours);
            }
            return { 
              ...t, 
              status: 'completed', 
              actualEnd: now.toISOString(),
              duration: finalDuration,
              isPaused: false,
              pauseStartTime: null
            };
          }
          return t;
        });
      }
    }

    // 2. Start the new task
    let updatedTasks = shiftSubsequentTasks(currentTasks, taskIdx, delay);
    const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const taskToStart = updatedTasks[taskIndex];
    const actualEndTarget = new Date(now.getTime() + (taskToStart.duration || 0) * 3600 * 1000);
    
    updatedTasks = updatedTasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          status: 'running', 
          actualStart: now.toISOString(), 
          actualEndTarget: actualEndTarget.toISOString(),
          plannedStart: formatTime(now),
          plannedEnd: formatTime(actualEndTarget),
          totalPauseTimeMs: 0,
          isPaused: false,
          pauseStartTime: null
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    setActiveTaskId(taskId);
  };

  const handleStopTask = (taskId) => {
    if (!taskId) return;
    const now = new Date();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    const plannedEnd = parseTime(task.plannedEnd);
    let diffMinutes = 0;
    if (plannedEnd) {
      diffMinutes = differenceInMinutes(now, plannedEnd);
    }
    
    let updatedTasks = shiftSubsequentTasks(tasks, taskIndex, diffMinutes);
    
    updatedTasks = updatedTasks.map(t => {
      if (t.id === taskId) {
        let finalDuration = t.duration || 0;
        if (t.actualStart) {
          const startTime = new Date(t.actualStart);
          let pauseMs = t.totalPauseTimeMs || 0;
          if (t.isPaused && t.pauseStartTime) {
            pauseMs += (now.getTime() - new Date(t.pauseStartTime).getTime());
          }
          const actualHours = (now.getTime() - startTime.getTime() - pauseMs) / (1000 * 3600);
          finalDuration = Math.max(0, actualHours);
        }
        return { 
          ...t, 
          status: 'completed', 
          actualEnd: now.toISOString(),
          duration: finalDuration,
          isPaused: false,
          pauseStartTime: null
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    setActiveTaskId(null);
  };

  const handleTaskComplete = (taskId) => handleStopTask(taskId);

  const handleCompleteAll = () => {
    if (window.confirm('Mark all remaining tasks as completed?')) {
      const now = new Date();
      const updatedTasks = tasks.map(t => {
        if (t.status === 'pending') {
          return { ...t, status: 'completed', actualEnd: now.toISOString() };
        }
        return t;
      });
      setTasks(updatedTasks);
    }
  };

  const handleMarkMissed = (taskId) => {
    if (!taskId) return;
    const now = new Date();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    const plannedStart = parseTime(task.plannedStart);
    let shift = 0;
    
    if (plannedStart && differenceInMinutes(now, plannedStart) > -30) {
       shift = -((task.duration || 0) * 60);
    }

    let updatedTasks = shiftSubsequentTasks(tasks, taskIndex, shift);
    updatedTasks = updatedTasks.map(t => {
      if (t.id === taskId) return { ...t, status: 'missed' };
      return t;
    });
    setTasks(updatedTasks);
  };

  const handlePauseTask = (taskId) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, isPaused: true, pauseStartTime: new Date().toISOString() };
      }
      return t;
    }));
  };

  const handleResumeTask = (taskId) => {
    const now = new Date();
    setTasks(tasks.map(t => {
      if (t.id === taskId && t.isPaused && t.pauseStartTime) {
        const pauseStart = new Date(t.pauseStartTime);
        const pauseDurationMs = now.getTime() - pauseStart.getTime();
        
        // Push the target end time forward by the duration of the pause
        const oldTarget = new Date(t.actualEndTarget);
        const newTarget = new Date(oldTarget.getTime() + pauseDurationMs);
        
        // Also update the planned end display string
        return { 
          ...t, 
          isPaused: false, 
          actualEndTarget: newTarget.toISOString(),
          plannedEnd: formatTime(newTarget),
          pauseStartTime: null,
          totalPauseTimeMs: (t.totalPauseTimeMs || 0) + pauseDurationMs
        };
      }
      return t;
    }));
  };

  const openAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const activeTask = todayTasks.find(t => t.id === activeTaskId);
  const pendingTasksList = todayTasks.filter(t => t.status === 'pending');

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={(user) => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden selection:bg-indigo-500/30" style={{ background: '#0B1120', color: '#F8FAFC' }}>
      <style>{analysisStyles}</style>

      {/* Premium Deep Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
         background: 'radial-gradient(circle at 15% 50%, rgba(37, 99, 235, 0.08), transparent 50%), radial-gradient(circle at 85% 30%, rgba(124, 58, 237, 0.08), transparent 50%), radial-gradient(circle at 50% 100%, rgba(14, 165, 233, 0.05), transparent 50%)',
      }}></div>
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-20 blur-[120px] pointer-events-none animate-pulse-glow" style={{ background: 'radial-gradient(circle, #2563EB, transparent)' }}></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-20 blur-[120px] pointer-events-none animate-pulse-glow" style={{ background: 'radial-gradient(circle, #7C3AED, transparent)', animationDelay: '2s' }}></div>
      <div className="fixed inset-0 z-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

      {/* ═══════════════════════════════════════════
          TOP NAVBAR
      ═══════════════════════════════════════════ */}
      <nav style={{ 
        background: 'rgba(15,23,42,0.9)', 
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'fixed', 
        top: 0, 
        left: 0,
        right: 0,
        zIndex: 100,
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
      }}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', borderRadius: 12 }} className="p-2 shadow-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight" style={{ color: '#F8FAFC' }}>SmartStudy</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:bg-white/5"
                style={{ color: '#94A3B8' }}>
                <Home className="w-4 h-4" />
                Home
              </button>

              <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' }}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CalendarDays className="w-4 h-4" style={{ color: '#818CF8' }} />
                <select
                  value={dashboardTimeframe}
                  onChange={(e) => setDashboardTimeframe(e.target.value)}
                  style={{ background: 'transparent', color: '#94A3B8', outline: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="daily" style={{ background: '#1E293B' }}>Daily</option>
                  <option value="weekly" style={{ background: '#1E293B' }}>Weekly</option>
                  <option value="monthly" style={{ background: '#1E293B' }}>Monthly</option>
                  <option value="yearly" style={{ background: '#1E293B' }}>Yearly</option>
                  <option value="all" style={{ background: '#1E293B' }}>All Time</option>
                </select>
              </div>

              <button
                onClick={() => exportTasksToExcel(historyTasks, tasks)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>

              <button
                onClick={() => exportTasksToPDF(historyTasks, tasks)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                <FileText className="w-4 h-4" />
                PDF Report
              </button>

              <button 
                   onClick={() => setSyncStatus(syncStatus === 'syncing' ? 'idle' : 'syncing')}
                   className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:bg-white/5 cursor-pointer" 
                   style={{ 
                     background: syncStatus === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', 
                     borderColor: syncStatus === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                     color: syncStatus === 'error' ? '#EF4444' : syncStatus === 'success' ? '#10B981' : '#94A3B8'
                   }}>
                <Radio className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {syncStatus === 'syncing' ? 'Backing up...' : syncStatus === 'error' ? 'Offline' : 'Cloud Sync'}
                </span>
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Task Drawer Toggle */}
              <div className="relative">
                <button
                  onClick={() => setIsTaskDrawerOpen(!isTaskDrawerOpen)}
                  className="relative p-2.5 rounded-xl transition-all hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Bell className="w-5 h-5" style={{ color: '#94A3B8' }} />
                  {pendingTasksList.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2"
                      style={{ background: '#EF4444', borderColor: '#0F172A', animation: 'pulse 2s infinite' }}></span>
                  )}
                </button>
              </div>

              {/* Calendar Icon */}
              <button
                onClick={() => setIsCalendarOpen(true)}
                className="p-2.5 rounded-xl transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CalendarHeart className="w-5 h-5" style={{ color: '#818CF8' }} />
              </button>

              {/* Add Task Button */}
              <button
                onClick={openAddTask}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                <PlusCircle className="w-4 h-4" />
                Add Task
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {isMobileMenuOpen ? <X className="w-5 h-5" style={{ color: '#94A3B8' }} /> : <Menu className="w-5 h-5" style={{ color: '#94A3B8' }} />}
              </button>
            </div>
          </div>

          {/* Mobile Expanded Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <CalendarDays className="w-4 h-4" style={{ color: '#818CF8' }} />
                <select
                  value={dashboardTimeframe}
                  onChange={(e) => setDashboardTimeframe(e.target.value)}
                  className="flex-1"
                  style={{ background: 'transparent', color: '#94A3B8', outline: 'none', fontSize: 14, fontWeight: 600 }}
                >
                  <option value="daily" style={{ background: '#1E293B' }}>Daily View</option>
                  <option value="weekly" style={{ background: '#1E293B' }}>Weekly View</option>
                  <option value="monthly" style={{ background: '#1E293B' }}>Monthly View</option>
                  <option value="yearly" style={{ background: '#1E293B' }}>Yearly View</option>
                  <option value="all" style={{ background: '#1E293B' }}>All Time</option>
                </select>
              </div>

              <button
                onClick={openAddTask}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                <PlusCircle className="w-5 h-5" />
                Add Task
              </button>

              <button
                onClick={() => { exportTasksToExcel(historyTasks); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
                <FileSpreadsheet className="w-5 h-5" />
                Export Excel
              </button>

              <button
                onClick={() => { exportTasksToPDF(historyTasks); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                <FileText className="w-5 h-5" />
                Download PDF
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          PAGE CONTENT
      ═══════════════════════════════════════════ */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pt-24 pb-8 flex flex-col gap-4 relative z-10 font-medium">

        {/* Compressed Quick Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 backdrop-blur-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50"></div>
            
            <div className="flex items-center gap-4 z-10">
               <div className="hidden md:block p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <Zap className="w-6 h-6 text-indigo-400" />
               </div>
               <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                     Focus Mode <span className="text-indigo-400">Activated</span>
                  </h1>
                  <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-0.5">Capture your flow. Master your time.</p>
               </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4">
               <LiveClock />
               
               <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center px-4 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-lg">
                     <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Lifetime</span>
                     <span className="text-sm font-black text-white leading-none">{lifetimeHours.toFixed(1)}h</span>
                  </div>
                  
                  <div className="hidden sm:flex flex-col items-center px-4 py-1.5 rounded-xl bg-white/5 border border-white/10">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Date</span>
                     <span className="text-xs font-black text-slate-300">{formatDisplayDate(new Date())}</span>
                  </div>

                  <div className="flex flex-col px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 min-w-[100px]">
                     <div className="flex justify-between items-center mb-1 leading-none">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                        <span className="text-[8px] font-black text-indigo-400">{Math.round((todayTasks.filter(t => t.status === 'completed').length / (todayTasks.length || 1)) * 100)}%</span>
                     </div>
                     <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-1000" style={{ width: `${(todayTasks.filter(t => t.status === 'completed').length / (todayTasks.length || 1)) * 100}%` }}></div>
                     </div>
                  </div>
               </div>
            </div>
        </div>

        {/* Stats Cards */}
        <StatsCards tasks={todayTasks} historyTasks={historyTasks} timeframe={dashboardTimeframe} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left: Timer Hub / Schedule */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-5">
            {activeTask ? (
              <TimerDisplay
                activeTask={activeTask}
                pendingTasks={todayTasks.filter(t => t.status === 'pending')}
                onComplete={handleTaskComplete}
                onStartTask={handleStartTask}
                onStopTimer={handleStopTask}
                onCompleteAll={handleCompleteAll}
                onPauseTask={handlePauseTask}
                onResumeTask={handleResumeTask}
                onModifyTask={handleModifyTask}
              />
            ) : (
               <div className="relative p-6 md:p-10 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] min-h-[340px] xl:min-h-[420px] bg-gradient-to-br from-white/[0.04] to-transparent">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                  {/* Background Image */}
                  <div className="absolute inset-0 w-full h-full opacity-10 mix-blend-overlay bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-black"></div>
                  
                  <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                       <Zap className="w-3 h-3" /> System Idle
                    </div>
                    
                    <div className="relative mb-10 group cursor-pointer" onClick={() => setIsTaskDrawerOpen(true)}>
                       <div className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                       <div className="relative p-6 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-xl shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                          <Bell className="w-14 h-14 text-indigo-400" />
                       </div>
                    </div>
                    
                    <h3 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-3 tracking-tight drop-shadow-sm">Task Center</h3>
                    <p className="text-slate-400 max-w-lg mx-auto mb-6 text-sm font-medium leading-relaxed px-4">Your journey to mastery begins with a single session. Initialize your optimized flow engine now.</p>
                    
                    <button 
                       onClick={() => setIsTaskDrawerOpen(true)}
                       className="group relative px-8 py-3 rounded-2xl font-black text-base text-white transition-all overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_50px_rgba(79,70,229,0.6)] hover:-translate-y-1"
                    >
                       <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all"></div>
                       <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                       <span className="relative flex items-center gap-3">
                         Launch Session
                         <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                       </span>
                    </button>
                  </div>
               </div>
            )}
          </div>

          {/* Right: Subject Analytics Hub */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-5">
            <div className="flex-1 min-h-[340px] xl:min-h-[420px]">
               <SubjectTracker tasks={todayTasks} historyTasks={historyTasks} />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            REWARDS & GOALS Section
        ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Achievement Card */}
           <div className="lg:col-span-2 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                 <div className="relative shrink-0">
                    <div className="w-32 h-32 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center animate-spin-slow"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                       {rank.icon}
                    </div>
                 </div>
                 <div className="text-center md:text-left">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Daily Achievement</p>
                    <h2 className="text-3xl font-black text-white mb-2">Your current rank: <span style={{ color: rank.color }}>{rank.title}</span></h2>
                    <p className="text-slate-400 font-medium mb-6">You have completed {completedTasksCount} out of {totalTasksCount} tasks today. Keep pushing for that Titan rank!</p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                       <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-slate-300">{dailyProgress.toFixed(0)}% Efficiency</span>
                       </div>
                       <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-400" />
                          <span className="text-xs font-bold text-slate-300">{currentStreak} Day Streak</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Milestone Progress */}
           <div className="lg:col-span-1">
              {(() => {
                const allDoneTasks = [...historyTasks, ...tasks].filter(t => t.status === 'completed');
                const goalStats = allDoneTasks.reduce((acc, t) => {
                  if (t.goal) {
                    if (!acc[t.goal]) {
                      acc[t.goal] = { hours: 0, tasks: 0, dates: new Set() };
                    }
                    acc[t.goal].hours += (t.duration || 0);
                    acc[t.goal].tasks += 1;
                    acc[t.goal].dates.add(t.historyDate || t.taskDate || todayISO);
                  }
                  return acc;
                }, {});

                // Convert Sets to counts for easier consumption
                Object.keys(goalStats).forEach(goalName => {
                   goalStats[goalName].daysCount = goalStats[goalName].dates.size;
                });

                return (
                  <GoalTracking 
                    lifetimeHours={lifetimeHours} 
                    targetHours={targetHours} 
                    onSetTarget={setTargetHours} 
                    goalStats={goalStats}
                  />
                );
              })()}
           </div>
        </div>

        {/* ═══════════════════════════════════════════
            DASHBOARD INSIGHTS
        ═══════════════════════════════════════════ */}
        <div className="mt-4 p-8 md:p-12 rounded-[2.5rem] border border-white/10 relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
           <div className="absolute top-0 right-0 p-12 opacity-5">
              <LayoutDashboard className="w-64 h-64 text-white" />
           </div>

           <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
                 <div className="p-4 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-600/40">
                    <Activity className="w-8 h-8 text-white" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-white">Project Commander</h2>
                    <p className="text-slate-400 font-medium">Your mission control for academic excellence & deep focused work.</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {/* Feature 1 */}
                 <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.08] group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                       <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Flow State Engine</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">The central timer hub designed to maintain your focus. One-click session starts with automatic SMS-style alerts and haptic feedback.</p>
                 </div>

                 {/* Feature 2 */}
                 <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.08] group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                       <BookMarked className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Subject Mastery</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">Visual progress trackers that show exactly where your time goes. Identify your strengths and balance your study load with real-time analytics.</p>
                 </div>

                 {/* Feature 3 */}
                 <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.08] group">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                       <Bell className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Smart Sync</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">Your "Task Center" is always one click away. Manage your recurring daily routine and skip or edit tasks on the fly without cluttering your workspace.</p>
                 </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-6 items-center justify-between">
                 <div className="flex items-center gap-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">3 Active Modules</p>
                 </div>
                 <div className="text-xs font-black text-indigo-500/50 uppercase tracking-[0.2em]">Designed for Modern Developers</div>
              </div>
           </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════
          MODALS & DRAWERS
      ═══════════════════════════════════════════ */}

      {/* Task Center Drawer */}
      {isTaskDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setIsTaskDrawerOpen(false)}
          />
          <div className="relative w-full max-w-lg h-full overflow-hidden flex flex-col animate-in slide-in-from-right duration-500" 
               style={{ background: '#0F172A', borderLeft: '1px solid rgba(255,255,255,0.1)', boxShadow: '-30px 0 80px rgba(0,0,0,0.6)' }}>
            
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10">
                   <Bell className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-black text-xl text-white">Task Center</h3>
              </div>
              <button
                onClick={() => setIsTaskDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <Timetable
                tasks={todayTasks}
                onStartTask={handleStartTask}
                onStopTask={handleStopTask}
                onMarkMissed={handleMarkMissed}
                onCompleteAll={handleCompleteAll}
                activeTaskId={activeTaskId}
                onLoadRoutine={handleLoadRoutine}
                onEditTask={handleEditTask}
                onAddTask={openAddTask}
                onDeleteTask={handleDeleteTask}
                onClearAll={handleClearAll}
                onRestoreTask={handleRestoreTask}
              />
            </div>

            <div className="p-6 bg-slate-900/50" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
               <button 
                  onClick={openAddTask}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-white shadow-xl shadow-indigo-600/20"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
               >
                  <PlusCircle className="w-5 h-5" />
                  Create New Subject
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
            onClick={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
          />
          <div className="relative w-full max-w-md overflow-hidden" style={{ borderRadius: 24, background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 100px rgba(0,0,0,0.7)' }}>
            <TaskForm onSaveTask={handleSaveTask} initialData={editingTask} />
            <button
              onClick={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
              className="absolute top-5 right-5 p-2 rounded-full transition-all hover:bg-white/10"
              style={{ color: '#94A3B8' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Smart Calendar Drawer */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setIsCalendarOpen(false)} />
          <div className="relative w-full max-w-md h-full flex flex-col" style={{ background: '#1E293B', borderLeft: '1px solid rgba(255,255,255,0.1)', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}>
            <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-bold text-xl flex items-center gap-3" style={{ color: '#F8FAFC' }}>
                <CalendarHeart className="w-6 h-6" style={{ color: '#818CF8' }} />
                Study Heatmap
              </h3>
              <button onClick={() => setIsCalendarOpen(false)} className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <Calendar historyTasks={historyTasks} onRestoreTask={handleRestoreTask} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
