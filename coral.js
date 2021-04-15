function run_coral() {
    coralGraphicsLayer.clear();


    for (let c of corals) {
        c.run();
    }
    coral_base_z += coral_evolution_speed;
    image(coralGraphicsLayer, 0, 0)
}

function spawn_corals() {
    for (let x = -2; x <= (width / coral_size) + 2; x++) {
        for (let y = -2; y <= (height / coral_size) + 2; y++) {
            corals.push(new Coral(x, y))
        }
    }

    coralGraphicsLayer = createGraphics(width, height);
    coralGraphicsLayer.colorMode(HSB)
    coralGraphicsLayer.strokeWeight(4)
    coralGraphicsLayer.blendMode(SCREEN);
}

function checkNearby(id, otherID, testX, testY) {

}



class Coral {

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.z = 0;
    }


    checkNearby() {
        for (let p of poses) {
            for (let keypoint of p.pose.keypoints) {
                if (keypoint.score > poseThreshold) {

                    for (let extraRepeats = 0; extraRepeats < numCameras; extraRepeats++) {
                        let checkX = keypoint.position.x + (cameraGap * extraRepeats);
                        let d = dist(this.x * coral_length, this.y * coral_length, checkX, keypoint.position.y)
                        if(d < coral_disturb_distance){
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    nearestDist() {
        let nearest = width*2;
        for (let p of poses) {
            for (let keypoint of p.pose.keypoints) {
                if (keypoint.score > poseThreshold) {
                    for (let extraRepeats = 0; extraRepeats < numCameras; extraRepeats++) {
                        let checkX = keypoint.position.x + (cameraGap * extraRepeats);
                        nearest = min(nearest, dist(this.x * coral_length, this.y * coral_length, checkX, keypoint.position.y));
                    }
                }
            }
        }
        return nearest;

    }


    run() {
        let n = (noiser.simplex3(this.x * coral_length / coral_noise_scale, this.y * coral_length / coral_noise_scale, this.z) + 1) / 2;
       // n += map(this.nearestDist(), 0, 100, 0.2, 0, true);
        if(n > 0.6){

        // let nearby = this.checkNearby();
        // if (nearby) {
        //     this.z += coral_fast_evolution_speed;
        // } else {
        //     this.z = lerp(this.z, coral_base_z, coral_return_ease)
        // }
        this.z = coral_base_z;


        let deltaX = cos(n * TWO_PI) * coral_length * n;
        let deltaY = sin(n * TWO_PI) * coral_length * n;


            coralGraphicsLayer.stroke(map(n, 0.6, 1, globalHue, globalHue + hueRange) % 360, sat, bright, map(n, 0.6, 1, 0, 1))
            coralGraphicsLayer.line(this.x * coral_size + (deltaX * coralOffsetA), this.y * coral_size + (deltaY * coralOffsetA), (this.x * coral_size) + (deltaX * coralOffsetB), (this.y * coral_size) + (deltaY * coralOffsetB));
        }
    }

}