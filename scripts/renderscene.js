let view;
let ctx;
let scene;
let start_time;
let check = 0;

const LEFT =   32; // binary 100000
const RIGHT =  16; // binary 010000
const BOTTOM = 8;  // binary 001000
const TOP =    4;  // binary 000100
const FAR =    2;  // binary 000010
const NEAR =   1;  // binary 000001
const FLOAT_EPSILON = 0.000001;

// Initialization function - called when web page loads
function init() {
    let w = 800;
    let h = 600;
    view = document.getElementById('view');
    view.width = w;
    view.height = h;

    ctx = view.getContext('2d');

    // initial scene... feel free to change this
    scene = {
        view: {
            type: 'perspective',
            prp: Vector3(44, 20, -16),
            srp: Vector3(20, 20, -40),
            vup: Vector3(0, 1, 0),
            clip: [-19, 5, -10, 8, 12, 100]
        },
        models: [
            {
                type: 'generic',
                vertices: [
                    Vector4( 0,  0, -30, 1),
                    Vector4(20,  0, -30, 1),
                    Vector4(20, 12, -30, 1),
                    Vector4(10, 20, -30, 1),
                    Vector4( 0, 12, -30, 1),
                    Vector4( 0,  0, -60, 1),
                    Vector4(20,  0, -60, 1),
                    Vector4(20, 12, -60, 1),
                    Vector4(10, 20, -60, 1),
                    Vector4( 0, 12, -60, 1)
                ],
                edges: [
                    [0, 1, 2, 3, 4, 0],
                    [5, 6, 7, 8, 9, 5],
                    [0, 5],
                    [1, 6],
                    [2, 7],
                    [3, 8],
                    [4, 9]
                ],
                animation: {
                    axis: "y",
                    rps: 0.5
                },
                matrix: new Matrix(4, 4) 
            },
            { 
                type: "sphere",
                center: Vector4(12, 10, -49, 1),
                radius: 12,
                stacks: 20,
                slices: 20,
                animation: {
                    axis: "z",
                    rps: 0.5
                },
                matrix: new Matrix(4,4)
            }
        ]
    };
    // event handler for pressing arrow keys
    computeVertAndEdge();
    document.addEventListener('keydown', onKeyDown, false);

    // start animation loop
    start_time = performance.now(); // current timestamp in milliseconds
    window.requestAnimationFrame(animate);
}

