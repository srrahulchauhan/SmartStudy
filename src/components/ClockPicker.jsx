import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check, X } from 'lucide-react';

export default function ClockPicker({ value, onChange, onClose, label }) {
  // Value is expected in "HH:mm" (24h)
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState('AM');
  const [mode, setMode] = useState('hours'); // 'hours' or 'minutes'
  const clockRef = useRef(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setHours(h % 12 || 12);
      setMinutes(m);
      setPeriod(h >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  const handleSelect = () => {
    let h = hours % 12;
    if (period === 'PM') h += 12;
    const m = minutes.toString().padStart(2, '0');
    const hStr = h.toString().padStart(2, '0');
    onChange(`${hStr}:${m}`);
    onClose();
  };

  const calculateValueFromAngle = (e) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    
    // Angle in degrees (0 is top)
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hours') {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      if (h > 12) h = 1;
      setHours(h);
    } else {
      let m = Math.round(angle / 6) % 60;
      setMinutes(m);
    }
  };

  const onMouseDown = (e) => {
    calculateValueFromAngle(e);
    const onMouseMove = (moveEvent) => calculateValueFromAngle(moveEvent);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (mode === 'hours') setMode('minutes');
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const renderNumbers = () => {
    const numbers = mode === 'hours' ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    return numbers.map((n, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const radius = 95;
      const x = Math.sin(angle) * radius;
      const y = -Math.cos(angle) * radius;
      
      const isActive = mode === 'hours' ? hours === n : minutes === n;

      return (
        <div
          key={n}
          className={`absolute flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-125' : 'scale-100'}`}
          style={{
            width: 34,
            height: 34,
            left: `calc(50% + ${x}px - 17px)`,
            top: `calc(50% + ${y}px - 17px)`,
            color: isActive ? '#FFFFFF' : '#94A3B8',
            fontSize: isActive ? 16 : 14,
            fontWeight: isActive ? 900 : 500,
            textShadow: isActive ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
            zIndex: 10
          }}
        >
          {n}
        </div>
      );
    });
  };


  const pointerAngle = mode === 'hours' ? (hours % 12) * 30 : minutes * 6;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#1E293B] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden w-full max-w-[320px] animate-in zoom-in-95 duration-200">
        
        {/* Header Display */}
        <div className="p-6 bg-indigo-600/10 border-b border-white/5 flex flex-col items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">{label || 'Select Time'}</p>
          
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => setMode('hours')}
              className={`text-5xl font-black transition-colors ${mode === 'hours' ? 'text-white' : 'text-slate-600'}`}
            >
              {hours.toString().padStart(2, '0')}
            </button>
            <span className="text-4xl font-black text-slate-700">:</span>
            <button 
              onClick={() => setMode('minutes')}
              className={`text-5xl font-black transition-colors ${mode === 'minutes' ? 'text-white' : 'text-slate-600'}`}
            >
              {minutes.toString().padStart(2, '0')}
            </button>
            
            <div className="flex flex-col gap-1 ml-4">
              <button 
                onClick={() => {
                  const now = new Date();
                  let h = now.getHours();
                  const m = now.getMinutes();
                  setPeriod(h >= 12 ? 'PM' : 'AM');
                  setHours(h % 12 || 12);
                  setMinutes(m);
                }}
                className="px-3 py-1 rounded-lg text-[10px] font-black bg-white/10 text-white hover:bg-white/20 transition-all mb-1"
                title="Set to Current Time"
              >NOW</button>
              <button 
                onClick={() => setPeriod('AM')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${period === 'AM' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}
              >AM</button>
              <button 
                onClick={() => setPeriod('PM')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${period === 'PM' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}
              >PM</button>
            </div>
          </div>
        </div>

        {/* Clock Body */}
        <div className="p-6 flex flex-col items-center">
          <div 
            ref={clockRef}
            onMouseDown={onMouseDown}
            className="relative w-[240px] h-[240px] rounded-full bg-slate-900/50 border border-white/5 flex items-center justify-center cursor-pointer select-none"
          >
            {/* Center dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 z-50 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            
            {/* Pointer / Needle */}
            <div 
              className="absolute bottom-1/2 left-1/2 origin-bottom transition-all duration-300 ease-out"
              style={{
                width: 2,
                height: 90,
                background: 'linear-gradient(to top, #6366F1, #818CF8)',
                transform: `translateX(-50%) rotate(${pointerAngle}deg)`,
                zIndex: 5
              }}
            >
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-indigo-600 shadow-lg border border-white/20"
              />
            </div>

            {/* Numbers */}
            {renderNumbers()}
          </div>

          {/* Actions */}
          <div className="flex gap-4 w-full mt-8">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all"
            >Cancel</button>
            <button 
              onClick={handleSelect}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all"
            >Select</button>
          </div>
        </div>

      </div>
    </div>
  );
}
