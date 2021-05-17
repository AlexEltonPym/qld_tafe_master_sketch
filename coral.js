function run_coral(){
    coral_keypoints_x = [];
    coral_keypoints_y = [];
    for (let p of poses) {
        for (let keypoint of p.pose.keypoints) {
          if (keypoint.score > poseThreshold) {
              coral_keypoints_x.push(keypoint.position.x);
              coral_keypoints_y.push(map(keypoint.position.y, 0, height, 2*height, 0));
          }
        }
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