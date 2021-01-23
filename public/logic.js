/*global document, addEventListener*/
/*eslint no-undef: "error"*/

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");

var fps = 1000/100;
var lps = 1000/100;
var player = {x: canvas.width/2, y: canvas.height/2, radius: 50, speed: 500, prevPos: {x: 100, y: 100}, camera: {x:canvas.width/2, y:canvas.height/2}, collision:false}
var control = {isGoLeft: false, isGoRight: false, isGoUp: false, isGoDown: false}
var settings = {width:1000, height:1000, gridSize: 250}
var map = {"rec":{x:275, y:200, w:300, h:150}}

canvas.width = 960;// 960 800
canvas.height = 540;//540 600


function HotLog(txt) {
  document.getElementById("hotLog").innerHTML = txt;
}

function lerp(v1, v2, w) {
    return v1 + w * (v2 - v1);
}

function normalize(vector, scale) {
  var norm = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (norm != 0) {
    vector.x = scale * vector.x / norm;
    vector.y = scale * vector.y / norm;
  }
}

var lastTimeLogic = Date.now();
setInterval(function() {
  let timePass = Date.now() - lastTimeLogic;
  
  if (timePass < lps) {
      return;
  } else if (timePass > 4 * lps) { // hard mistiming
    lastTimeLogic = Date.now();
    timePass = 4 * lps;
  }

  let maxSpeed = player.speed * timePass / 1000
  let distance = { x:0, y:0 }  
  if (control.isGoLeft) {
    distance.x -= 1
  }
  if (control.isGoRight) {
    distance.x += 1
  }
  if (control.isGoUp) {
    distance.y -= 1
  }
  if (control.isGoDown) {
    distance.y += 1
  }
  
  normalize(distance, maxSpeed)
  
  if (player.x - player.radius + distance.x < 0) {
    distance.x = player.radius - player.x
  } else if (player.x + player.radius + distance.x > settings.width) {
    distance.x = settings.width - player.radius - player.x
  }
  if (player.y - player.radius + distance.y < 0) {
    distance.y = player.radius - player.y
  } else if (player.y + player.radius + distance.y > settings.height) {
    distance.y = settings.height - player.radius - player.y
  }

  let isCollision = false
  for(let c in map)
  {
    console.log(`R:${player.radius}, x:${player.x.toFixed(2)}, y:${player.y.toFixed(2)}, a:${map[c].x}, b:${map[c].y}, dy2:${player.radius*player.radius - player.y*player.y}, dx:${Math.sqrt(player.radius*player.radius - player.x*player.x)}`)
    if(Math.abs(Math.sqrt(player.radius*player.radius - player.y*player.y) - map[c].y) <= 0.1 && Math.abs(Math.sqrt(player.radius*player.radius - player.x*player.x) - map[c].x) <= 0.1) {
      isCollision = true
    }
    if(player.x >= map[c].x && player.x <= map[c].w + map[c].x &&
       player.y >= map[c].y && player.y <= map[c].h + map[c].y )
    {
      isCollision = true
    }
  }
  player.collision = isCollision
    
  player.x += distance.x
  player.y += distance.y
  
  if (player.x - canvas.width/2 < 0 && player.x + canvas.width/2 < settings.width) {
    player.camera.x = canvas.width/2
  } else if (player.x - canvas.width/2 > 0 && player.x + canvas.width/2 > settings.width) {
    player.camera.x = settings.width - canvas.width/2
  } else {
    player.camera.x = player.x
  }
  if (player.y - canvas.height/2 < 0 && player.y + canvas.height/2 < settings.height) {
    player.camera.y = canvas.height/2
  } else if (player.y - canvas.height/2 > 0 && player.y + canvas.height/2 > settings.height) {
    player.camera.y = settings.height - canvas.height/2
  } else {
    player.camera.y = player.y
  }
  
  lastTimeLogic += timePass; // state logic computation completed at START of function
}, 10)

setInterval(function() {
  //console.log(player.x-player.prevPos.x, player.y-player.prevPos.y)
  player.prevPos.x = player.x
  player.prevPos.y = player.y
}, 1000)

