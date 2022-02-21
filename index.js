const parseMidi = require('./parseMidi')
const layoutFrames = require('./layoutFrames')
const generateImages = require('./generateImages')
const createVideo = require('./createVideo')

const config = {
    fps: 30,
    midiFileName: 'foo.mid',
    noteTravelTime: 3000,
    outputFileName: 'awesome-video.mp4'
}

const song = parseMidi(midiFileName)
const frames = layoutFrames(song, config)
const imageDirectory = generateImages(frames)
createVideo(imageDirectory, fps, outputFileName)
