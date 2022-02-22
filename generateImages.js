const {createCanvas} = require("canvas")
const {writeFileSync, mkdirSync, existsSync, readdirSync, rmSync} = require("fs")

module.exports = (frames, width=480, height=360) => {
    const noteWidth = width / 88
    function drawFrame(canvas, frame) {
        /** @type {CanvasRenderingContext2D} */
        var ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, width, height)

        frame.flyingNotes.forEach(note => {
            ctx.fillStyle = "white"
            ctx.fillRect(noteWidth * (note.midiNoteNumber - 21), note.endProgress * height, noteWidth, note.startProgress * height - note.endProgress * height)
        })
    }
    /** @type {HTMLCanvasElement} */
    var canvas = createCanvas(width, height)
    if(existsSync("./frames")) {
        readdirSync("./frames").forEach(file => {
            rmSync(`./frames/${file}`)
        })
    } else {
        mkdirSync("./frames")
    }
    frames.forEach((frame, i) => {
        drawFrame(canvas, frame)
        var b64 = canvas.toDataURL("image/png").split("data:image/png;base64,")[1]
        writeFileSync(`./frames/frame${('' + i).padStart(7, '0')}.png`, b64, "base64")
    })
    return "frames"
}