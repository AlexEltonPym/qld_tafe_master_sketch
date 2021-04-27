let globalHue;
let hueRange = 60;
let hueChangeRate = 1;
let sat = 100;
let bright = 100;

const systemHasWebcam = false;
let video;
let poseNet;
let poses = [];
const poseThreshold = 0.2;
let modelStatus = "loading";
let simPeople = [];
let simPeopleCount = 10;
let simPersonWalkerSpeed = 4;

let pFr = 0;



const walkers = [];
let nextWalkerSpawn = 0;
const walkerSpawnCooldown = 100; //milliseconds
const walkerNoiseScale = 0.005;
const walkerAgingSpeed = 0.0415;
const walker_spawn_offset = 100;


const points = [];
let triangles = [];
const triangleFadeRate = 0.001;
const triangleSpawnOffsets = 100;
let delaunay;
const maxAllowedEdgeLength = 30000;


let trail = [];
let fairies = [];
let fairyColorScheme = ["#E69F66", "#DF843A", "#D8690F", "#B1560D", "#8A430A"];
const MAX_TRAIL_COUNT = 20;
const MAX_PARTICLE_COUNT = 40;
let fairyShaderTexture;
let fairyShader;
let fairiesShaded = true;

let coral_shader;
let coral_graphics_layer;
const coral_noise_scale = 2;
const coral_grid_scale = 20;
const coral_disturb_dist = 400;
let coral_keypoints_x = [];
let coral_keypoints_y = [];


let state = 1;
let stateNames = ['skelly', 'walkers', 'triangulation', 'fairy', 'coral'];
let left_transition = 0;
let right_transition = 0;
let transitioning = false;
let transition_speed = 0.00003;

let transition_frequency = 15 * 60000; //mins * millis in a minute
let last_transition_time = 0;
let info_font;

function preload(){

  info_font = loadFont('Roboto-Regular.ttf');
  coral_shader = loadShader('coral_base.vert', 'coral_shader.frag');
}

function setup() {
  createCanvas(5600, 1280, WEBGL);
  frameRate(30);
  for(let i = 0; i < simPeopleCount; i++){
    simPeople.push({x: random(width), y: random(height)})
  }

  if(systemHasWebcam){
    video = createCapture(VIDEO);
    video.hide();

    poseNet = ml5.poseNet(video, () => {
      console.log('Ready!')
      modelStatus = "ready";
    });
    poseNet.on('pose', (results) => {
      poses = results
      
      for (let simPerson of simPeople) {
        poses.push({pose: {keypoints: [{score: 1, position: {x: simPerson.x, y: simPerson.y}}]}})

      }
      //todo: add centroid here
    });
  }

  background(0);

  textFont(info_font)

  colorMode(HSB);
  globalHue = random(360);


  walkerGraphicsLayer = createGraphics(width, height);
  walkerGraphicsLayer.noStroke();
  walkerGraphicsLayer.background(0, 0, 0);

  setupFairy();

  coral_graphics_layer = createGraphics(width, height, WEBGL);
  

  noiser.seed(random())
}



function draw() {

  if(!systemHasWebcam){
    poses = [];

    for (let simPerson of simPeople) {
      poses.push({pose: {keypoints: [{score: 1, position: {x: simPerson.x, y: simPerson.y}}]}})

    }
  }


  translate(-width/2, -height/2)

  background(0);

  globalHue = (globalHue+hueChangeRate)%360;
  for(let simPerson of simPeople){
    simPerson.x = constrain(simPerson.x + random(-simPersonWalkerSpeed, simPersonWalkerSpeed), 0, width);
    simPerson.y = constrain(simPerson.y + random(-simPersonWalkerSpeed, simPersonWalkerSpeed), 0, height);
  
  }

  if(modelStatus == "ready" || !systemHasWebcam){
    if (stateNames[state] == "skelly") {
      run_skelly();
    } else if (stateNames[state] == "walkers") {
      run_walkers();
    } else if (stateNames[state] == "triangulation") {
      run_triangles();
    } else if (stateNames[state] == "fairy") {
      run_fairy();
    } else if(stateNames[state] == "coral"){
      run_coral();
    }
  }
  handleTransition();

  widgetOverlay();
  

 // infoOverlay();



}

function handleTransition(){

  if(last_transition_time + transition_frequency < millis()){
    triggerTransition();
    last_transition_time = millis();
  }

  if(transitioning){
    right_transition = min(right_transition+transition_speed*deltaTime, 1)

    if(right_transition > 0.99){
      left_transition = min(left_transition+transition_speed*deltaTime, 1)
      state = next_state;
    }

    if(left_transition > 0.99){
      transitioning = false;
    }
  }

  let left_pos = easeInOutQuad(left_transition) * width;
  let right_pos = easeInOutQuad(right_transition) * width;


  noStroke();
  fill(0);
  rect(left_pos, 0, right_pos, height)

}

function easeInOutQuad(t) { 
  //return t<0.5 ? 2*t*t : -1+(4-2*t)*t
  return t;
}

function triggerTransition(){
  transitioning = true;
  next_state = (state + 1) % stateNames.length;

  right_transition = 0;
  left_transition = 0;
}


function widgetOverlay(){
  textSize(72)
  fill(0)
  rect(0, 0, 300, 200)
  fill(255)
  text(nf(hour(), 2) + ":" + nf(minute(), 2), 100, 100)

  textSize(42);
  text("fps: " + int((frameRate() + pFr) / 2), 100, 160);
  pFr = frameRate();
}

function infoOverlay() {

  image(video, 0, 1300, video.width, video.height);
  


  fill(0);
  rect(0, height * 2 - 240, 1200, 600)
  fill(255);
  textSize(82);
  text("Click to view next sketch", 100, height * 2 - 120)
  textSize(72);

  text("Current sketch: " + stateNames[state] + (transitioning ? " - transitioning":""), 100, height * 2);
  text("Model status: " + modelStatus, 100, height * 2 + 120)
  text(modelStatus == "ready" ?
    ("Detecting " + poses.length + (poses.length == 1 ? " person" : " people")) : "",
    100, height * 2 + 240)


}


function mousePressed() {
  state = (state + 1) % stateNames.length;
 //triggerTransition();
}