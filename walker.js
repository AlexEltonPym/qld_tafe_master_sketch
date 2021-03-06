

function run_walkers(){
    spawnWalkers();
    for (let w of walkers) {
      w.run();
    }

    walkerGraphicsLayer.background(0, 10)

    image(walkerGraphicsLayer, 0, 0)
}


function spawnWalkers() {
  for (let p of poses) {
    for (let keypoint of p.pose.keypoints) {
      if (keypoint.score > poseThreshold) {
        let spawnX = random(keypoint.position.x - walker_spawn_offset, keypoint.position.x + walker_spawn_offset);
        let spawnY = random(keypoint.position.y - walker_spawn_offset, keypoint.position.y + walker_spawn_offset);
        walkers.push(new Walker(spawnX, spawnY));
        
      }
    }
  }
}



class Walker {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.r = random(1, 5);
    this.fillCol = color(random(globalHue, globalHue+hueRange) % 360, sat, bright)
    this.age = 1;
  }

  run() {
    let nAngle = noise(this.pos.x * walkerNoiseScale, this.pos.y * walkerNoiseScale);
    nAngle = map(nAngle, 0, 1, 200, 340)
    this.vel = p5.Vector.fromAngle(radians(nAngle))
    this.age -= walkerAgingSpeed;

    if (this.age < 0) {
      walkers.splice(walkers.indexOf(this), 1)
    }


    this.fillCol.setAlpha(map(this.age, 1, 0, 1.0, 0))
    this.pos.add(this.vel.mult(1.5))
    this.display();
  }


  display() {
    walkerGraphicsLayer.push();
    walkerGraphicsLayer.translate(this.pos.x, this.pos.y)

    walkerGraphicsLayer.fill(this.fillCol)
    walkerGraphicsLayer.circle(0, 0, this.r);
    walkerGraphicsLayer.pop();

  }
}