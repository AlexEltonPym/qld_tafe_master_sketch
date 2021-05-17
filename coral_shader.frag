
precision mediump float;
#define LINE_W .005
#define AA 0.04
#define KEYPOINTS_ARRAY_LENGTH 32
  
varying vec2 vTexCoord;
uniform vec2 resolution;
uniform float time;

uniform float noiseScale;
uniform float gridScale;
uniform float globalHue;
uniform float hueRange;
uniform float coral_disturb_dist;

uniform float keypointsX[KEYPOINTS_ARRAY_LENGTH];
uniform float keypointsY[KEYPOINTS_ARRAY_LENGTH];


  
//3D gradient noise by Íñigo Quílez
vec3 hash(vec3 p){
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
float noise(in vec3 p){
    vec3 i = floor( p );
    vec3 f = fract( p );
	
	vec3 u = f*f*(3.0-2.0*f);

    return mix( mix( mix( dot( hash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                          dot( hash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                          dot( hash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                mix( mix( dot( hash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                          dot( hash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                          dot( hash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}



//From https://www.shadertoy.com/view/Wt2SWt
//by skaplun 
float dist2Line(vec2 a, vec2 b, vec2 p) { 
    p -= a, b -= a;
	float h = clamp(dot(p, b) / dot(b, b), 0., 1.); 
	return length( p - b * h );                       
}
vec2 rotate2D(vec2 _st, float _angle){
    //_st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    //_st += 0.5;
    return _st;
}
float cell(vec2 uv){
	return smoothstep(LINE_W + AA, LINE_W, dist2Line(vec2(-0.35, 0), vec2(0.35, 0), uv));
}


//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}



//From p5.js
float map(in float n, in float start1, in float stop1, in float start2, in float stop2){
    float retVal = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    return clamp(retVal, start2, stop2);
    
}

//From https://www.shadertoy.com/view/Wt2SWt
//by skaplun 
void mainImage(out vec4 O, vec2 u){
    u = (u - resolution.xy*1.0)/resolution.y;
        
    float n = noise(vec3(u*noiseScale, time*1.0));
    O = vec4(cell(rotate2D(fract(u*gridScale) - .5, n*6.2831)));
    if(O.x > 0.0){
      float smallestDistance = 10000.0;
      for(int i=0;i < KEYPOINTS_ARRAY_LENGTH;++i){
          smallestDistance = min(distance(vec2(keypointsX[i], keypointsY[i]), gl_FragCoord.xy), smallestDistance);

      }
      
      n += smoothstep(0.0, 1.0, map(smallestDistance, coral_disturb_dist, 0.0, 0.0, 1.0));
      
      O.x = n*n*n;
    }  
}

void main() {
  mainImage(gl_FragColor,gl_FragCoord.xy);
  if(gl_FragColor.x > 0.0){
    gl_FragColor = vec4(hsb2rgb(vec3(mod(globalHue + map(gl_FragColor.x, 0.0, 1.0, 0.0, hueRange), 360.0) / 360.0, 1.0, 1.0)), gl_FragColor.x);
  } else {
     gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
}