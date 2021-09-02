import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
});

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = io;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on("connection", (socket) => {
  socket["nickname"] = "Anonymous";
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName.payload);
    done();
    socket
      .to(roomName.payload)
      .emit("welcome", socket.nickname, countRoom(roomName.payload)); // except for me!
    io.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", (roomName) => {
    socket.rooms.forEach((room) =>
      socket
        .to(room)
        .emit("bye", socket.nickname, countRoom(roomName.payload) - 1)
    );
  });
  socket.on("disconnect", () => {
    io.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname} : ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

//the lines below are the wss

// const sockets = [];

// function handleConnection(socket) {
//   sockets.push(socket);
//   socket["nickname"] = "anonymous";
//   socket.on("close", () => {
//     console.log("disconnected");
//   });

//   socket.on("message", (message) => {
//     const parsed = JSON.parse(message);
//     if (parsed.type === "new_message") {
//       sockets.forEach((aSocket) =>
//         aSocket.send(`${socket.nickname}: ${parsed.payload}`)
//       );
//     } else if (parsed.type === "nickname") {
//       socket["nickname"] = parsed.payload;
//     }
//   });
// }

// wss.on("connection", handleConnection);

server.listen(3000, () => console.log("server is on"));
