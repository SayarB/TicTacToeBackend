const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);

var turn = 0;
var isDraw = false;
const initial_game_state = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
var game_state = [...initial_game_state];
const winning_positions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

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
        const { isWin, comb, winner } = checkWinComb();
        console.log("Winner ", winner, "winning combination, ", comb);
        const isDraw = checkDraw();
        if (!isWin) {
          if (isDraw) {
            io.emit("set_draw", true);
          } else changeTurn();
        } else {
          io.emit("set_winner", { isWin, comb, winner_turn: winner });
        }
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
  if (game_state[pos] === -1) {
    game_state[pos] = newTurn;
  }
};

const changeTurn = () => {
  if (turn === 0) {
    turn = 1;
  } else if (turn === 1) {
    turn = 0;
  }
};

const checkWinComb = () => {
  var check = turn;
  var comb = [];
  var isWin = false;
  winning_positions.forEach((element) => {
    var ans = true;
    element.forEach((pos) => {
      if (check !== game_state[pos]) {
        ans = false;
      }
    });
    if (ans) {
      comb = element;
      isWin = true;
    }
  });
  var win = isWin ? turn : -1;

  return { isWin, comb, winner: win };
};

const checkDraw = () => {
  var ans = true;
  game_state.forEach((ele) => {
    if (ele === -1) {
      ans = false;
    }
  });
  return ans;
};

const showUsers = () => {
  users.forEach((user, i) => console.log("User ", i, user.id));
};
httpServer.listen(port, () => {
  console.log("Listening on port ", port);
});
