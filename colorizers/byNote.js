const { mapValues } = require("lodash")

module.exports = ({
    defaultColor = 'white',
    noteColors = [],
    track: { noteMap }
}) => {
    defaultColor = { fillStyle: defaultColor }
    noteColors = mapValues(noteColors, color => ({ fillStyle: color }))
    const getColor = noteMap
        ? (midiNoteNumber) => noteColors[noteMap[midiNoteNumber] || 'unknown']
        : (midiNoteNumber) => noteColors[midiNoteNumber]
    return ({ midiNoteNumber }) => getColor(midiNoteNumber) || defaultColor
}