const msInDay = 86400 * 1000;
const colors = ['#3cc23f', '#f34c44', '#65b9ac', '#4682b4', '#c8f344', '#e044f3'];
const maxRandomColumns = 500;

export default function makeBigChartData(daysCount, linesCount = 6) {
  const dates = [Date.now() - daysCount * msInDay];
  const linesValues = [];

  for (let i = 0; i < linesCount; ++i) {
    linesValues[i] = [
      100 + Math.floor(Math.random() * 900)
    ];
  }

  for (let i = 1; i < daysCount; ++i) {
    dates[i] = dates[0] + i * msInDay;

    for (let j = 0; j < linesCount; ++j) {
      if (j < maxRandomColumns) {
        linesValues[j][i] = Math.floor(linesValues[j][0] * (0.8 + Math.random() * 0.4));
      } else {
        linesValues[j][i] = linesValues[j][i % maxRandomColumns];
      }
    }
  }

  const linesData = {};
  for (let i = 0; i < linesCount; ++i) {
    linesData[`y${i}`] = {
      name: `Series #${i}`,
      color: colors[i % colors.length],
      values: linesValues[i]
    };
  }

  return {
    name: `${daysCount} columns`,
    dates,
    lines: linesData
  };
}
