precision mediump float;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

attribute vec3 vPosition;
varying vec3 fPosition;

attribute vec4 vColor;
varying vec4 fColor;


void main()
{
  vec4 pos = mView * mWorld * vec4(vPosition, 1.0);
  fPosition = pos.xyz / pos.w;
  fColor = vColor;
  gl_Position = mProj * mView * mWorld * vec4(vPosition, 1.0);
}
