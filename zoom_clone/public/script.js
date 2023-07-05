const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
    host: '/',
    port: '7004'
})

const myVideo = document.createElement('video')
const video = document.createElement('video');
const video1 = document.createElement('video');
const screen = [];
myVideo.muted = true;
const peers = {}

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
}).then(stream => {
  addVideoStream(myVideo, stream);
  
  myPeer.on('call', call => {
    call.answer(stream);
    call.on('stream', userVideoStream => {
      const currentVideo = video.srcObject ? video1 : video
      addVideoStream(currentVideo, userVideoStream);
      document.getElementById('remote-video').append(video1)
      currentVideo.play();
    });
  });

  socket.on('user-connected', userId => {
      connectToNewUser(userId, stream);
  });
});

socket.on('user-disconnected', userId => {
  peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});


function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove();
    })

    peers[userId] = call
}

function shareScreen() {
  navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: 'always'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true
    }
  }).then(screenStream => {
    streamScreenVideo(screenStream);
    screen.push(screenStream);
    // Share the screen stream with existing peers
    for (const peerId in peers) {
      const call = myPeer.call(peerId, screenStream);
      call.on('close', () => {
        video.remove();
      });
      peers[peerId] = call;
    }
  }).catch(err => {
    console.log('Unable to get display media ' + err);
  });
}

function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    removeScreenStream(myPeer.id);

    // Restore user's original video stream
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      stream.removeTrack(screenVideoTrack);
      stream.addTrack(videoTracks[0]);
      myVideo.srcObject = stream;
    }

    // Emit screen-stopped event to the server
    socket.emit('screen-stopped');

    screenStream = null;
  }
}


async function streamScreenVideo(stream) {
  video1.srcObject = stream;
  video1.play();
  document.getElementById('remote-video').append(video1);
}