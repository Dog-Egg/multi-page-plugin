module.exports.matcher = function (matches) {
  function indexOf (value) {
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      if ((typeof match === 'string' && match === value) || (match instanceof RegExp && match.test(value))) {
        return i
      }
    }
    return -1
  }

  return function (a, b) {
    return indexOf(a) - indexOf(b)
  }
}
