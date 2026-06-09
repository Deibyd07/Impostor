import Redis from 'ioredis'

const DEFAULT_TTL_SECONDS = 2 * 60 * 60
const DEFAULT_PREFIX = 'el-impostor:room:'

function memoryStore(ttlSeconds = DEFAULT_TTL_SECONDS) {
  const rooms = new Map()

  function pruneExpired() {
    const now = Date.now()
    rooms.forEach((entry, code) => {
      if (entry.expiresAt <= now) rooms.delete(code)
    })
  }

  return {
    type: 'memory',
    async get(code) {
      pruneExpired()
      return rooms.get(code)?.room || null
    },
    async set(code, room) {
      rooms.set(code, {
        room,
        expiresAt: Date.now() + ttlSeconds * 1000,
      })
    },
    async delete(code) {
      rooms.delete(code)
    },
    async has(code) {
      pruneExpired()
      return rooms.has(code)
    },
    async count() {
      pruneExpired()
      return rooms.size
    },
  }
}

export function createRoomStore({
  redisUrl = process.env.REDIS_URL,
  keyPrefix = process.env.REDIS_PREFIX || DEFAULT_PREFIX,
  ttlSeconds = Number(process.env.ROOM_TTL_SECONDS) || DEFAULT_TTL_SECONDS,
  logger = console,
} = {}) {
  if (!redisUrl) return memoryStore(ttlSeconds)

  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    connectTimeout: 1000,
    maxRetriesPerRequest: 2,
    enableReadyCheck: false,
  })
  let connectionStarted = false

  redis.on('error', (error) => {
    logger.warn?.(`[room-store] Redis error: ${error.message}`)
  })

  async function ensureConnected() {
    if (redis.status === 'ready') return true
    if (!connectionStarted) {
      connectionStarted = true
      try {
        await redis.connect()
      } catch (error) {
        logger.warn?.(`[room-store] Redis unavailable: ${error.message}`)
        return false
      }
    }
    return redis.status === 'ready'
  }

  const keyFor = (code) => `${keyPrefix}${code}`

  return {
    type: 'redis',
    async get(code) {
      if (!await ensureConnected()) return null
      const raw = await redis.get(keyFor(code))
      return raw ? JSON.parse(raw) : null
    },
    async set(code, room) {
      if (!await ensureConnected()) return
      await redis.set(keyFor(code), JSON.stringify(room), 'EX', ttlSeconds)
    },
    async delete(code) {
      if (!await ensureConnected()) return
      await redis.del(keyFor(code))
    },
    async has(code) {
      if (!await ensureConnected()) return false
      return (await redis.exists(keyFor(code))) === 1
    },
    async count() {
      if (!await ensureConnected()) return 0
      const keys = await redis.keys(`${keyPrefix}*`)
      return keys.length
    },
  }
}
