attribute vec3 aPosition;
attribute vec2 aTexCoord;

void main() {
  gl_Position = vec4(aPosition*2.0, 1.0);
}