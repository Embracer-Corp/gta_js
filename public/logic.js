/*global document, addEventListener*/
/*eslint no-undef: "error"*/

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d");

var fps = 1000/100;
var lps = 1000/100;
var player = {x: canvas.width/2, y: canvas.height/2, radius: 50, speed: 500, camera: {x:canvas.width/2, y:canvas.height/2}, collision:false}
var control = {
  keyboard: {isGoLeft: false, isGoRight: false, isGoUp: false, isGoDown: false}, mouse: {x: 0, y: 0, hold: null}, touch0: {x: 0, y: 0, hold: null},
  stickAreaRadius: 100, stickSizeRadius: 30,
  get axis() {
    let res = { x: this.keyboard.isGoRight - this.keyboard.isGoLeft, y: this.keyboard.isGoDown - this.keyboard.isGoUp }
    if (this.mouse.hold != null) {
      res.x += this.mouse.x - this.mouse.hold.x
      res.y += this.mouse.y - this.mouse.hold.y
    } else if(this.touch0.hold != null) {
      res.x += this.touch0.x - this.touch0.hold.x
      res.y += this.touch0.y - this.touch0.hold.y
    }
    //console.log(res, Math.sqrt(res.x * res.x + res.y * res.y))
    if (Math.sqrt(res.x * res.x + res.y * res.y) < (this.stickAreaRadius - this.stickSizeRadius)) {
      multiplication(res, 1/(this.stickAreaRadius - this.stickSizeRadius))
    } else {
      normalize(res, 1) 
    }
    return res
  }
}
var settings = {width:2000, height:2000, gridSize: 250}
var map = {"rec":{x:275, y:200, w:300, h:150}}
var test = ""

canvas.width = 400;
canvas.height = 745;


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
function multiplication(vector, scale) {
  vector.x *= scale
  vector.y *= scale
}