// Animation loop - repeatedly calls rendering code
function animate(timestamp) {
    // step 1: calculate time (time since start)
    let prev_time = 0;
    let time = (timestamp - start_time)/1000;
    prev_time = time;
    // step 2: transform models based on time
    //need to put this in so that we can change rate of spin based on model
    // also need to check which axis to spin on  
        for(let i = 0; i< scene.models.length; i++){
            //console.log(scene.models[1].vertices);
            if(scene.models[i].animation != undefined){
                let angle = (time)*scene.models[i].animation.rps*(Math.PI*2);
                let subtract = new Matrix(4,4);
                let rotate = new Matrix(4,4);
                let addBack = new Matrix(4,4);
                let tempX = scene.models[i].center.x;
                let tempY = scene.models[i].center.y;
                let tempZ = scene.models[i].center.z;
                
                // console.log(tempY);
                // console.log(tempZ);
                mat4x4Translate(subtract, -tempX, -tempY, -tempZ);
                if(scene.models[i].animation.axis == "x"){
                    mat4x4RotateX(rotate,angle);
                }else if(scene.models[i].animation.axis == "y"){
                    mat4x4RotateY(rotate,angle);
                }else{
                    mat4x4RotateZ(rotate,angle);
                }
                mat4x4Translate(addBack, tempX, tempY, tempZ);
                scene.models[i].matrix = Matrix.multiply([addBack,rotate,subtract]);
            }

                    //console.log(scene.models[i].vertices[0]);
                ctx.clearRect(0, 0, view.width, view.height);
        } 

    // step 3: draw scene
    drawScene();
    // step 4: request next animation frame (recursively calling same function)
    // (may want to leave commented out while debugging initially)
    window.requestAnimationFrame(animate);
}
function computeVertAndEdge(){

    for(let i = 0; i< scene.models.length; i++){
        if(scene.models[i].type == 'cube') {
            halfHeight = scene.models[i].height/2;
            halfWidth = scene.models[i].width/2;
            halfDepth = scene.models[i].depth/2;
            modelCenter = scene.models[i].center;
            scene.models[i].vertices = [];
            scene.models[i].vertices.push(Vector4(modelCenter.x - halfWidth, modelCenter.y + halfHeight,modelCenter.z - halfDepth,modelCenter.w)); // front, top, left 0
            scene.models[i].vertices.push(Vector4(modelCenter.x + halfWidth, modelCenter.y + halfHeight,modelCenter.z - halfDepth,modelCenter.w)); // front, top, right 1
            scene.models[i].vertices.push(Vector4(modelCenter.x + halfWidth, modelCenter.y - halfHeight,modelCenter.z - halfDepth,modelCenter.w)); // front, bottom, right 2
            scene.models[i].vertices.push(Vector4(modelCenter.x - halfWidth, modelCenter.y - halfHeight,modelCenter.z - halfDepth,modelCenter.w)); // front, bottom, left 3
            scene.models[i].vertices.push(Vector4(modelCenter.x - halfWidth, modelCenter.y + halfHeight,modelCenter.z + halfDepth,modelCenter.w)); // back, top, left 4
            scene.models[i].vertices.push(Vector4(modelCenter.x + halfWidth, modelCenter.y + halfHeight,modelCenter.z + halfDepth,modelCenter.w)); // back, top, right 5
            scene.models[i].vertices.push(Vector4(modelCenter.x + halfWidth, modelCenter.y - halfHeight,modelCenter.z + halfDepth,modelCenter.w)); // back, bottom, right 6
            scene.models[i].vertices.push(Vector4(modelCenter.x - halfWidth, modelCenter.y - halfHeight,modelCenter.z + halfDepth,modelCenter.w)); // back, bottom, left 7 
            scene.models[i].edges = [];
            scene.models[i].edges[0] = [0, 1, 2, 3, 0];
            scene.models[i].edges[1] = [4, 5, 6, 7, 4]; 
            scene.models[i].edges[2] = [0,4];
            scene.models[i].edges[3] = [1,5];
            scene.models[i].edges[4] = [2,6];
            scene.models[i].edges[5] = [3,7];
        } else if(scene.models[i].type == 'cone') {
            let cos = Math.cos(0.0);
            let sin = Math.sin(0.0);
            center = scene.models[i].center;
            radius = scene.models[i].radius;
            point = scene.models[i].height/2 + center.z;
            fz = center.z - scene.models[i].height/2;
            scene.models[i].vertices = [];
            scene.models[i].edges = [];
            scene.models[i].edges[0] = [];
            scene.models[i].vertices.push(Vector4(center.x, center.y, point,1));
            scene.models[i].vertices.push(Vector4(center.x + radius * cos, center.y + radius * sin, fz, 1));
            for(let j = 0; j < scene.models[i].sides; j++) {
                cos = Math.cos(((j+1) * 2 * Math.PI)/scene.models[i].sides);
                sin = Math.sin(((j+1) * 2 * Math.PI)/scene.models[i].sides);
                scene.models[i].vertices.push(Vector4(center.x + radius * cos, center.y + radius * sin, fz, 1));
            }
            let newEdge = 1;
            for(let j = 1; j < scene.models[i].vertices.length; ++j) {
                scene.models[i].edges[0].push(j);
                scene.models[i].edges[newEdge] = [0,j];
                newEdge++;
            }
    
        } else if(scene.models[i].type == 'cylinder') {
            let cos = Math.cos(0.0);
            let sin = Math.sin(0.0);
            center = scene.models[i].center;
            radius = scene.models[i].radius;
            fz = center.z - scene.models[i].height/2;
            bz = center.z + scene.models[i].height/2;
            scene.models[i].vertices = [];
            scene.models[i].edges = [];
            scene.models[i].edges[0] = [];
            scene.models[i].edges[1] = [];
            radius = scene.models[i].radius;
            scene.models[i].vertices.push(Vector4(center.x + radius * cos, center.y + radius * sin, fz, 1));
            scene.models[i].vertices.push(Vector4(center.x + radius * cos, center.y + radius * sin, bz, 1));
                
            for(let j = 0; j < scene.models[i].sides; j++) {
                cos = Math.cos(((j+1) * 2 * Math.PI)/scene.models[i].sides);
                sin = Math.sin(((j+1) * 2 * Math.PI)/scene.models[i].sides);
                scene.models[i].vertices.push(Vector4(center.x + radius * cos, center.y + radius * sin, fz, 1));
                scene.models[i].vertices.push(Vector4(center.x + radius * cos, center.y + radius * sin, bz, 1));
            }
    
            let newEdge = 2;
            for(let j = 0; j < scene.models[i].vertices.length; ++j) {
                if(j%2 == 0) {
                    scene.models[i].edges[1].push(j);
                    scene.models[i].edges[newEdge] = [j, j+1];
                    newEdge++;
                } else if (j % 2 != 0) {
                    scene.models[i].edges[0].push(j);
                }
            }
        } else if (scene.models[i].type == 'sphere') {
            let cos = Math.cos(0.0);
            let sin = Math.sin(0.0);
            let sides = 20;
            let radius = scene.models[i].radius;
            let center = scene.models[i].center;
            scene.models[i].edges = [];
            scene.models[i].edges[0] = [];
            scene.models[i].vertices = [];
            let angle = 0;
            let subtract = new Matrix(4,4);
            let rotate = new Matrix(4,4);
            let addBack = new Matrix(4,4);
            let tempX = scene.models[i].center.x;
            let tempY = scene.models[i].center.y;
            let tempZ = scene.models[i].center.z;
            let rotationMatrix = new Matrix(4,4);
            let checker = 0;
            for(let j = 0; j < scene.models[i].slices; j++) { 
                mat4x4Translate(subtract, -tempX, -tempY, -tempZ);
                mat4x4RotateY(rotate,angle);
                mat4x4Translate(addBack, tempX, tempY, tempZ);
                rotationMatrix = Matrix.multiply([addBack,rotate,subtract]);
                scene.models[i].vertices.push(Matrix.multiply([rotationMatrix,Vector4(center.x + radius * sin, center.y + radius * cos, center.z, 1)]));
                for(let k = 0; k < (scene.models[i].stacks) * 2; ++k) {
                    if(k < scene.models[i].stacks) {
                        cos = Math.cos(((k+1) * Math.PI)/(scene.models[i].stacks));
                        sin = Math.sin(((k+1) * Math.PI)/(scene.models[i].stacks));
                        scene.models[i].vertices.push(Matrix.multiply([rotationMatrix,Vector4(center.x + radius * sin, center.y + radius * cos, center.z, 1)]));
                    }
                    if(k == scene.models[i].stacks * 2 - 1) {
                        cos = Math.cos(((k+1) * Math.PI)/(scene.models[i].stacks));
                        sin = Math.sin(((k+1) * Math.PI)/(scene.models[i].stacks));
                        scene.models[i].vertices.push(Matrix.multiply([rotationMatrix,Vector4(center.x + radius * sin, center.y + radius * cos, center.z, 1)]));
                    }
                }
                scene.models[i].edges[j] = [];
                scene.models[i].edges[j].push(scene.models[i].vertices.length-1);
                for(let k = checker; k < scene.models[i].vertices.length-1; k++) {
                    scene.models[i].edges[j].push(k);
                }
                checker = scene.models[i].vertices.length;
                angle = angle + (Math.PI*2)/(scene.models[i].slices);                
            }

            angle = 0;
            newStart = scene.models[i].edges.length;
            //console.log(scene.models[i].edges.length);
            /*checker = scene.models[i].edges.length;
            for(let j = 0; j<scene.models[i].stacks-1; j++){
                scene.models[i].edges[checker] = [];
                checker++;  
            }*/
            //console.log(scene.models[i].edges);
            //console.log(scene.models[i].vertices);
            let tempSpot = 0;
            let edgeLength = scene.models[i].edges.length;
            for(let j = 0; j<edgeLength; j++){
                for(let k = 0; k<scene.models[i].edges[j].length; k++){
                    //console.log(scene.models[i].edges);
                    //console.log(scene.models[i].slices + (scene.models[i].edges[j][k] % scene.models[i].edges[j].length));
                    if(scene.models[i].edges[scene.models[i].slices + (scene.models[i].edges[j][k] % scene.models[i].edges[j].length)] == undefined) {
                        scene.models[i].edges[scene.models[i].slices + (scene.models[i].edges[j][k] % scene.models[i].edges[j].length)] = [];
                    }
                    
                    scene.models[i].edges[scene.models[i].slices + (scene.models[i].edges[j][k] % scene.models[i].edges[j].length)].push(scene.models[i].edges[j][k]);
                }
            }

            for(let j = scene.models[i].slices; j < scene.models[i].edges.length;j++) {
                scene.models[i].edges[j].push(scene.models[i].edges[j][0]);
            }
            //console.log(scene.models[i].edges);
            // for(let j = 0; j < scene.models[i].stacks; j++) {
            //     mat4x4Translate(subtract, -tempX, -tempY, -tempZ);
            //     mat4x4RotateX(rotate,angle);
            //     mat4x4Translate(addBack, tempX, tempY, tempZ);
            //     rotationMatrix = Matrix.multiply([addBack,rotate,subtract]);
            //     scene.models[i].vertices.push(Matrix.multiply([rotationMatrix,Vector4(center.x + radius * sin, center.y + radius * cos, center.z, 1)]));
            //     for(let k = 0; k < scene.models[i].slices*2; ++k) {
            //         cos = Math.cos(((k+1) * 2 * Math.PI)/(scene.models[i].stacks*2));
            //         sin = Math.sin(((k+1) * 2 * Math.PI)/(scene.models[i].stacks*2));
            //         scene.models[i].vertices.push(Matrix.multiply([rotationMatrix,Vector4(center.x + radius * sin, center.y + radius * cos, center.z, 1)]));
            //     }
            //     scene.models[i].edges[newStart] = [];
            //     for(let k = checker; k < scene.models[i].vertices.length; k++) {
            //         scene.models[i].edges[newStart].push(k);
            //     }
            //     newStart++;
            //     checker = scene.models[i].vertices.length;
            //     angle = angle + ((Math.PI)/(scene.models[i].slices));
                
            // }
            //  console.log(scene.models[i].vertices);

            //set the next position of edges
            //loop through  stacks
            //loop through each vertices and push to that current edge
            
    
        }else{
            let hx = scene.models[i].vertices[0].x;
            let lx = scene.models[i].vertices[0].x;
            let hy = scene.models[i].vertices[0].y;
            let ly = scene.models[i].vertices[0].y;
            let hz = scene.models[i].vertices[0].z;
            let lz = scene.models[i].vertices[0].z;
            for(let j = 1; j<scene.models[i].vertices.length; j++){
                if(lx > scene.models[i].vertices[j].x){
                    lx = scene.models[i].vertices[j].x;
                }
                if(ly > scene.models[i].vertices[j].y){
                    ly = scene.models[i].vertices[j].y;
                }
                if(lz > scene.models[i].vertices[j].z){
                    lz = scene.models[i].vertices[j].z;
                }
                if(hx < scene.models[i].vertices[j].x){
                    hx = scene.models[i].vertices[j].x;
                }
                if(hy < scene.models[i].vertices[j].y){
                    hy = scene.models[i].vertices[j].y;
                }
                if(hz < scene.models[i].vertices[j].z){
                    hz = scene.models[i].vertices[j].z;
                }
            }
            px = (hx + lx)/2;
            py = (hy + ly)/2;
            pz = (hz + lz)/2;

            scene.models[i].center = Vector4(px,py,pz,1);

        }
    }

  
}
// Main drawing code - use information contained in variable `scene`
function drawScene() {
    var transform;
    let model = [];
    let windowTS = new Matrix(4,4);
    windowTS.values = [[view.width/2, 0, 0, view.width/2],
                       [0, view.height/2, 0, view.height/2],
                       [0, 0, 1, 0],
                       [0, 0, 0, 1]];
    // TODO: implement drawing here!
    // For each model, for each edge
    //  * transform to canonical view volume
    //console.log(scene.view.prp);
    //computeVertAndEdge();
    for(let i = 0; i< scene.models.length; i++){
        //console.log(scene.models[i].type);
        model.push([]);

        //console.log(scene.models[i].edges);
        if(scene.view.type == 'perspective') {
            transform = mat4x4Perspective(scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
            
        //  * clip in 3D
            for(let j = 0; j < scene.models[i].edges.length; ++j) {
                for(let k = 0; k < scene.models[i].edges[j].length-1;++k) {
                    let p0 = Matrix.multiply([transform, scene.models[i].matrix, scene.models[i].vertices[scene.models[i].edges[j][k]]]);
                    let p1 = Matrix.multiply([transform, scene.models[i].matrix, scene.models[i].vertices[scene.models[i].edges[j][k+1]]]);
                    let line = {
                        pt0: p0,
                        pt1: p1
                    };
                
                    //console.log(j,k);
                    //console.log(j,k+1);
                    let clippedLine = clipLinePerspective(line,-(scene.view.clip[4]/scene.view.clip[5]));
                    if(clippedLine != null){
                        //console.log(model[i]);
                        model[i].push(clippedLine);
                    }
                }
            }
    
            //should be transfrom clip then mper * windowTS * vertice

            for(let j = 0; j < model[i].length; ++j) {
                    let p02d = Matrix.multiply([windowTS,mat4x4MPer(), model[i][j][0]]);
                    let p12d = Matrix.multiply([windowTS,mat4x4MPer(), model[i][j][1]]);
                    p02d.x = p02d.x/p02d.w;
                    p02d.y = p02d.y/p02d.w;
                    p12d.x = p12d.x/p12d.w;
                    p12d.y = p12d.y/p12d.w;
                    drawLine(p02d.x, p02d.y, p12d.x, p12d.y);
            }
            
        }else{
            transform = mat4x4Parallel(scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
            //console.log(scene.models[i]);
            for(let j = 0; j < scene.models[i].edges.length; ++j) {
                for(let k = 0; k < scene.models[i].edges[j].length-1;++k) {
                    let p0 = Matrix.multiply([transform,scene.models[i].matrix, scene.models[i].vertices[scene.models[i].edges[j][k]]]);
                    let p1 = Matrix.multiply([transform,scene.models[i].matrix, scene.models[i].vertices[scene.models[i].edges[j][k+1]]]);
                    let line = {
                        pt0: p0,
                        pt1: p1
                    };
                    //console.log(j,k); //setting to cononical view
                    //console.log(j,k+1);
                    let clippedLine = clipLineParallel(line);
                    if(clippedLine != null){
                        
                        model[i].push(clippedLine);
                    }
                    //console.log(model[i]);
                }
            }
            for(let j = 0; j < model[i].length; ++j) {
                let p02d = Matrix.multiply([windowTS,mat4x4MPar(), model[i][j][0]]);
                let p12d = Matrix.multiply([windowTS,mat4x4MPar(), model[i][j][1]]);
                p02d.x = p02d.x/p02d.w;
                p02d.y = p02d.y/p02d.w;
                p12d.x = p12d.x/p12d.w;
                p12d.y = p12d.y/p12d.w;
                drawLine(p02d.x, p02d.y, p12d.x, p12d.y);
        }

        
            
        }
        //  * project to 2
        
        //console.log(model);
        //console.log(scene);
        
    }    
    
}

// Get outcode for vertex (parallel view volume)
function outcodeParallel(vertex) {
    let outcode = 0;
    if (vertex.x < (-1.0 - FLOAT_EPSILON)) {
        outcode += LEFT;
    }
    else if (vertex.x > (1.0 + FLOAT_EPSILON)) {
        outcode += RIGHT;
    }
    if (vertex.y < (-1.0 - FLOAT_EPSILON)) {
        outcode += BOTTOM;
    }
    else if (vertex.y > (1.0 + FLOAT_EPSILON)) {
        outcode += TOP;
    }
    if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
        outcode += FAR;
    }
    else if (vertex.z > (0.0 + FLOAT_EPSILON)) {
        outcode += NEAR;
    }
    return outcode;
}

// Get outcode for vertex (perspective view volume)
function outcodePerspective(vertex, z_min) {
    let outcode = 0;
    if (vertex.x < (vertex.z - FLOAT_EPSILON)) {
        outcode += LEFT;
    }
    else if (vertex.x > (-vertex.z + FLOAT_EPSILON)) {
        outcode += RIGHT;
    }
    if (vertex.y < (vertex.z - FLOAT_EPSILON)) {
        outcode += BOTTOM;
    }
    else if (vertex.y > (-vertex.z + FLOAT_EPSILON)) {
        outcode += TOP;
    }
    if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
        outcode += FAR;
    }
    else if (vertex.z > (z_min + FLOAT_EPSILON)) {
        outcode += NEAR;
    }
    return outcode;
}

