
function run_skelly() {
  for (let p of poses) {
    for (let keypoint of p.pose.keypoints) {
      if (keypoint.score > poseThreshold) {
        for (let extraRepeats = 0; extraRepeats < numCameras; extraRepeats++) {
          fill(255);
          ellipse(keypoint.position.x + cameraGap * extraRepeats, keypoint.position.y, 40);
        }
      }
    }
  }
}