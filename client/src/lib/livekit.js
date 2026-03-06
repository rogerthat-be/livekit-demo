export const wsUrl = import.meta.env.VITE_LIVEKIT_URL
export const tokenUrl = import.meta.env.VITE_TOKEN_URL || '/token'
const stunUrl = import.meta.env.VITE_STUN_URL
const turnUrl = import.meta.env.VITE_TURN_URL
const turnUsername = import.meta.env.VITE_TURN_USERNAME
const turnPassword = import.meta.env.VITE_TURN_PASSWORD
const iceTransportPolicy = import.meta.env.VITE_ICE_TRANSPORT_POLICY || 'all'

function parseUrls(value) {
  if (!value) return []

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function fetchToken({ roomName, role, identity }) {
  const params = new URLSearchParams({
    room: roomName,
    identity,
    role,
  })

  const separator = tokenUrl.includes('?') ? '&' : '?'
  const response = await fetch(`${tokenUrl}${separator}${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Token server responded with status ${response.status}`)
  }

  const data = await response.json()
  if (!data.token) {
    throw new Error('Token server did not return a token')
  }

  return data.token
}

export function createViewerIdentity() {
  return `viewer-${Math.random().toString(16).slice(2)}`
}

export function getIceEnvDebug() {
  return {
    wsUrl,
    tokenUrl,
    stunUrls: parseUrls(stunUrl),
    turnUrls: parseUrls(turnUrl),
    turnUsername: turnUsername || '(not set)',
    turnPasswordConfigured: Boolean(turnPassword),
    iceTransportPolicy,
  }
}

export function logIceEnvDebug(context = 'client') {
  console.log(`[LiveKit][${context}] ICE env debug`, getIceEnvDebug())
}

export function createRoomOptions() {
  const iceServers = []
  const stunUrls = parseUrls(stunUrl)
  const turnUrls = parseUrls(turnUrl)

  if (stunUrls.length > 0) {
    iceServers.push({ urls: stunUrls })
  }

  if (turnUrls.length > 0 && turnUsername && turnPassword) {
    iceServers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnPassword,
    })
  }

  return iceServers.length > 0
    ? {
        rtcConfig: {
          iceServers,
          iceTransportPolicy,
        },
      }
    : {}
}

export function logRoomOptionsDebug(context = 'client') {
  const roomOptions = createRoomOptions()
  const iceServers = roomOptions.rtcConfig?.iceServers || []

  console.log(`[LiveKit][${context}] Room options`, {
    hasRtcConfig: Boolean(roomOptions.rtcConfig),
    iceServersCount: iceServers.length,
    iceServers: iceServers.map((server) => ({
      urls: server.urls,
      hasUsername: Boolean(server.username),
      hasCredential: Boolean(server.credential),
    })),
  })
}