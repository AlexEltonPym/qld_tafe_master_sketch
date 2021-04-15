let globalHue;
let hueRange = 60;
let hueChangeRate = 1;
let sat = 100;
let bright = 100;

let video;
let poseNet;
let poses = [];
const poseThreshold = 0.2;
let modelStatus = "loading";
let simPeople = [];
let simPeopleCount = 6;
let simPersonWalkerSpeed = 10;

let pFr = 0;



const walkers = [];
let nextWalkerSpawn = 0;
const walkerSpawnCooldown = 100; //milliseconds
const walkerNoiseScale = 0.005;
const walkerAgingSpeed = 0.0415;
const  walker_spawn_offset = 100;


const points = [];
let triangles = [];
const triangleFadeRate = 0.016;
const triangleSpawnOffsets = 100;
let delaunay;
const maxAllowedEdgeLength = 3200;


let trail = [];
let fairies = [];
let fairyColorScheme = ["#E69F66", "#DF843A", "#D8690F", "#B1560D", "#8A430A"];
const MAX_TRAIL_COUNT = 20;
const MAX_PARTICLE_COUNT = 40;
let fairyShaderTexture;
let fairyShader;
let fairiesShaded = false;

let corals = [];
const coral_size = 25;
const coral_length = 20;
const coralOffsetA = 1;
const coralOffsetB = 4;
const coral_noise_scale = 1000;
const coral_evolution_speed = 0.004;
const coral_fast_evolution_speed = 0.01;
const coral_return_ease = 0.03;
const coral_disturb_distance = 150;
let coral_base_z = 0;
let coralGraphicsLayer;



let state = 2;
let stateNames = ['skelly', 'walkers', 'triangulation', 'fairy', 'coral'];
let left_transition = 0;
let right_transition = 0;
let transitioning = false;
let transition_speed = 0.00003;
let transition_frequency = 15 * 60000; //mins -> millis
let last_transition_time = 0;
let info_font;

function preload(){

  info_font = loadFont("Roboto-Regular.ttf");
}
function setup() {
  createCanvas(5600, 1280, WEBGL);

  for(let i = 0; i < simPeopleCount; i++){
    simPeople.push({x: random(width), y: random(height)})
  }

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

  background(0);

  textFont(info_font)

  colorMode(HSB);
  globalHue = random(360);


  walkerGraphicsLayer = createGraphics(width, height);
  walkerGraphicsLayer.noStroke();
  walkerGraphicsLayer.background(0, 0, 0);

  fairyShaderTexture = createGraphics(width, height, WEBGL);
  fairyShader = fairyShaderTexture.createShader(getFairyVertShader(), getFairyFragShader())
  fairyShaderTexture.noStroke();

  noiser.seed(random())
  spawn_corals();
}



function draw() {
  translate(-width/2, -height/2)
 // scale(0.3);

  background(0);

  globalHue = (globalHue+hueChangeRate)%360;
  for(let simPerson of simPeople){
    simPerson.x = constrain(simPerson.x + random(-simPersonWalkerSpeed, simPersonWalkerSpeed), 0, width);
    simPerson.y = constrain(simPerson.y + random(-simPersonWalkerSpeed, simPersonWalkerSpeed), 0, height);
  
  }

  if(modelStatus == "ready"){
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
  

  infoOverlay();



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
  text(nf((frameRate() + pFr) / 2, 2, 1), 100, 160);
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
}