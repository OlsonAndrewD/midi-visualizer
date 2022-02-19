const parseMidi = require('./parseMidi')
const generateImages = require('./generateImages')
const createVideo = require('./createVideo')

const midiFileName = 'foo.mid' // TODO: Get this from CLI args.
const fps = 30
const outputFileName = 'awesome-video.mp4'

const midiNotes = parseMidi(midiFileName)
const imageDirectory = generateImages(midiNotes, fps)
createVideo(imageDirectory, fps, outputFileName)
