const { chain } = require("lodash")

module.exports = ({
    color = 'white',
    keyswitches = [],
}) => {
    const defaultColor = { fillStyle: color }
    const keyswitchColorLookup = chain(keyswitches)
        .keyBy('midiNoteNumber')
        .mapValues(({ color: keySwitchColor }) => keySwitchColor ? ({ fillStyle: keySwitchColor }) : defaultColor)
        .value()
    let activeKeyswitchColor = defaultColor

    const getCurrentColor = ({ midiNoteNumber }) => {
        const prevKeySwitchColor = activeKeyswitchColor
        activeKeyswitchColor = keyswitchColorLookup[midiNoteNumber] || activeKeyswitchColor
        if (activeKeyswitchColor !== prevKeySwitchColor) {
            console.log('activeKeySwitchColor', activeKeyswitchColor)
        }
        return activeKeyswitchColor || defaultColor
    }

    return (note) => {
        return getCurrentColor(note) || defaultColor
    }
}
