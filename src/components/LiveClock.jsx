import React, { useState, useEffect } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatIndianTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hStr = hours.toString().padStart(2, '0');
    const mStr = minutes.toString().padStart(2, '0');
    const sStr = seconds.toString().padStart(2, '0');
    
    return { hStr, mStr, sStr, ampm };
  };

  const { hStr, mStr, sStr, ampm } = formatIndianTime(time);

  return (
    <div className="flex items-center gap-3 group px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl md:text-3xl font-black tracking-tight text-white tabular-nums">
          {hStr}:{mStr}
        </span>
        <span className="text-[10px] font-black text-indigo-400 animate-pulse w-4">
          {sStr}
        </span>
        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">{ampm}</span>
      </div>
    </div>
  );
}
