function run_triangles() {
  spawnPoints();

  for (let p of points) {
    p.update();
  }
  
  draw_triangles();
  
  for(let p of points){
    p.display();
  }
}



class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.r = random(1, 5);

    this.fillCol = color(random(globalHue, globalHue+hueRange) % 360, sat, bright)
    this.fade = 1;

    this.viableSpot = true;
    for (let p of points) {
      let d = dist(this.x, this.y, p.x, p.y);
      if (d < (this.r + p.r) * 3) {
        this.viableSpot = false;
        return;
      }
    }

  }

  update() {
    this.fillCol = color((hue(this.fillCol) + hueChangeRate) % 360, sat, bright, alpha(this.fillCol));
    this.fade -= triangleFadeRate;
    let color_a;
    if (this.fade > 0.5) {
      color_a = map(this.fade, 1, 0.75, 0, 1, true);
    } else if (this.fade > 0) {

      color_a = map(this.fade, 0.25, 0, 1, 0, true);
    } else {
      points.splice(points.indexOf(this), 1)
    }

    this.fillCol.setAlpha(color_a);

    for (let i = 0; i < poses.length; i++) {
      let pose = poses[i].pose;
      for (let j = 0; j < pose.keypoints.length; j++) {
        let keypoint = pose.keypoints[j];
        if (keypoint.score > poseThreshold) {
          let d = dist(this.x, this.y, keypoint.position.x, keypoint.position.y)
          if (d < triangleSpawnOffsets ) {
            this.fade = max(this.fade, 0.5);
          }
        }
      }
    }
  }


  display() {
    fill(this.fillCol)
    noStroke();
    circle(this.x, this.y, this.r)
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }
}


function draw_triangles() {
  delaunay = Delaunator.from(points, (p) => p.x, (p) => p.y);
  let coords = [];

  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    coords.push([
      points[delaunay.triangles[i]],
      points[delaunay.triangles[i + 1]],
      points[delaunay.triangles[i + 2]]
    ]);
  }
  
  for (let c of coords) {
    let biggestEdge = Math.max(
      sq(c[0].x - c[1].x) + sq(c[0].y - c[1].y),
      sq(c[1].x - c[2].x) + sq(c[1].y - c[2].y),
      sq(c[2].x - c[0].x) + sq(c[2].y - c[0].y)
    );

    if (biggestEdge < maxAllowedEdgeLength) {
      fill(c[0].fillCol)
      strokeWeight(0.2)
      stroke(0);
      triangle(c[0].x, c[0].y, c[1].x, c[1].y, c[2].x, c[2].y);
    }
  }

}

function spawnPoints() {
  for (let p of poses) {
    for (let keypoint of p.pose.keypoints) {
      if (keypoint.score > poseThreshold) {
        spawnAtPoint(keypoint.position.x, keypoint.position.y);
      }
    }

    let cCount = p.pose.keypoints.reduce(reducerCount, 0);
    let cX = p.pose.keypoints.reduce(reducerX, 0) / cCount;
    let cY = p.pose.keypoints.reduce(reducerY, 0) / cCount;
    spawnAtPoint(cX, cY)
  }

}

function spawnAtPoint(requestX, requestY) {
  let spawnX = random(requestX - triangleSpawnOffsets, requestX + triangleSpawnOffsets);
  let spawnY = random(requestY - triangleSpawnOffsets, requestY + triangleSpawnOffsets);


  for (let extraRepeats = 0; extraRepeats < numCameras; extraRepeats++) {

    let attempt = new Point(spawnX + cameraGap * extraRepeats, spawnY);
    if (attempt.viableSpot) {
      points.push(attempt)
    }
  }
}

const reducerCount = (accumulator, item) => {

  if (item.score > 0.2) {
    return ++accumulator;
  } else {
    return accumulator;
  }
};

const reducerX = (accumulator, item) => {

  if (item.score > 0.2) {
    if (item.position.x) {
      return accumulator += item.position.x;
    }
  }

  return accumulator;
};

const reducerY = (accumulator, item) => {

  if (item.score > 0.2) {
    if (item.position.y) {
      return accumulator += item.position.y;
    }
  }

  return accumulator;
};