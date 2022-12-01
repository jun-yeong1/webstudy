const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName, nickName;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event){
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
}

function handleNicknameSubmit(event){
  event.preventDefault();
  const input = room.querySelector("#name input");
  socket.emit("nickname", input.value);
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  const msgForm = room.querySelector("#msg");
  const nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  
}

function handleRoomSubmit(event){
  event.preventDefault();
  const roomNameInput = form.querySelector("#roomname");
  const nickNameInput = form.querySelector("#name");
  roomName = roomNameInput.value;
  nickName = nickNameInput.value;
  socket.emit("enter_room", roomName, nickName, showRoom);
  roomNameInput.value = "";
  const changeNameInput = room.querySelector("#name input");
  changeNameInput.value = nickNameInput.value;
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  addMessage(`${user} arrived`);
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
});

socket.on("bye", (user, newCount) => {
  addMessage(`${user} left`);
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML ="";
  if(rooms.length === 0){
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});