precision mediump float;

struct MaterialParams {
  vec3 ambient;
  vec3 diffuse;
  vec3 specular;
  float shininess;
};

struct LightParams {
  vec3 position;
  vec3 color;
  vec3 ambient;
};

uniform MaterialParams mat;
uniform LightParams light;

varying vec3 fPosition;
varying vec3 fNormal;

varying vec2 fTex;
uniform sampler2D sampler;

void main()
{
  vec3 L = normalize(light.position - fPosition); // light direction 
  vec3 N = normalize(fNormal);                    // normal
  vec3 V = vec3(0.0, 0.0, 1.0);                   // eye direction
  vec3 color = mat.ambient * light.ambient;
  color += mat.diffuse * light.color * max(dot(N, L), 0.0); 
  color += mat.specular * light.color * pow(max(dot(reflect(-L, N), V), 0.0), mat.shininess);
  //test
  vec4 tex = texture2D(sampler, fTex);
  vec3 endColor =  tex.xyz * color;
  //!test

  //gl_FragColor =  texture2D(sampler, fTex);
  gl_FragColor = vec4(color,1.0);
  // eigentlich endColor benutzen
}



