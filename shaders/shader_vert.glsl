precision mediump float;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

attribute vec3 vPosition;
attribute vec3 vNormal;

attribute vec2 vTex;
varying vec2 fTex;

varying vec3 fPosition;
varying vec3 fNormal;

void main()
{
  vec4 pos = mView * mWorld * vec4(vPosition, 1.0);
  fPosition = pos.xyz / pos.w;
  fTex = vTex;
  fNormal = (mView * mWorld * vec4(vNormal, 0.0)).xyz;
  gl_Position = mProj * mView * mWorld * vec4(vPosition, 1.0);
}
