module.exports = ({
    colors = ["red", "orange", "yellow", "#00ff00", "blue", "indigo", "violet"],
    startingNote = 21
}) => {
    const palette = colors.map(c => { fillStyle: c })
    return ({ midiNoteNumber }) => palette[Math.abs(midiNoteNumber - startingNote) % colors.length]
}
