const randomString = (i) => {
  let rnd = ''
  while (rnd.length < i) rnd += Math.random().toString(36).substring(2)
  return rnd.substring(0, i)
}

const throttle = (fn, threshhold = 250, scope) => {
  let last
  let deferTimer
  // eslint-disable-next-line func-names
  return function (...args) {
    const context = scope || this

    const now = +new Date()
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer)
      deferTimer = setTimeout(() => {
        last = now
        fn.apply(context, args)
      }, threshhold)
    } else {
      last = now
      fn.apply(context, args)
    }
  }
}

const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function isDomElement(obj) {
  return !!(obj && obj.nodeType === 1)
}

export { randomString, throttle, capitalize, isDomElement }
