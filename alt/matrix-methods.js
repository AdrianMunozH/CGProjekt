function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

let radians_to_degree = function(radians) {
    return radians * 180 / Math.PI;
}

var scale = function(matrix, scaleVec) {
  
  let j = 0;
  for (let index = 0; j < 4; index+=3) {
    matrix[index] *= scaleVec[j];
    matrix[index+1] *= scaleVec[j];
    matrix[index+2] *= scaleVec[j];
    j++;
  }
  
}
let trans = function(out,matrix, transVec) {
  /*
  out = new Float32Array;
  for(let i = 0; i<matrix.length;i++) {
    out[i] = matrix[i];
  }
  */
  out[12] = matrix[0] * transVec[0] + matrix[4] * transVec[1] + matrix[8] * transVec[2] + matrix[12];
  out[13] = matrix[1] * transVec[0] + matrix[5] * transVec[1] + matrix[9] * transVec[2] + matrix[13];
  out[14] = matrix[2] * transVec[0] + matrix[6] * transVec[1] + matrix[10] * transVec[2] + matrix[14];
  out[15] = matrix[3] * transVec[0] + matrix[7] * transVec[1] + matrix[11] * transVec[2] + matrix[15];

  return out;
}
let identity = function(out) {
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

let scalar = function (up,n) {
  let u = 0;
  for (let index = 0; index < up.length; index++) {
    u += up[index] * n[index];
    }

  console.log("u1: " + u);
  u = up[0] * n[0] + up[1] * n[1] + up[2] * n[2];
        
  console.log("u2: "+ u);
}
let rotate = function(out,matrix,angle) {
  let rx = [1,0,0,0,0,Math.cos(angle),Math.sin(angle),0,0,-Math.sin(angle),Math.cos(angle),0,0,0,0,1];
  let ry = [Math.cos(angle),0,-Math.sin(angle),0,0,1,0,0,Math.sign(angle),0,Math.cos(angle),0,0,0,0,1];
  let rz = [Math.cos(angle),Math.sin(angle),0,0,-Math.sin(angle),Math.cos(angle),0,0,0,1,0,0,0,0,0,1];

  

  return out;
}

let lookAt = function(out,eye,center,up) {
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
        norm(nn,n);
        norm(un,u);
        norm(vn,v);


        let i,j,k;
        i = 0;
        j = 0;
        k = 0;
        for (let index = 0; index < out.length-4; index++) {
          if(index % 4 == 0) {
            out[index] = un[i];
            i++;
          } else if(index % 4 == 1){
            out[index] = vn[j];
            j++;
          } else if(index % 4 == 2){
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
let norm = function(out,vert) {
    let magn = vert[0] * vert[0] + vert[1] * vert[1] + vert[2] * vert[2];
    magn  = Math.sqrt(magn);
    out[0] = vert[0] * 1/magn;
    out[1] = vert[1] * 1/magn;
    out[2] = vert[2] * 1/magn;
    return out;
}
