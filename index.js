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

const song = parseMidi(config.midiFileName)
const frames = layoutFrames({config, song})
const imageDirectory = generateImages(frames, config.width, config.height)
// createVideo(imageDirectory, config.fps, config.outputFileName)
