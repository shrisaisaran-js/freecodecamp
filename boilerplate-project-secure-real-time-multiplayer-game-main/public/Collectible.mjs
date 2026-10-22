class Collectible {
  constructor({ x, y, value = 1, id }) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.id = id;
    this.width = 15;
    this.height = 15;
  }
}

/*
  Note: attempt to export this for use
  in server.js
*/
try {
  module.exports = Collectible;
} catch (e) {}

export default Collectible;
