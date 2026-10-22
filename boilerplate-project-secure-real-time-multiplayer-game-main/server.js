require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// ---- Security (helmet@3) ----
app.use(helmet.noSniff());                              // no MIME sniffing
app.use(helmet.xssFilter());                            // XSS protection
app.use(helmet.noCache());                              // nothing cached
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));  // fake X-Powered-By

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

// ---- Game (server-authoritative) ----
const W = 640, H = 480, TOP = 50, SPEED = 5, SIZE = 30, ITEM = 15;
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

Promise.all([import('./public/Player.mjs'), import('./public/Collectible.mjs')]).then(([PlayerMod, CollectibleMod]) => {
  const Player = PlayerMod.default;
  const Collectible = CollectibleMod.default;

  const io = socket(server);
  const players = {};
  const inputs = {};
  let nextItemId = 1;

  const spawnItem = () =>
    new Collectible({
      id: nextItemId++,
      value: rand(1, 3),
      x: rand(0, W - ITEM),
      y: rand(TOP, H - ITEM),
    });

  let item = spawnItem();

  io.on('connection', (socket) => {
    players[socket.id] = new Player({
      id: socket.id,
      score: 0,
      x: rand(0, W - SIZE),
      y: rand(TOP, H - SIZE),
    });
    inputs[socket.id] = {};
    socket.emit('init', { id: socket.id });

    socket.on('input', (i) => {
      if (!i || typeof i !== 'object') return;           // validate client data
      inputs[socket.id] = {
        up: i.up === true, down: i.down === true,
        left: i.left === true, right: i.right === true,
      };
    });

    socket.on('disconnect', () => {
      delete players[socket.id];
      delete inputs[socket.id];
    });
  });

  setInterval(() => {
    for (const id in players) {
      const p = players[id];
      const inp = inputs[id] || {};
      for (const dir of ['up', 'down', 'left', 'right']) {
        if (inp[dir]) p.movePlayer(dir, SPEED);
      }
      p.x = Math.min(Math.max(p.x, 0), W - SIZE);
      p.y = Math.min(Math.max(p.y, TOP), H - SIZE);
      if (p.collision(item)) {
        p.score += item.value;
        item = spawnItem();
      }
    }
    io.emit('state', { players: Object.values(players), collectible: item });
  }, 1000 / 30);
}).catch((err) => console.error('Game failed to start:', err));

module.exports = app; // For testing
