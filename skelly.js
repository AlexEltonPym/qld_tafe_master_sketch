
function run_skelly() {
  for (let p of poses) {
    for (let keypoint of p.pose.keypoints) {
      if (keypoint.score > poseThreshold) {
          fill(255);
          ellipse(keypoint.position.x, keypoint.position.y, 40);
        }
      }
    
  }
}