const midiParser = require("midi-parser-js")
const {readFileSync} = require("fs")
const {last} = require("lodash")

// There seems to be a bug in the midi-parser-js code that handles meta events.
// It reads twice as many data bytes as it should, effectively causing it to skip data
// that shouldn't be read as part of the unknown event.
// But if we give it a customInterpreter to invoke for unknown events, we can make it read the correct number of bytes.
// So, here's a customInterpreter that just reads it but ignores the result.
midiParser.customInterpreter = (msgType, arrayBuffer, metaEventLength) => {
    arrayBuffer.readInt(metaEventLength)
    console.log(`returning 0 for data of unknown msgType ${msgType} of length ${metaEventLength}`)
    return 0
}

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
    var ticksPerQuarterNote = data.timeDivision
    var tempoChanges = []
    function ticksToMilliseconds(ticks) {
        for (let i = 0; i < tempoChanges.length; i++) {
            const tempoChange = tempoChanges[(tempoChanges.length - 1) - i];
            if(currentTick >= tempoChange.startTick) {
                return Math.round(((ticks / ticksPerQuarterNote) * tempoChange.msPerQuarterNote) + tempoChange.startTime)
            }
        }
    }
    data.track.forEach(track => {
        track.event.forEach(event => {
            currentTick += event.deltaTime
            if(event.metaType == 81) {
                tempoChanges.push({
                    msPerQuarterNote: event.data / 1000,
                    startTick: currentTick,
                    startTime: last(tempoChanges) ? (last(tempoChanges).startTime) + (currentTick - (last(tempoChanges).startTick) / ticksPerQuarterNote * last(tempoChanges).msPerQuarterNote) : 0
                })
            }
        })
        currentTick = 0
    })
    data.track.forEach(track => {
        track.event.forEach(event => {
            currentTick += event.deltaTime
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