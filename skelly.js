
function run_skelly() {
  image(video, 0, 0);
  for (let p of poses) {
    for (let keypoint of p.pose.keypoints) {
      if (keypoint.score > poseThreshold) {
          fill(255);
          ellipse(keypoint.position.x, keypoint.position.y, 40);
        }
      }
    
  }
}