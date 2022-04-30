const { curryRight, round } = require("lodash")

module.exports = curryRight(round)(2)
