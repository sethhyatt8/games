import type { CueTrack } from './catalog'

let audioContext: AudioContext | null = null
let currentStop: (() => void) | null = null

export async function enableAudio() {
  const context = getContext()
  if (context.state === 'suspended') await context.resume()
}

export function stopPlayback() {
  currentStop?.()
  currentStop = null
}

export async function playTrack(input: {
  track: CueTrack
  startedAtMs: number
  fadeAfterMs: number
  full?: boolean
}) {
  stopPlayback()
  await enableAudio()
  const context = getContext()
  const offsetMs = Math.max(0, Date.now() - input.startedAtMs)
  const buffer = input.track.src
    ? await loadFileBuffer(context, input.track.src)
    : makePracticeBuffer(context, input.track.generated ?? 'practice-a', input.track.cueMs)

  const source = context.createBufferSource()
  const gain = context.createGain()
  source.buffer = buffer
  source.connect(gain)
  gain.connect(context.destination)

  const offsetSec = Math.min(buffer.duration, offsetMs / 1000)
  source.start(0, offsetSec)

  if (!input.full) {
    const fadeAt = input.startedAtMs + input.fadeAfterMs
    const fadeStart = Math.max(context.currentTime, context.currentTime + (fadeAt - Date.now()) / 1000)
    const fadeEnd = fadeStart + 0.7
    gain.gain.setValueAtTime(1, Math.max(context.currentTime, fadeStart - 0.01))
    gain.gain.linearRampToValueAtTime(0, fadeEnd)
    source.stop(fadeEnd + 0.05)
  }

  currentStop = () => {
    try {
      source.stop()
    } catch {
      // already stopped
    }
    source.disconnect()
    gain.disconnect()
  }
}

function getContext() {
  if (!audioContext) audioContext = new AudioContext()
  return audioContext
}

async function loadFileBuffer(context: AudioContext, src: string) {
  const response = await fetch(src)
  const data = await response.arrayBuffer()
  return context.decodeAudioData(data.slice(0))
}

function makePracticeBuffer(
  context: AudioContext,
  kind: 'practice-a' | 'practice-b' | 'practice-c',
  cueMs: number,
) {
  const duration = Math.max(cueMs / 1000 + 2, 12)
  const sampleRate = context.sampleRate
  const buffer = context.createBuffer(1, Math.ceil(duration * sampleRate), sampleRate)
  const data = buffer.getChannelData(0)
  const introHz = kind === 'practice-a' ? 220 : kind === 'practice-b' ? 196 : 247
  const introEnd = Math.min(cueMs / 1000 - 1.5, 4.2)

  for (let i = 0; i < data.length; i += 1) {
    const t = i / sampleRate
    if (t < introEnd) {
      const note = introHz * (1 + 0.12 * Math.floor((t * 2) % 3))
      data[i] = Math.sin(2 * Math.PI * note * t) * 0.22 * (1 - t / (introEnd + 0.2))
    }
    const click = Math.abs(t - cueMs / 1000)
    if (click < 0.03) {
      data[i] += (1 - click / 0.03) * 0.7 * (i % 2 === 0 ? 1 : -1)
    }
  }
  return buffer
}
