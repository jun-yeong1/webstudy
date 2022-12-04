import http from "http";
import { Server } from "socket.io";
// import { instrument } from "@socket.io/admin-ui";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.set('view engine', "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

httpServer.listen(3000, handleListen);
const handleListen = () => console.log(`Listening on http://localhost:3000`);

// const wss = new WebSocket.Server({ server });
// const wsServer = new Server(httpServer, {
//   cors: {
//     origin: ["https://admin.socket.io"],
//     credentials: true,
//   },
// });
// instrument(wsServer, {
//   auth: false,
// })

// const sids = wsServer.sockets.adapter.sids;
// const rooms = wsServer.sockets.adapter.rooms;

// function publicRooms() {
//   const {
//     sockets: {
//       adapter : { sids, rooms },
//     },
//   } = wsServer;
//   const publicRooms = [];
//   rooms.forEach((_, key) => {
//     if (sids.get(key) === undefined) {
//       publicRooms.push(key);
//     }
//   });
//   return publicRooms;
// }

// function countRoom(roomName){
//   return wsServer.sockets.adapter.rooms.get(roomName).size;
// }

// wsServer.on("connection", (socket)=> {
//   wsServer.sockets.emit("room_change", publicRooms());
//   socket.onAny((event) => {
//     console.log(`Socket Event: ${event}`);
//   })
//   socket.on("enter_room", (roomName, nickname, done) => {
//     socket["nickname"] = nickname;
//     socket.join(roomName);
//     done(); //front에 알리기 app.js
//     wsServer.to(roomName).emit("welcome", socket.nickname, countRoom(roomName)); //모든사람에게 보내기
//     wsServer.sockets.emit("room_change", publicRooms());
//   });
//   socket.on("disconnecting", () => {
//     socket.rooms.forEach(room => 
//       socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
//       );
//   });
//   socket.on("disconnect", () => {
//     wsServer.sockets.emit("room_change", publicRooms());
//   })
//   socket.on("new_message", (msg, room, done) => {
//     socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
//     done();
//   });
//   socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
// });

/*const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "jun";
  console.log("Connected to Browser");
  socket.on("close", () => console.log("Disconnented from the Browser X"));
  socket.on("message", (msg) => {
    const message = JSON.parse(msg);
    switch(message.type) {
      case "new_message":
        sockets.forEach((aSocket) => 
          aSocket.send(`${socket.nickname}: ${message.payload}`));
        break;
      case "nickname":
        socket["nickname"] = message.payload;
        break;
      default:
    }
  });
});*/

