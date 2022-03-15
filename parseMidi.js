const midiParser = require("midi-parser-js")
const {readFileSync} = require("fs")
const { defaults, first } = require("lodash")

// There seems to be a bug in the midi-parser-js code that handles meta events.
// It reads twice as many data bytes as it should, effectively causing it to skip data
// that shouldn't be read as part of the unknown event.
// But if we give it a customInterpreter to invoke for unknown events, we can make it read the correct number of bytes.
// So, here's a customInterpreter that just reads it but ignores the result.
midiParser.customInterpreter = (msgType, arrayBuffer, metaEventLength) => {
    arrayBuffer.readInt(metaEventLength)
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
    var playingNotes = {}
    var sustainingNotes = []
    const allTempoChanges = []
    var nextTempoChanges = []
    var mostRecentTempoChange = null
    var currentTick = 0
    var ticksPerQuarterNote = data.timeDivision
    function ticksToMilliseconds(ticks, tempo = {}) {
        tempo = defaults(tempo, {
            millisecondsPerQuarterNote: 400,
            start: 0,
            tick: 0
        })
        const ticksSinceLastTempoChange = ticks - tempo.tick
        return tempo.start + (ticksSinceLastTempoChange / ticksPerQuarterNote) * tempo.millisecondsPerQuarterNote
    }
    data.track.forEach(track => {
        var sustainPedalIsDown = false

        track.event.forEach(event => {
            currentTick += event.deltaTime

            // tempo
            if(event.metaType == 81) {
                const newTempoChange = {
                    millisecondsPerQuarterNote: Math.round(event.data / 1000),
                    start: ticksToMilliseconds(currentTick, mostRecentTempoChange),
                    tick: currentTick,
                }
                allTempoChanges.push(newTempoChange)
                nextTempoChanges.push(newTempoChange)
            }
            const nextTempoChange = first(nextTempoChanges)
            if(nextTempoChange && currentTick >= nextTempoChange.tick) {
                mostRecentTempoChange = nextTempoChanges.shift()
            }

            // sustain pedal
            if(event.type == 11 && event.data[0] == 64) {
                const sustainPedalIsLifting = sustainPedalIsDown && event.data[1] < 64
                if (sustainPedalIsLifting) {
                    sustainingNotes.forEach(note => {
                        note.sustainEnd = ticksToMilliseconds(currentTick, mostRecentTempoChange)
                    })
                    sustainingNotes = []
                }
                sustainPedalIsDown = event.data[1] >= 64
            }

            // note on
            if(event.type == 9) {
                playingNotes[event.data[0]] = {
                    midiNoteNumber: event.data[0],
                    start: ticksToMilliseconds(currentTick, mostRecentTempoChange),
                }
            }

            // note off
            if(event.type == 8) {
                var currentNote = playingNotes[event.data[0]]
                if(currentNote) {
                    currentNote.end = ticksToMilliseconds(currentTick, mostRecentTempoChange)
                    notes.push(currentNote)
                    if(sustainPedalIsDown) {
                        sustainingNotes.push(currentNote)
                    }
                    delete playingNotes[event.data[0]]
                }
            }
        })
        if (sustainingNotes.length) {
            sustainingNotes.forEach(note => {
                note.sustainEnd = ticksToMilliseconds(currentTick, mostRecentTempoChange)
            })
        }
        playingNotes = {}
        sustainingNotes = []
        currentTick = 0
        nextTempoChanges = [...allTempoChanges]
        mostRecentTempoChange = null
    })
    return {notes}
}