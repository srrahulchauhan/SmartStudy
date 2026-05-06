import { useState, useEffect, useRef, useCallback } from 'react';
import { getRemainingSeconds } from '../utils/timeUtils';

export function useTimer(activeTask, onTaskComplete) {
  const [remainingTime, setRemainingTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const audioRef = useRef(null);
  
  // Initialize audio object once
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Shorter SMS-style notification ping
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/237/237-preview.mp3'); 
      audioRef.current.loop = true;
    }
  }, []);

  const playAlert = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.play().catch(e => console.warn('Audio play failed - requires user interaction first', e));
    }
    // Trigger device vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
    }
  }, []);

  const stopAlert = useCallback(() => {
     if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    // Stop vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(0);
    }
  }, []);

  useEffect(() => {
    let intervalId;

    if (activeTask && activeTask.status === 'running' && !activeTask.isPaused) {
      setIsRunning(true);
      // We calculate time based on end target to prevent drift
      const targetEnd = new Date(activeTask.actualEndTarget);
      
      const updateTimer = () => {
         const seconds = getRemainingSeconds(targetEnd);
         setRemainingTime(seconds);
         
         if (seconds <= 0) {
            setIsRunning(false);
            clearInterval(intervalId);
            playAlert();
            if (onTaskComplete) {
                onTaskComplete(activeTask.id);
            }
         }
      };
      
      // Init immediately
      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
    } else {
        setIsRunning(false);
        // If it's paused, we don't reset remainingTime to 0
        if (!activeTask || activeTask.status !== 'running') {
          setRemainingTime(0);
        }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTask, activeTask?.isPaused, onTaskComplete, playAlert]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return { remainingTime, formatTime, isRunning, stopAlert };
}
