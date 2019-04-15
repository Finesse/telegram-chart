export function quadInOut(t) {
  t *= 2;

  if (t <= 1) {
    return t * t / 2;
  }

  --t;
  return (t * (2 - t) + 1) / 2;
}

export function quadOut(t) {
  return 1 - (1 - t) * (1 - t);
}

export function cubicOut(t) {
  --t;
  return t * t * t + 1;
}
