const midiParser = require("midi-parser-js")
const {readFileSync} = require("fs")

module.exports = (midiFileName) => {
    var data = midiParser.parse(readFileSync(midiFileName, "base64"))
    // console.log(data)
    // data.track.forEach(track => {
    //     track.event.forEach(x => console.log(x))
    //     console.log('———————')
    // })
    var notes = []
    var currentNotes = {}
    var currentTick = 0
    var millisecondsPerQuarterNote = 400
    var ticksPerQuarterNote = data.timeDivision
    function ticksToMilliseconds(ticks) {
        return (ticks / ticksPerQuarterNote) * millisecondsPerQuarterNote
    }
    data.track.forEach(track => {
        track.event.forEach(event => {
            currentTick += event.deltaTime
            if(event.metaType == 81) {
                millisecondsPerQuarterNote = Math.round(event.data / 1000)
            }
            if(event.type == 9) {
                currentNotes[event.data[0]] = {
                    startTick: currentTick
                }
            }
            if(event.type == 8) {
                var currentNote = currentNotes[event.data[0]]
                if(currentNote) {
                    currentNote.endTick = currentTick
                    notes.push({
                        midiNoteNumber: event.data[0],
                        start: ticksToMilliseconds(currentNote.startTick),
                        end: ticksToMilliseconds(currentNote.endTick)
                    })
                    currentNotes[event.data[0]] = null
                }
            }
        })
        currentNotes = {}
        currentTick = 0
    })
    return {notes}
}