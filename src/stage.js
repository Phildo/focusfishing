var Stage = function(init)
{
  var self = this;

  self.container = init.container;
  self.dpr = init.dpr;
  if(!self.dpr) self.dpr = window.devicePixelRatio;
  if(!self.dpr) self.dpr = 1;

  self.canvas = document.createElement('canvas');
  self.canvas.style.position = "absolute";
  self.canvas.style.top = "0px";
  self.canvas.style.left = "0px";

  if(init.webgl)
  {
    self.webgl = 1;
    self.webgl_canvas = document.createElement("canvas");
    self.webgl_canvas.style.position = "absolute";
    self.webgl_canvas.style.top = "0px";
    self.webgl_canvas.style.left = "0px";
  }

  self.resize = function(width,height)
  {
    self.width = width;
    self.height = height;

    self.canvas.width  = floor(self.width *self.dpr);
    self.canvas.height = floor(self.height*self.dpr);
    self.canvas.style.width = self.width+"px";
    self.canvas.style.height = self.height+"px";
    self.s_mod = (self.canvas.width < self.canvas.height ? self.canvas.width : self.canvas.height)/660;

    if(self.webgl)
    {
      self.webgl_canvas.width = self.canvas.width;
      self.webgl_canvas.height = self.canvas.height;
      self.webgl_canvas.style.width = self.width+"px";
      self.webgl_canvas.style.height = self.height+"px";
      if(self.webgl_canvas.context)
      {
        self.webgl_canvas.context.viewport(0, 0, self.webgl_canvas.width, self.webgl_canvas.height);
        self.webgl_canvas.context.uniform2f(self.webgl_canvas.viewport_unif, self.webgl_canvas.width, self.webgl_canvas.height);
      }
    }
  }
  self.resize(init.width,init.height);

  self.context = self.canvas.getContext('2d');//,{alpha:false});
  self.context.imageSmoothingEnabled = init.smoothing;
  if(self.webgl)
  {
    document.getElementById(self.container).appendChild(self.webgl_canvas);
    initGL(self.webgl_canvas);
  }
  document.getElementById(self.container).appendChild(self.canvas);
};

function initGL(canvas)
{
  canvas.context = canvas.getContext("webgl");
  var ctx = canvas.context;

  var vs_source = `
    attribute vec2 position;
    uniform vec2 viewport;
    uniform vec4 transform;
    void main(void)
    {
      vec2 p = position;
      p.x = (((position.x*transform.z)+transform.x)/ viewport.x)*2.0-1.0;
      p.y = (((position.y*transform.w)+transform.y)/-viewport.y)*2.0+1.0;
      gl_Position = vec4(p, 0.0, 1.0);
    }
  `;

  var vs = ctx.createShader(ctx.VERTEX_SHADER);
  ctx.shaderSource(vs, vs_source);
  ctx.compileShader(vs);
  if(!ctx.getShaderParameter(vs, ctx.COMPILE_STATUS)) console.log(ctx.getShaderInfoLog(vs));

  var fs_source = `
    precision mediump float;
    void main(void)
    {
      gl_FragColor = vec4(0.5, 1.0, 1.0, 1.0);
    }
  `;

  var fs = ctx.createShader(ctx.FRAGMENT_SHADER);
  ctx.shaderSource(fs, fs_source);
  ctx.compileShader(fs);
  if(!ctx.getShaderParameter(fs, ctx.COMPILE_STATUS)) console.log(ctx.getShaderInfoLog(fs));

  var p = ctx.createProgram();
  ctx.attachShader(p, vs);
  ctx.attachShader(p, fs);
  ctx.linkProgram(p);
  if(!ctx.getProgramParameter(p, ctx.LINK_STATUS)) console.log("couldn't link");

  ctx.useProgram(p);

  var position_attrib = ctx.getAttribLocation(p, "position");
  ctx.enableVertexAttribArray(position_attrib);
  canvas.viewport_unif = ctx.getUniformLocation(p, "viewport");
  canvas.transform_unif = ctx.getUniformLocation(p, "transform");

  var position_buff = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, position_buff);
  var vertices = [
       0.0,  0.0,
       1.0,  0.0,
       0.0,  1.0,
       1.0,  1.0,
  ];
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW);
  var position_buff_item_size = 2;
  var position_buff_num_items = 4;

  ctx.clearColor(1.0, 1.0, 1.0, 0.0);
  ctx.enable(ctx.DEPTH_TEST);

  ctx.viewport(0, 0, canvas.width, canvas.height);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

  ctx.bindBuffer(ctx.ARRAY_BUFFER, position_buff);
  ctx.vertexAttribPointer(position_attrib, position_buff_item_size, ctx.FLOAT, false, 0, 0);
  ctx.uniform2f(canvas.viewport_unif, canvas.width, canvas.height);
  ctx.uniform4f(canvas.transform_unif, 0,0,100,100);
  ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, position_buff_num_items);
}

