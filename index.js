const readline = require('readline')
readline.emitKeypressEvents(process.stdin)
const parseMidi = require('./parseMidi')
const layoutFrames = require('./layoutFrames')
const generateImages = require('./generateImages')
const createVideo = require('./createVideo')
const {existsSync, readFileSync, readdirSync, lstatSync} = require("fs")
const { orderBy, omit } = require('lodash')
const terminal = require('terminal-kit').terminal
const path = require("path")

terminal.windowTitle("MIDI Visualizer")

function showFileExplorer(startDir, fileType) {
    return new Promise((resolve, reject) => {
        var currentDir = startDir
        if(currentDir == null) currentDir = process.cwd()
        var options
        function updateOptions() {
            options = ["..", ...readdirSync(currentDir).filter(file => existsSync(path.join(currentDir, file)) && lstatSync(path.join(currentDir, file)).isDirectory() || file.endsWith(fileType)), "Exit"]
        }
        updateOptions()
        function showFiles() {
            terminal.grabInput({mouse: "motion"})
            terminal(`Current Folder: ${currentDir}\n`)
            terminal.gridMenu(options, {
                submittedStyle: terminal.bgDefaultColor.bold
            }, (error, response) => {
                terminal.grabInput(false)
                if(response.selectedIndex == 0) {
                    currentDir = path.join(currentDir, "../")
                    updateOptions()
                    showFiles()
                } else if(response.selectedIndex == options.length - 1) {
                    reject()
                    process.exit(0)
                } else {
                    var selectedPath = path.join(currentDir, options[response.selectedIndex])
                    if(existsSync(selectedPath) && lstatSync(selectedPath).isDirectory()) {
                        currentDir = selectedPath
                        updateOptions()
                        showFiles()
                    } else if(existsSync(selectedPath)) {
                        resolve(selectedPath)
                    }
                }
            })
        }
        showFiles()
    })
}

class Visualizer {
    constructor(config) {
        this.start = () => {
            const visualizer = require(`./visualizers/${config.visualizer.type}`)({
                ...omit(config, "visualizer"),
                ...config.visualizer
            })
            
            terminal('Parsing MIDI file...\n')
            var song
            try {
                song = parseMidi(config.midiFileName)
            } catch (err) {
                terminal.brightRed.bgBlack("Error: Failed to parse MIDI.")
                console.error(err)
                terminal.windowTitle("")
                process.exit(1)
            }
            terminal.up(1)
            terminal('Parsing MIDI file... ').bgBlack.brightGreen("Done\n")
            
            song.notes = orderBy(song.notes, ['start', 'midiNoteNumber'])
            
            visualizer.prepareNotesForLayout && visualizer.prepareNotesForLayout(song.notes)
            
            terminal(`Laying out and coloring frames for ${song.notes.length} notes...\n`)
            var frames
            try {
                frames = layoutFrames({config, song})
            } catch (err) {
                terminal.brightRed.bgBlack("Error: Laying out or coloring frames failed.\n")
                console.error(err)
                terminal.windowTitle("")
                process.exit(1)
            }
            terminal.up(1)
            terminal(`Laying out and coloring frames for ${song.notes.length} notes... `).bgBlack.brightGreen("Done\n")
            
            var numberOfFrames = frames.length
            terminal(`Generating ${numberOfFrames} frame images...\n`)
            var imageDirectory
            try {
                imageDirectory = generateImages(visualizer.drawFrame, frames, config)
            } catch (err) {
                terminal.brightRed.bgBlack("Error: Couldn't draw frames.\n")
                console.error(err)
                terminal.windowTitle("")
                process.exit(1)
            }
            terminal.up(1)
            terminal(`Generating ${numberOfFrames} frame images... `).bgBlack.brightGreen("Done\n")
            // createVideo(imageDirectory, config.fps, config.outputFileName)
            
            terminal.brightGreen.bgBlack(`     ___    ____       __                 __
    /   |  / / /  ____/ /___  ____  ___  / /
   / /| | / / /  / __  / __ \\/ __ \\/ _ \\/ / 
  / ___ |/ / /  / /_/ / /_/ / / / /  __/_/  
 /_/  |_/_/_/   \\____/\\____/_/ /_/\\___(_)   \n`)
            terminal.windowTitle("")
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
                terminal.brightRed.bgBlack("Error: Missing config props:\n")
            }
            if(!config[prop]) terminal.brightRed.bgBlack(`  ${prop}`.padEnd(28, " ") + "\n")
        })
        if(shouldError) {
            terminal.windowTitle("")
            process.exit(1)
        } else {
            const visualizer = new Visualizer(config)
            visualizer.start()
        }
    } catch (err) {
        terminal.brightRed.bgBlack("Error: Could not parse config JSON.\n")
        console.error(err)
        terminal.windowTitle("")
        process.exit(1)
    }
} else if(!process.argv.slice(2)[0]) {
    terminal("Welcome to the MIDI config file creator! Do you want to create a new config file and run it or run an existing config file?\n")
    terminal.grabInput({mouse: "motion"})
    terminal.singleColumnMenu([
        "Create new",
        "Run existing",
        "Exit"
    ], {
        submittedStyle: terminal.inverse
    }, (error, response) => {
        terminal.grabInput(false)
        var selection = response.selectedIndex
        if(selection === 0) {
            terminal("Work in progress. Selected: Create new.\n")
        }
        if(selection === 1) {
            showFileExplorer(null, ".json").then(answer => {
                terminal(`Tip: To skip this interface, add the file path after the command you used to run this. Example:
> midi-visualizer ${answer}\n`)
                try {
                    config = JSON.parse(readFileSync(answer, {encoding: "utf8"}))
                    var shouldError = false
                    configProps.forEach(prop => {
                        if(!shouldError && !config[prop]) {
                            shouldError = true
                            terminal.brightRed.bgBlack("Error: Missing config props:")
                        }
                        if(!config[prop]) terminal.brightRed.bgBlack(`  ${prop}`.padEnd(28, " "))
                    })
                    if(shouldError) {
                        terminal.windowTitle("")
                        process.exit(1)
                    } else {
                        const visualizer = new Visualizer(config)
                        visualizer.start()
                    }
                } catch (err) {
                    terminal.brightRed.bgBlack("Error: Could not parse config JSON.")
                    console.error(err)
                    terminal.windowTitle("")
                    process.exit(1)
                }
            })
        }
        if(selection === 2) {
            terminal.windowTitle("")
            process.exit(0)
        }
    })
} else {
    terminal.brightRed.bgBlack(`Error: ${configFile} does not exist.`)
    terminal.windowTitle("")
    process.exit(1)
}