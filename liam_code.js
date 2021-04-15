// If you get an error about max uniforms then you can decrease these 2 values :(
const MAX_PARTICLE_COUNT = 40;
const MAX_TRAIL_COUNT = 20;

let colorScheme = ["#E69F66", "#DF843A", "#D8690F", "#B1560D", "#8A430A"];
let shaded = true;
let theShader;
let shaderTexture;
let trail = [];
let particles = [];

let video;
let poseNet;
let pose;
let skeleton;
let bigX;
let bigY;
let pbigX = [];
let pbigY = [];
let less = 1;
let previousX;
let previousy;
let poses = [];

function preload() {
  theShader = loadShader(vertShader, fragShader);
}

function setup() {



  createCanvas(560*10, 213*6, WEBGL);

  // let canvas = createCanvas(windowWidth, windowHeight, WEBGL);

  // canvas.canvas.oncontextmenu = () => false; // Removes right-click menu.
  // noCursor();

  shaderTexture = createGraphics(width, height, WEBGL);
  shaderTexture.noStroke();

  video = createCapture(VIDEO);
  video.hide();
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on("pose", function (results) {
    poses = results;
  });

}


function draw() {
  translate(-width / 2, -height / 2);
  //image(video, 0, 0);


  for (let i = 0; i < poses.length; i += 1) {
    const pose = poses[i].pose;
    // for (let j = 0; j < pose.keypoints.length; j += 1) {
    for (let j = 0; j < 1; j += 1) {
      const keypoint = pose.keypoints[j];
      if (poses[i].pose.keypoints[j].score > 0.2) {
        x = poses[i].pose.keypoints[j].position.x
        y = poses[i].pose.keypoints[j].position.y


        //       let x = poses[i].pose.keypoints[i].leftWrist.position.x;
        //       let y = poses[i].pose.keypoints[i].leftWrist.position.y;
        //       console.log(x, y, i);




        let easing = 0.002;

        let targetX = x;
        let dx = targetX - x;
        x += dx * easing;

        let targetY = y;
        let dy = targetY - y;
        y += dy * easing;


        let bigX = x;
        let bigY = y;




        // Trim end of trail.
        trail.push([bigX, bigY]);

        let removeCount = 1;
        // if (mouseIsPressed && mouseButton == CENTER) {
        //   removeCount++;
        // }

        for (let i = 0; i < removeCount; i++) {
          if (trail.length == 0) {
            break;
          }

          if (trail.length > MAX_TRAIL_COUNT) {
            trail.splice(0, 1);
          }
        }

        // Spawn particles.
        if (trail.length > 1 && particles.length < MAX_PARTICLE_COUNT) {
          let detected = new p5.Vector(bigX, bigY);
          detected.sub(bigX - width / 2, bigY - height / 2);
          //console.log("detected", detected.sub())
          if (detected.mag() > 10) {
            detected.normalize();
            particles.push(new Particle(bigX, bigY, detected.x, detected.y));
          }
        }
        //     }
        //   }
        // }



        // Move and kill particles.
        for (let i = particles.length - 1; i > -1; i--) {
          particles[i].move();
          if (particles[i].vel.mag() < 0.1) {
            particles.splice(i, 1);
          }
        }

        if (shaded) {
          // Display shader.
          shaderTexture.shader(theShader);


          let data = serializeSketch();

          theShader.setUniform("resolution", [width, height]);
          theShader.setUniform("trailCount", trail.length);
          theShader.setUniform("trail", data.trails);
          theShader.setUniform("particleCount", particles.length);
          theShader.setUniform("particles", data.particles);
          theShader.setUniform("colors", data.colors);

          shaderTexture.rect(0, 0, width, height);
          texture(shaderTexture);

          rect(0, 0, width, height);
        } else {
          // Display points.
          stroke(255, 200, 0);
          for (let i = 0; i < particles.length; i++) {
            point(particles[i].pos.x, particles[i].pos.y);
          }

          stroke(0, 255, 255);
          for (let i = 0; i < trail.length; i++) {
            point(trail[i][0], trail[i][1]);
          }
        }
      }
    }
  }
}

// function mousePressed() {
//   if (mouseButton == RIGHT) {
//     shaded = !shaded;
//   }
// }

function serializeSketch() {
  data = {
    "trails": [],
    "particles": [],
    "colors": []
  };

  for (let i = 0; i < trail.length; i++) {
    data.trails.push(
      map(trail[i][0], 0, width, 0.0, 1.0),
      map(trail[i][1], 0, height, 1.0, 0.0));
  }

  for (let i = 0; i < particles.length; i++) {
    data.particles.push(
      map(particles[i].pos.x, 0, width, 0.0, 1.0),
      map(particles[i].pos.y, 0, height, 1.0, 0.0),
      particles[i].mass * particles[i].vel.mag() / 100)

    let itsColor = colorScheme[particles[i].colorIndex];
    data.colors.push(red(itsColor), green(itsColor), blue(itsColor));
  }

  return data;
}