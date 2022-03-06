const parseMidi = require('./parseMidi')
const layoutFrames = require('./layoutFrames')
const generateImages = require('./generateImages')
const createVideo = require('./createVideo')
const outputLine = require('./consoleColors')
const {existsSync, readFileSync} = require("fs")

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

if(existsSync("./midiconfig.json")) {
    try {
        config = JSON.parse(readFileSync("./midiconfig.json", {encoding: "utf8"}))
        var shouldError = false
        configProps.forEach(prop => {
            if(!shouldError && !config[prop]) {
                shouldError = true
                outputLine(196, 0, "Error: Missing config props:")
            }
            if(!config[prop]) outputLine(196, 0, `  ${prop}`.padEnd(28, " "))
        })
        if(shouldError) process.exit(1)
    } catch (err) {
        outputLine(196, 0, "Error: Could not parse config JSON.")
        process.exit(1)
    }
} else {
    outputLine(196, 0, "Error: midiconfig.json does not exist in local directory.")
    process.exit(1)
}

console.log('Parsing MIDI file...')
var song
try {
    song = parseMidi(config.midiFileName)
} catch (err) {
    outputLine(196, 0, "Error: Failed to parse MIDI.")
    process.exit(1)
}

console.log(`Laying out frames for ${song.notes.length} notes...`)
var frames
try {
    frames = layoutFrames({config, song})
} catch (err) {
    outputLine(196, 0, "Error: Laying out frames failed.")
    process.exit(1)
}

console.log(`Generating ${frames.length} frame images...`)
var imageDirectory
try {
    imageDirectory = generateImages(frames, config.width, config.height)
} catch (err) {
    outputLine(196, 0, "Error: Couldn't draw frames.")
    process.exit(1)
}
// createVideo(imageDirectory, config.fps, config.outputFileName)

outputLine(40, 0, `    ___    ____       __                 __
   /   |  / / /  ____/ /___  ____  ___  / /
  / /| | / / /  / __  / __ \\/ __ \\/ _ \\/ / 
 / ___ |/ / /  / /_/ / /_/ / / / /  __/_/  
/_/  |_/_/_/   \\____/\\____/_/ /_/\\___(_)   `)