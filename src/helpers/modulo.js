// https://stackoverflow.com/q/4467539/1118709
export default function modulo(dividend, divider) {
  return ((dividend % divider) + divider) % divider;
}
