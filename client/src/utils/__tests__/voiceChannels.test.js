import { describe, expect, it } from 'vitest'
import { resolveVoiceChannel } from '../voiceChannels.js'

const players = [
  { id: 'detective', name: 'Detective' },
  { id: 'target', name: 'Interrogado' },
  { id: 'a', name: 'A' },
  { id: 'b', name: 'B' },
]

const interrogation = {
  detectiveId: 'detective',
  targetId: 'target',
}

describe('resolveVoiceChannel', () => {
  it('deja sala completa cuando no hay interrogatorio', () => {
    const channel = resolveVoiceChannel({
      roomCode: 'ABCD',
      myId: 'a',
      players,
      phase: 'discussion',
      interrogation: null,
    })

    expect(channel.canSpeak).toBe(true)
    expect(channel.allowedPeerIds).toBe(null)
    expect(channel.channel).toBe('room')
  })

  it('pone al detective solo con el interrogado', () => {
    const channel = resolveVoiceChannel({
      roomCode: 'ABCD',
      myId: 'detective',
      players,
      phase: 'discussion',
      interrogation,
    })

    expect(channel.canSpeak).toBe(true)
    expect(channel.allowedPeerIds).toEqual(['target'])
    expect(channel.channel).toBe('interrogation')
  })

  it('pone al resto de la mesa entre ellos sin escuchar el interrogatorio', () => {
    const channel = resolveVoiceChannel({
      roomCode: 'ABCD',
      myId: 'a',
      players,
      phase: 'discussion',
      interrogation,
    })

    expect(channel.canSpeak).toBe(true)
    expect(channel.allowedPeerIds).toEqual(['b'])
    expect(channel.channel).toBe('table')
  })

  it('cierra voz en fases privadas', () => {
    const channel = resolveVoiceChannel({
      roomCode: 'ABCD',
      myId: 'a',
      players,
      phase: 'voting',
      interrogation: null,
    })

    expect(channel.canSpeak).toBe(false)
    expect(channel.allowedPeerIds).toEqual([])
  })
})
