const { keyBy } = require("lodash")

const initKeyswitcher = ({
    color = 'white',
    keyswitches = [],
}) => {
    const keyswitchLookup = keyBy(keyswitches, 'midiNoteNumber')
    let activeKeyswitchColor = color

    const getCurrentColor = ({ midiNoteNumber }) => {
        const keyswitch = keyswitchLookup[midiNoteNumber]
        if (keyswitch) {
            activeKeyswitchColor = keyswitch.color
        }
        return activeKeyswitchColor || color
    }

    return {
        getCurrentColor,
    }
}

module.exports = ({
    fallbackColor = 'white',
    tracks = [],
}) => {
    const trackKeyswitchers = {}
    tracks.forEach((track, index) => {
        trackKeyswitchers[index] = initKeyswitcher(track)
    })
    return (note) => {
        const { track } = note
        return trackKeyswitchers[track]?.getCurrentColor(note) || fallbackColor
    }
}