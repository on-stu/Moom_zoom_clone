import express from "express";
import http from "http";
import SocketIO from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const server = http.createServer(app);
const io = SocketIO(server);

io.on("connection", (socket) => {
  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName.payload);
    done();
    socket.to(roomName.payload).emit("welcome"); // except for me!
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => socket.to(room).emit("bye"));
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", msg);
    done();
  });
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
