const hbs = require('hbs')

hbs.registerHelper("loud", val => {
  return val.toUpperCase()
})

hbs.registerHelper("isnt", (a, b, opts) => {
  if (a != b) {
    return opts.fn(this)
  } else {
    return opts.inverse(this)
  }
})
