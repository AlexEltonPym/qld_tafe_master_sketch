function run_coral(){
    background(0);
    for (let p of poses) {
        for (let keypoint of p.pose.keypoints) {
          if (keypoint.score > poseThreshold) {
              let polyp_attempt = new Polyp(keypoint.position.x+polyp_spawn_offset, keypoint.position.y+polyp_spawn_offset)
              if(polyp_attempt.viable){
                polyps.push(polyp_attempt);
              }
          }
        }
    }

    coral_keypoints_x = [];
    coral_keypoints_y = [];
    for(let p of polyps){
        coral_keypoints_x.push(p.x);
        coral_keypoints_y.push(map(p.y, 0, height, 2*height, 0));
        p.run();

    }

    coral_graphics_layer.shader(coral_shader);
    coral_shader.setUniform('time', millis()*0.0001);
    coral_shader.setUniform('resolution', [width, height]);
    coral_shader.setUniform('noiseScale', coral_noise_scale)
    coral_shader.setUniform('gridScale', coral_grid_scale)
    coral_shader.setUniform('globalHue', globalHue)
    coral_shader.setUniform('hueRange', hueRange)
    coral_shader.setUniform('coral_disturb_dist', coral_disturb_dist)
    coral_shader.setUniform('keypointsX', coral_keypoints_x);
    coral_shader.setUniform('keypointsY', coral_keypoints_y)
    coral_graphics_layer.plane(width, height)
    
    image(coral_graphics_layer, 0, 0);
}


class Polyp{

    constructor(spawnX, spawnY){
        this.fade = 1;
        this.x = spawnX;
        this.y = spawnY;

        this.viable = true;
        for (let p of polyps) {
            let d = ((this.x-p.x)*(this.x-p.x)) + ((this.y-p.y)*(this.y-p.y));
            if (d < polyp_spawn_seperation_sq) {
              this.viable = false;
              return;
            }
        }
    }

    run(){
        this.fade -= coral_polyp_fade_rate;
        if(this.fade < 0){
            polyps.splice(polyps.indexOf(this), 1)
        }
    }
}