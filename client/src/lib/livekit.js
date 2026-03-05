export const wsUrl = import.meta.env.VITE_LIVEKIT_URL
export const tokenUrl = import.meta.env.VITE_TOKEN_URL || '/token'

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