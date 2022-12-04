const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
  try{
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => (device.kind === "videoinput"));
    const currentCamera = myStream.getAudioTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if(currentCamera.label === camera.label){
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    })
  } catch (error) {
    console.log(error);
  }
}

async function getMedia(deviceId){
  const initialConstrains = {
    audio: true, 
    video: { facingMode: "user" },
  };
  const cameraConstrains = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains 
    );
    myFace.srcObject = myStream;
    if(!deviceId){
      await getCameras();
    }
  } catch (error) {
    console.log(error);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if(!muted){
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream
  .getVideoTracks()
  .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff){
    cameraBtn.innerText = "Turn camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn camera On";
    cameraOff = true;
  }
}

async function handleCameraChange(){
  await getMedia(camerasSelect.value);
  if(myPeerConnection){
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSender()
      .find(sender => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall(){
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event){
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
};

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//socket code
// peer A offer 생성
socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", console.log);
  console.log("made data channel");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});
// peer B
socket.on("offer", async(offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) =>
      console.log(event.data)
    );
  });
  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  console.log(answer);
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) =>{
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
})

//RTC code

function makeConnection(){
  myPeerConnection = new RTCPeerConnection({
    iceServer: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", (data) => {
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.streams[0];
  });
  myStream
    .getTracks()
    .forEach(track => myPeerConnection.addTrack(track, myStream)); 
}

function handleIce(date){
  console.log("sent candidate");
  socket.emit("ice", date.candidate, roomName);
}

// function handleAddStream(data){
//   const peerFace = document.getElementById("peerFace");
//   peerFace.srcObject = data.stream;
// }


// const welcome = document.getElementById("welcome");
// const form = welcome.querySelector("form");
// const room = document.getElementById("room");

// room.hidden = true;

// let roomName, nickName;

// function addMessage(message) {
//   const ul = room.querySelector("ul");
//   const li = document.createElement("li");
//   li.innerText = message;
//   ul.appendChild(li);
// }

// function handleMessageSubmit(event){
//   event.preventDefault();
//   const input = room.querySelector("#msg input");
//   const value = input.value;
//   socket.emit("new_message", input.value, roomName, () => {
//     addMessage(`You: ${value}`);
//   });
// }

// function handleNicknameSubmit(event){
//   event.preventDefault();
//   const input = room.querySelector("#name input");
//   socket.emit("nickname", input.value);
// }

// function showRoom() {
//   welcome.hidden = true;
//   room.hidden = false;
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName}`;
//   const msgForm = room.querySelector("#msg");
//   const nameForm = room.querySelector("#name");
//   msgForm.addEventListener("submit", handleMessageSubmit);
  
// }

// function handleRoomSubmit(event){
//   event.preventDefault();
//   const roomNameInput = form.querySelector("#roomname");
//   const nickNameInput = form.querySelector("#name");
//   roomName = roomNameInput.value;
//   nickName = nickNameInput.value;
//   socket.emit("enter_room", roomName, nickName, showRoom);
//   roomNameInput.value = "";
//   const changeNameInput = room.querySelector("#name input");
//   changeNameInput.value = nickNameInput.value;
// }

// form.addEventListener("submit", handleRoomSubmit);

// socket.on("welcome", (user, newCount) => {
//   addMessage(`${user} arrived`);
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName} (${newCount})`;
// });

// socket.on("bye", (user, newCount) => {
//   addMessage(`${user} left`);
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName} (${newCount})`;
// });

// socket.on("new_message", addMessage);

// socket.on("room_change", (rooms) => {
//   const roomList = welcome.querySelector("ul");
//   roomList.innerHTML ="";
//   if(rooms.length === 0){
//     return;
//   }
//   rooms.forEach((room) => {
//     const li = document.createElement("li");
//     li.innerText = room;
//     roomList.append(li);
//   });
// });