// Clip line - should either return a new line (with two endpoints inside view volume) or null (if line is completely outside view volume)
function clipLineParallel(line) {
    let result = null;
    let p0 = Vector4(line.pt0.x, line.pt0.y, line.pt0.z,1); 
    let p1 = Vector4(line.pt1.x, line.pt1.y, line.pt1.z,1);
    let out0 = outcodeParallel(p0);
    let out1 = outcodeParallel(p1);
    let loop = true;
    var outcode;
    var p;
    // TODO: implement clipping here!
    while(loop) {
        if((out0 | out1) == 0){
        //trivial accept
            result = [p0,p1];
            loop = false;
        }else if((out0 & out1) != 0){
        // trivial deny
            loop = false;
        }else{
            if(out0 != 0) {
                outcode = out0;
            } else {
                outcode = out1;
            }

            p = calculateIntersectionPara(line.pt0, line.pt1, outcode);

            //console.log("clipped",p);
            if(outcode == out0) {
                p0 = p;
                out0 = outcodeParallel(p0);
            } else {
                p1 = p;
                out1 = outcodeParallel(p1);
            }
        }
    }
    
    return result;
}

function calculateIntersectionPara(p0, p1, outcode) {

    let t;
    //console.log("p1: ",p0.x,p0.y,p0.z);
    //console.log("p2: ",p1.x,p1.y,p1.z);
    if(outcode >= 32) {
        t = (-1-p0.x)/((p1.x) - p0.x);
        outcode -= 32;
    } else if (outcode >= 16) { 
        t = (1-p0.x)/((p1.x) - p0.x);
        outcode -= 16;
    }

    if(outcode >= 8) {
        t = (-1-p0.y)/((p1.y) - p0.y);
        outcode -= 8;
    } else if(outcode >= 4) {
        t = (1-p0.y)/((p1.y) - p0.y);
        outcode -= 4;
    }

    if(outcode >= 2) {
        t = (-1-p0.z)/((p1.z) - p0.z);
        outcode -= 2;
    } else if (outcode >= 1) {
        t = (-p0.z)/((p1.z) - p0.z);
        outcode -= 1;
    }

    let newVect = Vector4((1-t) * p0.x + t * p1.x, (1-t) * p0.y + t * p1.y, (1-t) * p0.z + t * p1.z,1);

    return newVect;
}
// Clip line - should either return a new line (with two endpoints inside view volume) or null (if line is completely outside view volume)
function clipLinePerspective(line, z_min) {
    let result = null;
    let p0 = Vector4(line.pt0.x, line.pt0.y, line.pt0.z,1); 
    let p1 = Vector4(line.pt1.x, line.pt1.y, line.pt1.z,1);
    let out0 = outcodePerspective(p0, z_min);
    let out1 = outcodePerspective(p1, z_min);
    let loop = true;
    var outcode;
    var p;
    // console.log(z_min);
    // console.log(p0,p1);
    // console.log(out0,out1);
    // console.log(p0,p1);
    // TODO: implement clipping here!
    while(loop) {
        if((out0 | out1) == 0){
        //trivial accept
            result = [p0,p1];
            loop = false;
        }else if((out0 & out1) != 0){
        // trivial deny
            loop = false;
        }else{
            if(out0 != 0) {
                outcode = out0;
            } else {
                outcode = out1;
            }

            p = calculateIntersectionPersp(line.pt0, line.pt1, outcode);
            //console.log("clipped",p);
            if(outcode == out0) {
                p0 = p;
                out0 = outcodePerspective(p0, z_min);
            } else {
                p1 = p;
                out1 = outcodePerspective(p1, z_min);
            }
        }
    }
    
    return result;
}

