/**
 * Converts the input JSON into a more convenient format
 *
 * @param {{}[]} data The input data in the original contest JSON format
 * @return {{}[]}
 */
export default function convertChartData(data) {
  return data.map(({columns, types, names, colors}, index) => {
    // Determine what columns are Xs and what are Ys
    let xKey;
    const yKeys = [];
    for (const [key, type] of Object.entries(types)) {
      switch (type) {
        case 'x':
          xKey = key;
          break;
        case 'line':
          yKeys.push(key);
          break;
        default:
          console.warn(`Unknown column type "${type}" under key "${key}"`);
      }
    }

    // Index the columns
    const indexedColumns = {};
    for (const [key, ...values] of columns) {
      indexedColumns[key] = values;
    }

    if (xKey === undefined || !indexedColumns[xKey]) {
      throw new Error(`There is no x column in data[${index}]`);
    }

    const lines = {};
    for (const yKey of yKeys) {
      lines[yKey] = {
        name: names[yKey],
        color: colors[yKey],
        values: indexedColumns[yKey]
      };
    }

    return {
      name: `Data #${index + 1}`,
      x: indexedColumns[xKey],
      lines
    };
  });
}
