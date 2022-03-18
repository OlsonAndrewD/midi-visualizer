const { createCanvas } = require("canvas")
const { writeFileSync, mkdirSync, existsSync, rmSync } = require("fs")

function initFrame(ctx, width, height, backgroundColor) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
}

module.exports = (imageGenerator, backgroundColor, frames, width = 480, height = 360) => {
    const { drawFrame } = imageGenerator.init(width, height)

    /** @type {HTMLCanvasElement} */
    var canvas = createCanvas(width, height)
    if (existsSync("./frames")) {
        rmSync("./frames", { recursive: true })
    }
    mkdirSync("./frames")
    var ctx = canvas.getContext("2d")
    console.log("")

    frames.forEach((frame, i) => {
        initFrame(ctx, width, height, backgroundColor)
        drawFrame(ctx, frame)
        var b64 = canvas.toDataURL("image/png").split("data:image/png;base64,")[1]
        writeFileSync(`./frames/frame${('' + i).padStart(7, '0')}.png`, b64, "base64")
        var progressWidth = process.stdout.columns - 4
        var progressChars = Math.floor((i / frames.length) * progressWidth)
        console.log(`\x1b[1A\x1b[2K\r\x1b[36m${"█".repeat(progressChars)}${"░".repeat(progressWidth - progressChars)}\x1b[0m ${Math.floor((i / frames.length) * 100).toString().padStart(2, " ")}%`)
        // console.log(`\x1b[1A\x1b[2K\rDone with ${i}/${frames.length} frames...`)
    })

    console.log("\x1b[1A\x1b[2K\r\x1b[1A")
    return "frames"
}