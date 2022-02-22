const child_process = require('child_process')

module.exports = (imageDirectory, fps, outputFileName) => {
    const result = child_process.spawnSync('C:\\Users\\Andrew\\Downloads\\ffmpeg\\bin\\ffmpeg', [
        '-f image2',
        `-i ${imageDirectory}\\frame%d.png`,
        `-framerate ${fps}`,
        outputFileName
    ])
    console.log(result)
}