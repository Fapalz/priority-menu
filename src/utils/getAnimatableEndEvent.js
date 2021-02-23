import capitalize from './index'

/**
 * getAnimatableEndEvent
 *
 * returns the name of transitionend/animationend event for cross browser compatibility
 *
 * @param {string} type of the animatableEvent: 'transition' or 'animation'
 * @returns {string} the transitionend/animationend event name
 */
const getAnimatableEndEvent = function whichAnimationType(type) {
  let animatableEvent

  const el = document.createElement('fakeelement')
  const capitalType = capitalize(type)

  const animations = {
    [type]: `${type}end`,
    [`O${capitalType}`]: `o${capitalType}End`,
    [`Moz${capitalType}`]: `${type}end`,
    [`Webkit${capitalType}`]: `webkit${capitalType}End`,
    [`MS${capitalType}`]: `MS${capitalType}End`,
  }

  const hasEventEnd = Object.keys(animations).some((item) => {
    if (el.style[item] !== undefined) {
      animatableEvent = animations[item]
      return true
    }

    return false
  })

  if (!hasEventEnd) {
    throw new Error(`${type}end is not supported in your web browser.`)
  }

  return animatableEvent
}

export default getAnimatableEndEvent
