
function run_skelly() {
  image(video, 0, 0);
  for (let p of poses) {
    for (let keypoint of p.pose.keypoints) {
      if (keypoint.score > poseThreshold) {
          if(keypoint.score==1){
            fill(360, 100, 100)
          } else {

            fill(255);
          }
          ellipse(keypoint.position.x, keypoint.position.y, 40);
        }
      }
    
  }
}