import {chartMapHeight} from '../style';

export default function updateSVG(svgElement, drawData) {
  const canvasWidth = 500;
  const canvasHeight = 400;

  const yRange = (drawData.maxY - drawData.minY) || 1;
  const minY = drawData.minY - yRange * 0.03;
  const maxY = drawData.maxY + yRange * 0.03;

  let pathIndex = 0;
  for (const {opacity, color, values} of drawData.lines) {
    if (opacity <= 0) {
      continue;
    }

    let d = '';
    for (let i = 0; i < values.length; ++i) {
      const x = i / (values.length - 1) * canvasWidth;
      const y = canvasHeight - (values[i] - minY) / (maxY - minY) * chartMapHeight;

      if (i === 0) {
        d += `M ${x} ${y}`;
      } else {
        d += ` L ${x} ${y}`;
      }
    }

    if (!svgElement.children[pathIndex]) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-width', 1);
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svgElement.appendChild(path);
    }

    const path = svgElement.children[pathIndex];
    path.setAttribute('stroke', color);
    path.setAttribute('d', d);

    ++pathIndex;
  }

  while (svgElement.children[pathIndex]) {
    svgElement.removeChild(svgElement.children[pathIndex]);
  }
}
