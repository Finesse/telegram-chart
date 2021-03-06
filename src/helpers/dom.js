const tempBlock = document.createElement('div');

export function htmlToElements(html) {
  tempBlock.innerHTML = html;
  return Array.prototype.slice.apply(tempBlock.children);
}

export function htmlToElement(html) {
  tempBlock.innerHTML = html;
  return tempBlock.firstElementChild;
}

export function setCSSTransform(element, value) {
  element.style.webkitTransform = element.style.transform = value;
}
