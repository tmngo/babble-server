'use strict';
const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');

const PORT = process.env.PORT || 8000;

const app = express();
// app
//   .use(express.static(__dirname + "/../client/"))
//   .get('/*', (req, res) => {
//     res.sendFile(__dirname + '/../client/index.html');
//   })

const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server: server })

const { encodeTrie } = require('./js/bits.js');
const { performance } = require('perf_hooks');
const Dawg = require('./js/dawg.js');

/* Constants. */
const letters = "abcdefghijklmnopqrstuvwxyz"
const alphabet = {
  a: [1, 9],
  b: [3, 2],
  c: [3, 2],
  d: [2, 4],
  e: [1, 12],
  f: [4, 2],
  g: [2, 3],
  h: [4, 2],
  i: [1, 9],
  j: [8, 1],
  k: [5, 1],
  l: [1, 4],
  m: [3, 2],
  n: [1, 6],
  o: [1, 8],
  p: [3, 2],
  q: [10, 1],
  r: [1, 6],
  s: [1, 4],
  t: [1, 6],
  u: [1, 4],
  v: [4, 2],
  w: [4, 2],
  x: [8, 1],
  y: [4, 2],
  z: [10, 1],
};

let dist = new Array(98);
let index = 0;

for (let i = 0; i < letters.length; i++) {
  for (let j = 0; j < alphabet[letters[i]][1]; j++) {
    dist[index] = letters[i];
    index++;
  }
}

const dictname = "csw_19_able";
const filename = "word_lists/" + dictname + ".txt";
let dictionaryWords = [];


fs.readFile(filename, 'utf8', function(err, data) {
  if (err) throw err;

  dictionaryWords = data.toLowerCase().split(/\r\n/);
  for (let i = 0; i < 10; i++) {
    console.log(dictionaryWords[i*100])
  }
  console.log("Dictionary: " + filename);
  console.log("Words in dictionary = " + dictionaryWords.length);

  // fs.writeFileSync("output/" + dictname + "_long.txt", words.filter(w => w.length > 15).join("\n"));

  // words = words.filter((w) => {
  //   return reg.test(w) && w.length > 1;
  // })
  // console.log("Words using grid letters = " + words.length)

  // fs.writeFileSync("output/" + dictname + "_filtered.txt", words.join("\n"));
  
  

  // let dict = {};
  // let set = new Set();

  // for (let i = 0; i < words.length; i++) {
  //   dict[words[i]] = 1;
  //   set.add(words[i]);
  // }

  // let dawgSet = dawg.from(words);

  // let x;
  // let y;

  // let n = 0;

  // let t0 = performance.now();
  // for (let i = 0; i < n; i++) {
  //   x = dict["cheats"] !== undefined;
  //   y = dict["kwijibo"] !== undefined;
  // }
  // let t1 = performance.now();
  // console.log({x, y})
  // console.log(`Hash took ${(t1 - t0) / n} milliseconds.`);

  // // console.log(frozenTrie)
  // t0 = performance.now();
  // for (let i = 0; i < n; i++) {
  //   x = frozenTrie.lookup( "cheats" );
  //   y = frozenTrie.lookup( "kwijibo" );
  // }
  // t1 = performance.now();
  // console.log({x, y})
  // console.log(`Succinct tree took ${(t1 - t0) / n} milliseconds.`);

  // t0 = performance.now();
  // for (let i = 0; i < n; i++) {
  //   x = dawgSet.has( "cheats" );
  //   y = dawgSet.has( "kwijibo" );
  // }
  // t1 = performance.now();
  // console.log({x, y})
  // console.log(`DAWG took ${(t1 - t0) / n} milliseconds.`);

  // console.log("START SOLVE.")
  // t0 = performance.now();
  // let solution = solve(gridLetters, dawgSet)
  // t1 = performance.now();
  // console.log(`Solution 1 took ${(t1 - t0) / 1000} milliseconds.`);
  
  // t0 = performance.now();
  // let solution2 = dawgSet.solve(gridLetters);
  // t1 = performance.now();
  // console.log(`Solution 2 took ${(t1 - t0) / 1000} milliseconds.`);

  // fs.writeFileSync("output/" + dictname + "_solution.txt", Array.from(solution).sort((a,b) => b.length - a.length).join("\n"));
  // fs.writeFileSync("output/" + dictname + "_solution2.txt", Object.keys(solution2).sort((a,b) => b.length - a.length).join("\n"));
  // fs.writeFileSync("output/" + dictname + "_solution.json", JSON.stringify(solution2));

  // let succinctTrie = encodeTrie(Object.keys(solution2).sort());
  // console.log(succinctTrie);

});







