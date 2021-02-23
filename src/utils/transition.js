/* eslint-disable import/no-mutable-exports */
/* eslint-disable no-nested-ternary */
import { inBrowser, isIE9 } from './env'

export const hasTransition = inBrowser && !isIE9
const TRANSITION = 'transition'
const ANIMATION = 'animation'

// Transition property/event sniffing
export let transitionProp = 'transition'
export let transitionEndEvent = 'transitionend'
export let animationProp = 'animation'
export let animationEndEvent = 'animationend'
if (hasTransition) {
  /* istanbul ignore if */
  if (
    window.ontransitionend === undefined &&
    window.onwebkittransitionend !== undefined
  ) {
    transitionProp = 'WebkitTransition'
    transitionEndEvent = 'webkitTransitionEnd'
  }
  if (
    window.onanimationend === undefined &&
    window.onwebkitanimationend !== undefined
  ) {
    animationProp = 'WebkitAnimation'
    animationEndEvent = 'webkitAnimationEnd'
  }
}

// binding to window is necessary to make hot reload work in IE in strict mode
const raf = inBrowser
  ? window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : setTimeout
  : (fn) => fn()

// Old versions of Chromium (below 61.0.3163.100) formats floating pointer numbers
// in a locale-dependent way, using a comma instead of a dot.
// If comma is not replaced with a dot, the input will be rounded down (i.e. acting
// as a floor function) causing unexpected behaviors
function toMs(s) {
  return Number(s.slice(0, -1).replace(',', '.')) * 1000
}

function getTimeout(delays, durations) {
  while (delays.length < durations.length) {
    // eslint-disable-next-line no-param-reassign
    delays = delays.concat(delays)
  }

  return Math.max.apply(
    null,
    durations.map((d, i) => {
      return toMs(d) + toMs(delays[i])
    })
  )
}

const transformRE = /\b(transform|all)(,|$)/

export function getTransitionInfo(el, expectedType) {
  const styles = window.getComputedStyle(el)
  // JSDOM may return undefined for transition properties
  const transitionDelays = (styles[`${transitionProp}Delay`] || '').split(', ')
  const transitionDurations = (styles[`${transitionProp}Duration`] || '').split(
    ', '
  )
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations)
  const animationDelays = (styles[`${animationProp}Delay`] || '').split(', ')
  const animationDurations = (styles[`${animationProp}Duration`] || '').split(
    ', '
  )
  const animationTimeout = getTimeout(animationDelays, animationDurations)

  let type
  let timeout = 0
  let propCount = 0
  /* istanbul ignore if */
  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION
      timeout = transitionTimeout
      propCount = transitionDurations.length
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION
      timeout = animationTimeout
      propCount = animationDurations.length
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout)
    type =
      timeout > 0
        ? transitionTimeout > animationTimeout
          ? TRANSITION
          : ANIMATION
        : null
    propCount = type
      ? type === TRANSITION
        ? transitionDurations.length
        : animationDurations.length
      : 0
  }
  const hasTransform =
    type === TRANSITION && transformRE.test(styles[`${transitionProp}Property`])
  return {
    type,
    timeout,
    propCount,
    hasTransform,
  }
}

export function whenTransitionEnds(el, expectedType, cb) {
  const { type, timeout, propCount } = getTransitionInfo(el, expectedType)
  if (!type) return cb()
  const event = type === TRANSITION ? transitionEndEvent : animationEndEvent
  let ended = 0
  const end = () => {
    // eslint-disable-next-line no-use-before-define
    el.removeEventListener(event, onEnd)
    cb()
  }
  const onEnd = (e) => {
    if (e.target === el) {
      ended += 1
      if (ended >= propCount) {
        end()
      }
    }
  }
  setTimeout(() => {
    if (ended < propCount) {
      end()
    }
  }, timeout + 1)
  el.addEventListener(event, onEnd)
  return el
}

export function nextFrame(fn) {
  raf(() => {
    raf(fn)
  })
}
