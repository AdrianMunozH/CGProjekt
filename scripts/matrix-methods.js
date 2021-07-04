function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * pi / 180;
}

let radians_to_degree = function (radians) {
  return radians * 180 / Math.PI;
}

// m4x4 und vec4 als input
var scale = function (out, matrix, scaleVec) {
  let j = 0;
  for (let index = 0; index < 12; index += 4) {
    out[index] = matrix[index] * scaleVec[j];
    out[index + 1] = matrix[index + 1] * scaleVec[j];
    out[index + 2] = matrix[index + 2] * scaleVec[j];
    out[index + 3] = matrix[index + 3] * scaleVec[j];
    j++;
  }
  out[12] = matrix[12];
  out[13] = matrix[13];
  out[14] = matrix[14];
  out[15] = matrix[15];
  
  return out;
}
let translate = function (out, matrix, transVec) {
  
  out[12] = matrix[0] * transVec[0] + matrix[4] * transVec[1] + matrix[8] * transVec[2] + matrix[12];
  out[13] = matrix[1] * transVec[0] + matrix[5] * transVec[1] + matrix[9] * transVec[2] + matrix[13];
  out[14] = matrix[2] * transVec[0] + matrix[6] * transVec[1] + matrix[10] * transVec[2] + matrix[14];
  out[15] = matrix[3] * transVec[0] + matrix[7] * transVec[1] + matrix[11] * transVec[2] + matrix[15];

  return out;
}
let identity = function (out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;



  return out;
}

let scalar = function (up, n) {
  let u = 0;
  for (let index = 0; index < up.length; index++) {
    u += up[index] * n[index];
  }

  console.log("u1: " + u);
  u = up[0] * n[0] + up[1] * n[1] + up[2] * n[2];

  console.log("u2: " + u);
}



let rotate = function(out, input, angle, axis)
    {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        // vl 43 folie 7
        let r11 = cos + Math.pow(axis[0], 2) * (1 - cos);
        let r12 = axis[0] * axis[1] * (1 - cos) - axis[2] * sin;
        let r13 = axis[0] * axis[2] * (1 - cos) + axis[1] * sin;

        let r21 = axis[1] * axis[0] * (1 - cos) + axis[2] * sin;
        let r22 = cos + Math.pow(axis[1], 2) * (1 - cos);
        let r23 = axis[1] * axis[2] * (1 - cos) - axis[0] * sin;

        let r31 = axis[2] * axis[0] * (1 - cos) - axis[1] * sin;
        let r32 = axis[2] * axis[1] * (1 - cos) + axis[0] * sin;
        let r33 = cos + Math.pow(axis[2], 2) * (1 - cos);

        let in11 = input[0];
        let in12 = input[4];
        let in13 = input[8];
        //
        let in21 = input[1];
        let in22 = input[5];
        let in23 = input[9];
        //  
        let in31 = input[2];
        let in32 = input[6];
        let in33 = input[10];
        //  
        let in41 = input[3];
        let in42 = input[7];
        let in43 = input[11];
        // 

        // vl 43 folie 8

        out[0] = in11 * r11 + in12 * r21 + in13 * r31;
        out[1] = in21 * r11 + in22 * r21 + in23 * r31;
        out[2] = in31 * r11 + in32 * r21 + in33 * r31;
        out[3] = in41 * r11 + in42 * r21 + in43 * r31;

        out[4] = in11 * r12 + in12 * r22 + in13 * r32;
        out[5] = in21 * r12 + in22 * r22 + in23 * r32;
        out[6] = in31 * r12 + in32 * r22 + in33 * r32;
        out[7] = in41 * r12 + in42 * r22 + in43 * r32;

        out[8] = in11 * r13 + in12 * r23 + in13 * r33;
        out[9] = in21 * r13 + in22 * r23 + in23 * r33;
        out[10] = in31 * r13 + in32 * r23 + in33 * r33;
        out[11] = in41 * r13 + in42 * r23 + in43 * r33;
    }

let perspective = function(out, fov, aspect,near,far) {

  var cotan = 1 / Math.tan(fov/2);
  var diff = 1 / (near - far);

  out.fill(0);
  out[0] = cotan / aspect; 
  out[5] = cotan; 
  out[10] = (far + near) * diff; // zwischen -1 und 0.99
  out[11] = -1; //
  out[14] = (2 * far * near) * diff; //q aber mit wert von z

  return out;

}

let lookAt = function (out, eye, center, up) {
  let n = [];
  let u = [];
  let v = [];



  n[0] = eye[0] - center[0];
  n[1] = eye[1] - center[1];
  n[2] = eye[2] - center[2];

  u[0] = up[1] * n[2] - up[2] * n[1];
  u[1] = up[2] * n[0] - up[0] * n[2];
  u[2] = up[0] * n[1] - up[1] * n[0];

  v[0] = n[1] * u[2] - n[2] * u[1];
  v[1] = n[2] * u[0] - n[0] * u[2];
  v[2] = n[0] * u[1] - n[1] * u[0];

  let nn = [];
  let un = [];
  let vn = [];
  norm(nn, n);
  norm(un, u);
  norm(vn, v);


  let i, j, k;
  i = 0;
  j = 0;
  k = 0;
  for (let index = 0; index < out.length - 4; index++) {
    if (index % 4 == 0) {
      out[index] = un[i];
      i++;
    } else if (index % 4 == 1) {
      out[index] = vn[j];
      j++;
    } else if (index % 4 == 2) {
      out[index] = nn[k];
      k++;
    } else {
      out[index] = 0;
    }
  }
  out[12] = -(un[0] * eye[0] + un[1] * eye[1] + un[2] * eye[2]);
  out[13] = -(vn[0] * eye[0] + vn[1] * eye[1] + vn[2] * eye[2]);
  out[14] = -(nn[0] * eye[0] + nn[1] * eye[1] + nn[2] * eye[2]);
  out[15] = 1;

  return out;
}
let norm = function (out, vert) {
  let magn = vert[0] * vert[0] + vert[1] * vert[1] + vert[2] * vert[2];
  magn = Math.sqrt(magn);
  out[0] = vert[0] * 1 / magn;
  out[1] = vert[1] * 1 / magn;
  out[2] = vert[2] * 1 / magn;
  return out;
}


let addVec3 = function (v1, v2) {
  out = new Float32Array(3);
  out[0] = v1[0] + v2[0];
  out[1] = v1[1] + v2[1];
  out[2] = v1[2] + v2[2];

  return out;
}

let createVec3 = function () {
  vec3 = new Float32Array(3);
  vec3[0] = 0;
  vec3[1] = 0;
  vec3[2] = 0;
  return vec3;
}

let fromValues = function (x, y, z) {
  out = createVec3();
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

let createM4 = function () {
  m4 = new Float32Array(16);
  return m4;
}

let negateVec3 = function (out) {
  var out = out.map(value => -value);
  return out;
}

let normalizeVec3 = function (out, v1) {
  let lenght = v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2];
  if (lenght != 0) { // wollen ja nicht durch null teilen ;)
    lenght = 1 / Math.sqrt(lenght);
    out[0] = v1[0] * lenght;
    out[1] = v1[1] * lenght;
    out[2] = v1[2] * lenght;
  }
  return out;
};

