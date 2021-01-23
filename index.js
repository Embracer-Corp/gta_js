const globalConfig = require('./config')
const express = require('express')
const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname +'/public'));

var clients = {}
var rooms = {"r00001": {clients: [], activePlayer: 0}}

function getClientNames() {
  let players = []
  for (let key in clients) {
    if (clients[key].name == null) continue
    players.push(clients[key].name)
  }
  return players
}

// need broadcast in room (when game started), authorized users (for starting only for them, mb other spectator?), for all (new room, server restart, ...)
function broadcast(signal, data = null, except = []) {
  for (let key in clients) {
    if (except.includes(key)) { continue }
    clients[key].socket.emit(signal, data)
  }
}

var chatLog = []

io.on('connection', (socket) => {
  clients[socket.id] = {socket: socket, name: null, room: null}
  console.log(`a user connected, id:${socket.id}. COUNT: ${Object.keys(clients).length}`);

  socket.emit('players_info', getClientNames())
  chatLog.forEach(str => {
    socket.emit('chat', str)
  })

  socket.on('register', regData => {
    // name filtering [size, symbols, special name, ...]
    // socket.emit('registered', null)
    // return
    console.log('register:', regData);

    let players = getClientNames()
    if (players.includes(regData.name)) {
      let fixer = 1
      while (players.includes(regData.name+" ("+fixer+")")) { fixer +=1 }
      regData.name += " ("+fixer+")"
    }

    clients[socket.id].name = regData.name
    socket.emit('registered', regData.name)
    broadcast('players_info', getClientNames())
    chatLog.push(`${clients[socket.id].name} joined us.`)
    broadcast('chat', `${clients[socket.id].name} joined us.`)
  })

  socket.on('chat', message => {
    // message filtering [size, command, ...]
    console.log('chat:', message);

    if (clients[socket.id].name != null) {
      message = `[${clients[socket.id].name}]: ${message}`
      chatLog.push(message)
      broadcast('chat', message)
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(`Disconnecting a user ${socket.id}, reason: '${reason}'`)
    if (reason === 'io server disconnect') {
      // the disconnection was initiated by the server, you need to reconnect manually
      socket.connect(); // when ???
    }

    if (clients[socket.id].name != null) {
      chatLog.push(`${clients[socket.id].name} left the party.`)
      broadcast('chat', `${clients[socket.id].name} left the party.`)
      delete clients[socket.id]
      broadcast('players_info', getClientNames())
    }
    else {
      delete clients[socket.id]
    }
  })
  
  socket.on('start', () => {
    for(let id in clients) {
      if (clients[id].name != null) {
        rooms.r00001.clients.push(clients[id]) // better create game here
        clients[id].room = rooms.r00001 // is cyclic ref good?
      }
    }
    broadcast('start')
  })

  socket.on('endTurn', () => {
    let room = clients[socket.id].room
    
    console.log(`test ${room.activePlayer}, ${room != null && room.clients[room.activePlayer].socket == socket}, ${room.clients.length}.`)
    if (room != null && room.clients[room.activePlayer].socket == socket) {
      room.activePlayer++
      if (room.activePlayer >= room.clients.length) room.activePlayer = 0
      console.log(`now ${room.activePlayer} turn.`)
      broadcast('nextPlayer')
    }
  })

  socket.on('playerAction', (action) => {
    let room = clients[socket.id].room
    console.log(`${clients[socket.id].name} /${action.player}\\ -> ${action.player}, ${action.unit}, ${action.action}, ${action.direction}`)
    if (room != null && room.clients[room.activePlayer].socket == socket) {
      broadcast('playerAction', action, [socket.id]) // except himself
    }
  })
})

http.listen(globalConfig.PORT, globalConfig.HOST, () => {
  console.log(`listening on '${globalConfig.PORT}:${globalConfig.HOST}`)
})