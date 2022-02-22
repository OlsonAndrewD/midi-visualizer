const parseMidi = require('./parseMidi')
const layoutFrames = require('./layoutFrames')
const generateImages = require('./generateImages')
const createVideo = require('./createVideo')

const config = {
    fps: 60,
    noteApproachTime: 2000,
    midiFileName: 'test-data/test.mid',
    width: 480,
    height: 360
}

console.log('Parsing MIDI file...')
const song = parseMidi(config.midiFileName)

console.log(`Laying out frames for ${song.notes.length} notes...`)
const frames = layoutFrames({config, song})

console.log(`Generating ${frames.length} frame images...`)
const imageDirectory = generateImages(frames, config.width, config.height)
// createVideo(imageDirectory, config.fps, config.outputFileName)

console.log('All done!')