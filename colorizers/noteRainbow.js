module.exports = ({colors = ["red", "orange", "yellow", "#00ff00", "blue", "indigo", "violet"], startingNote = 21}) => ({midiNoteNumber}) => {
    return colors[Math.abs(midiNoteNumber - startingNote) % colors.length]
}