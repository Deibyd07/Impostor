export default function PhoneScreen({
  children,
  padTop = true,
  padBottom = true,
  footer,
  scrollable = true,
  className = '',
  leftPanel,
  rightPanel,
}) {
  return (
    <div className={`phone-screen grain ${className}`} style={{
      width: '100%', minHeight: '100vh',
      color: 'var(--text-1)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {leftPanel && (
        <aside className="ds-panel ds-panel-left">
          {leftPanel}
        </aside>
      )}

      <div className="phone-screen-center">
        <div className="phone-screen-scroll" style={{
          flex: 1,
          overflowY: scrollable ? 'auto' : 'hidden',
          paddingTop: padTop ? 56 : 0,
          paddingBottom: footer ? 0 : (padBottom ? 40 : 0),
          position: 'relative', zIndex: 2,
        }}>{children}</div>
        {footer && (
          <div className="phone-screen-footer" style={{
            padding: '12px 20px 32px',
            background: 'linear-gradient(180deg, rgba(7,7,15,0) 0%, rgba(7,7,15,0.95) 30%, var(--bg-base) 100%)',
            position: 'sticky', bottom: 0, zIndex: 3,
          }}>{footer}</div>
        )}
      </div>

      {rightPanel && (
        <aside className="ds-panel ds-panel-right">
          {rightPanel}
        </aside>
      )}
    </div>
  )
}