var lastTimeLogic = Date.now();
setInterval(function() {
  let timePass = Date.now() - lastTimeLogic;
  
  if (timePass < lps) {
      return;
  }

  let maxSpeed = player.speed * timePass / 1000
  let distance = control.axis
  multiplication(distance, maxSpeed)
  
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
    //console.log(`R:${player.radius}, x:${player.x.toFixed(2)}, y:${player.y.toFixed(2)}, a:${map[c].x}, b:${map[c].y}, dy2:${player.radius*player.radius - player.y*player.y}, dx:${Math.sqrt(player.radius*player.radius - player.x*player.x)}`)
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

var lastTimeGraphic = Date.now();
setInterval(function() {
  let timePass = Date.now() - lastTimeGraphic; // guess will better change "nextTimeRender > Date.now()"
  if (timePass < fps) {
      return;
  }
  
  canvas.width = document.documentElement.clientWidth - 20
  canvas.height = document.documentElement.clientHeight - 20

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "12px bold Lucida Console"; // need to remove bold

  for (let j = Math.floor((player.camera.y-canvas.height/2)/settings.gridSize); j < (player.camera.y+canvas.height/2)/settings.gridSize; j++) {    
    for (let i = Math.floor((player.camera.x-canvas.width/2)/settings.gridSize); i < (player.camera.x+canvas.width/2)/settings.gridSize; i++) {
      if (i < 0 || i >= settings.width/settings.gridSize || j < 0 || j >= settings.height/settings.gridSize) { continue }
      ctx.fillStyle = (i+j)%2?"#707580":"#707070"
      ctx.fillRect(canvas.width/2 -player.camera.x + i*settings.gridSize, canvas.height/2 -player.camera.y + j*settings.gridSize, settings.gridSize, settings.gridSize)
    }
  }

  ctx.strokeStyle = player.collision?"#FF2000":"#000"
  for(let c in map)
  {
    ctx.fillStyle = "#307540"
    ctx.beginPath(); ctx.rect(canvas.width/2 -player.camera.x + map[c].x, canvas.height/2 -player.camera.y + map[c].y, map[c].w, map[c].h)
    ctx.fill(); ctx.stroke()
    ctx.fillStyle = "#000"
    let text = `x: ${map[c].x.toFixed(2)}, y:${map[c].y.toFixed(2)}`
    ctx.fillText(text, canvas.width/2 -player.camera.x + map[c].x + 5, canvas.height/2 -player.camera.y + map[c].y + 15)
  }

  ctx.fillStyle = "#902000"
  
  ctx.beginPath(); ctx.arc(canvas.width/2 -player.camera.x + player.x, canvas.height/2 -player.camera.y + player.y, player.radius, 0, 2 * Math.PI)
  ctx.fill(); ctx.stroke()
  ctx.fillStyle = "#000"
  ctx.fillRect(canvas.width/2 -player.camera.x + player.x - 1, canvas.height/2 -player.camera.y + player.y - 1, 2, 2)
  let text = `x: ${player.x.toFixed(2)}, y:${player.y.toFixed(2)}`
  ctx.fillText(text, canvas.width/2 -player.camera.x + player.x - ctx.measureText(text).width/2, canvas.height/2 -player.camera.y + player.y+15)

  if (control.mouse.hold != null) {
    ctx.fillStyle = "#00000030";
    ctx.beginPath();ctx.arc(control.mouse.hold.x, control.mouse.hold.y, control.stickAreaRadius, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke()
    ctx.beginPath();ctx.arc(control.mouse.hold.x, control.mouse.hold.y, control.stickSizeRadius, 0, 2 * Math.PI);
    ctx.fill()
    ctx.fillStyle = "#333333";
    ctx.beginPath();ctx.arc(control.mouse.x, control.mouse.y, control.stickSizeRadius, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke()
  }
  if (control.touch0.hold != null) {
    ctx.fillStyle = "#00000030";
    ctx.beginPath();ctx.arc(control.touch0.hold.x, control.touch0.hold.y, control.stickAreaRadius, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke()
    ctx.beginPath();ctx.arc(control.touch0.hold.x, control.touch0.hold.y, control.stickSizeRadius, 0, 2 * Math.PI);
    ctx.fill()
    ctx.fillStyle = "#333333";
    ctx.beginPath();ctx.arc(control.touch0.x, control.touch0.y, control.stickSizeRadius, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke()
  }
  ctx.fillText(test, 20, 20)

  lastTimeGraphic += timePass; // finished drawing data at the start of the function
}, 10);

/// --- EVENTS ---

function onMouseUpdate(e) {
  // if (e.toElement != canvas) return;
  
  control.mouse.x = e.x - canvas.offsetLeft;
  control.mouse.y = e.y - canvas.offsetTop;
  
  // if (control.mouse.hold != null) {
  // }
}

document.addEventListener('mousemove', onMouseUpdate, false);
document.addEventListener('mouseenter', onMouseUpdate, false);

function moverSet(e) {
  if (e.ctrlKey || e.altKey) return
  // if ('type' in e && e['type'] == 'keydown') { console.log("key pressed '"+e.key+"'") }
  switch (e.key) {    
    case 'a': case 'arrowLeft':
      control.keyboard.isGoLeft = true;
      break;
    case 'd': case 'arrowRight':
      control.keyboard.isGoRight = true;
      break;
    case 'w': case 'arrowUp':
      control.keyboard.isGoUp = true;
      break;
    case 's': case 'arrowDown':
      control.keyboard.isGoDown = true;
      break;
  }
}

function moverReset(e) {
  switch (e.key) {
    case 'a':
      control.keyboard.isGoLeft = false;
      break;
    case 'd':
      control.keyboard.isGoRight = false;
      break;
    case 'w':
      control.keyboard.isGoUp = false;
      break;
    case 's':
      control.keyboard.isGoDown = false;
      break;
  }
}

addEventListener("keydown", moverSet);
addEventListener("keyup", moverReset);

canvas.onmousedown = function(e) {
  // console.dir(document)
  test = "Resolution: " + document.documentElement.clientWidth + "x" + document.documentElement.clientHeight
  control.mouse.hold = {x: e.layerX, y: e.layerY }
}
document.body.onmouseup = function() {
  control.mouse.hold = null
}

canvas.onmousewheel = function(e) {
  moverSet({key: e.wheelDelta>0?'=':'-'})
}

addEventListener('touchstart', function(ev) {
  ev.preventDefault();
  test = document.documentElement.clientWidth + ", " + document.documentElement.clientHeight
  //test = document.fullscreenElement
  if (document.fullscreenElement == null ) { canvas.requestFullscreen() }
  for (var i=0; i < ev.targetTouches.length; i++) {
    if (i > 0) break
    control['touch'+i].hold = {x: ev.changedTouches[i].pageX + canvas.offsetLeft, y: ev.changedTouches[i].pageY + canvas.offsetTop }
    control['touch'+i].x = ev.changedTouches[i].pageX + canvas.offsetLeft
    control['touch'+i].y = ev.changedTouches[i].pageY + canvas.offsetTop
  }
}, false)

addEventListener("touchend", function(ev) {
  ev.preventDefault();
  control['touch0'].hold = null
}, false)

addEventListener("touchmove", function(ev) {
  ev.preventDefault();
  // console.dir(ev)
  //test = ev.changedTouches[0].pageX
  control['touch0'].x = ev.changedTouches[0].pageX + canvas.offsetLeft
  control['touch0'].y = ev.changedTouches[0].pageY + canvas.offsetTop
}, false);

