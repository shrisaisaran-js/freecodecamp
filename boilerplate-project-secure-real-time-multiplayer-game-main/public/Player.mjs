class Player {
  constructor({ x, y, score = 0, id }) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    this.width = 30;
    this.height = 30;
  }

  // dir: "up" | "down" | "left" | "right", px: number of pixels
  movePlayer(dir, px) {
    switch (dir) {
      case 'up':    this.y -= px; break;
      case 'down':  this.y += px; break;
      case 'left':  this.x -= px; break;
      case 'right': this.x += px; break;
    }
  }

  // item: collectible object. Returns true if rectangles overlap.
  collision(item) {
    const w = item.width || 15;
    const h = item.height || 15;
    return (
      this.x < item.x + w &&
      this.x + this.width > item.x &&
      this.y < item.y + h &&
      this.y + this.height > item.y
    );
  }

  // arr: array of all players. Returns "Rank: current/total"
  calculateRank(arr) {
    const higher = arr.filter((p) => p.score > this.score).length;
    return `Rank: ${higher + 1}/${arr.length}`;
  }
}

export default Player;
