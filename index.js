const readline = require('readline')
readline.emitKeypressEvents(process.stdin)
const prompt = require('prompt-sync')({sigint: true})
const parseMidi = require('./parseMidi')
const layoutFrames = require('./layoutFrames')
const generateImages = require('./generateImages')
const createVideo = require('./createVideo')
const outputLine = require('./consoleColors')
const {existsSync, readFileSync} = require("fs")
const { orderBy, update, isEqual, omit } = require('lodash')

const consoleStyles = {
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
    greenDone: "\x1b[38;5;40m\x1b[48;5;0mDone\x1b[0m",
    underline: (text) => `\x1b[4m${text}\x1b[24m`
}

function selectOption(options, shortcuts) {
    if(!isEqual([...new Set(shortcuts)], shortcuts)) throw new Error("All shortcuts must be unique.")
    process.stdin.setRawMode(true)
    return new Promise((resolve) => {
        new Promise((resolve) => {
            var selected = 0
            function updateOptions() {
                options.forEach(() => console.log(consoleStyles.moveCursorUp(1).lines + consoleStyles.eraseLine + consoleStyles.moveCursorUp(1).lines))
                options.forEach((option, i) => {
                    console.log(`${i == selected ? ">" : " "} ${option}`)
                })
            }
            options.forEach(() => console.log())
            updateOptions()
            function keyHandler(str, key) {
                if(key && key.name == "c" && key.ctrl) {
                    process.exit(0)
                }
                if(key.name == "up") {
                    selected -= 1
                    if(selected <= -1) selected = options.length - 1
                }
                if(key.name == "down") {
                    selected += 1
                    if(selected >= options.length) selected = 0
                }
                shortcuts.forEach((shortcut, i) => {
                    if(str == shortcut) {
                        selected = i
                        updateOptions()
                        process.stdin.off('keypress', keyHandler)
                        resolve(selected)
                    }
                })
                if(key.name == "return" || key.name == "enter") {
                    console.log(consoleStyles.moveCursorUp(2).lines)
                    updateOptions()
                    resolve(selected)
                    process.stdin.off('keypress', keyHandler)
                } else {
                    console.log(consoleStyles.eraseLine, consoleStyles.moveCursorUp(1).lines)
                }
                updateOptions()
            }
            process.stdin.on('keypress', keyHandler)
        }).then((output) => {
            console.log(consoleStyles.eraseLine, consoleStyles.moveCursorUp(1).lines)
            process.stdin.setRawMode(false)
            resolve(output)
        })
    })
}

class Visualizer {
    constructor(config) {
        this.start = () => {
            const visualizer = require(`./visualizers/${config.visualizer.type}`)({
                ...omit(config, "visualizer"),
                ...config.visualizer
            })
            
            console.log('Parsing MIDI file...')
            var song
            try {
                song = parseMidi(config.midiFileName)
            } catch (err) {
                outputLine(196, 0, "Error: Failed to parse MIDI.")
                console.error(err)
                process.exit(1)
            }
            console.log(consoleStyles.moveCursorUp(1).lines + consoleStyles.eraseLine + "Parsing MIDI file... " + consoleStyles.greenDone)
            
            song.notes = orderBy(song.notes, ['start', 'midiNoteNumber'])
            
            visualizer.prepareNotesForLayout && visualizer.prepareNotesForLayout(song.notes)
            
            console.log(`Laying out and coloring frames for ${song.notes.length} notes...`)
            var frames
            try {
                frames = layoutFrames({config, song})
            } catch (err) {
                outputLine(196, 0, "Error: Laying out or coloring frames failed.")
                console.error(err)
                process.exit(1)
            }
            console.log(consoleStyles.moveCursorUp(1).lines + consoleStyles.eraseLine + `Laying out frames for ${song.notes.length} notes... ` + consoleStyles.greenDone)
            
            var numberOfFrames = frames.length
            console.log(`Generating ${numberOfFrames} frame images...`)
            var imageDirectory
            try {
                imageDirectory = generateImages(visualizer.drawFrame, frames, config)
            } catch (err) {
                outputLine(196, 0, "Error: Couldn't draw frames.")
                console.error(err)
                process.exit(1)
            }
            console.log(consoleStyles.moveCursorUp(1).lines + consoleStyles.eraseLine + `Generating ${numberOfFrames} frame images... ` + consoleStyles.greenDone)
            // createVideo(imageDirectory, config.fps, config.outputFileName)
            
            outputLine(40, 0, `     ___    ____       __                 __
    /   |  / / /  ____/ /___  ____  ___  / /
   / /| | / / /  / __  / __ \\/ __ \\/ _ \\/ / 
  / ___ |/ / /  / /_/ / /_/ / / / /  __/_/  
 /_/  |_/_/_/   \\____/\\____/_/ /_/\\___(_)   `)
            process.exit(0)
        }
    }
}

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// })

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
            process.exit(1)
        } else {
            const visualizer = new Visualizer(config)
            visualizer.start()
        }
    } catch (err) {
        outputLine(196, 0, "Error: Could not parse config JSON.")
        console.error(err)
        process.exit(1)
    }
} else if(!process.argv.slice(2)[0]) {
    console.log("Welcome to the MIDI config file creator! Do you want to create a new config file and run it or run an existing config file?")
    selectOption([
        `Create ${consoleStyles.underline("n")}ew`,
        `Run ${consoleStyles.underline("e")}xisting`,
        `E${consoleStyles.underline("x")}it`
    ], [
        "n",
        "e",
        "x"
    ]).then(selection => {
        if(selection === 0) {
            console.log("Work in progress. Selected: Create new.")
        }
        if(selection === 1) {
            function enterFileName(incorrect) {
                console.log(`${consoleStyles.eraseLine}\r${consoleStyles.moveCursorUp(1).lines}`)
                var answer = prompt(`${incorrect ? "File doesn't exist. " : ""}Please enter the path to the config file: `)
                if(existsSync(answer)) {
                    console.log(`Tip: To skip this interface, add the file path after the command you used to run this. Example:
> midi-visualizer ${answer}`)
                    try {
                        config = JSON.parse(readFileSync(answer, {encoding: "utf8"}))
                        var shouldError = false
                        configProps.forEach(prop => {
                            if(!shouldError && !config[prop]) {
                                shouldError = true
                                outputLine(196, 0, "Error: Missing config props:")
                            }
                            if(!config[prop]) outputLine(196, 0, `  ${prop}`.padEnd(28, " "))
                        })
                        if(shouldError) {
                            process.exit(1)
                        } else {
                            const visualizer = new Visualizer(config)
                            visualizer.start()
                        }
                    } catch (err) {
                        outputLine(196, 0, "Error: Could not parse config JSON.")
                        console.error(err)
                        process.exit(1)
                    }
                } else {
                    enterFileName(true)
                }
            }
            enterFileName(false)
        }
        if(selection === 2) {
            process.exit(0)
        }
    })
} else {
    outputLine(196, 0, `Error: ${configFile} does not exist.`)
    process.exit(1)
}