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

    


    // alles was gezeichnet werden soll
    let models = [];

    models = await setUpArray(gl);


    // muss nochmal alles durchgegangen werden
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);


    //Draw loop
    async function loop() {
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        /*
        // muss auch nochmal recherchiert werden
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.2, 0.6, 0.7, 1.0);//Background-Canvas -- set color for drawing area before drawing
        gl.depthMask(true);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT); //depthBuffer must be cleared before drawing/ otherwise wrong results
        gl.disable(gl.DEPTH_TEST);//hidden surface removal func - decides which obj to draw in FG by varifying the depth of each obj
        gl.disable(gl.CULL_FACE); //eliminating back face drawing : disabled
        gl.disable(gl.BLEND);
        */
        // kamera
        lookAt(viewMatrix, [-5, 0, -10], [0, 0, 0], [0, 1, 0]);

        mat4.perspective(projMatrix, radians_to_degree(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);

        // Rendert alle objekte
        for await (const element of models) {
            drawObject(gl, element, viewMatrix, projMatrix);
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}
function drawObject(gl, currentObject, viewMatrix, projMatrix) {

    var worldMatrix = new Float32Array(16);


    // Draw Objects
    gl.useProgram(currentObject.program);

    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    const angle = performance.now() / 1000 / 6 * 2 * Math.PI;
    let matProjUniformLocation = gl.getUniformLocation(currentObject.program, 'mProj');
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    let matViewUniformLocation = gl.getUniformLocation(currentObject.program, 'mView');
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

    let matWorldUniformLocation = gl.getUniformLocation(currentObject.program, 'mWorld');
    identity(worldMatrix);


    // veränderung des objektes -- reihenfolge muss nochmal recherchiert werden
    mat4.translate(worldMatrix, worldMatrix, currentObject.model.position);
    mat4.scale(worldMatrix, worldMatrix, currentObject.model.scale);
    mat4.rotate(worldMatrix, worldMatrix, degrees_to_radians(currentObject.model.angle *angle), currentObject.model.rotationAxis);



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
        [8, 0, 0],            // position
        -320,                  // angle
        [1, 0, 1],            // rotation
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
        [-8, 0, 0],            // position
        60,                  // angle
        [0, 1, 0],            // rotation
        [3, 3, 3]             // scale
    );

    // cube
    setUpObjects[2] = setUpObject(
        gl,
        './models/book.obj', 'shader_vert.glsl', 'shader_frag.glsl',
        'book-image',         // texture
        [1, 1, 1], // ambient
        [1, 1, 1], // diffuse
        [0.58, 0.22, 0.07], // specular
        5,               // shiny
        [12, 0, 0],            // position
        60,                  // angle
        [0, 1, 0],            // rotation
        [0.5,0.5,0.5]             // scale
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
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,document.getElementById(model.texture));
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
        gl.bindTexture(gl.TEXTURE_2D,this.texture);
        
        /*
        const samplerUniformLocation = gl.getUniformLocation(this.program, 'sampler')
		gl.uniform1i(samplerUniformLocation, 11); // warum 11 ? für die übung hatte ich das nicht braucht
        */

        // material
        const ambientUniformLocation = gl.getUniformLocation(this.program, 'mat.ambient');
        const diffuseUniformLocation = gl.getUniformLocation(this.program, 'mat.diffuse');
        const specularUniformLocation = gl.getUniformLocation(this.program, 'mat.specular');
        const shininessUniformLocation = gl.getUniformLocation(this.program, 'mat.shininess');
        gl.uniform3f(ambientUniformLocation, this.model.material.ambient[0], this.model.material.ambient[1], this.model.material.ambient[2]);
        gl.uniform3f(diffuseUniformLocation, this.model.material.diffuse[0], this.model.material.diffuse[1], this.model.material.diffuse[2]);
        gl.uniform3f(specularUniformLocation, this.model.material.specular[0], this.model.material.specular[1], this.model.material.specular[2]);
        gl.uniform1f(shininessUniformLocation, this.model.material.shiny);

        //lightning -- kann vielleicht nur in createObj() sein

        const lightPositionUniformLocation = gl.getUniformLocation(this.program, 'light.position');
        const lightColorUniformLocation = gl.getUniformLocation(this.program, 'light.color');
        const lightAmbientUniformLocation = gl.getUniformLocation(this.program, 'light.ambient');
        gl.uniform3f(lightPositionUniformLocation, 1.0, 1.0, 0.0);
        gl.uniform3f(lightColorUniformLocation, 1.0, 1.0, 1.0);
        gl.uniform3f(lightAmbientUniformLocation, 0.2, 0.2, 0.2);



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
