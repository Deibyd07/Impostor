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
  const modifiers = [
    leftPanel ? 'has-left' : 'no-left',
    rightPanel ? 'has-right' : 'no-right',
  ].join(' ')

  return (
    <div className={`phone-screen ${modifiers} ${className}`} style={{
      width: '100%', minHeight: '100vh',
      color: 'var(--text-1)',
      position: 'relative',
    }}>
      {leftPanel && (
        <aside className="ds-panel ds-panel-left">
          {leftPanel}
        </aside>
      )}

      <div className="phone-screen-center">
        <div className="phone-screen-scroll" style={{
          overflowY: scrollable ? 'auto' : 'hidden',
          paddingTop: padTop ? 48 : 0,
          paddingBottom: footer ? 12 : (padBottom ? 40 : 0),
        }}>{children}</div>
        {footer && (
          <div className="phone-screen-footer">{footer}</div>
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
