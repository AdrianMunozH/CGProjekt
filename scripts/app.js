//const nearFar = [0.01, 100]; brauchen wir vllt gar nicht mehr 

async function InitDemo() {
  // canvas,gl setup
  console.log('This is working');
  var canvas = document.getElementById('game-surface');
  var gl = canvas.getContext('webgl');

  if (!gl) {
    console.log('WebGL not supported, falling back on experimental');
    gl = canvas.getContext('experimental-webgl');
  }
  if (!gl) {
    alert('Your Browser does not support WebGL');
  }

  var lColor = new Float32Array(4);
  lColor[0] = 1.0;
  lColor[1] = 0.96;
  lColor[2] = 0.9;
  lColor[3] = 0.9;

  var lightModel = await setUpLight(
    gl,
    './models/sphere.obj', 'light_vert.glsl', 'light_frag.glsl',
    lColor, // color
    [0, 6, 0],            // position
    0,                  // angle
    [0, 1, 0],            // rotation
    [0.5, 0.5, 0.5]             // scale
  );

  // licht obj
  const light = {
    position: [0, 0, 0],  // wird später gesetzt und eigentlich nur als getter genutzt
    color: [1.0, 0.96, 0.9],
    ambient: [0.0, 0.0, 0.0],
    model: lightModel
  };


  //light
  const dome = await setUpObject(
    gl,
    './models/sphere.obj', 'shader_vert.glsl', 'shader_frag.glsl',
    'aussen-image',         // texture
    [1, 1, 1], // ambient
    [0.2, 0.2, 0.2], // diffuse
    [1.0, 1.0, 1.0], // specular
    100,               // shiny
    0.1,                //alpha
    [0, 0, 0],            // position
    180,                  // angle
    [0, 1, 0],            // rotation
    [20, 20, 20]             // scale
  );



  // alles was gezeichnet werden soll
  let models = [];

  models = await setUpArray(gl);


  // dome

  // blending equation C¯result = C¯source ∗ Fsource + C¯destination ∗ Fdestination
  gl.blendColor(0.0, 0.0, 0.0, 0.7);
  gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
  //gl.SRC_ALPHA  => Factor is equal to the alpha component of the source color vector C¯source. 
  // gl.ONE_MINUS_SRC_ALPHA => Factor is equal to 1−alpha of the source color vector C¯source.
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);



  // camera setup
  actCamera = new Camera(
    addVec3(createVec3(), [0, 15, -60]),
    createVec3(),
    addVec3(createVec3(), [0, 1, 0]),
  );


  // muss nochmal alles durchgegangen werden
  gl.clearColor(0.75, 0.85, 0.8, 1.0);
  gl.enable(gl.DEPTH_TEST);


  var viewMatrix = createM4();
  var projMatrix = createM4();


  //Draw loop
  async function loop() {

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.82, 0.94, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);


    // kamera
    actCamera.getViewMatrix(viewMatrix);


    //mat4.perspective(projMatrix, degrees_to_radians(45), canvas.width / canvas.height, 0.1, 1000.0);
    perspective(projMatrix, degrees_to_radians(45), canvas.width / canvas.height, 0.1, 1000.0);

    // blend aus
    gl.depthMask(true);
    gl.disable(gl.BLEND);



    // view matrizen von cams aktualisieren

    index = 0;
    // Rendert alle objekte
    for await (const element of models) {
      if (index == 5) {
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        await drawObject(gl, dome, viewMatrix, projMatrix, light, false);
        // light
        await drawObject(gl, lightModel, viewMatrix, projMatrix, light, true);

        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }


      drawObject(gl, element, viewMatrix, projMatrix, light, false);
      index++;
    }

    /*
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    await drawObject(gl, dome, viewMatrix, projMatrix, light, false);
    // light
    await drawObject(gl, lightModel, viewMatrix, projMatrix, light, true);
    */


    requestAnimationFrame(await loop);
  }

  requestAnimationFrame(loop);

}

var Camera = function (position, lookAt, up) {
  this.position = position;
  this.lookAt = lookAt;
  this.up = up;
  /*
  
  this.forward = createVec3();
  this.forward = addVec3(lookAt, negateVec3(this.position));
  

  normalizeVec3(this.forward, this.forward); // bin mir nicht sicher ob normalisiert werden muss
*/
}