function solve(gridLetters, dictionary) {
  let words = new Set();
  let grid = gridLetters.split(" ");
  let n = grid.length;

  let visited = [];
  for (let i = 0; i < n; i++) {
    let row = new Array(n);
    visited.push(row.fill(false));
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      recursiveSolve("", i, j, grid, visited, dictionary, words);
    }
  }
  return words;
}

function recursiveSolve(word, i, j, grid, visited, dictionary, words) {
  visited[i][j] = true;
  word += grid[i][j];
  if (dictionary.has(word)) {
    words.add(word);
  }
  for (let row = i-1; row <= i+1; row++) {
    for (let col = j-1; col <= j+1; col++) {
      if (row > -1 && col > -1 && row < grid.length && col < grid.length) {
        if (!visited[row][col]) {
          recursiveSolve(word, row, col, grid, visited, dictionary, words);
        }
      }
    }
  }
  visited[i][j] = false;
}





server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});

let numClients = 0;
let players = {};
let rooms = {};
let deleteTimeout;

wss.on('connection', (ws, req) => {

  /* OPEN CONNECTION */
  let id = ""; 
  clearTimeout(deleteTimeout);

  ws.url = req.url;
  let r = ws.url;


  
  // if (!rooms.hasOwnProperty(ws.url)) {
  //   // Create new room
  //   rooms[r] = {
  //     numUsers: 1,
  //     players: {},
  //     existingGame: false,
  //   };
  // } else {
  //   // Join existing room
  //   rooms[r].numUsers++;
  // }

  // console.log("(%s) clients across (%s) rooms.", numClients, Object.keys(rooms).length);
  // for (const room in rooms) {
  //   console.log("room: %s (%s)", room, rooms[room].numUsers)
  // }

  /** INITIALIZE GAME */
  // if (numClients === 0 || rooms[ws.url].existingGame === false) {
  //   // Create new game
  //   startNewGame(wss, ws);
  //   rooms[ws.url].existingGame = true;
  // } else {
  //   // Load existing game
  //   emit(ws, "load-game", rooms[ws.url].activeCards);
  // }

  // Handle client input
  ws.on('message', (message) => {

    const obj = JSON.parse(message);
    const action = obj.message;
    const data = obj.data;
    console.log('Received "%s" from player "%s".', action, id);

    switch (action) {

      case "new-game":
        let puzzle = createNewGame(data);
        emit(ws, "new-game", puzzle);
        break;

      // case "load-new-game":
      //   loadGame(wss, ws, data);
      //   broadcast(wss, ws, "update-players", rooms[r].players);
      //   break;

      case "user-connected":
        numClients++;
        if (data === "") {
          // new player
          id = uuidv4();
          emit(ws, "set-user-id", { id: id });
          console.log("User [ %s ] connected at %s.", id, req.url);
        } else {
          // returning player
          id = data;
          console.log(`User [ %s ] reconnected to %s.`, id, req.url)
        }
        // broadcast(wss, ws, "update-players", rooms[r].players);
        break;

      // case "change-name":
      //   console.log("Name changed from [ %s ] to [ %s ].", rooms[r].players[id].username, data)
      //   rooms[r].players[id].username = data;
      //   broadcast(wss, ws, "update-players", rooms[r].players);
      //   break;

      // case "submit-set":
      //   let cardObjects = parseCards(data, rooms[r].activeCards);
      //   let isValid = isSet(cardObjects);
      //   console.log("Indices: " + data.toString());
      //   console.log(`Raw cards: ${rooms[r].activeCards[data[0]]},${rooms[r].activeCards[data[1]]},${rooms[r].activeCards[data[2]]}`);
      //   console.log(cardObjects);
      //   console.log(isValid ? `Valid set from ${rooms[r].players[id].username}.` : `Invalid set from ${rooms[r].players[id].username}.`);
      //   if (isValid) {
      //     data.sort((a, b) => { return b - a; });
      //     for (let i = 0; i < data.length; i++) {
      //       if (rooms[r].deckIndex >= rooms[r].deck.length || rooms[r].activeCards.length > 12) {
      //         rooms[r].activeCards.splice(data[i], 1);
      //       } else {
      //         rooms[r].activeCards[data[i]] = rooms[r].deck[rooms[r].deckIndex++];
      //       }
      //     }
      //     rooms[r].players[id].score++;
      //     broadcast(wss, ws, "load-game", rooms[r].activeCards);
      //     emit(ws, "valid-set", rooms[r].players[id]);
      //   } else {
      //     rooms[r].players[id].penalties++;
      //     emit(ws, "invalid-set", rooms[r].players[id]);
      //   }
      //   console.log(players)
      //   broadcast(wss, ws, "update-players", rooms[r].players);
      //   break;

      // case "draw-cards":
      //   if (rooms[r].deckIndex < rooms[r].deck.length) {
      //     drawCards(wss, ws, 3);
      //   }
      //   break;
      default:
        break;

    }
  });

  /* Prevent Heroku server timeout */
  // setInterval(() => { 
  //   let time = new Date().toTimeString(); 
  //   emit(ws, 'time', time)
  // }, 30000);

  /** CLOSE */
  ws.on("close", function() {
    numClients--;

    // remove player
    // delete rooms[r].players[id]
    // broadcast(wss, ws, "update-players", rooms[r].players);

    // if (rooms[r] !== undefined) {
    //   rooms[r].numUsers--;
    //   if (rooms[r].numUsers === 0) {
    //     // delete rooms[r]
    //     deleteTimeout = setTimeout(() => { delete rooms[r] }, 5000);
    //     console.log("Empty room deleted after 5 s.")
    //   }
    // }

    console.log("User %s disconnected.", id);
    // console.log("(%s) clients across (%s) rooms.", numClients, Object.keys(rooms).length);
    // for (const room in rooms) {
    //   console.log("room: %s (%s)", room, rooms[room].numUsers)
    // }
  })

})

