import VoicePanel from './VoicePanel.jsx'

export function OnlineVoicePanel() {
  return (
    <div className="online-persistent-voice-panel">
      <VoicePanel compact />
    </div>
  )
}

export function OnlineVoiceMobilePanel() {
  return (
    <div className="online-voice-mobile ds-mobile-only">
      <VoicePanel compact />
    </div>
  )
}
