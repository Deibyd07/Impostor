export default function PhoneScreen({
  children,
  padTop = true,
  padBottom = true,
  footer,
  scrollable = true,
  className = '',
}) {
  return (
    <div className={`grain ${className}`} style={{
      width: '100%', minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-1)',
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        overflowY: scrollable ? 'auto' : 'hidden',
        paddingTop: padTop ? 56 : 0,
        paddingBottom: footer ? 0 : (padBottom ? 40 : 0),
        position: 'relative', zIndex: 2,
      }}>{children}</div>
      {footer && (
        <div style={{
          padding: '12px 20px 32px',
          background: 'linear-gradient(180deg, rgba(7,7,15,0) 0%, rgba(7,7,15,0.95) 30%, var(--bg-base) 100%)',
          position: 'sticky', bottom: 0, zIndex: 3,
        }}>{footer}</div>
      )}
    </div>
  )
}
