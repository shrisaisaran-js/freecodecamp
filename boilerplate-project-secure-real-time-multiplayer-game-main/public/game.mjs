import Player from './Player.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');

let myId = null;
let state = { players: [], collectible: null };

socket.on('init', ({ id }) => { myId = id; });
socket.on('state', (s) => { state = s; });

// ---- Input (WASD + arrows) ----
const keyMap = {
  w: 'up', arrowup: 'up',
  s: 'down', arrowdown: 'down',
  a: 'left', arrowleft: 'left',
  d: 'right', arrowright: 'right',
};
const pressed = { up: false, down: false, left: false, right: false };

function handleKey(e, isDown) {
  const dir = keyMap[e.key.toLowerCase()];
  if (!dir) return;
  e.preventDefault();
  if (pressed[dir] !== isDown) {
    pressed[dir] = isDown;
    socket.emit('input', pressed);
  }
}
window.addEventListener('keydown', (e) => handleKey(e, true));
window.addEventListener('keyup', (e) => handleKey(e, false));

// ---- Rendering ----
const colorFor = (id) => {
  let h = 0;
  for (const c of id) h = (h *31 + c.charCodeAt(0)) % 360;
  return `hsl(${h}, 70%, 55%)`;
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f5f6f7';
  ctx.font = '16px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('Controls: WASD / Arrows', 10, 25);

  const me = state.players.find((p) => p.id === myId);
  if (me) {
    const rank = new Player(me).calculateRank(state.players);
    ctx.textAlign = 'right';
    ctx.fillText(`${rank}   Score: ${me.score}`, canvas.width - 10, 25);
  }
  ctx.strokeStyle = '#f5f6f7';
  ctx.beginPath();
  ctx.moveTo(0, 50); ctx.lineTo(canvas.width, 50);
  ctx.stroke();

  const c = state.collectible;
  if (c) {
    ctx.fillStyle = ['#ffd700', '#ff9f1c', '#ff4d6d'][c.value - 1] || '#ffd700';
    ctx.beginPath();
    ctx.arc(c.x + c.width / 2, c.y + c.height / 2, c.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of state.players) {
    ctx.fillStyle = colorFor(p.id);
    ctx.fillRect(p.x, p.y, p.width, p.height);
    if (p.id === myId) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeRect(p.x, p.y, p.width, p.height);
      ctx.lineWidth = 1;
    }
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
