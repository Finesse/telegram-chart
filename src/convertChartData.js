import {hexColorToNumber} from './helpers/color';

/**
 * Converts the input JSON into a more convenient format
 *
 * @param {{}[]} data The input data in the original contest JSON format
 * @return {{}[]}
 */

export default function convertChartData(data) {
  return data.map(({name, columns, types, names, colors}, index) => {
    // Determine what columns are Xs and what are Ys
    let datesKey;
    const valuesKeys = [];
    for (const [key, type] of Object.entries(types)) {
      switch (type) {
        case 'x':
          datesKey = key;
          break;
        case 'line':
          valuesKeys.push(key);
          break;
        default:
          // todo: Support other types
          valuesKeys.push(key);
          // console.warn(`Unknown column type "${type}" under key "${key}"`);
      }
    }

    // Index the columns
    const indexedColumns = {};
    for (const [key, ...values] of columns) {
      indexedColumns[key] = values;
    }

    if (datesKey === undefined || !indexedColumns[datesKey]) {
      throw new Error(`There is no x column in data[${index}]`);
    }

    const lines = {};
    for (const yKey of valuesKeys) {
      lines[yKey] = {
        name: names[yKey],
        color: hexColorToNumber(colors[yKey]),
        values: indexedColumns[yKey]
      };
    }

    return {
      name: name || `Data #${index + 1}`,
      dates: indexedColumns[datesKey],
      lines
    };
  });
}
