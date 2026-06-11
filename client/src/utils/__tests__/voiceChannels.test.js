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

  it('mantiene la voz en votacion del modo principal', () => {
    const channel = resolveVoiceChannel({
      roomCode: 'ABCD',
      myId: 'a',
      players,
      phase: 'voting',
      interrogation: null,
    })

    expect(channel.canSpeak).toBe(true)
    expect(channel.allowedPeerIds).toBe(null)
  })

  it('cierra la voz de sala en Linea Privada sin llamada activa', () => {
    const channel = resolveVoiceChannel({
      roomCode: 'ABCD',
      myId: 'a',
      players,
      phase: 'partyRound',
      interrogation: null,
      isPartyLineMode: true,
      partyLineCalls: [],
    })

    expect(channel.canSpeak).toBe(false)
    expect(channel.allowedPeerIds).toEqual([])
    expect(channel.channel).toBe('party-wait')
  })

  it('abre solo el par privado durante una llamada de Linea Privada', () => {
    const channel = resolveVoiceChannel({
      roomCode: 'ABCD',
      myId: 'a',
      players,
      phase: 'partyRound',
      interrogation: null,
      isPartyLineMode: true,
      partyLineCalls: [{
        status: 'active',
        callerId: 'a',
        callerName: 'A',
        targetId: 'b',
        targetName: 'B',
      }],
    })

    expect(channel.canSpeak).toBe(true)
    expect(channel.allowedPeerIds).toEqual(['b'])
    expect(channel.channel).toBe('party-call')
  })
})
