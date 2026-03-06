import { Room, createLocalTracks } from 'livekit-client'
import {
  wsUrl,
  fetchToken,
  createRoomOptions,
  logIceEnvDebug,
  logRoomOptionsDebug,
} from './lib/livekit.js'

console.log('LiveKit wsUrl loaded:', wsUrl)
if (!wsUrl) {
  console.error('VITE_LIVEKIT_URL is not set! Check your .env file.')
}
logIceEnvDebug('host')
logRoomOptionsDebug('host')

const elRoom = document.getElementById('room')
const btnStart = document.getElementById('start')
const btnStop = document.getElementById('stop')
const localVideo = document.getElementById('local')

let room

btnStart.onclick = async () => {
  const roomName = elRoom.value.trim() || 'demo'
  btnStart.disabled = true

  try {
    console.log('Starting stream...')
    console.log('LiveKit URL:', wsUrl)
    logIceEnvDebug('host-connect')
    logRoomOptionsDebug('host-connect')
    
    room = new Room(createRoomOptions())
    console.log('Getting token for room:', roomName)
    const token = await fetchToken({ roomName, role: 'host', identity: 'host' })
    console.log('Token received:', token)

    console.log('Connecting to room...')
    await room.connect(wsUrl, token)
    console.log('Connected to room')

    // Camera + mic tracks
    console.log('Creating local tracks...')
    const tracks = await createLocalTracks({ audio: true, video: true })
    console.log('Tracks created:', tracks)
    
    for (const t of tracks) {
      await room.localParticipant.publishTrack(t)
      if (t.kind === 'video') {
        t.attach(localVideo)
      }
    }

    console.log('Stream started successfully')
    btnStop.disabled = false
  } catch (error) {
    console.error('Error starting stream:', error)
    alert('Fout bij starten stream: ' + error.message)
    btnStart.disabled = false
  }
}

btnStop.onclick = async () => {
  btnStop.disabled = true
  if (room) await room.disconnect()
  room = null
  localVideo.srcObject = null
  btnStart.disabled = false
}