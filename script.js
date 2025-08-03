// Connect to your Render backend WebSocket (change URL if needed)
const socket = io('https://your-render-app-name.onrender.com'); // 👈 Replace this with your actual Render URL

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// Get media, then join room
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    socket.emit('join', roomId);
  })
  .catch(err => {
    console.error('Media error:', err);
    alert('Please allow access to camera and microphone.');
  });

// Join room
socket.on('user-joined', async (remoteSocketId) => {
  console.log('User joined:', remoteSocketId);
  peerConnection = createPeerConnection(remoteSocketId);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit('offer', {
    target: remoteSocketId,
    offer: offer
  });
});

socket.on('offer', async ({ sender, offer }) => {
  console.log('Received offer from', sender);
  peerConnection = createPeerConnection(sender);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit('answer', {
    target: sender,
    answer: answer
  });
});

socket.on('answer', async ({ sender, answer }) => {
  console.log('Received answer from', sender);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', ({ sender, candidate }) => {
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});

function createPeerConnection(remoteSocketId) {
  const pc = new RTCPeerConnection(config);

  pc.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        target: remoteSocketId,
        candidate: event.candidate
      });
    }
  };

  pc.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  return pc;
}
