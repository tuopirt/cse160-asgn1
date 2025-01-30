// ColoredPoints.js
// Vertex shader program
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform float u_Size;
    void main() {
       gl_Position = a_Position;
       gl_PointSize = u_Size;
    }`

// Fragment shader program
var FSHADER_SOURCE =`
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
       gl_FragColor = u_FragColor;
    }`


//constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

//globals
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_segmentSize = 10;

var g_shapesList = [];

//start webGL
function setupWebGL() {
    // Get the canvas element and WebGL rendering context
    canvas = document.getElementById('example');

    //changing this so it doesnt lag
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return null;
    }
}

//Initialize shaders
function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return false;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return false;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return false;
    }

    // Get the storage location of u_Size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return false;
    }
}

//passes for HTML
function forHTML(){
  //buttons - color
  document.getElementById('green').onclick = function() {g_selectedColor = [ 0.0,1.0,0.0,1.0]; };
  document.getElementById('red').onclick = function() {g_selectedColor = [ 1.0,0.0,0.0,1.0]; };
  document.getElementById('clearB').onclick = function() {g_shapesList = []; RenderShapes();};

  //buttons - pens
  document.getElementById('square').onclick = function() {g_selectedType = POINT};
  document.getElementById('tri').onclick = function() {g_selectedType = TRIANGLE};
  document.getElementById('cir').onclick = function() {g_selectedType = CIRCLE};

  //slider - color
  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });

  //slider - etc.
  document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });
  document.getElementById('segSlide').addEventListener('mouseup', function() { g_segmentSize = this.value; });

  //draw
  document.getElementById('drew').onclick = function() {g_shapesList = [];createPic();};

  //extra
  document.getElementById("applyColor").onclick = function() {HextoColor()};
}



// main
function main() {
    //startups
    setupWebGL();
    connectVariablesToGLSL();
    forHTML();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;

    //draw when holding down mouse
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev) }};
  
    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  

  //on click command
  function click(ev) {
    [x, y] = CoordtoGL(ev)  

    //call which class based on selected pens
    let point;
    if ( g_selectedType == POINT) {
      point = new Point();
    } else if ( g_selectedType == TRIANGLE) {
      point = new Triangle();
    } else {
      point = new Circle();
      //new setting for circle
      point.segments = g_segmentSize;
    }

    //setting position, color, size setting for our current point
    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;

    //add to list
    g_shapesList.push(point);

    RenderShapes() //render the point
  }
    
    
  //getting the coord
  function CoordtoGL(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
  
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return([x, y])
  }


  //renders our point
  function RenderShapes(){
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    var len = g_shapesList.length;

    for(var i = 0; i < len; i++) {
      g_shapesList[i].render();
    }
  }
  

  //convert hex code to our color code
  function HextoColor() {
    var hexInput = document.getElementById("hexInput").value.trim();
    // Convert hex to RGB
    var r = parseInt(hexInput.slice(1, 3), 16) / 255;
    var g = parseInt(hexInput.slice(3, 5), 16) / 255;
    var b = parseInt(hexInput.slice(5, 7), 16) / 255;

    // Update our global var
    g_selectedColor = [r, g, b, 1.0];
  } 


  //function to draw my painting
  function createPic(){
    //bg
    gl.uniform4f(u_FragColor, 0.96, 0.86, 0.83, 1.0);
    makeTriangle( [-1,-1,  -1,1,  1,1] );
    makeTriangle( [-1,-1,  1,-1,  1,1] );
    //eye white
    gl.uniform4f(u_FragColor, 0, 0, 0, 1);
    makeTriangle( [-0.62,-0.42,  -0.42,0.42,  -0.42,-0.42] );
    makeTriangle( [-0.42,0.42,  -0.42,-0.42,  0.42,0.42] );
    makeTriangle( [-0.42,-0.42,  0.42,0.42,  0.42,-0.42] );
    makeTriangle( [0.62,0.42,  0.42,0.42,  0.42,-0.42] );

    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    makeTriangle( [-0.6,-0.4,  -0.4,0.4,  -0.4,-0.4] );
    makeTriangle( [-0.4,0.4,  -0.4,-0.4,  0.4,0.4] );
    makeTriangle( [-0.4,-0.4,  0.4,0.4,  0.4,-0.4] );
    makeTriangle( [0.6,0.4,  0.4,0.4,  0.4,-0.4] );
    //iris
    gl.uniform4f(u_FragColor, 0, 0, 0, 1);
    makeTriangle( [-0.21,-0.21,  -0.21,0.21,  0.21,0.21] );
    makeTriangle( [-0.21,-0.21,  0.21,-0.21,  0.21,0.21] );

    gl.uniform4f(u_FragColor, 0.49, 0.96, 1, 1);
    makeTriangle( [-0.2,-0.2,  -0.2,0.2,  0.2,0.2] );
    makeTriangle( [-0.2,-0.2,  0.2,-0.2,  0.2,0.2] );
    
    //eyelash upper
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    makeTriangle( [-0.55,0.7,  -0.5,0.45,  -0.3,0.5] );
    makeTriangle( [-0.2,0.5,  -0.1,0.8,  0,0.5] );
    makeTriangle( [0.1,0.5,  0.2,0.8,  0.3,0.5] );
    makeTriangle( [0.4,0.5,  0.5,0.7,  0.55,0.5] );
    makeTriangle( [0.65,0.5,  0.8,0.55,  0.75,0.4] );
    //eyelash lower
    makeTriangle( [-0.5,-0.5,  -0.45,-0.6,  -0.4,-0.5] );
    makeTriangle( [-0.3,-0.5,  -0.2,-0.7,  -0.1,-0.5] );
    makeTriangle( [0,-0.5,  0.2,-0.7,  0.15,-0.5] );
    makeTriangle( [0.3,-0.5,  0.37,-0.6,  0.4,-0.5] );
    makeTriangle( [0.5,-0.45,  0.61,-0.47,  0.55,-0.4] );
    //iris detail
    //outer blue [0.12, 0.61, 1, 1]


    //innter blue [0.33, 0.9, 1, 1]
    gl.uniform4f(u_FragColor, 0.33, 0.83, 1, 1);
    makeTriangle( [-0.06,0.05,  -0.16,0.17,  -0.03,0.06] );
    makeTriangle( [-0.02,0.05,  -0.06,0.16,  -0.05,0.05] );
    makeTriangle( [-0.02,0.05,  0.01,0.2,  0.02,0.05] );
    makeTriangle( [0.02,0.05,  0.08,0.14,  0.05,0.05] );
    makeTriangle( [0.05,0.05,  0.18,0.18,  0.06,0] );

    makeTriangle( [0.05,0.02,  0.18,0,  0.05,-0.03] );
    makeTriangle( [0.05,-0.01,  0.14,-0.07,  0.05,-0.04] );

    makeTriangle( [0.06,-0.04,  0.09,-0.15,  0.02,-0.05] );
    makeTriangle( [0.02,-0.05,  -0.02,-0.2,  -0.02,-0.05] );
    makeTriangle( [-0.03,-0.05,  -0.1,-0.16,  -0.06,-0.05] );
    makeTriangle( [-0.03,-0.05,  -0.18,-0.17,  -0.08,-0.05] );

    makeTriangle( [-0.05,-0.05,  -0.15,-0.07,  -0.08,-0.03] );
    makeTriangle( [-0.05,-0.01,  -0.18,0.01,  -0.05,0.02] );
    makeTriangle( [-0.05,0.02,  -0.13,0.06,  -0.05,0.05] );


    //light blue [0.86, 0.99, 1, 1]
    gl.uniform4f(u_FragColor, 0.86, 0.99, 1, 1);
    makeTriangle( [0,0.05,  0.03,0.1,  0.05,0.05] );
    makeTriangle( [0,0.05,  0.1,0.09,  0.05,0.01] );
    makeTriangle( [0.05,0.05,  0.12,0.03,  0.05,-0.02] );
    makeTriangle( [0,-0.05,  0.09,-0.07,  0.05,0.01] );
    makeTriangle( [-0.04,0.05,  -0.03,0.11,  0.02,0.05] );

    makeTriangle( [0,-0.05,  -0.03,-0.1,  -0.05,-0.05] );
    makeTriangle( [-0,-0.05,  -0.1,-0.09,  -0.05,-0.01] );
    makeTriangle( [-0.05,-0.05,  -0.12,-0.03,  -0.05,0.02] );
    makeTriangle( [0,0.05,  -0.09,0.07,  -0.05,-0.01] );
    makeTriangle( [0.04,-0.05,  0.03,-0.11,  -0.02,-0.05] );
    //pupil
    gl.uniform4f(u_FragColor, 0, 0, 0, 1);
    makeTriangle( [-0.05,-0.05,  -0.05,0.05,  0.05,0.05] );
    makeTriangle( [-0.05,-0.05,  0.05,-0.05,  0.05,0.05] );
    
  } 


//References:
// https://stackoverflow.com/questions/21646738/convert-hex-to-rgba for converting hex code to our color code