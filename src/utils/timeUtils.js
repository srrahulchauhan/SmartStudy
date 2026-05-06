import { addHours, addMinutes, differenceInMinutes, parse, format, isAfter, isBefore, isEqual, differenceInSeconds } from 'date-fns';

export const parseTime = (timeStr, baseDate = new Date()) => {
  if (!timeStr) return null;
  return parse(timeStr, 'HH:mm', baseDate);
};

export const formatTime = (date, pattern = 'HH:mm') => {
  if (!date) return '';
  return format(date, pattern);
};

export const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '';
  // If it's already in a format that parseTime can handle (HH:mm)
  const date = parseTime(timeStr);
  if (!date) return timeStr;
  return format(date, 'hh:mm b').toUpperCase();
};

export const formatDisplayDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd-MM-yyyy');
};

export const formatFullDateTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM, hh:mm b');
};



// Calculates the end time given a start time string and duration in hours
export const calculateEndTime = (startTimeStr, durationHours) => {
  const start = parseTime(startTimeStr);
  if (!start) return '';
  const minutes = Math.floor(durationHours * 60);
  const end = addMinutes(start, minutes);
  return formatTime(end);
};

// Calculates the duration in hours given a start and end time string
export const calculateDuration = (startTimeStr, endTimeStr) => {
  const start = parseTime(startTimeStr);
  const end = parseTime(endTimeStr);
  if (!start || !end) return 0;
  
  // Handle cross-midnight if end time is earlier than start time (assume next day)
  let diffMinutes = differenceInMinutes(end, start);
  if (diffMinutes < 0) {
     diffMinutes += 24 * 60;
  }
  
  return diffMinutes / 60;
};

// Determines how many minutes late a task was started
export const calculateDelayMinutes = (plannedStartTimeStr, actualStartDate) => {
  const plannedStart = parseTime(plannedStartTimeStr);
  if (!plannedStart || !actualStartDate) return 0;
  
  if (isAfter(actualStartDate, plannedStart)) {
    return differenceInMinutes(actualStartDate, plannedStart);
  }
  return 0; // Not delayed if started on time or early
};

// Shifts a specific time string by a number of minutes
export const shiftTime = (timeStr, minutesToShift) => {
  const time = parseTime(timeStr);
  if (!time) return '';
  return formatTime(addMinutes(time, minutesToShift));
};

// Shifts all subsequent tasks based on a delay introduced by a previous task
export const shiftSubsequentTasks = (tasks, startIndex, delayMinutes) => {
  if (delayMinutes === 0) return tasks;

  return tasks.map((task, index) => {
    // Only shift tasks that come AFTER the current task
    if (index > startIndex) {
      return {
        ...task,
        plannedStart: shiftTime(task.plannedStart, delayMinutes),
        plannedEnd: shiftTime(task.plannedEnd, delayMinutes)
      };
    }
    return task; // Return task unchanged if it's the current or previous task
  });
};

export const getRemainingSeconds = (endDate) => {
    if(!endDate) return 0;
    const diff = differenceInSeconds(endDate, new Date());
    return diff > 0 ? diff : 0;
};
