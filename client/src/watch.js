import { Room } from 'livekit-client'
import {
  wsUrl,
  fetchToken,
  createViewerIdentity,
  createRoomOptions,
  logIceEnvDebug,
  logRoomOptionsDebug,
} from './lib/livekit.js'

console.log('LiveKit wsUrl loaded:', wsUrl)
if (!wsUrl) {
  console.error('VITE_LIVEKIT_URL is not set! Check your .env file.')
}
logIceEnvDebug('watch')
logRoomOptionsDebug('watch')

const elRoom = document.getElementById('room')
const btnJoin = document.getElementById('join')
const btnLeave = document.getElementById('leave')
const remoteVideo = document.getElementById('remote')
const statusDiv = document.getElementById('status')

let room

function log(msg) {
  console.log(msg)
  if (statusDiv) {
    statusDiv.innerHTML += msg + '<br>'
    statusDiv.scrollTop = statusDiv.scrollHeight
  }
}

log(`LiveKit URL: ${wsUrl}`)

btnJoin.onclick = async () => {
  const roomName = elRoom.value.trim() || 'demo'
  btnJoin.disabled = true
  statusDiv.innerHTML = ''

  try {
    log('Joining room...')
    log('LiveKit URL: ' + wsUrl)
    logIceEnvDebug('watch-connect')
    logRoomOptionsDebug('watch-connect')
    
    room = new Room(createRoomOptions())
    log('Getting token for room: ' + roomName)
    const token = await fetchToken({
      roomName,
      role: 'viewer',
      identity: createViewerIdentity(),
    })
    log('Token received: ' + token.substring(0, 50) + '...')

    room.on('trackSubscribed', (track) => {
      log('Track subscribed: ' + track.kind)
      if (track.kind === 'video') {
        track.attach(remoteVideo)
      }
    })

    room.on('trackUnsubscribed', (track) => {
      log('Track unsubscribed: ' + track.kind)
      if (track.kind === 'video') {
        track.detach(remoteVideo)
        remoteVideo.srcObject = null
      }
    })

    log('Connecting to room...')
    await room.connect(wsUrl, token)
    log('✅ Connected to room')
    btnLeave.disabled = false
  } catch (error) {
    console.error('Error joining room:', error)
    log('❌ ERROR: ' + error.message)
    alert('Fout bij verbinden: ' + error.message)
    btnJoin.disabled = false
  }
}

btnLeave.onclick = async () => {
  btnLeave.disabled = true
  if (room) await room.disconnect()
  room = null
  remoteVideo.srcObject = null
  btnJoin.disabled = false
}