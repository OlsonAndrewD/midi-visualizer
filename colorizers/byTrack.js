const { chain } = require("lodash")

const initKeyswitcher = ({
    color = 'white',
    keyswitches = [],
}) => {
    const defaultColor = { fillStyle: color }
    const keyswitchColorLookup = chain(keyswitches)
        .keyBy('midiNoteNumber')
        .mapValues(({ color }) => { fillStyle: color })
        .value()
    let activeKeyswitchColor = defaultColor

    const getCurrentColor = ({ midiNoteNumber }) => {
        activeKeyswitchColor = keyswitchColorLookup[midiNoteNumber] || activeKeyswitchColor
        return activeKeyswitchColor || defaultColor
    }

    return {
        getCurrentColor,
    }
}

module.exports = ({
    fallbackColor = 'white',
    tracks = [],
}) => {
    fallbackColor = { fillStyle: fallbackColor }
    const trackKeyswitchers = {}
    tracks.forEach((track, index) => {
        trackKeyswitchers[index] = initKeyswitcher(track)
    })
    return (note) => {
        const { track } = note
        return trackKeyswitchers[track]?.getCurrentColor(note) || fallbackColor
    }
}