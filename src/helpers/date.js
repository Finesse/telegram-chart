export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const weekDays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const timestampInDay = 86400000;

export function formatDateForDateScale(timestamp) {
  const date = new Date(timestamp);
  return months[date.getUTCMonth()].slice(0, 3) + ' ' + date.getUTCDate();
}

export function getDayInMonth(timestamp) {
  return new Date(timestamp).getUTCDate();
}

export function getDayInWeekAndMonth(timestamp) {
  const date = new Date(timestamp);
  return weekDays[date.getUTCDay()].slice(0, 3)
    + ', ' + date.getUTCDate();
}

export function getDateComponentsForRange(timestamp) {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();

  return {
    year,
    month: year * 12 + monthIndex,
    day: Math.floor(timestamp / timestampInDay)
  };
}
