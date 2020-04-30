var GamePlayScene = function()
{
  var self = this;

  var clicker;
  var keyer;

  var ENUM = 0;

  ENUM = 0;
  var CAST_STATE_READY = ENUM; ENUM++;
  var CAST_STATE_CAST  = ENUM; ENUM++;
  var CAST_STATE_WATER = ENUM; ENUM++;
  var CAST_STATE_REEL  = ENUM; ENUM++;
  var CAST_STATE_MISS  = ENUM; ENUM++;

  ENUM = 0;
  var FISH_STATE_SPAWN    = ENUM; ENUM++;
  var FISH_STATE_IDLE     = ENUM; ENUM++;
  var FISH_STATE_WAIT     = ENUM; ENUM++;
  var FISH_STATE_APPROACH = ENUM; ENUM++;
  var FISH_STATE_BITE     = ENUM; ENUM++;
  var FISH_STATE_HOOKED   = ENUM; ENUM++;
  var FISH_STATE_SCARED   = ENUM; ENUM++;

  var t_fish_spawn = 100;
  var t_fish_scared = 100;
  var max_fish_distance = 100;

  var streak = 0;

  var cast_state = CAST_STATE_READY;
  var cast_state_t = 0;

  var fish_state = FISH_STATE_SPAWN;
  var fish_state_t = 0;
  var fish_wait_t = 0;
  var fish_distance = floor(rand()*max_fish_distance);

  var cur_fish = 0;

  var fish = function()
  {
    var self = this;
      
    self.x = 0;
    self.y = 0;
    self.r = 0;
  };

  self.resize = function()
  {
    if(clicker) clicker.detach(); clicker = new Clicker({source:gg.canvas});
    if(keyer)   keyer.detach();   keyer   = new Keyer({source:gg.canvas});

    gg.cam = {wx:0,wy:0,ww:gg.canvas.width,wh:gg.canvas.height};
    var wm = gg.canvas.width/660;
    var hm = gg.canvas.height/660;
    gg.s_mod = wm < hm ? wm : hm;
  }

  self.ready = function()
  {
    self.resize();
  };

  var t_mod_twelve_pi = 0;
  self.tick = function()
  {
    t_mod_twelve_pi += 0.01;
    if(t_mod_twelve_pi > twelvepi) t_mod_twelve_pi -= twelvepi;

    var hit = (clicker.hit() || keyer.anykey_down());

    if(!cur_fish)
    {
      cur_fish = new fish();
    }

    cast_state_t++;
    fish_state_t++;

    switch(cast_state)
    {
      case CAST_STATE_READY:
      {
        if(hit)
        {
          cast_state = CAST_STATE_CAST;
          cast_state_t = 0;
        }
      }
        break;
      case CAST_STATE_CAST:
      {
        if(cast_state_t > 100)
        {
          cast_state = CAST_STATE_WATER;
          cast_state_t = 0;
        }
      }
        break;
      case CAST_STATE_WATER:
      {
        if(hit)
        {
          if(fish_state == FISH_STATE_BITE)
            cast_state = CAST_STATE_REEL;
          else
            cast_state = CAST_STATE_MISS;
          cast_state_t = 0;
        }
      }
        break;
      case CAST_STATE_REEL:
      {
        if(cast_state_t > 100)
        {
          cast_state = CAST_STATE_READY;
          cast_state_t = 0;
        }
      }
        break;
      case CAST_STATE_MISS:
      {
        if(cast_state_t > 100)
        {
          cast_state = CAST_STATE_READY;
          cast_state_t = 0;
        }
      }
        break;
    }

    switch(fish_state)
    {
      case FISH_STATE_SPAWN:
      {
        if(fish_state_t > t_fish_spawn)
        {
          fish_state = FISH_STATE_IDLE;
          fish_state_t = 0;
        }
      }
        break;
      case FISH_STATE_IDLE:
      {
        if(cast_state == CAST_STATE_WATER)
        {
          fish_state = FISH_STATE_WAIT;
          fish_state_t = 0;
          fish_wait_t = 10+floor(rand()*100);
        }
      }
        break;
      case FISH_STATE_WAIT:
      {
        fish_distance += min(1,1/fish_distance*10);
        fish_wait_t--;
        if(hit)
        {
          fish_state = FISH_STATE_SCARED;
          fish_state_t = 0;
        }
        else if(fish_wait_t <= 0)
        {
          fish_state = FISH_STATE_APPROACH;
          fish_state_t = 0;
        }
      }
        break;
      case FISH_STATE_APPROACH:
      {
        fish_distance--;
        if(hit)
        {
          fish_state = FISH_STATE_SCARED;
          fish_state_t = 0;
        }
        else if(fish_distance <= 0)
        {
          fish_distance = 1;
          if(rand() < 0.5)
            fish_state = FISH_STATE_BITE;
          else
          {
            fish_state = FISH_STATE_WAIT;
            fish_wait_t = 10+floor(rand()*100);
          }
          fish_state_t = 0;
        }
      }
        break;
      case FISH_STATE_BITE:
      {
        if(hit)
        {
          fish_state = FISH_STATE_HOOKED;
          fish_state_t = 0;
        }
        else if(fish_state_t > 100)
        {
          fish_state = FISH_STATE_SCARED;
          fish_state_t = 0;
        }
      }
        break;
      case FISH_STATE_HOOKED:
      {
        if(fish_state_t > 100)
        {
          streak++;
          fish_state = FISH_STATE_SPAWN;
          fish_distance = floor(rand()*max_fish_distance);
          fish_state_t = 0;
        }
      }
        break;
      case FISH_STATE_SCARED:
      {
        if(fish_state_t > t_fish_scared)
        {
          streak = 0;
          fish_state = FISH_STATE_SPAWN;
          fish_distance = floor(rand()*max_fish_distance);
          fish_state_t = 0;
        }
      }
        break;
    }

    
    clicker.flush();
    keyer.flush();
  };

  self.draw = function()
  {
    var w = gg.canvas.width;
    var h = gg.canvas.height;

    gg.ctx.fillStyle = white;
    gg.ctx.clearRect(0, 0, w, h);

    gg.ctx.fillStyle = black;
    gg.ctx.font = "20px Arial";

    switch(fish_state)
    {
      case FISH_STATE_SPAWN:
      {
        gg.ctx.fillText("spawn",20,40);
        gg.ctx.globalAlpha = fish_state_t/t_fish_spawn;
        gg.ctx.fillStyle = black;
        fillCircle(gg.canvas.width/2+fish_distance*gg.s_mod,gg.canvas.height/2,10*gg.s_mod,gg.ctx);
        gg.ctx.globalAlpha = 1;
      }
        break;
      case FISH_STATE_IDLE:
      {
        gg.ctx.fillText("idle",20,40);
        gg.ctx.fillStyle = black;
        fillCircle(gg.canvas.width/2+fish_distance*gg.s_mod,gg.canvas.height/2,10*gg.s_mod,gg.ctx);
      }
        break;
      case FISH_STATE_WAIT:
      {
        gg.ctx.fillText("wait",20,40);
        gg.ctx.fillStyle = black;
        fillCircle(gg.canvas.width/2+fish_distance*gg.s_mod,gg.canvas.height/2,10*gg.s_mod,gg.ctx);
      }
        break;
      case FISH_STATE_APPROACH:
      {
        gg.ctx.fillText("approach",20,40);
        gg.ctx.fillStyle = black;
        fillCircle(gg.canvas.width/2+fish_distance*gg.s_mod,gg.canvas.height/2,10*gg.s_mod,gg.ctx);
      }
        break;
      case FISH_STATE_BITE:
      {
        gg.ctx.fillText("bite",20,40);
        gg.ctx.fillStyle = black;
        fillCircle(gg.canvas.width/2+fish_distance*gg.s_mod,gg.canvas.height/2,10*gg.s_mod,gg.ctx);
      }
        break;
      case FISH_STATE_HOOKED:
      {
        gg.ctx.fillText("hooked",20,40);
        gg.ctx.fillStyle = black;
        fillCircle(gg.canvas.width/2+fish_distance*gg.s_mod,gg.canvas.height/2,10*gg.s_mod,gg.ctx);
      }
        break;
      case FISH_STATE_SCARED:
      {
        gg.ctx.fillText("scared",20,40);
        gg.ctx.globalAlpha = 1-(fish_state_t/t_fish_scared);
        gg.ctx.fillStyle = black;
        fillCircle(gg.canvas.width/2+fish_distance*gg.s_mod,gg.canvas.height/2,10*gg.s_mod,gg.ctx);
        gg.ctx.globalAlpha = 1;
      }
        break;
    }

    gg.ctx.fillStyle = black;

    switch(cast_state)
    {
      case CAST_STATE_READY:
      {
        gg.ctx.fillText("ready",20,20);
        gg.ctx.strokeStyle = brown;
        gg.ctx.lineWidth = 3*gg.s_mod;
        drawLine(
          gg.canvas.width/2-300*gg.s_mod, gg.canvas.height/2,
          gg.canvas.width/2-200*gg.s_mod, gg.canvas.height/2-100*gg.s_mod,
          gg.ctx);
      }
      break;
      case CAST_STATE_CAST:
      {
        gg.ctx.fillText("cast",20,20);
        gg.ctx.strokeStyle = brown;
        gg.ctx.lineWidth = 3*gg.s_mod;
        drawLine(
          gg.canvas.width/2-300*gg.s_mod, gg.canvas.height/2,
          gg.canvas.width/2-100*gg.s_mod, gg.canvas.height/2-100*gg.s_mod,
          gg.ctx);
      }
      break;
      case CAST_STATE_WATER:
      {
        gg.ctx.fillText("water",20,20);
        gg.ctx.strokeStyle = brown;
        gg.ctx.lineWidth = 3*gg.s_mod;
        drawLine(
          gg.canvas.width/2-300*gg.s_mod, gg.canvas.height/2,
          gg.canvas.width/2-50 *gg.s_mod, gg.canvas.height/2-75*gg.s_mod,
          gg.ctx);
        gg.ctx.fillStyle = red;
        fillCircle(gg.canvas.width/2, gg.canvas.height/2, 5*gg.s_mod, gg.ctx);
      }
      break;
      case CAST_STATE_REEL:
      {
        gg.ctx.fillText("reel",20,20);
        gg.ctx.strokeStyle = brown;
        gg.ctx.lineWidth = 3*gg.s_mod;
        drawLine(
          gg.canvas.width/2-300*gg.s_mod, gg.canvas.height/2,
          gg.canvas.width/2-50 *gg.s_mod, gg.canvas.height/2-150*gg.s_mod,
          gg.ctx);
      }
      break;
      case CAST_STATE_MISS:
      {
        gg.ctx.fillText("miss",20,20);
        gg.ctx.strokeStyle = brown;
        gg.ctx.lineWidth = 3*gg.s_mod;
        drawLine(
          gg.canvas.width/2-300*gg.s_mod, gg.canvas.height/2,
          gg.canvas.width/2-50 *gg.s_mod, gg.canvas.height/2-300*gg.s_mod,
          gg.ctx);
      }
      break;
    }

    gg.ctx.fillText(fish_state_t,  20, 60);
    gg.ctx.fillText(fish_distance, 20, 80);
    gg.ctx.fillText(fish_wait_t,   20, 100);


    gg.ctx.fillText(streak, gg.canvas.width/2, 20);
  };

  self.cleanup = function()
  {
    if(clicker) clicker.detach(); clicker = null;
    if(keyer)   keyer.detach();   keyer   = null;
  };

};

