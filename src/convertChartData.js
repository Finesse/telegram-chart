import {hexColorToNumber} from './helpers/color';
import {TYPE_LINE, TYPE_LINE_TWO_Y, TYPE_BAR, TYPE_AREA} from './namespace';

/**
 * Converts the input JSON into a more convenient format
 *
 * @param {{}[]} data The input data in the original contest JSON format
 * @return {{}[]}
 */

export default function convertChartData(data) {
  return data.map(({name, columns, types, names, colors, y_scaled}, index) => {
    let type;

    // Determine what columns are Xs and what are Ys
    let datesKey;
    const valuesKeys = [];
    for (const [key, lineType] of Object.entries(types)) {
      if (lineType === 'x') {
        datesKey = key;
      } else {
        valuesKeys.push(key);

        if (!type) {
          switch (lineType) {
            case 'line':
              type = y_scaled ? TYPE_LINE_TWO_Y : TYPE_LINE;
              break;
            case 'bar':
              type = TYPE_BAR;
              break;
            case 'area':
              type = TYPE_AREA;
              break;
          }
        }
      }
    }

    if (!type) {
      console.warn(`Unknown chart type under index ${index}`);
      type = TYPE_LINE;
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
      type,
      dates: indexedColumns[datesKey],
      lines
    };
  });
}
