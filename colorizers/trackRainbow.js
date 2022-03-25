const { keyBy } = require("lodash")

const initKeyswitcher = (keyswitches) => {
    const keyswitchLookup = keyBy(keyswitches, 'midiNoteNumber')
    const currentColorByTrack = {}

    const handleNote = ({ midiNoteNumber, track }) => {
        const keyswitch = keyswitchLookup[midiNoteNumber]
        if (keyswitch) {
            currentColorByTrack[track] = keyswitch.color
        }
    }

    const getCurrentColorForTrack = (track) => currentColorByTrack[track]

    return {
        handleNote,
        getCurrentColorForTrack,
    }
}

module.exports = ({
    colors = ["red", "orange", "yellow", "#00ff00", "blue", "indigo", "violet"],
    startingTrack = 0,
    keyswitches = [],
}) => {
    const keyswitcher = initKeyswitcher(keyswitches)
    return (note) => {
        const { track } = note
        keyswitcher.handleNote(note)
        const keyswitchColor = keyswitcher.getCurrentColorForTrack(track)
        return keyswitchColor || colors[Math.abs(track - startingTrack) % colors.length]
    }
}