// https://developer.mozilla.org/de/docs/Learn/JavaScript/Objects/Object_prototypes
Camera.prototype.getViewMatrix = function (out) {
  //let lookAtVar = createVec3(); // wir müssen unsere lookat variable berechnen weil die shadow cameras sich nicht am ursprung befinden
  //lookAtVar = addVec3(this.position, this.forward);
  // falls wir nicht immer in den urprung gucken sollen müssen wir noch die derz. position addieren
  lookAt(out, this.position, this.lookAt, this.up);
  return out;
}



function drawObject(gl, currentObject, viewMatrix, projMatrix, movingLight, isLight) {
  program = currentObject.program;
  var worldMatrix = createM4();

  // Draw Objects
  gl.useProgram(program);

  let matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
  gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

  let matViewUniformLocation = gl.getUniformLocation(program, 'mView');

  gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

  let matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
  identity(worldMatrix);



  const angle = performance.now() / 1000 / 6 * 2 * Math.PI * 1 / 2;
  if (isLight) {

    translate(worldMatrix, worldMatrix, currentObject.model.position);
    translate(worldMatrix, worldMatrix, [Math.sin(angle * 2) / 10, 0, 0]);
    movingLight.position = [worldMatrix[12], worldMatrix[13], worldMatrix[14]];
    currentObject.model.position = [worldMatrix[12], worldMatrix[13], worldMatrix[14]];

    //console.log(movingLight.position);
    //console.log(currentObject.model.position);


  } else {
    const lightPositionUniformLocation = gl.getUniformLocation(program, 'light.position');
    const lightColorUniformLocation = gl.getUniformLocation(program, 'light.color');
    const lightAmbientUniformLocation = gl.getUniformLocation(program, 'light.ambient');
    gl.uniform3f(lightPositionUniformLocation, movingLight.position[0], movingLight.position[1], movingLight.position[2],);
    gl.uniform3f(lightColorUniformLocation, movingLight.color[0], movingLight.color[1], movingLight.color[2]);
    gl.uniform3f(lightAmbientUniformLocation, movingLight.ambient[0], movingLight.ambient[1], movingLight.ambient[2]);

    // veränderung des objektes -- erst translate, dann rotate
    translate(worldMatrix, worldMatrix, currentObject.model.position);
    scale(worldMatrix, worldMatrix, currentObject.model.scale);
    mat4.rotate(worldMatrix, worldMatrix, degrees_to_radians(currentObject.model.angle), currentObject.model.rotationAxis);
    //drehung
    mat4.rotate(worldMatrix, worldMatrix, -angle / 2, [0, 1, 0]);
  }



  gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

  // draw call -- weil ich ihn immer übersehe :D
  currentObject.draw();

  gl.useProgram(null);

}

async function setUpObject(gl, objFile, vertShader, fragShader, texture, ambient, diffuse, specular, shiny, alpha, position, angle, rotationAxis, scale) {

  const oVertices = await fetchModel(objFile);

  // material werte
  let oMaterial = {
    ambient: ambient,
    diffuse: diffuse,
    specular: specular,
    shiny: shiny,
    alpha: alpha
  }


  // init der versch models.
  let modelObj = {
    vertices: oVertices,
    texture: texture,
    material: oMaterial,
    position: position,
    angle: angle,
    rotationAxis: rotationAxis,
    scale: scale
    // is skybox ?? oder wessen program benutzt werden so   ll
    // textur
  }

  const setUpObject = await createObject(modelObj, gl);
  //shader datein werden geladen
  setUpObject.program = await createShaderProgram(gl, './shaders/'.concat(vertShader), './shaders/'.concat(fragShader));

  if (!setUpObject.program) {
    console.error('Cannot run without shader program!');
    return;
  }

  return setUpObject;
}

// letztendlich einfach nur ohne texture und dafür eine farbe
async function setUpLight(gl, objFile, vertShader, fragShader, color, position, angle, rotationAxis, scale) {

  const oVertices = await fetchModel(objFile);


  let modelObj = {
    vertices: oVertices,
    color: color,
    position: position,
    angle: angle,
    rotationAxis: rotationAxis,
    scale: scale
  }

  const setUpObject = await createLight(modelObj, gl);
  //shader datein werden geladen
  setUpObject.program = await createShaderProgram(gl, './shaders/'.concat(vertShader), './shaders/'.concat(fragShader));

  if (!setUpObject.program) {
    console.error('Cannot run without shader program!');
    return;
  }

  return setUpObject;
}

