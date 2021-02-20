const randomString = (i) => {
  let rnd = '';
  while (rnd.length < i)
    rnd += Math.random().toString(36).substring(2);
  return rnd.substring(0, i);
};


const throttle = (fn, threshhold, scope) => {
  threshhold || (threshhold = 250);
  let last,
    deferTimer;
  return function () {
    let context = scope || this;

    let now = +new Date,
      args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function isDomElement(obj) {
  return !!(obj && obj.nodeType === 1);
}

export { randomString, throttle, capitalize, isDomElement }