const interpolate = require("color-interpolate")
const { last } = require("lodash")
const numberOfColorChanges = 50
const progressIncrement = 1 / numberOfColorChanges

module.exports = ({
    colors = ["red", "orange", "yellow", "#00ff00", "blue", "indigo", "violet"],
    numCycles = 2,
    lastNote: { start: lastNoteStart }
}) => {
    const colorPalette = []
    let i = numCycles
    while (i > 0) {
        colorPalette.push(...colors)
        i--
    }
    const colorMap = interpolate(colorPalette)
    const lookup = []
    let progress = 0
    while (progress <= 1) {
        lookup.push({ fillStyle: colorMap(progress)})
        progress += progressIncrement
    }
    return ({ start }) => lookup[Math.floor(start / lastNoteStart / progressIncrement)] || last(lookup)
}