import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const sockets = [];

function handleConnection(socket) {
  sockets.push(socket);
  socket["nickname"] = "anonymous";
  socket.on("close", () => {
    console.log("disconnected");
  });

  socket.on("message", (message) => {
    const parsed = JSON.parse(message);
    if (parsed.type === "new_message") {
      sockets.forEach((aSocket) =>
        aSocket.send(`${socket.nickname}: ${parsed.payload}`)
      );
    } else if (parsed.type === "nickname") {
      socket["nickname"] = parsed.payload;
    }
  });
}

wss.on("connection", handleConnection);

server.listen(3000);