function calculateIntersectionPersp(p0, p1, outcode) {
    let dx = (p1.x - p0.x);
    let dy = (p1.y - p0.y);
    let dz = (p1.z - p0.z); 
    let t;

    if(outcode >= 32) {
        t = (-p0.x + p0.z)/(dx - dz);
        outcode -= 32;
    } else if (outcode >= 16) { 
        t = (p0.x + p0.z)/(-dx - dz);
        outcode -= 16;
    }

    if(outcode >= 8) {
        t = (-p0.y + p0.z)/(dy-dz);
        outcode -= 8;
    } else if(outcode >= 4) {
        t = (p0.y + p0.z)/(-dy-dz);
        outcode -= 4;
    }

    if(outcode >= 2) {
        t = (-p0.z - 1)/dz;
        outcode -= 2;
    } else if (outcode >= 1) {
        t = (p0.z - -(scene.view.clip[4]/scene.view.clip[5]))/-dz;
        outcode -= 1;
    }

    let newVect = Vector4((1-t) * p0.x + t * p1.x, (1-t) * p0.y + t * p1.y, (1-t) * p0.z + t * p1.z,1);

    return newVect;
}
// Called when user presses a key on the keyboard down 
function onKeyDown(event) {
    let angle;
    let subtract;
    let rotateX;
    let rotateY;
    let rotateZ;
    let addBack;

    let tempX;
    let tempY;
    let tempZ;
    let tempVect;
    switch (event.keyCode) {
        case 37: // LEFT Arrow
            //console.log("left");
            n = scene.view.prp.subtract(scene.view.srp)
            n.normalize();
            u = scene.view.vup.cross(n)
            u.normalize();
            v = n.cross(u);
            angle = -.11;
            subtract = new Matrix(4,4);
            rotateX = new Matrix(4,4);
            rotateY = new Matrix(4,4);
            rotateZ = new Matrix(4,4);
            addBack = new Matrix(4,4);

            tempX = scene.view.prp.x;
            tempY = scene.view.prp.y;
            tempZ = scene.view.prp.z;
            tempVect = Vector4(scene.view.srp.x,scene.view.srp.y,scene.view.srp.z,1);
            // console.log(tempY);
            // console.log(tempZ);
            mat4x4Translate(subtract, -tempX, -tempY, -tempZ);
            mat4x4RotateX(rotateX,angle*v.x);
            mat4x4RotateY(rotateY,angle*v.y);
            mat4x4RotateZ(rotateZ,angle*v.z);
            mat4x4Translate(addBack, tempX, tempY, tempZ);
            
            

            tempVect = Matrix.multiply([addBack,rotateX,rotateY,rotateZ,subtract,tempVect]);
            //console.log(scene.view.srp);
            scene.view.srp.x = tempVect.x;
            scene.view.srp.y = tempVect.y;
            scene.view.srp.z = tempVect.z;
            // console.log(scene.view.srp.x, scene.view.srp.y, scene.view.srp.z);
            // ctx.clearRect(0, 0, view.width, view.height);
            drawScene();
            break;
        case 39: // RIGHT Arrow
            n = scene.view.prp.subtract(scene.view.srp)
            n.normalize();
            u = scene.view.vup.cross(n)
            u.normalize();
            v = n.cross(u);
            angle = .11;
            subtract = new Matrix(4,4);
            rotateX = new Matrix(4,4);
            rotateY = new Matrix(4,4);
            rotateZ = new Matrix(4,4);
            addBack = new Matrix(4,4);

            tempX = scene.view.prp.x;
            tempY = scene.view.prp.y;
            tempZ = scene.view.prp.z;
            tempVect = Vector4(scene.view.srp.x,scene.view.srp.y,scene.view.srp.z,1);
            // console.log(tempY);
            // console.log(tempZ);
            mat4x4Translate(subtract, -tempX, -tempY, -tempZ);
            mat4x4RotateX(rotateX,angle*v.x);
            mat4x4RotateY(rotateY,angle*v.y);
            mat4x4RotateZ(rotateZ,angle*v.z);
            mat4x4Translate(addBack, tempX, tempY, tempZ);
            
            

            tempVect = Matrix.multiply([addBack,rotateX,rotateY,rotateZ,subtract,tempVect]);
            console.log(scene.view.srp);
            scene.view.srp.x = tempVect.x;
            scene.view.srp.y = tempVect.y;
            scene.view.srp.z = tempVect.z;
            // console.log(scene.view.srp.x, scene.view.srp.y, scene.view.srp.z);
            // ctx.clearRect(0, 0, view.width, view.height);
            drawScene();
            break;
        case 65: // A key
            n = scene.view.prp.subtract(scene.view.srp)
            n.normalize();
            u = scene.view.vup.cross(n)
            u.normalize();
            scene.view.prp = scene.view.prp.add(u);
            scene.view.srp = scene.view.srp.add(u);
            ctx.clearRect(0, 0, view.width, view.height);
            drawScene();
            break;
        case 68: // D key
            n = scene.view.prp.subtract(scene.view.srp)
            n.normalize();
            u = scene.view.vup.cross(n)
            u.normalize();
            scene.view.prp = scene.view.prp.subtract(u);
            scene.view.srp = scene.view.srp.subtract(u);
            ctx.clearRect(0, 0, view.width, view.height);
            drawScene();
            break;
        case 83: // S key
            console.log("S");
            n = scene.view.prp.subtract(scene.view.srp)
            n.normalize();
            scene.view.prp = scene.view.prp.add(n);
            scene.view.srp = scene.view.srp.add(n);
            ctx.clearRect(0, 0, view.width, view.height);
            drawScene();
            break;
        case 87: // W key
            console.log("W");
            n = scene.view.prp.subtract(scene.view.srp)
            n.normalize();
            scene.view.prp = scene.view.prp.subtract(n);
            scene.view.srp = scene.view.srp.subtract(n);
            ctx.clearRect(0, 0, view.width, view.height);
            drawScene();
            break;
    }
}

///////////////////////////////////////////////////////////////////////////
// No need to edit functions beyond this point
///////////////////////////////////////////////////////////////////////////

// Called when user selects a new scene JSON file
function loadNewScene() {
    let scene_file = document.getElementById('scene_file');

    console.log(scene_file.files[0]);

    let reader = new FileReader();
    reader.onload = (event) => {
        scene = JSON.parse(event.target.result);
        scene.view.prp = Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]);
        scene.view.srp = Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]);
        scene.view.vup = Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]);

        for (let i = 0; i < scene.models.length; i++) {
            if (scene.models[i].type === 'generic') {
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    scene.models[i].vertices[j] = Vector4(scene.models[i].vertices[j][0],
                                                          scene.models[i].vertices[j][1],
                                                          scene.models[i].vertices[j][2],
                                                          1);
                }
            }
            else {
                scene.models[i].center = Vector4(scene.models[i].center[0],
                                                 scene.models[i].center[1],
                                                 scene.models[i].center[2],
                                                 1);
            }
            scene.models[i].matrix = new Matrix(4, 4);
        }
        computeVertAndEdge();
    };
    reader.readAsText(scene_file.files[0], 'UTF-8');
}

// Draw black 2D line with red endpoints 
function drawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
}

