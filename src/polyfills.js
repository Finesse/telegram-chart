if (!Object.assign) {
  Object.assign = (target, ...sources) => {
    for (const source of sources) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };
}

if (!Object.entries) {
  Object.entries = object => {
    const entries = [];

    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        entries.push([key, object[key]]);
      }
    }

    return entries;
  };
}

if (!Object.values) {
  Object.values = object => {
    const values = [];

    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        values.push(object[key]);
      }
    }

    return values;
  };
}