var lastTimeGraphic = Date.now();
setInterval(function() {
  let timePass = Date.now() - lastTimeGraphic; // guess will better change "nextTimeRender > Date.now()"
  if (timePass < fps) {
      return;
  }

  // if (game.settings.tileScaleTimeExp > 0) {
  //   if (game.settings.tileScaleTimeExp > game.settings.scaleSpeed/10) {
  //     game.settings.tileScaleTimeExp -= timePass
  //     if (game.settings.tileScaleTimeExp < 0) game.settings.tileScaleTimeExp = 0
  //     game.control.camera.x -= game.control.mouse.cell.x *lerp(0, game.settings.tileSize - game.settings.tileSizeTarget, 1 - game.settings.tileScaleTimeExp/2/game.settings.scaleSpeed)
  //     game.control.camera.y -= game.control.mouse.cell.y *lerp(0, game.settings.tileSize - game.settings.tileSizeTarget, 1 - game.settings.tileScaleTimeExp/2/game.settings.scaleSpeed)
  //     // not good centring on a cam, need to upgrade
  //     game.settings.tileSize = lerp(game.settings.tileSize, game.settings.tileSizeTarget, 1 - game.settings.tileScaleTimeExp/2/game.settings.scaleSpeed)
  //   } else {
  //     game.settings.tileSize = game.settings.tileSizeTarget
  //     game.settings.tileScaleTimeExp = 0
  //   }
  // }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "12px bold Lucida Console"; // need to remove bold

  for (let j = Math.floor((player.camera.y-canvas.height/2)/settings.gridSize); j < (player.camera.y+canvas.height/2)/settings.gridSize; j++) {    
    for (let i = Math.floor((player.camera.x-canvas.width/2)/settings.gridSize); i < (player.camera.x+canvas.width/2)/settings.gridSize; i++) {
      if (i < 0 || i >= settings.width/settings.gridSize || j < 0 || j >= settings.height/settings.gridSize) { continue }
      ctx.fillStyle =  (i+j)%2?"#707580": "#707070"
      ctx.fillRect(canvas.width/2 -player.camera.x + i*settings.gridSize, canvas.height/2 -player.camera.y + j*settings.gridSize, settings.gridSize, settings.gridSize)
    }
  }

  ctx.strokeStyle = player.collision?"#FF2000":"#000"
  for(let c in map)
  {
    ctx.fillStyle = "#307540"
    ctx.fillRect(canvas.width/2 -player.camera.x + map[c].x, canvas.height/2 -player.camera.y + map[c].y, map[c].w, map[c].h)
    ctx.fillStyle = "#000"
    ctx.strokeRect(canvas.width/2 -player.camera.x + map[c].x, canvas.height/2 -player.camera.y + map[c].y, map[c].w, map[c].h)
    let text = `x: ${map[c].x.toFixed(2)}, y:${map[c].y.toFixed(2)}`
    ctx.fillText(text, canvas.width/2 -player.camera.x + map[c].x + 5, canvas.height/2 -player.camera.y + map[c].y + 15)
  }

  ctx.fillStyle = "#902000"
  ctx.beginPath();
  ctx.arc(canvas.width/2 -player.camera.x + player.x, canvas.height/2 -player.camera.y + player.y, player.radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width/2 -player.camera.x + player.x, canvas.height/2 -player.camera.y + player.y, player.radius, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "#000"
  ctx.fillRect(canvas.width/2 -player.camera.x + player.x - 1, canvas.height/2 -player.camera.y + player.y - 1, 2, 2)
  let text = `x: ${player.x.toFixed(2)}, y:${player.y.toFixed(2)}`
  ctx.fillText(text, canvas.width/2 -player.camera.x + player.x - ctx.measureText(text).width/2, canvas.height/2 -player.camera.y + player.y+15)

  
  // for (let i = Math.floor((game.control.camera.y - canvas.height/2)/game.settings.tileSize); i < (game.control.camera.y + canvas.height/2)/game.settings.tileSize; i++) {
  //   for (let j = Math.floor((game.control.camera.x - canvas.width/2)/game.settings.tileSize); j < (game.control.camera.x + canvas.width/2)/game.settings.tileSize; j++) {
  //     if (i < 0 || i >= map.tiles.length || j < 0 || j >= map.tiles[i].length) {continue;}
  //     ctx.fillStyle = TILES[map.tiles[i][j]].color
  //     ctx.fillRect(canvas.width/2 -game.control.camera.x + j * game.settings.tileSize, canvas.height/2 -game.control.camera.y + i * game.settings.tileSize, game.settings.tileSize, game.settings.tileSize);

  //     if (game.settings.showGridInfo == 'num') {
  //       ctx.fillStyle = "#00002090";
  //       ctx.fillText(
  //           ("000" + i).slice(-3),
  //           canvas.width/2 -game.control.camera.x + 4 + j * game.settings.tileSize,
  //           canvas.height/2 -game.control.camera.y + game.settings.tileSize*0.45 + i * game.settings.tileSize,
  //           game.settings.tileSize-2
  //       );
  //       ctx.fillText(
  //         ("000" + j).slice(-3),
  //         canvas.width/2 -game.control.camera.x + 6 + j * game.settings.tileSize,
  //         canvas.height/2 -game.control.camera.y + game.settings.tileSize*0.5 + i * game.settings.tileSize+10,
  //         game.settings.tileSize-2
  //       );
  //       ctx.fillStyle = "#00000050";
  //       if (j == 0) {
  //         ctx.fillRect(canvas.width/2 -game.control.camera.x + j * game.settings.tileSize, canvas.height/2 -game.control.camera.y + i * game.settings.tileSize, 2, 2);
  //       }
  //     }
  //   }
  // }
  
  // HotLog('Keys:\n' +
  //     'Player: "' + game.player.name +'", zoom:' + (game.settings.tileSize/ SETTINGS.tileDefaultSize * 100).toFixed(2) + '%, et:' + game.settings.tileScaleTimeExp + ', tts:' + game.settings.tileSizeTarget + '\n' +
  //     'Cam [' + game.control.camera.x.toFixed(2) + ', ' + game.control.camera.y.toFixed(2) + '], Face ' + (180 / Math.PI * 0).toFixed(2) + '°\n' +
  //     'Mouse [' + game.control.mouse.x + ',' + game.control.mouse.y + '], cell[' + game.control.mouse.cell.x + ', ' + game.control.mouse.cell.y + '], polar[' + (180 / Math.PI * game.control.mouse.polar.angular).toFixed(3) + '°,' + game.control.mouse.polar.distance.toFixed(2) + ']');
  
  lastTimeGraphic += timePass; // finished drawing data at the start of the function
}, 10);

/// --- EVENTS ---

// function onMouseUpdate(e) {
//   // if (e.toElement != canvas) return;
  
//   game.control.mouse.x = e.x - canvas.offsetLeft;
//   game.control.mouse.y = e.y - canvas.offsetTop;
  
//   game.player.mouseCalcCell()
//   game.player.mouseCalcPolar()

//   if (game.control.mouse.hold != null) {
//     game.control.camera.x = game.control.mouse.hold.x - game.control.mouse.x
//     game.control.camera.y = game.control.mouse.hold.y - game.control.mouse.y
//   }
// }

// document.addEventListener('mousemove', onMouseUpdate, false);
// document.addEventListener('mouseenter', onMouseUpdate, false);

function moverSet(e) {
  if (e.ctrlKey || e.altKey) return
  // if ('type' in e && e['type'] == 'keydown') { console.log("key pressed '"+e.key+"'") }
  switch (e.key) {    
    case 'a': case 'arrowLeft':
      control.isGoLeft = true;
      break;
    case 'd': case 'arrowRight':
      control.isGoRight = true;
      break;
    case 'w': case 'arrowUp':
      control.isGoUp = true;
      break;
    case 's': case 'arrowDown':
      control.isGoDown = true;
      break;

    case ' ':
      break
    case '-':
      if (game.settings.tileSizeTarget > SETTINGS.tileMinSize) {
        game.settings.tileSizeTarget -= 2
        game.settings.tileScaleTimeExp = 250
      }
      break
    case '=': case '+':
      if (game.settings.tileSizeTarget < SETTINGS.tileMaxSize) {
        game.settings.tileSizeTarget += 2
        game.settings.tileScaleTimeExp = 250
      }
      break
    case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': case '0':
      if (e.code.startsWith("Numpad")) {
        if (e.key % 5 != 0) {
          console.log('%%',game.player.name,nickname)
          if (game.player.activeUnit.avalibleMoves == 0 || nickname != game.player.name) { return }
          socket.emit('playerAction', { player: game.player.name, unit: game.player.control.selectedUint, action: 'move', direction: e.key })
          if (e.key % 3 == 1) { game.player.activeUnit.x-=1 }
          else if (e.key % 3 == 0) { game.player.activeUnit.x+=1 }
          if (e.key < 4) { game.player.activeUnit.y+=1 }
          else if (e.key > 6) { game.player.activeUnit.y-=1 }

          game.player.activeUnit.avalibleMoves -= 1          
          if (game.player.activeUnit.avalibleMoves == 0) { game.player.selectNextUnit() }
        }
      }
      else {
        map.tiles[game.control.mouse.cell.y][game.control.mouse.cell.x] = e.key
      }
      break
    case 'e':
      break
  }
}

function moverReset(e) {
  switch (e.key) {
    case 'a':
      control.isGoLeft = false;
      break;
    case 'd':
      control.isGoRight = false;
      break;
    case 'w':
      control.isGoUp = false;
      break;
    case 's':
      control.isGoDown = false;
      break;
  }
}

addEventListener("keydown", moverSet);
addEventListener("keyup", moverReset);

// canvas.onmousedown = function(e) {
//   game.control.mouse.hold = {x: e.layerX + game.control.camera.x , y: e.layerY + game.control.camera.y }
// }
// document.body.onmouseup = function(/*e*/) {
//   game.control.mouse.hold = null
// }

canvas.onmousewheel = function(e) {
  moverSet({key: e.wheelDelta>0?'=':'-'})
}

