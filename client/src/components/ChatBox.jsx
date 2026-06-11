import { useEffect, useRef, useState } from 'react'

const CHAT_TEXT_MAX_LENGTH = 20

export default function ChatBox({
  messages = [],
  myId,
  onSend,
  disabled = false,
  maxLength = CHAT_TEXT_MAX_LENGTH,
  placeholder = 'Mensaje',
  emptyText = 'Todavía no hay mensajes.',
  tone = 'public',
}) {
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
    <div className={`chat-box chat-box--${tone}`} style={{
      borderRadius: 8,
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
          padding: '12px 12px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
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
            fontFamily: 'var(--font-type)',
            fontSize: 11.5,
            color: 'var(--text-3)',
            padding: '0 24px',
            lineHeight: 1.6,
          }}>
            {emptyText}
          </div>
        )}
      </div>

      <div className="chat-box__composer" style={{
        display: 'flex',
        gap: 8,
        padding: 10,
      }}>
        <input
          type="text"
          value={text}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send()
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: '1px solid rgba(231, 210, 168, 0.14)',
            borderRadius: 6,
            color: 'var(--text-1)',
            fontFamily: 'var(--font-type)',
            fontSize: 13,
            outline: 'none',
            padding: '10px 12px',
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
            borderRadius: 6,
            padding: '0 14px',
            background: cleaned && !disabled
              ? 'linear-gradient(180deg, #e8bd6d 0%, #c89540 60%, #a87a2c 100%)'
              : 'rgba(240, 227, 200, 0.07)',
            color: cleaned && !disabled ? '#2a1c0d' : 'var(--text-3)',
            boxShadow: cleaned && !disabled
              ? 'inset 0 1px 0 rgba(255,244,214,0.5), 0 3px 0 #7a5417'
              : 'none',
            fontFamily: 'var(--font-ui)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            transition: 'transform 0.1s ease',
          }}
        >
          Enviar
        </button>
      </div>
      <div className="chat-box__counter" style={{
        padding: '0 12px 9px',
        textAlign: 'right',
        fontFamily: 'var(--font-type)',
        fontSize: 9.5,
        color: 'var(--text-faint)',
        letterSpacing: '0.1em',
      }}>
        {text.length}/{maxLength}
      </div>
    </div>
  )
}

function ChatMessage({ message, isOwn = false }) {
  return (
    <div className={`chat-message ${isOwn ? 'is-own' : ''}`} style={{
      display: 'flex',
      gap: 8,
      alignItems: 'baseline',
      maxWidth: '100%',
      fontFamily: 'var(--font-type)',
      fontSize: 12.5,
      lineHeight: 1.5,
      borderBottom: '1px solid rgba(231, 210, 168, 0.07)',
      paddingBottom: 6,
    }}>
      <span style={{
        flexShrink: 0,
        fontSize: 9.5,
        color: 'var(--text-faint)',
      }}>{formatTime(message.createdAt)}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{
          fontWeight: 400,
          color: isOwn ? 'var(--gold-soft)' : '#a9c6da',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontSize: 11,
        }}>
          {message.avatar ? `${message.avatar} ` : ''}{message.name}
          <span style={{ color: 'var(--text-faint)' }}>:</span>
        </span>{' '}
        <span style={{
          color: 'var(--text-1)',
          overflowWrap: 'anywhere',
        }}>{message.text}</span>
      </div>
    </div>
  )
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
