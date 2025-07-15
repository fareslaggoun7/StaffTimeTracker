import { Shift, PunchRecord } from '@shared/schema';

export interface ShiftMatch {
  shift: Shift;
  status: 'On-Time' | 'Late' | 'Unmatched';
  timeDifference: number;
}

export function findBestShiftMatch(
  punchRecord: PunchRecord,
  shifts: Shift[],
  gracePeriodMinutes: number = 15
): ShiftMatch | null {
  const punchTime = timeToMinutes(punchRecord.time);
  let bestMatch: ShiftMatch | null = null;
  let bestScore = Infinity;

  for (const shift of shifts) {
    const shiftStartTime = timeToMinutes(shift.startTime);
    let timeDifference: number;

    if (shift.isOvernight) {
      // Handle overnight shifts
      if (punchTime >= shiftStartTime) {
        // Same day punch-in
        timeDifference = punchTime - shiftStartTime;
      } else {
        // Next day punch-in (within overnight shift window)
        timeDifference = (24 * 60 - shiftStartTime) + punchTime;
        
        // Only consider if it's within a reasonable overnight window
        if (timeDifference > 12 * 60) {
          continue;
        }
      }
    } else {
      // Regular day shift
      timeDifference = punchTime - shiftStartTime;
    }

    // Only consider if punch is after shift start
    if (timeDifference >= 0 && timeDifference < bestScore) {
      bestScore = timeDifference;
      const status = timeDifference <= gracePeriodMinutes ? 'On-Time' : 'Late';
      
      bestMatch = {
        shift,
        status,
        timeDifference,
      };
    }
  }

  return bestMatch;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function isOvernightShift(startTime: string, endTime: string): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end < start;
}

export function calculateShiftEndDateTime(
  date: string,
  startTime: string,
  endTime: string,
  isOvernight: boolean
): string {
  if (isOvernight) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return `${nextDay.toISOString().split('T')[0]} ${endTime}`;
  }
  return `${date} ${endTime}`;
}
