class FairyParticle {
  constructor(x, y, vx, vy) {

    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.vel.mult(random(20));
    this.vel.rotate(random(TWO_PI));
    this.mass = random(0, 10);
    this.airDrag = random(0.92, 0.98);
    this.fillCol = color(random(globalHue, globalHue+hueRange) % 360, sat, bright);

  }

  move() {
    this.vel.mult(this.airDrag);
    this.pos.add(this.vel);
  }
}



function run_fairy() {
  for (let p of poses) {
    for (let keypoint of p.pose.keypoints) {
        if (keypoint.score > poseThreshold) {

          let keyX = keypoint.position.x;
          let keyY = keypoint.position.y;

          trail.push({ x: keyX, y: keyY });

          let removeCount = 1;
          for (let i = 0; i < removeCount; i++) {
            if (trail.length == 0) {
              break;
            }

            if (trail.length > MAX_TRAIL_COUNT) {
              trail.splice(0, 1);
            }
          }

          // Spawn particles.
          if (trail.length > 1 && fairies.length < MAX_PARTICLE_COUNT) {
            let detected = createVector(-width / 2, -height / 2);
            if (detected.mag() > 10) {
              detected.normalize();
              fairies.push(new FairyParticle(keyX, keyY, detected.x, detected.y));
            }
          }

          // Move and kill particles.
          for (let i = fairies.length - 1; i > -1; i--) {
            fairies[i].move();
            if (fairies[i].vel.mag() < 0.1) {
              fairies.splice(i, 1);
            }
          }

          if (fairiesShaded || keyIsPressed) {
            fairyShaderTexture.shader(fairyShader);

            let data = serializeSketch();
            fairyShader.setUniform("resolution", [width, height]);
            fairyShader.setUniform("trailCount", trail.length);
            fairyShader.setUniform("trail", data.trails);
            fairyShader.setUniform("particleCount", fairies.length);
            fairyShader.setUniform("particles", data.particles);
            fairyShader.setUniform("colors", data.colors);

            fairyShaderTexture.rect(0, 0, width, height);
            image(fairyShaderTexture, 0, 0);
          } else {
            noStroke();
            for (let f of fairies) {
              fill(f.fillCol);

              circle(f.pos.x, f.pos.y, 10);
            }

            fill(180, 100, 100);
            for (let t of trail) {
              circle(t.x, t.y, 20);
            }
          }
        }
      }
    
  }
}




function serializeSketch() {
  let data = {
    trails: [],
    particles: [],
    colors: []
  };

  for (let t of trail) {
    data.trails.push(
      map(t.x, 0, width, 0.0, 1.0),
      map(t.y, 0, height, 1.0, 0.0));
  }

  for (let f of fairies) {
    data.particles.push(
      map(f.pos.x, 0, width, 0.0, 1.0),
      map(f.pos.y, 0, height, 1.0, 0.0),
      f.mass * f.vel.mag() / 100)

    data.colors.push(red(f.fillCol), green(f.fillCol), blue(f.fillCol));
  }

  return data;
}

function getFairyVertShader() {
  return `
	precision mediump float;

	attribute vec3 aPosition;

	void main() {
		vec4 positionVec4 = vec4(aPosition, 1.0);
		positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
		gl_Position = positionVec4;
	}
`;

}
function getFairyFragShader() {
  return `

	precision mediump float;
	
	uniform vec2 resolution;
	uniform int trailCount;
	uniform vec2 trail[${MAX_TRAIL_COUNT}];
	uniform int particleCount;
	uniform vec3 particles[${MAX_PARTICLE_COUNT}];
	uniform vec3 colors[${MAX_PARTICLE_COUNT}];

	void main() {
			vec2 st = gl_FragCoord.xy / resolution.xy;  // Warning! This is causing non-uniform scaling.

			float r = 0.0;
			float g = 0.0;
			float b = 0.0;

			for (int i = 0; i < ${MAX_TRAIL_COUNT}; i++) {
				if (i < trailCount) {
					vec2 trailPos = trail[i];
					float value = float(i) / distance(st, trailPos.xy) * 0.00015;  // (changed this from 15) Multiplier may need to be adjusted if max trail count is tweaked.
					g += value * 0.5;
					b += value;
				}
			}

			float mult = 0.00009;
			
			for (int i = 0; i < ${MAX_PARTICLE_COUNT}; i++) {
				if (i < particleCount) {
					vec3 particle = particles[i];
					vec2 pos = particle.xy;
					float mass = particle.z / 5.0;
					vec3 color = colors[i];

					r += color.r / distance(st, pos) * mult * mass;
					g += color.g / distance(st, pos) * mult * mass;
					b += color.b / distance(st, pos) * mult * mass;
				}
			}
			//if(r + b + g < 0.5){
			//	gl_FragColor = vec4(r/10.0, g/10.0, b/10.0, 1.0);
			//} else {
				gl_FragColor = vec4(r, g, b, 1.0);
			//}
	}
`;
}