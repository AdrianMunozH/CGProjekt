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

    //test


    // hier eine setup methode 
    // vertices der obj datein laden
    const tVertices = await fetchModel('teapot.obj');


    // material werte
    let tMaterial = {
        ambient: [0.23, 0.09, 0.03],
        diffuse: [0.23, 0.09, 0.03],
        specular: [0.23, 0.09, 0.03],
        shiny: 51.2
    }


    // init der versch models.
    let teapotModel = {
        vertices: tVertices,
        material: tMaterial,
        // is skybox ?? oder wessen program benutzt werden soll
        // textur
    }


    //!test

    // neues Model
    //const teapot = {};

    const teapot = await createObject(teapotModel, gl);
    //shader datein werden geladen
    teapot.program = await createShaderProgram(gl, 'teapot_vert.glsl', 'teapot_frag.glsl');

    if (!teapot.program) {
        console.error('solarSystem Cannot run without shader program!');
        return;
    }


    // alles was gezeichnet werden soll
    let models = [];

    let programs = [];

    // shader werden geladen
    //programs[0] = await createShaderProgram(gl, 'teapot_vert.glsl', 'teapot_frag.glsl');


    // hinz. der versch models
    models[0] = teapot;


    // muss nochmal alles durchgegangen werden
    gl.clearColor(0.75, 0.85, 0.8, 1.0); 
    gl.enable(gl.DEPTH_TEST); 
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);


    //Draw loop
    function loop() {
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
        lookAt(viewMatrix, [5, -5, -5], [0, 0, 0], [0, 1, 0]);

        mat4.perspective(projMatrix, radians_to_degree(90), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);
       

        // hier die for each für die liste der objekte

        // Draw Objects
        gl.useProgram(teapot.program);

        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.enable(gl.DEPTH_TEST);
            
        matProjUniformLocation = gl.getUniformLocation(teapot.program, 'mProj');
		gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
		
		matViewUniformLocation = gl.getUniformLocation(teapot.program, 'mView');		
		gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
		
        let matWorldUniformLocation = gl.getUniformLocation(teapot.program, 'mWorld');
        identity(worldMatrix);
        // veränderung des objektes
        mat4.rotate(worldMatrix,worldMatrix,degrees_to_radians(180),[0,0,1]);
        mat4.scale(worldMatrix,worldMatrix,[2,2,2]);

        
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        teapot.draw();

        // !foreach

        
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}

async function createObject(model, gl) {

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

        // material
        const ambientUniformLocation = gl.getUniformLocation(this.program, 'mat.ambient');
        const diffuseUniformLocation = gl.getUniformLocation(this.program, 'mat.diffuse');
        const specularUniformLocation = gl.getUniformLocation(this.program, 'mat.specular');
        const shininessUniformLocation = gl.getUniformLocation(this.program, 'mat.shininess');
        gl.uniform3f(ambientUniformLocation, this.model.material.ambient[0], this.model.material.ambient[1], this.model.material.ambient[2]);
        gl.uniform3f(diffuseUniformLocation, this.model.material.diffuse[0], this.model.material.diffuse[1], this.model.material.diffuse[2]);
        gl.uniform3f(specularUniformLocation, this.model.material.specular[0], this.model.material.specular[1], this.model.material.specular[2]);
        gl.uniform1f(shininessUniformLocation, this.model.material.shiny);
        console.log(this.model.material.ambient[0]);
        
        
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
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        

    }
    return obj;
}
