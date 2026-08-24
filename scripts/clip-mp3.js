const fs = require("node:fs");

const [, , inputPath, outputPath, secondsArg] = process.argv;
const targetSeconds = Number(secondsArg || 45);

if (!inputPath || !outputPath || !Number.isFinite(targetSeconds) || targetSeconds <= 0) {
  console.error("Uso: node scripts/clip-mp3.js <entrada.mp3> <salida.mp3> [segundos]");
  process.exit(1);
}

const BITRATES = {
  1: [null, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  2: [null, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES = {
  3: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  0: [11025, 12000, 8000],
};

function getAudioStart(buffer) {
  if (buffer.toString("ascii", 0, 3) !== "ID3") return 0;

  const size =
    ((buffer[6] & 0x7f) << 21) |
    ((buffer[7] & 0x7f) << 14) |
    ((buffer[8] & 0x7f) << 7) |
    (buffer[9] & 0x7f);

  return 10 + size + ((buffer[5] & 0x10) ? 10 : 0);
}

function readFrame(buffer, offset) {
  if (offset + 4 > buffer.length || buffer[offset] !== 0xff) return null;

  const byte1 = buffer[offset + 1];
  if ((byte1 & 0xe0) !== 0xe0) return null;

  const version = (byte1 >> 3) & 0x03;
  const layer = (byte1 >> 1) & 0x03;
  const byte2 = buffer[offset + 2];
  const bitrateIndex = (byte2 >> 4) & 0x0f;
  const sampleRateIndex = (byte2 >> 2) & 0x03;
  const padding = (byte2 >> 1) & 0x01;

  if (version === 1 || layer !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
    return null;
  }

  const mpegVersion = version === 3 ? 1 : 2;
  const bitrate = BITRATES[mpegVersion][bitrateIndex] * 1000;
  const sampleRate = SAMPLE_RATES[version][sampleRateIndex];
  const frameLength = Math.floor(((mpegVersion === 1 ? 144 : 72) * bitrate) / sampleRate) + padding;
  const samples = mpegVersion === 1 ? 1152 : 576;

  if (frameLength < 4 || offset + frameLength > buffer.length) return null;

  return {
    end: offset + frameLength,
    duration: samples / sampleRate,
  };
}

const input = fs.readFileSync(inputPath);
const audioStart = getAudioStart(input);
let frameOffset = audioStart;
let duration = 0;
let lastFrameEnd = audioStart;
let frameCount = 0;

while (frameOffset < input.length && duration < targetSeconds) {
  const frame = readFrame(input, frameOffset);

  if (!frame) {
    frameOffset += 1;
    continue;
  }

  duration += frame.duration;
  lastFrameEnd = frame.end;
  frameOffset = frame.end;
  frameCount += 1;
}

if (!frameCount) {
  throw new Error("No se encontraron frames MP3 válidos.");
}

const output = Buffer.concat([input.subarray(0, audioStart), input.subarray(audioStart, lastFrameEnd)]);
fs.mkdirSync(require("node:path").dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);

console.log(JSON.stringify({
  input: inputPath,
  output: outputPath,
  requestedSeconds: targetSeconds,
  actualSeconds: Number(duration.toFixed(3)),
  frameCount,
  bytes: output.length,
}, null, 2));
