export const WORKING_HOURS = {
  startHour: 9,
  endHour: 18,
};

export const SLOT_INTERVAL_MINUTES = 60;
export const DAILY_BOOKING_LIMIT = 8;
export const SLOT_CAPACITY_LIMIT = 2;

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (
    let totalMinutes = WORKING_HOURS.startHour * 60;
    totalMinutes < WORKING_HOURS.endHour * 60;
    totalMinutes += SLOT_INTERVAL_MINUTES
  ) {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  }
  return slots;
}

export function getDateKey(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

export function getTimeKey(isoDateTime: string): string {
  return isoDateTime.slice(11, 16);
}
