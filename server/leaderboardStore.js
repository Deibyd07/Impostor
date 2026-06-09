import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const DEFAULT_LEADERBOARD_LIMIT = 50

function cleanName(name) {
  return String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 16)
}

function cleanAvatar(avatar) {
  return String(avatar ?? '').trim().slice(0, 8)
}

function cleanProfileId(profileId) {
  const value = String(profileId ?? '').trim().toLowerCase()
  return /^[0-9a-f-]{36}$/.test(value) ? value : null
}

function isImpostorRole(role) {
  return ['impostor', 'impostor-clue', 'impostor-blind', 'detective-impostor'].includes(role)
}

function calculateScore(stats) {
  return (
    stats.wins * 10 +
    stats.games_played * 3 +
    stats.impostor_wins * 5 +
    stats.best_streak * 3
  )
}

function rowFromStats(profile, previous, { role, won, playedAt }) {
  const wasImpostor = isImpostorRole(role)
  const gamesPlayed = (previous?.games_played || 0) + 1
  const wins = (previous?.wins || 0) + (won ? 1 : 0)
  const losses = (previous?.losses || 0) + (won ? 0 : 1)
  const impostorGames = (previous?.impostor_games || 0) + (wasImpostor ? 1 : 0)
  const citizenGames = (previous?.citizen_games || 0) + (wasImpostor ? 0 : 1)
  const impostorWins = (previous?.impostor_wins || 0) + (wasImpostor && won ? 1 : 0)
  const citizenWins = (previous?.citizen_wins || 0) + (!wasImpostor && won ? 1 : 0)
  const currentStreak = won ? (previous?.current_streak || 0) + 1 : 0
  const bestStreak = Math.max(previous?.best_streak || 0, currentStreak)

  const next = {
    profile_id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    games_played: gamesPlayed,
    wins,
    losses,
    impostor_games: impostorGames,
    citizen_games: citizenGames,
    impostor_wins: impostorWins,
    citizen_wins: citizenWins,
    current_streak: currentStreak,
    best_streak: bestStreak,
    last_role: role,
    last_result: won ? 'win' : 'loss',
    last_played_at: playedAt,
    updated_at: playedAt,
  }
  next.score = calculateScore(next)
  return next
}

function disabledStore() {
  return {
    type: 'disabled',
    enabled: false,
    async recordMatchResult() {
      return { ok: false, disabled: true }
    },
    async getLeaderboard() {
      return { available: false, players: [] }
    },
    async getProfiles() {
      return { available: false, profiles: [] }
    },
    async createProfile() {
      return { available: false, profile: null }
    },
    async updateProfile() {
      return { available: false, profile: null }
    },
    async deleteProfile() {
      return { available: false }
    },
  }
}

