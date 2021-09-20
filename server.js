const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);

var turn = 0;
var isDraw = false;
const initial_game_state = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
var game_state = [...initial_game_state];

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
const port = 8000;
var users = [];
io.on("connection", (socket) => {
  const len = users.length;
  if (len < 2) {
    socket.emit("connection", game_state);
    var turnToBeAssigned = -1;
    if (len === 0) {
      turnToBeAssigned = len;
    } else if (len === 1) {
      if (users[0].turn === 0) {
        turnToBeAssigned = 1;
      } else if (users[0].turn === 1) {
        turnToBeAssigned = 0;
      }
    }
    socket.emit("set_turn", turnToBeAssigned);
    users.push({ id: socket.id, turn: turnToBeAssigned, socket: socket });
    console.log("connected socket id ", socket.id);
    socket.on("put_turn", (pos, newTurn) => {
      if (turn === newTurn) {
        putTurn(pos, newTurn);
      } else {
        console.log("wrongTurn");
      }
      io.emit("update_game_state", game_state);
      console.log(
        "PutTurn, at pos",
        pos,
        " of turn ",
        newTurn === 0 ? "O" : "X"
      );
    });
    showUsers();
  } else {
    socket.emit("room_full");
  }

  socket.on("disconnect", () => {
    users = users.filter((user) => user.id !== socket.id);
    console.log("Disconnected");
    if (users.length === 0) {
      game_state = [...initial_game_state];
    }
    showUsers();
  });
});

const putTurn = (pos, newTurn) => {
  game_state[pos] = newTurn;
  if (turn === 0) {
    turn = 1;
  } else if (turn === 1) {
    turn = 0;
  }
};

const showUsers = () => {
  users.forEach((user, i) => console.log("User ", i, user.id));
};
httpServer.listen(port, () => {
  console.log("Listening on port ", port);
});
