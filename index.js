const parseMidi = require('./parseMidi')
const layoutFrames = require('./layoutFrames')
const generateImages = require('./generateImages')
const createVideo = require('./createVideo')
const outputLine = require('./consoleColors')
const {existsSync, readFileSync} = require("fs")

const consoleStyles = {
    hideCursor: "\x1b[?25l",
    showCursor: "\x1b[?25h",
    moveCursorUp: (num) => {
        return {lines: `\x1b[${num}A`}
    },
    moveCursorDown: (num) => {
        return {lines: `\x1b[${num}B`}
    },
    moveCursorRight: (num) => {
        return {columns: `\x1b[${num}C`}
    },
    moveCursorLeft: (num) => {
        return {columns: `\x1b[${num}D`}
    },
    eraseLine: "\x1b[2K\r",
    greenDone: "\x1b[38;5;40m\x1b[48;5;0mDone\x1b[0m"
}

console.log(consoleStyles.hideCursor + consoleStyles.moveCursorUp(1).lines)

// const config = {
//     fps: 60,
//     noteApproachTime: 2000,
//     midiFileName: 'test-data/tempo-test.mid',
//     width: 480,
//     height: 360
// }
var config = {}
var configProps = [
    "fps",
    "noteApproachTime",
    "midiFileName",
    "width",
    "height"
]

const configFile = process.argv.slice(2)[0] || "./midiconfig.json"
if(existsSync(configFile)) {
    try {
        config = JSON.parse(readFileSync(configFile, {encoding: "utf8"}))
        var shouldError = false
        configProps.forEach(prop => {
            if(!shouldError && !config[prop]) {
                shouldError = true
                outputLine(196, 0, "Error: Missing config props:")
            }
            if(!config[prop]) outputLine(196, 0, `  ${prop}`.padEnd(28, " "))
        })
        if(shouldError) {
            console.log(consoleStyles.showCursor + consoleStyles.moveCursorUp(1).lines)
            process.exit(1)
        }
    } catch (err) {
        outputLine(196, 0, "Error: Could not parse config JSON.")
        console.error(err)
        process.exit(1)
    }
} else {
    outputLine(196, 0, `Error: ${configFile} does not exist.`)
    console.log(consoleStyles.showCursor + consoleStyles.moveCursorUp(1).lines)
    process.exit(1)
}

const visualizer = require(`./visualizers/${config.visualizer.type}`)(config.visualizer)

console.log('Parsing MIDI file...')
var song
try {
    song = parseMidi(config.midiFileName)
} catch (err) {
    outputLine(196, 0, "Error: Failed to parse MIDI.")
    console.error(err)
    console.log(consoleStyles.showCursor + consoleStyles.moveCursorUp(1).lines)
    process.exit(1)
}
console.log(consoleStyles.moveCursorUp(1).lines + consoleStyles.eraseLine + "Parsing MIDI file... " + consoleStyles.greenDone)

visualizer.prepareNotesForLayout && visualizer.prepareNotesForLayout(song.notes)

console.log(`Laying out and coloring frames for ${song.notes.length} notes...`)
var frames
try {
    frames = layoutFrames({config, song})
} catch (err) {
    outputLine(196, 0, "Error: Laying out or coloring frames failed.")
    console.error(err)
    console.log(consoleStyles.showCursor + consoleStyles.moveCursorUp(1).lines)
    process.exit(1)
}
console.log(consoleStyles.moveCursorUp(1).lines + consoleStyles.eraseLine + `Laying out frames for ${song.notes.length} notes... ` + consoleStyles.greenDone)

console.log(`Generating ${frames.length} frame images...`)
var imageDirectory
try {
    imageDirectory = generateImages(visualizer.imageGenerator, config.backgroundColor, frames, config.width, config.height)
} catch (err) {
    outputLine(196, 0, "Error: Couldn't draw frames.")
    console.error(err)
    console.log(consoleStyles.showCursor + consoleStyles.moveCursorUp(1).lines)
    process.exit(1)
}
console.log(consoleStyles.moveCursorUp(1).lines + consoleStyles.eraseLine + `Generating ${frames.length} frame images... ` + consoleStyles.greenDone)
// createVideo(imageDirectory, config.fps, config.outputFileName)

outputLine(40, 0, `${consoleStyles.showCursor}    ___    ____       __                 __
   /   |  / / /  ____/ /___  ____  ___  / /
  / /| | / / /  / __  / __ \\/ __ \\/ _ \\/ / 
 / ___ |/ / /  / /_/ / /_/ / / / /  __/_/  
/_/  |_/_/_/   \\____/\\____/_/ /_/\\___(_)   `)