function setUpArray(gl) {
  let setUpObjects = [];


  // innen
  setUpObjects[0] = setUpObject(
    gl,
    './models/innenblender.obj', 'shader_vert.glsl', 'shader_frag.glsl',
    'innen-image',         // texture
    [0, 0, 0], // ambient
    [1, 1, 1], // diffuse
    [0.5, 0.5, 0.5], // specular
    5,               // shiny
    1.0,                //alpha
    [0, -8, 0],            // position
    180,                  // angle
    [0, 1, 0],            // rotation axis
    [1.25, 1.25, 1.25]             // scale
  );

  // aussen
  setUpObjects[1] = setUpObject(
    gl,
    './models/aussenblender.obj', 'shader_vert.glsl', 'shader_frag.glsl',
    'aussen-image',         // texture
    [0, 0, 0], // ambient
    [1, 1, 1], // diffuse
    [0.5, 0.5, 0.5], // specular
    5,               // shiny
    1.0,                //alpha
    [0, -8, 0],            // position
    180,                  // angle
    [0, 1, 0],            // rotation axis
    [1.25, 1.25, 1.25]             // scale
  );

  // computer
  setUpObjects[2] = setUpObject(
    gl,
    './models/pcobjblender.obj', 'shader_vert.glsl', 'shader_frag.glsl',
    'computer-image',         // texture
    [0, 0, 0], // ambient
    [1, 1, 1], // diffuse
    [0.5, 0.5, 0.5], // specular
    1,               // shiny
    1.0,                //alpha
    [0, -8, 0],            // position
    180,                  // angle
    [0, 1, 0],            // rotation axis
    [1.25, 1.25, 1.25]             // scale
  );

  // teppich
  setUpObjects[3] = setUpObject(
    gl,
    './models/teppichblender.obj', 'shader_vert.glsl', 'shader_frag.glsl',
    'teppich-image',         // texture
    [0, 0, 0], // ambient
    [1, 1, 1], // diffuse
    [0.1, 0.1, 0.1], // specular
    1,               // shiny
    1.0,                //alpha
    [0, -8, 0],            // position
    180,                  // angle
    [0, 1, 0],            // rotation axis
    [1.25, 1.25, 1.25]             // scale
  );

  // wood
  setUpObjects[4] = setUpObject(
    gl,
    './models/woodstuffobjblender.obj', 'shader_vert.glsl', 'shader_frag.glsl',
    'wood-image',         // texture
    [0, 0, 0], // ambient
    [1, 1, 1], // diffuse
    [0.1, 0.1, 0.1], // specular
    1,               // shiny
    1.0,                //alpha
    [0, -8, 0],            // position
    180,                  // angle
    [0, 1, 0],            // rotation axis
    [1.25, 1.25, 1.25]             // scale
  );

  // base
  setUpObjects[5] = setUpObject(
    gl,
    './models/baseblender.obj', 'shader_vert.glsl', 'shader_frag.glsl',
    'innen-image',         // texture
    [0, 0, 0], // ambient
    [0.8, 0.8, 0.8], // diffuse
    [0.99, 0.99, 0.99], // specular
    0.8,               // shiny
    1.0,                //alpha
    [0, -25, 0],            // position
    180,                  // angle
    [0, 1, 0],            // rotation axis
    [1.8, 1.5, 1.5]             // scale
  );


  return setUpObjects;
}

