export const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sen',
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
  'San'
];

export function formatDate(timestamp, withWeekDay) {
  const date = new Date(timestamp);
  return `${withWeekDay ? `${weekDays[date.getUTCDay()]}, ` : ''}${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
}
