const parseMidi = require('./parseMidi')
const layoutFrames = require('./layoutFrames')
const generateImages = require('./generateImages')
const createVideo = require('./createVideo')

const config = {
    fps: 30,
    noteApproachTime: 1000,
    midiFileName: 'test-data/test.mid',
    noteTravelTime: 3000,
    outputFileName: 'awesome-video.mp4'
}

const song = parseMidi(config.midiFileName)
const frames = layoutFrames({config, song})
frames.forEach(x => console.log(x))
const imageDirectory = generateImages(frames)
createVideo(imageDirectory, config.fps, config.outputFileName)
