export const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

export const weekDays = [
  'Sun',
  'Mon',
  'Tue',
  'Wen',
  'Thu',
  'Fri',
  'Sat'
];

export function formatDate(timestamp, withWeekDay) {
  const date = new Date(timestamp);
  return `${withWeekDay ? `${weekDays[date.getUTCDay()]}, ` : ''}${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
}
