import { QRCodeSVG } from 'qrcode.react'
import { categories } from '../data/wordBank.js'

export function LobbyInvitePanel({ roomCode, joinUrl, copied, onCopy }) {
  return (
    <section className="lobby-invite-card">
      <div className="case-rail__stamp">Invitacion</div>
      <div className="lobby-invite-card__code">
        {roomCode.split('').map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </div>
      <div className="lobby-invite-card__qr">
        <QRCodeSVG value={joinUrl} size={132} bgColor="#f1f5f9" fgColor="#07070f" />
      </div>
      <button
        type="button"
        className={`lobby-copy-link ${copied ? 'is-copied' : ''}`}
        onClick={onCopy}
      >
        <span>{joinUrl}</span>
        <strong>{copied ? 'copiado' : 'copiar'}</strong>
      </button>
    </section>
  )
}

export function LobbyPlayersBoard({ players, myId, minPlayers = 3 }) {
  const missing = Math.max(0, minPlayers - players.length)

  return (
    <section className="lobby-players-board">
      <div className="lobby-section-title">
        <span>Jugadores conectados</span>
        <strong>{players.length}<small>/12</small></strong>
      </div>
      <div className="lobby-player-grid">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`lobby-player-card ${player.isHost ? 'is-host' : ''} ${player.ready ? 'is-ready' : ''} ${player.id === myId ? 'is-you' : ''}`}
          >
            <span className="lobby-player-card__index">{String(index + 1).padStart(2, '0')}</span>
            <span className="lobby-player-card__avatar">{player.avatar || player.name?.charAt(0)?.toUpperCase() || '?'}</span>
            <span className="lobby-player-card__name">{player.name}</span>
            <span className="lobby-player-card__status">
              {player.isHost ? 'Anfitrion' : player.id === myId ? 'Tu lugar' : player.ready ? 'Listo' : 'En espera'}
            </span>
          </div>
        ))}
        {Array.from({ length: missing }).map((_, index) => (
          <div key={`missing-${index}`} className="lobby-player-card is-empty">
            <span className="lobby-player-card__index">{String(players.length + index + 1).padStart(2, '0')}</span>
            <span className="lobby-player-card__avatar">+</span>
            <span className="lobby-player-card__name">Falta jugador</span>
            <span className="lobby-player-card__status">Minimo requerido</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function LobbyStatusPanel({ players, config, note }) {
  const activeCategory = config?.category || 'random'
  const categoryLabel = activeCategory === 'random'
    ? 'Aleatoria'
    : categories[activeCategory]?.label || 'Sin categoria'
  const modeLabel = {
    classic: 'Clasico',
    clue: 'Con pista',
    blind: 'Ciego',
  }[config?.mode] || 'Sin modo'

  return (
    <aside className="lobby-status-panel">
      <div className="case-rail__stamp">Estado del caso</div>
      <div className="lobby-status-panel__metric">
        <span>En mesa</span>
        <strong>{players.length}<small>/12</small></strong>
      </div>
      <div className="lobby-status-list">
        <div>
          <span>Modo</span>
          <strong>{modeLabel}</strong>
        </div>
        <div>
          <span>Categoria</span>
          <strong>{categoryLabel}</strong>
        </div>
        <div>
          <span>Detective</span>
          <strong>{config?.detectiveEnabled ? 'Activo' : 'Inactivo'}</strong>
        </div>
      </div>
      <p className="lobby-status-panel__note">
        {note || 'Cuando todos esten en la mesa, inicia la partida para repartir cartas privadas.'}
      </p>
    </aside>
  )
}
