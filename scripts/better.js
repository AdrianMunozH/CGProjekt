
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

    // shere -- light
    let lightModel = await setUpObject(
        gl,
        './models/sphere.obj', 'shader_vert.glsl', 'shader_frag.glsl',
        'moon-image',         // texture
        [1, 1, 1], // ambient
        [1, 1, 1], // diffuse
        [0.58, 0.22, 0.07], // specular
        5,               // shiny
        [5, 5, 5],            // position
        60,                  // angle
        [0, 1, 0],            // rotation
        [0.5, 0.5, 0.5]             // scale
    );

    const light = {
        position: [5, 5, 5],
        color: [1.0, 1.0, 1.0],
        ambient: [0.0, 0.0, 0.0],
        model: lightModel
    };





    // schatten
    let shadowMap = {};
    //  shadowMap.createShaderProgram(gl,vShader,fShader);
    shadowMap = createShadowMapCube(gl);



    let shadowGenMap = {};
    // shadowGenMap.createShaderProgram(gl,vShader,fShader);


    //shadow map cameras
    shadowMap.shadowMapCameras = [
        new Camera(
            light.position,
            addVec3(createVec3(), addVec3(light.position, [1, 0, 0])), // positiv x
            addVec3(createVec3(), [0, -1, 0])
        ),
        new Camera(
            light.position,
            addVec3(createVec3(), addVec3(light.position, [-1, 0, 0])), // negativ x
            addVec3(createVec3(), [0, -1, 0])

        ),
        new Camera(
            light.position,
            addVec3(createVec3(), addVec3(light.position, [0, 1, 0])), // positiv y
            addVec3(createVec3(), [0, 0, 1])
        ),
        new Camera(
            light.position,
            addVec3(createVec3(), addVec3(light.position, [0, -1, 0])), // negativ y
            addVec3(createVec3(), [0, 0, -1])
        ),
        new Camera(
            light.position,
            addVec3(createVec3(), addVec3(light.position, [0, 0, 1])), // positiv z
            addVec3(createVec3(), [0, -1, 0])
        ),
        new Camera(
            light.position,
            addVec3(createVec3(), addVec3(light.position, [0, 0, -1])), // negativ z
            addVec3(createVec3(), [0, -1, 0])
        )
    ]
    shadowMap.shadowMapCamerasVM = [
        createM4(),
        createM4(),
        createM4(),
        createM4(),
        createM4(),
        createM4()
    ]
    shadowMap.shadowMapProj = createM4();
    // near und far muss noch getestet werden
    mat4.perspective(shadowMap.shadowMapProj, degrees_to_radians(90), 1.0, 0.01, 20);


    console.log(shadowMap);


    // alles was gezeichnet werden soll
    let models = [];

    models = await setUpArray(gl);




    // camera setup
    actCamera = new Camera(
        addVec3(createVec3(), [-5, 0, -20]),
        createVec3(),
        addVec3(createVec3(), [0, 1, 0]),
    );


    // muss nochmal alles durchgegangen werden
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);


    //Draw loop
    async function loop() {
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.2, 0.6, 0.7, 1.0);
        //gl.enable(gl.CULL_FACE); //macht irgendwie teapot kaputt
        gl.enable(gl.DEPTH_TEST);


        // kamera
        //lookAt(viewMatrix, [-5, 0, -20], [0, 0, 0], [0, 1, 0]);
        actCamera.getViewMatrix(viewMatrix);


        mat4.perspective(projMatrix, degrees_to_radians(90), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

        // light
        await drawObject(gl, lightModel, viewMatrix, projMatrix, light, true);


        // Rendert alle objekte
        for await (const element of models) {
            drawObject(gl, element, viewMatrix, projMatrix, light, false);
        }


        requestAnimationFrame(await loop);
    }

    requestAnimationFrame(loop);

}
//funktioniert noch nichts
var Camera = function (position, lookAt, up) {
    this.position = position;
    this.lookAt = lookAt;
    this.up = up;
}

// https://developer.mozilla.org/de/docs/Learn/JavaScript/Objects/Object_prototypes
Camera.prototype.getViewMatrix = function (out) {
    // falls wir nicht immer in den urprung gucken sollen müssen wir noch die derz. position addieren
    lookAt(out, this.position, this.lookAt, this.up);
    return out;
}




function drawObject(gl, currentObject, viewMatrix, projMatrix, light, isLight) {
    program = currentObject.program;
    var worldMatrix = new Float32Array(16);



    // Draw Objects
    gl.useProgram(program);

    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);


    const angle = performance.now() / 1000 / 6 * 2 * Math.PI * 1 / 2;



    let matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    let matViewUniformLocation = gl.getUniformLocation(program, 'mView');

    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

    let matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    identity(worldMatrix);

    //lightning -- kann vielleicht nur in createObj() sein

    const lightPositionUniformLocation = gl.getUniformLocation(program, 'light.position');
    const lightColorUniformLocation = gl.getUniformLocation(program, 'light.color');
    const lightAmbientUniformLocation = gl.getUniformLocation(program, 'light.ambient');
    gl.uniform3f(lightPositionUniformLocation, light.position[0], light.position[1], light.position[2],);
    gl.uniform3f(lightColorUniformLocation, light.color[0], light.color[1], light.color[2]);
    gl.uniform3f(lightAmbientUniformLocation, light.ambient[0], light.ambient[1], light.ambient[2]);


    if (isLight) {
        mat4.translate(worldMatrix, worldMatrix, [Math.sin(angle) * 15, 0, Math.cos(angle) * 15]);
        light.position = [-worldMatrix[12], worldMatrix[13], -worldMatrix[14]];

    } else {

        // veränderung des objektes -- reihenfolge muss nochmal recherchiert werden
        mat4.translate(worldMatrix, worldMatrix, currentObject.model.position);
        mat4.scale(worldMatrix, worldMatrix, currentObject.model.scale);
        mat4.rotate(worldMatrix, worldMatrix, degrees_to_radians(currentObject.model.angle), currentObject.model.rotationAxis);
    }


    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

    // draw call -- weil ich ihn immer übersehe :D
    currentObject.draw();

    gl.useProgram(null);

}