export function createLeaderboardStore({
  supabaseUrl = process.env.SUPABASE_URL,
  serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
  logger = console,
} = {}) {
  if (!supabaseUrl || !serviceRoleKey) return disabledStore()

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return {
    type: 'supabase',
    enabled: true,

    async getProfiles({ ids = [] } = {}) {
      const profileIds = ids.map(cleanProfileId).filter(Boolean)
      if (!profileIds.length) return { available: true, profiles: [] }

      const { data, error } = await supabase
        .from('profiles')
        .select('id,name,avatar,created_at,updated_at')
        .in('id', profileIds)
        .order('updated_at', { ascending: false })

      if (error) throw error

      return {
        available: true,
        profiles: (data || []).map(row => ({
          id: row.id,
          name: row.name,
          avatar: row.avatar,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      }
    },

    async createProfile({ name, avatar, id } = {}) {
      const clean = cleanName(name)
      if (!clean) return { ok: false, error: 'invalid_name' }

      const now = new Date().toISOString()
      const profile = {
        id: cleanProfileId(id) || randomUUID(),
        name: clean,
        avatar: cleanAvatar(avatar),
        updated_at: now,
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' })
        .select('id,name,avatar,created_at,updated_at')
        .single()

      if (error) throw error

      return {
        ok: true,
        profile: {
          id: data.id,
          name: data.name,
          avatar: data.avatar,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      }
    },

    async updateProfile(profileId, patch = {}) {
      const id = cleanProfileId(profileId)
      if (!id) return { ok: false, error: 'invalid_profile' }

      const name = patch.name == null ? null : cleanName(patch.name)
      const avatar = patch.avatar == null ? null : cleanAvatar(patch.avatar)
      const update = { updated_at: new Date().toISOString() }
      if (name) update.name = name
      if (avatar !== null) update.avatar = avatar

      const { data, error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', id)
        .select('id,name,avatar,created_at,updated_at')
        .single()

      if (error) throw error

      const statsUpdate = {}
      if (name) statsUpdate.name = name
      if (avatar !== null) statsUpdate.avatar = avatar
      if (Object.keys(statsUpdate).length) {
        await supabase.from('player_stats').update(statsUpdate).eq('profile_id', id)
      }

      return {
        ok: true,
        profile: {
          id: data.id,
          name: data.name,
          avatar: data.avatar,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      }
    },

    async deleteProfile(profileId) {
      const id = cleanProfileId(profileId)
      if (!id) return { ok: false, error: 'invalid_profile' }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { ok: true }
    },

    async recordMatchResult(result) {
      const gameId = String(result?.gameId ?? '').trim()
      const winner = result?.winner
      const seenProfileIds = new Set()
      const players = (Array.isArray(result?.players) ? result.players : [])
        .filter(player => player?.profileId && !player.isGuest)
        .filter(player => {
          const profileId = String(player.profileId)
          if (seenProfileIds.has(profileId)) return false
          seenProfileIds.add(profileId)
          return true
        })
        .map(player => ({
          id: String(player.profileId),
          name: cleanName(player.name),
          avatar: cleanAvatar(player.avatar),
          role: player.role || 'citizen',
        }))

      if (!gameId || !['citizens', 'impostor'].includes(winner) || !players.length) {
        return { ok: false, skipped: true }
      }

      const playedAt = new Date(Number.isFinite(result?.playedAt) ? result.playedAt : Date.now()).toISOString()
      const { data: existingMatch, error: existingError } = await supabase
        .from('matches')
        .select('id')
        .eq('id', gameId)
        .maybeSingle()

      if (existingError) throw existingError
      if (existingMatch?.id) return { ok: true, alreadyRecorded: true }

      const { error: matchError } = await supabase.from('matches').insert({
        id: gameId,
        winner,
        reason: result.reason || null,
        mode: result.mode || null,
        category: result.category || null,
        word: result.word || null,
        fake_word: result.fakeWord || null,
        played_at: playedAt,
      })
      if (matchError) throw matchError

      const profileRows = players.map(player => ({
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        updated_at: playedAt,
      }))
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileRows, { onConflict: 'id' })
      if (profileError) throw profileError

      const matchPlayerRows = players.map(player => {
        const won = winner === 'impostor' ? isImpostorRole(player.role) : !isImpostorRole(player.role)
        return {
          match_id: gameId,
          profile_id: player.id,
          name: player.name,
          avatar: player.avatar,
          role: player.role,
          won,
          played_at: playedAt,
        }
      })
      const { error: matchPlayersError } = await supabase
        .from('match_players')
        .insert(matchPlayerRows)
      if (matchPlayersError) throw matchPlayersError

      for (const player of players) {
        const won = winner === 'impostor' ? isImpostorRole(player.role) : !isImpostorRole(player.role)
        const { data: previous, error: statsReadError } = await supabase
          .from('player_stats')
          .select('*')
          .eq('profile_id', player.id)
          .maybeSingle()
        if (statsReadError) throw statsReadError

        const nextStats = rowFromStats(player, previous, { role: player.role, won, playedAt })
        const { error: statsWriteError } = await supabase
          .from('player_stats')
          .upsert(nextStats, { onConflict: 'profile_id' })
        if (statsWriteError) throw statsWriteError
      }

      return { ok: true, recorded: players.length }
    },

    async getLeaderboard({ limit = DEFAULT_LEADERBOARD_LIMIT } = {}) {
      const cleanLimit = Math.max(1, Math.min(100, Number(limit) || DEFAULT_LEADERBOARD_LIMIT))
      const { data, error } = await supabase
        .from('player_stats')
        .select('profile_id,name,avatar,games_played,wins,losses,impostor_games,impostor_wins,current_streak,best_streak,score,last_role,last_result,last_played_at')
        .order('score', { ascending: false })
        .order('wins', { ascending: false })
        .limit(cleanLimit)

      if (error) {
        logger.warn?.(`[leaderboard] Could not load leaderboard: ${error.message}`)
        return { available: false, players: [], error: error.message }
      }

      return {
        available: true,
        players: (data || []).map((row, index) => ({
          rank: index + 1,
          profileId: row.profile_id,
          name: row.name,
          avatar: row.avatar,
          gamesPlayed: row.games_played,
          wins: row.wins,
          losses: row.losses,
          impostorGames: row.impostor_games,
          impostorWins: row.impostor_wins,
          currentStreak: row.current_streak,
          bestStreak: row.best_streak,
          score: row.score,
          lastRole: row.last_role,
          lastResult: row.last_result,
          lastPlayedAt: row.last_played_at,
        })),
      }
    },
  }
}