/** SERVER FUNCTIONS */

function emit(ws, message, data) {
  ws.send(JSON.stringify({
    message: message,
    data: data,
  }));
}

function broadcast(wss, ws, message, data) {
  wss.clients.forEach((client) => {
    if (client.url === ws.url && client.readyState === WebSocket.OPEN) {
      emit(client, message, data)
    }
  });
}

/** GAME FUNCTIONS */

function unique(str) {
  var result = '';
  for(var i = 0; i < str.length; i++) {
    if (result.indexOf(str[i]) < 0) {
      result += str[i];
    }
  }
  return result;
}

/**
 * Hash function
 * @param {string} str The seed string.
 */
function xmur3(str) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
      h = h << 13 | h >>> 19;
  return function() {
      h = Math.imul(h ^ h >>> 16, 2246822507);
      h = Math.imul(h ^ h >>> 13, 3266489909);
      return (h ^= h >>> 16) >>> 0;
  }
}

/**
 * 
 * @param {*} a 
 */
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function generatePuzzle(seed, size) {
  let hash = xmur3(seed);
  let rand = mulberry32(hash());
  let grid = "";

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      grid += dist[Math.floor(rand() * 98)]
    }
    if (i < size - 1) {
      grid += " ";
    }
  }

  return grid;
}

function createNewGame(data) {
  let gridLetters = generatePuzzle(data.seed + data.size, data.size);
  let uniqueLetters = new RegExp("^[" + unique(gridLetters)
    .replace(/\s/g, "").split('').sort().join('') + "]+$");

  let words = dictionaryWords.filter(w => {
    return uniqueLetters.test(w) && w.length >= data.minLength;
  });

  /* Create a directed acyclic word graph from filtered words. */
  let dawg = Dawg.from(words);
  /* Use the DAWG to recursively find all the words on the board. */
  let solutionDictionary = dawg.solve(gridLetters);
  /* Encode the list of valid words as a succinct trie. */
  let trieData = encodeTrie(Object.keys(solutionDictionary).sort());

  console.log("Unique letters: " + uniqueLetters);
  console.log(gridLetters.replace(/ /g, "\n"));
  console.log(`Valid words = ${Object.keys(solutionDictionary).length}.`)

  return { 
    grid: gridLetters, 
    dictionary: solutionDictionary, 
    trieData: trieData 
  }
}

/* Creates a random sequence of numbers from 0 to n-1. */
function shuffledNumbers(n) {
  let arr = [];
  for (let i = 0; i < n; i++) {
    arr[i] = i;
  }
  return shuffle(arr);
}

/* Randomly sorts an array. */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startNewGame(wss, ws) {
  // deck = shuffledNumbers(81);
  rooms[ws.url].deck = shuffledNumbers(81)
  // rooms[ws.url].deck = []
  // for (let i = 50; i < 65; i++) {
  //   rooms[ws.url].deck.push(i)
  // }
  rooms[ws.url].deckIndex = 0;
  broadcast(wss, ws, "new-game", {});
  rooms[ws.url].activeCards = [];
  drawCards(wss, ws, 12)

  for (const player in players) {
    players[player].score = 0;
  }
}

// function loadGame(wss, ws, arr) {
//   rooms[ws.url].deck = arr
//   rooms[ws.url].deckIndex = 0;
//   broadcast(wss, ws, "new-game", {});
//   rooms[ws.url].activeCards = [];
//   drawCards(wss, ws, 12)

//   for (const player in players) {
//     players[player].score = 0;
//   }
// }

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
