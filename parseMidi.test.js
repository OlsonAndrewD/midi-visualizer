const parseMidi = require('./parseMidi')

it("parses the midi", () => {
    const song = parseMidi("./test-data/test.mid")
    expect(song.notes).toEqual([
        {midiNoteNumber: 48, start: 0, end: 200},
        {midiNoteNumber: 49, start: 400, end: 600},
        {midiNoteNumber: 50, start: 800, end: 1000}
    ])
})