async function createObject(model, gl) {

  const obj = {};

  obj.model = model;
  obj.vertexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBufferObject);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);



  // create texture
  obj.texture = gl.createTexture();

  gl.activeTexture(gl.TEXTURE0); // es gab ein array an texture an das ist die stelle 0
  /*
  https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html
  You can choose what WebGL does by setting the texture filtering for each texture. There are 6 modes

  NEAREST = choose 1 pixel from the biggest mip
  LINEAR = choose 4 pixels from the biggest mip and blend them
  NEAREST_MIPMAP_NEAREST = choose the best mip, then pick one pixel from that mip
  LINEAR_MIPMAP_NEAREST = choose the best mip, then blend 4 pixels from that mip
  NEAREST_MIPMAP_LINEAR = choose the best 2 mips, choose 1 pixel from each, blend them
  LINEAR_MIPMAP_LINEAR = choose the best 2 mips. choose 4 pixels from each, blend them
  */
  gl.bindTexture(gl.TEXTURE_2D, obj.texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById(model.texture));
  gl.bindTexture(gl.TEXTURE_2D, null); // unbind


  obj.draw = function () {

    // buffer wird nochmal 'gebindet' für die loop
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferObject);

    var positionAttribLocation = gl.getAttribLocation(this.program, 'vPosition');

    // ersten 3 werte sind die vertices
    gl.vertexAttribPointer(
      positionAttribLocation, // Attribute location
      3, // Number of elements per attribute
      gl.FLOAT, // Type of elements
      gl.FALSE,
      8 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
      0 // Offset from the beginning of a single vertex to this attribute
    );
    gl.enableVertexAttribArray(positionAttribLocation);



    var texCoordAttribLocation = gl.getAttribLocation(this.program, 'vTex'); // muss nochmal umgenannt werden
    gl.vertexAttribPointer(
      texCoordAttribLocation,
      2,
      gl.FLOAT,
      gl.FALSE,
      8 * Float32Array.BYTES_PER_ELEMENT,
      3 * Float32Array.BYTES_PER_ELEMENT
    );


    var normalAttribLocation = gl.getAttribLocation(this.program, 'vNormal');
    gl.vertexAttribPointer(
      normalAttribLocation, // Attribute location
      3, // Number of elements per attribute
      gl.FLOAT, // Type of elements
      gl.FALSE,
      8 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
      5 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
    );


    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(normalAttribLocation);
    gl.enableVertexAttribArray(texCoordAttribLocation);


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    


    const ambientUniformLocation = gl.getUniformLocation(this.program, 'mat.ambient');
    const diffuseUniformLocation = gl.getUniformLocation(this.program, 'mat.diffuse');
    const specularUniformLocation = gl.getUniformLocation(this.program, 'mat.specular');
    const shininessUniformLocation = gl.getUniformLocation(this.program, 'mat.shininess');
    const alphaUniformLocation = gl.getUniformLocation(this.program, 'mat.alpha');
    gl.uniform3f(ambientUniformLocation, this.model.material.ambient[0], this.model.material.ambient[1], this.model.material.ambient[2]);
    gl.uniform3f(diffuseUniformLocation, this.model.material.diffuse[0], this.model.material.diffuse[1], this.model.material.diffuse[2]);
    gl.uniform3f(specularUniformLocation, this.model.material.specular[0], this.model.material.specular[1], this.model.material.specular[2]);
    gl.uniform1f(shininessUniformLocation, this.model.material.shiny);
    gl.uniform1f(alphaUniformLocation, this.model.material.alpha);




    gl.drawArrays(gl.TRIANGLES, 0, model.vertices.length / 8);


    // unbind everything

    gl.disableVertexAttribArray(positionAttribLocation);
    gl.disableVertexAttribArray(normalAttribLocation);
    gl.disableVertexAttribArray(texCoordAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);


  }
  return obj;
}

async function createLight(model, gl) {

  const obj = {};

  obj.model = model;
  obj.vertexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBufferObject);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  obj.draw = function () {

    // buffer wird nochmal gebindet für die loop
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferObject);

    var positionAttribLocation = gl.getAttribLocation(this.program, 'vPosition');

    // ersten 3 werte sind die vertices
    gl.vertexAttribPointer(
      positionAttribLocation, // Attribute location
      3, // Number of elements per attribute
      gl.FLOAT, // Type of elements
      gl.FALSE,
      8 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
      0 // Offset from the beginning of a single vertex to this attribute
    );
    gl.enableVertexAttribArray(positionAttribLocation);

    var colorAttribLocation = gl.getAttribLocation(program, 'vColor');




    gl.vertexAttrib4fv(colorAttribLocation, this.model.color);

    gl.drawArrays(gl.TRIANGLES, 0, model.vertices.length / 8);


    // unbind everything
    gl.disableVertexAttribArray(colorAttribLocation);
    gl.disableVertexAttribArray(positionAttribLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);



  }
  return obj;
}


