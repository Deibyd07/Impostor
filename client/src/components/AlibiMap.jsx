import { useEffect, useMemo, useState } from 'react'
import GameIcon from './GameIcon.jsx'

export default function AlibiMap({ map, highlight, compact = false, showInspector = true }) {
  const zones = Array.isArray(map?.zones) ? map.zones : []
  const width = Math.max(1, Number(map?.width) || 6)
  const height = Math.max(1, Number(map?.height) || 4)
  const crimeScene = map?.crimeScene || ''
  const zoneByKey = useMemo(() => {
    const entries = zones.flatMap(zone => {
      const keys = [zone.id, zone.name].filter(Boolean)
      return keys.map(key => [key, zone])
    })
    return new Map(entries)
  }, [zones])
  const corridors = useMemo(() => (
    (Array.isArray(map?.routes) ? map.routes : [])
      .map((route, index) => {
        const sourceKey = Array.isArray(route) ? route[0] : route?.from
        const targetKey = Array.isArray(route) ? route[1] : route?.to
        const source = zoneByKey.get(sourceKey)
        const target = zoneByKey.get(targetKey)
        if (!source || !target) return null
        return {
          id: `${sourceKey}-${targetKey}-${index}`,
          sourceKey,
          targetKey,
          source: zoneCenter(source, width, height),
          target: zoneCenter(target, width, height),
        }
      })
      .filter(Boolean)
  ), [height, map?.routes, width, zoneByKey])

  const initialZoneId = useMemo(() => {
    const highlighted = zones.find(zone => zone.name === highlight)
    const crime = zones.find(zone => zone.name === crimeScene)
    return highlighted?.id || highlighted?.name || crime?.id || crime?.name || zones[0]?.id || zones[0]?.name || ''
  }, [crimeScene, highlight, zones])

  const [selectedZoneId, setSelectedZoneId] = useState(initialZoneId)

  useEffect(() => {
    setSelectedZoneId(initialZoneId)
  }, [initialZoneId])
  const selectedZone = zones.find(zone => (zone.id || zone.name) === selectedZoneId)
    || zones.find(zone => (zone.id || zone.name) === initialZoneId)
    || zones[0]

  return (
    <section
      className={`alibi-map ${compact ? 'alibi-map--compact' : ''} ${showInspector ? 'alibi-map--with-inspector' : ''}`}
      style={{
        '--map-cols': width,
        '--map-rows': height,
      }}
      aria-label={map?.name || 'Mapa del caso'}
    >
      <div className="alibi-map__header">
        <div>
          <span className="t-eyebrow">Plano del caso</span>
          <strong>{map?.name || 'Establecimiento'}</strong>
        </div>
        <GameIcon name="cardTarget" size={24} />
      </div>

      <div className="alibi-map__body">
        <div className="alibi-map__grid">
          {!!corridors.length && (
            <svg className="alibi-map__corridors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {corridors.map(corridor => {
                const isActive = selectedZoneId === corridor.sourceKey || selectedZoneId === corridor.targetKey
                return (
                  <g key={corridor.id} className={isActive ? 'is-active' : ''}>
                    <path d={corridorPath(corridor.source, corridor.target)} />
                    <circle cx={corridor.source.x} cy={corridor.source.y} r="0.9" />
                    <circle cx={corridor.target.x} cy={corridor.target.y} r="0.9" />
                  </g>
                )
              })}
            </svg>
          )}
          {zones.map(zone => {
            const zoneKey = zone.id || zone.name
            const isCrimeScene = zone.name === crimeScene
            const isHighlighted = highlight && zone.name === highlight
            const isSelected = selectedZone && (selectedZone.id || selectedZone.name) === zoneKey
            return (
              <button
                key={zoneKey}
                type="button"
                className={`alibi-map-zone alibi-map-zone--${zone.type || 'default'} ${isCrimeScene ? 'is-crime-scene' : ''} ${isHighlighted ? 'is-highlighted' : ''} ${isSelected ? 'is-selected' : ''}`}
                style={{
                  gridColumn: `${Number(zone.x || 0) + 1} / span ${Number(zone.w || 1)}`,
                  gridRow: `${Number(zone.y || 0) + 1} / span ${Number(zone.h || 1)}`,
                }}
                aria-pressed={isSelected}
                onClick={() => setSelectedZoneId(zoneKey)}
              >
                <span>{isCrimeScene ? 'Escena' : zone.type === 'route' ? 'Ruta' : 'Zona'}</span>
                <strong>{zone.shortName || zone.name}</strong>
                {!compact && <small>{zone.note}</small>}
              </button>
            )
          })}
        </div>

        {showInspector && selectedZone && (
          <aside className="alibi-map__inspector">
            <span>{selectedZone.name === crimeScene ? 'Escena principal' : selectedZone.type === 'route' ? 'Ruta interna' : 'Zona revisada'}</span>
            <strong>{selectedZone.name}</strong>
            <p>{selectedZone.note || 'Sin nota registrada.'}</p>
            {highlight && selectedZone.name === highlight && (
              <small>Tu coartada apunta a esta ubicacion.</small>
            )}
          </aside>
        )}
      </div>

      {!compact && (
        <div className="alibi-map__legend">
          <span><i className="is-crime" /> Escena del crimen</span>
          <span><i className="is-route" /> Ruta interna</span>
          <span><i className="is-control" /> Zona clave</span>
        </div>
      )}
    </section>
  )
}

function zoneCenter(zone, width, height) {
  const x = ((Number(zone.x || 0) + Number(zone.w || 1) / 2) / width) * 100
  const y = ((Number(zone.y || 0) + Number(zone.h || 1) / 2) / height) * 100
  return { x, y }
}

function corridorPath(source, target) {
  const sameRow = Math.abs(source.y - target.y) < 1
  const sameColumn = Math.abs(source.x - target.x) < 1
  if (sameRow || sameColumn) return `M ${source.x} ${source.y} L ${target.x} ${target.y}`
  const midX = (source.x + target.x) / 2
  return `M ${source.x} ${source.y} L ${midX} ${source.y} L ${midX} ${target.y} L ${target.x} ${target.y}`
}
