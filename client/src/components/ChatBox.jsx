import { useEffect, useRef, useState } from 'react'

const CHAT_TEXT_MAX_LENGTH = 20

export default function ChatBox({ messages = [], myId, onSend, disabled = false }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const cleaned = text.trim()

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const send = () => {
    if (!cleaned || disabled) return
    onSend?.(cleaned)
    setText('')
  }

  return (
    <div className="chat-box" style={{
      background: 'linear-gradient(180deg, var(--surface-2), var(--surface-1))',
      border: '1px solid var(--hairline-cold)',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      <div
        className="chat-box__list"
        ref={listRef}
        style={{
          maxHeight: 210,
          minHeight: 128,
          overflowY: 'auto',
          padding: '12px 12px 4px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length ? (
          messages.map(message => (
            <ChatMessage key={message.id} message={message} isOwn={message.playerId === myId} />
          ))
        ) : (
          <div style={{
            minHeight: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            color: 'var(--text-3)',
            fontStyle: 'italic',
            padding: '0 24px',
          }}>
            Todavia no hay mensajes.
          </div>
        )}
      </div>

      <div className="chat-box__composer" style={{
        display: 'flex',
        gap: 8,
        padding: 10,
        borderTop: '1px solid var(--hairline-cold)',
        background: 'rgba(0,0,0,0.16)',
      }}>
        <input
          type="text"
          value={text}
          maxLength={CHAT_TEXT_MAX_LENGTH}
          disabled={disabled}
          placeholder="Mensaje"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send()
          }}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--hairline-cold)',
            borderRadius: 10,
            color: 'var(--text-1)',
            fontFamily: 'var(--font-ui)',
            fontSize: 13,
            outline: 'none',
            padding: '11px 12px',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!cleaned || disabled}
          style={{
            border: 'none',
            cursor: !cleaned || disabled ? 'not-allowed' : 'pointer',
            borderRadius: 10,
            padding: '0 13px',
            background: cleaned && !disabled ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
            color: cleaned && !disabled ? '#07070f' : 'var(--text-3)',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Enviar
        </button>
      </div>
      <div className="chat-box__counter" style={{
        padding: '0 12px 10px',
        textAlign: 'right',
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        color: 'var(--text-faint)',
        letterSpacing: '0.08em',
      }}>
        {text.length}/{CHAT_TEXT_MAX_LENGTH}
      </div>
    </div>
  )
}

function ChatMessage({ message, isOwn = false }) {
  return (
    <div className={`chat-message ${isOwn ? 'is-own' : ''}`} style={{
      display: 'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      gap: 9,
      alignItems: 'flex-start',
      alignSelf: isOwn ? 'flex-end' : 'stretch',
      maxWidth: '100%',
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        background: isOwn
          ? 'linear-gradient(135deg, #3a250b, #1f1608)'
          : 'linear-gradient(135deg, #2a2a45, #15152a)',
        border: `1px solid ${isOwn ? 'rgba(245, 158, 11, 0.48)' : 'rgba(245, 158, 11, 0.2)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        lineHeight: 1,
        flexShrink: 0,
      }}>{message.avatar || '?'}</div>
      <div style={{
        minWidth: 0,
        flex: isOwn ? '0 1 auto' : 1,
        maxWidth: isOwn ? '82%' : '100%',
        textAlign: isOwn ? 'right' : 'left',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isOwn ? 'row-reverse' : 'row',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: 3,
          justifyContent: isOwn ? 'flex-start' : 'flex-start',
        }}>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{message.name}</span>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            color: 'var(--text-faint)',
            flexShrink: 0,
          }}>{formatTime(message.createdAt)}</span>
        </div>
        <div style={{
          display: 'inline-block',
          maxWidth: '100%',
          padding: '8px 10px',
          borderRadius: isOwn ? '10px 0 10px 10px' : '0 10px 10px 10px',
          background: isOwn ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.08)',
          border: `1px solid ${isOwn ? 'rgba(59, 130, 246, 0.28)' : 'rgba(245, 158, 11, 0.18)'}`,
          color: 'var(--text-1)',
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          lineHeight: 1.35,
          overflowWrap: 'anywhere',
        }}>{message.text}</div>
      </div>
    </div>
  )
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
