import { isIOS} from './env'



/**
 * Returns a scrollbar width
 * @private
 * @returns {Number}
 */
function getScrollbarWidth() {
  if (document.documentElement.scrollHeight <= document.documentElement.clientHeight) {
    return 0;
  }

  var outer = document.createElement('div');
  var inner = document.createElement('div');
  var widthNoScroll;
  var widthWithScroll;

  outer.style.visibility = 'hidden';
  outer.style.width = '100px';
  document.body.appendChild(outer);

  widthNoScroll = outer.offsetWidth;

  // Force scrollbars
  outer.style.overflow = 'scroll';

  // Add inner div
  inner.style.width = '100%';
  outer.appendChild(inner);

  widthWithScroll = inner.offsetWidth;

  // Remove divs
  outer.parentNode.removeChild(outer);

  return widthNoScroll - widthWithScroll;
}

const html = document.documentElement;
let scrollPosition = 0;
const body = document.body;

function lockScreen(lockedClass = 'scroll-locked') {
  
  
  
  const bodyStyle = getComputedStyle(body);
  let paddingRight;

  if (html.classList.contains(lockedClass)) return

  paddingRight = parseInt(bodyStyle.paddingRight, 10) + getScrollbarWidth();

  body.style.paddingRight = `${paddingRight}px`
  html.classList.add(lockedClass);
  if (isIOS) {
    scrollPosition = window.pageYOffset;
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollPosition}px`;
    body.style.width = '100%';
  } else {

  }
}

function unlockScreen(lockedClass = 'scroll-locked') {

  
  const bodyStyle = getComputedStyle(body);
  let paddingRight;

  if (!html.classList.contains(lockedClass)) return

  paddingRight = parseInt(bodyStyle.paddingRight, 10) - getScrollbarWidth();

  body.style.paddingRight = `${paddingRight}px`
  html.classList.remove(lockedClass);

  if (isIOS) {
    body.style.removeProperty('overflow');
    body.style.removeProperty('position');
    body.style.removeProperty('top');
    body.style.removeProperty('width');
    window.scrollTo(0, scrollPosition);
  } else {

  }
}

export { lockScreen, unlockScreen}