async function setUpObject(gl, objFile, vertShader, fragShader, texture, ambient, diffuse, specular, shiny, position, angle, rotationAxis, scale) {

    const oVertices = await fetchModel(objFile);

    // material werte
    let oMaterial = {
        ambient: ambient,
        diffuse: diffuse,
        specular: specular,
        shiny: shiny
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

function setUpArray(gl) {
    let setUpObjects = [];



    // teapot
    setUpObjects[0] = setUpObject(
        gl,
        './models/teapot.obj', 'shader_vert.glsl', 'shader_frag.glsl', //obj file und shader
        'crate-image',         // texture
        [1.0, 1.0, 1.0], // ambient
        [0.55, 0.21, 0.07], // diffuse
        [0.58, 0.22, 0.07], // specular
        51.2,               // shiny
        [0, 0, 0],            // position
        -25,                  // angle
        [1, 0, 0],            // rotation
        [3, 3, 3],            // scale
    );

    //skybox


    // cube
    setUpObjects[1] = setUpObject(
        gl,
        './models/cube.obj', 'shader_vert.glsl', 'shader_frag.glsl',
        'crate-image',         // texture
        [0.23, 0.09, 0.03], // ambient
        [0.55, 0.21, 0.07], // diffuse
        [0.58, 0.22, 0.07], // specular
        5,               // shiny
        [5, 0, -10],            // position
        45,                  // angle
        [1, 0, 0],            // rotation
        [3, 3, 3]             // scale
    );

    // book
    setUpObjects[2] = setUpObject(
        gl,
        './models/book.obj', 'shader_vert.glsl', 'shader_frag.glsl',
        'book-image',         // texture
        [1, 1, 1], // ambient
        [1, 1, 1], // diffuse
        [0.58, 0.22, 0.07], // specular
        5,               // shiny
        [-3, 0, 0],            // position
        30,                  // angle
        [0, 1, 1],            // rotation
        [0.5, 0.5, 0.5]             // scale
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
    //      gl.activeTexture(gl.TEXTURE13); ist in der übung weiß nicht was das bringt, vllt fürs video
    gl.activeTexture(gl.TEXTURE0); // ich glaube es gab ein array an texture an das ist die stelle 0
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

        /*
        const samplerUniformLocation = gl.getUniformLocation(this.program, 'sampler')
        gl.uniform1i(samplerUniformLocation, 11); // warum 11 ? für die übung hatte ich das nicht braucht
        */

        // material -- vllt sollten wir das in einer methode machen und abfragen ob es textur und material gibt
        const ambientUniformLocation = gl.getUniformLocation(this.program, 'mat.ambient');
        const diffuseUniformLocation = gl.getUniformLocation(this.program, 'mat.diffuse');
        const specularUniformLocation = gl.getUniformLocation(this.program, 'mat.specular');
        const shininessUniformLocation = gl.getUniformLocation(this.program, 'mat.shininess');
        gl.uniform3f(ambientUniformLocation, this.model.material.ambient[0], this.model.material.ambient[1], this.model.material.ambient[2]);
        gl.uniform3f(diffuseUniformLocation, this.model.material.diffuse[0], this.model.material.diffuse[1], this.model.material.diffuse[2]);
        gl.uniform3f(specularUniformLocation, this.model.material.specular[0], this.model.material.specular[1], this.model.material.specular[2]);
        gl.uniform1f(shininessUniformLocation, this.model.material.shiny);





        //test

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

function createShadowMapCube(gl) {
    let ShadowMap = {};

    // benutzen framebuffer um den schatten zu generiern
    ShadowMap.shadowMapCube = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, ShadowMap.shadowMapCube);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.GL_CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.GL_CLAMP_TO_EDGE);

    for (var i = 0; i < 6; i++) {
        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, // gehen mit dem index zu -x,y,-y,z,-z 
            0, gl.RGBA, 2048, 2048, // werte sollten zweier potenz seien, wenn der pc es nicht schafft muss er niedrig gesetzt werden (ist die höhe und breite der textur)
            0, gl.RGBA, gl.UNSIGNED_BYTE, null


        );
    }


    // framebuffer wird erstellt
    ShadowMap.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, ShadowMap.framebuffer);

    // renderbuffer wird erstellt
    ShadowMap.renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, ShadowMap.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 2048, 2048);




    // unbind
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return ShadowMap;
}

function generateShadowMapCube(gl, shadowMap) {
    gl.useProgram(shadowGenMap.program);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMap.shadowMapCube);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMap.framebuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, shadowMap.renderbuffer);

    gl.viewport(0, 0, 2048, 2048);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(CULL_FACE);

    // uniforms müssen gesetzt werden

    // near far

    // pointlightposition


    // proj matrix     


    for (let i = 0; i < shadowMap.shadowMapCameras.length; i++) {
        let matViewUniformLocation = gl.getUniformLocation(shadowMap.programprogram, 'mView');
        gl.uniformMatrix4fv(
            matViewUniformLocation,
            gl.FALSE,
            shadowMap.shadowMapCameras[i].getViewMatrix(shadowMap.shadowMapCamerasVM[i])
        );
        // setzt das ziel vom framebuffer 
        gl.frameBufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            shadowMap.shadowMapCube,
            0
        );
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,shadowMap.renderbuffer);
        
        gl.clearColor(1,1,1,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    }




    // unbind
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

}