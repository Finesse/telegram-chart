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

export function getDateParts(timestamp, withWeekDay) {
  const date = new Date(timestamp);
  const parts = {
    day: date.getUTCDate(),
    monthIndex: date.getUTCMonth()
  };

  if (withWeekDay) {
    parts.weekDay = date.getUTCDay();
  }

  return parts;
}

export function formatDate(timestamp, withWeekDay) {
  const {day, monthIndex, weekDay} = getDateParts(timestamp, withWeekDay);
  return `${withWeekDay ? `${weekDays[weekDay]}, ` : ''}${months[monthIndex]} ${day}`;
}
