import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { calculateEndTime, calculateDuration, formatDisplayTime, formatTime } from '../utils/timeUtils';
import ClockPicker from './ClockPicker';
import { Clock } from 'lucide-react';

export default function TaskForm({ onSaveTask, initialData = null }) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(0);
  const [isDaily, setIsDaily] = useState(true);
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickerConfig, setPickerConfig] = useState(null); // { type: 'start' | 'end', value: string }

  useEffect(() => {
    if (initialData) {
      setSubject(initialData.subject || '');
      setTopic(initialData.topic || '');
      setGoal(initialData.goal || '');
      setStartTime(initialData.plannedStart || '');
      setEndTime(initialData.plannedEnd || '');
      setIsDaily(initialData.isDaily || false);
    } else {
      setSubject(''); setTopic(''); setGoal(''); setStartTime(''); setEndTime(''); setIsDaily(true);
      setTaskDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData]);

  useEffect(() => {
    if (startTime && endTime) {
      setDuration(calculateDuration(startTime, endTime));
    } else {
      setDuration(0);
    }
  }, [startTime, endTime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !startTime || !endTime || duration <= 0) return;

    onSaveTask({
      id: initialData ? initialData.id : Date.now().toString(),
      subject,
      topic,
      goal,
      plannedStart: startTime,
      plannedEnd: endTime,
      duration,
      isDaily,
      taskDate,
      status: initialData ? initialData.status : 'pending',
      actualStart: initialData ? initialData.actualStart : null,
      actualEnd: initialData ? initialData.actualEnd : null,
      actualEndTarget: initialData ? initialData.actualEndTarget : null,
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#E2E8F0',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  return (
    <div style={{ padding: '1.75rem' }}>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: '#F8FAFC' }}>
        <div className="p-1.5 rounded-xl" style={{ background: 'rgba(124,58,237,0.15)' }}>
          <PlusCircle className="w-5 h-5" style={{ color: '#A78BFA' }} />
        </div>
        {initialData ? 'Edit Task' : 'New Task'}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label style={labelStyle}>Subject *</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. React JS"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Topic (Optional)</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Hooks – useState & useEffect"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
        </div>

        <div>
          <label style={labelStyle}>Strategic Goal (Optional)</label>
          <input
            type="text"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="e.g. Mastering React Architecture"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
        </div>
        
        <div>
          <label style={labelStyle}>Target Date *</label>
          <input
            type="date"
            value={taskDate}
            onChange={e => setTaskDate(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center">
              <label style={labelStyle}>Start Time *</label>
              <button 
                type="button"
                onClick={() => setStartTime(formatTime(new Date()))}
                className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 hover:text-indigo-300 transition-colors"
              >
                Use Current
              </button>
            </div>
            <div 
              onClick={() => setPickerConfig({ type: 'start', value: startTime })}
              className="flex items-center gap-3 cursor-pointer" 
              style={{ ...inputStyle, borderColor: pickerConfig?.type === 'start' ? '#7C3AED' : 'rgba(255,255,255,0.12)' }}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{startTime ? formatDisplayTime(startTime) : '--:-- --'}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label style={labelStyle}>End Time *</label>
              <button 
                type="button"
                onClick={() => setEndTime(formatTime(new Date()))}
                className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 hover:text-indigo-300 transition-colors"
              >
                Use Current
              </button>
            </div>
            <div 
              onClick={() => setPickerConfig({ type: 'end', value: endTime })}
              className="flex items-center gap-3 cursor-pointer"
              style={{ ...inputStyle, borderColor: pickerConfig?.type === 'end' ? '#7C3AED' : 'rgba(255,255,255,0.12)' }}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{endTime ? formatDisplayTime(endTime) : '--:-- --'}</span>
            </div>
          </div>
        </div>

        {pickerConfig && (
          <ClockPicker 
            value={pickerConfig.value}
            label={pickerConfig.type === 'start' ? 'Start Time' : 'End Time'}
            onChange={(val) => {
              if (pickerConfig.type === 'start') setStartTime(val);
              else setEndTime(val);
            }}
            onClose={() => setPickerConfig(null)}
          />
        )}

        {duration > 0 && (
          <div className="flex justify-between items-center px-4 py-3 rounded-xl"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <span className="text-sm font-semibold" style={{ color: '#A78BFA' }}>Calculated Duration</span>
            <span className="font-black text-sm" style={{ color: '#C4B5FD' }}>{duration.toFixed(2)} Hrs</span>
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer" style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={isDaily}
            onChange={e => setIsDaily(e.target.checked)}
            className="w-4 h-4"
            style={{ accentColor: '#7C3AED' }}
          />
          🔄 Repeat this task daily
        </label>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl font-black text-white text-sm transition-all hover:scale-105 mt-2"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 8px 25px rgba(124,58,237,0.4)' }}>
          {initialData ? '💾 Save Changes' : '➕ Add Task'}
        </button>
      </form>
    </div>
  );
}
