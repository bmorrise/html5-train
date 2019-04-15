//[[5,0,8,0,3,null,null,null,null,null],[1,null,1,null,13,0,0,3,null,null],[1,5,12,null,1,null,5,2,null,null],[1,1,1,5,6,3,1,null,null,null],[13,6,11,1,1,4,2,null,null,null],[13,6,6,6,6,0,3,null,null,null],[4,6,6,6,6,0,6,3,null,null],[null,4,2,4,6,0,2,1,null,null],[null,null,5,0,11,null,null,1,null,null],[null,null,4,0,9,0,0,2,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null]]
window.onload = () => {
  const terrain = document.getElementById('canvas');
  const ctx = terrain.getContext('2d');

  const grid = document.getElementById('grid');
  const gctx = grid.getContext('2d');  

  const EDIT = 0;
  const PLAY = 1;
  const RAIL_COLOR = "#A9932F";
  const SQUARE_SIZE = 100;

  const LT = 0;
  const RT = 1;
  const LB = 2;
  const RB = 3;  

  var power = 0;
  var currentPieceX = null;
  var currentPieceY = null;
  var currentX = -1;
  var currentY = -1;
  var startX = 3;
  var startY = 0;  

  var mode = EDIT;
  var isMouseDown = false;
  var isDragging = false;
  var mouseX = -1;
  var mouseY = -1;

  var enginePlaced = false;
  var interval;

  var doTick = false;

  const tileXCount = Math.floor(window.innerWidth/SQUARE_SIZE) > 10 ? Math.floor(window.innerWidth/SQUARE_SIZE) : 10;
  const tileYCount = Math.floor(window.innerHeight/SQUARE_SIZE) > 10 ? Math.floor(window.innerHeight/SQUARE_SIZE) : 10;
  const terrainWidth = tileXCount * SQUARE_SIZE;
  const terrainHeight = tileYCount * SQUARE_SIZE;

  terrain.width = terrainWidth;
  terrain.height = terrainHeight;
  grid.width = terrainWidth;
  grid.height = terrainHeight;

  const Pieces = {
    VERTICAL: 0,
    HORIZONTAL: 1,    
    LT: 2,
    RT: 3,
    LB: 4,
    RB: 5,
    CROSS: 6,
    VERTICAL_LT: 7,
    VERTICAL_RT: 8,
    VERTICAL_LB: 9,
    VERTICAL_RB: 10,
    HORIZONTAL_LT: 11,
    HORIZONTAL_RT: 12,
    HORIZONTAL_LB: 13,
    HORIZONTAL_RB: 14
  }

  const TOTAL_PIECES = Object.keys(Pieces).length;  

  var saveText = document.createElement("input");
  document.body.append(saveText);
  saveText.style.display = "none";

  const clearGrid = () => {
    gctx.clearRect(0, 0, terrainWidth, terrainHeight);
  }

  const clearTerrain = () => {
    ctx.clearRect(0, 0, terrainWidth, terrainHeight);    
  }

  document.body.onkeydown = (e) => {
    if (e.keyCode == 84) {
      doTick = true;
    }
  }

  document.body.onkeyup = (e) => {
    if (e.keyCode == 84) {
      doTick = false;
    }

    if (e.keyCode == 38) {
      power = power < 200 ? power + 1 : power;
      e.stopPropagation();
      e.preventDefault();
    }
    if (e.keyCode == 40) {
      power = power > -200 ? power - 1 : power;
      e.stopPropagation();
      e.preventDefault();
    }   

    if (e.keyCode == 77) {
      clearGrid();
      clearTerrain();
      if (mode == EDIT) {
        mode = PLAY;   
        start();   
      } else {
        mode = EDIT;
        drawGrid();
      }
      render();
    }

    if (e.keyCode == 83) {
      var saveItems = new Array();
      for (var i = 0; i < renderItems.length; i++) {
        for (var j = 0; j < renderItems[i].length; j++) {
          if (!saveItems[i]) {
            saveItems[i] = new Array();
          }
          if (renderItems[i][j]) {
            saveItems[i][j] = renderItems[i][j].index;
          } else {
            saveItems[i][j] = null;
          }
        }
      }  
      
      saveText.style.display = "block";
      saveText.value = JSON.stringify(saveItems);
      setTimeout(function() {
        saveText.select();
        document.execCommand("copy");
        saveText.style.display = "none";
      });      
    }

    if (e.keyCode == 76) {
      var track = JSON.parse(prompt("Enter track data", ""));
      load(track);
    }
  }

  window.onkeydown = (e) => {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
  }

  const load = (track) => {
    if (track) {
      for (var i = 0; i < track.length; i++) {
        for (var j = 0; j < track[i].length; j++) {
          if (track[i][j] != null) {
            renderItems[i][j] = {
              piece: createPiece(track[i][j], i, j),
              index: track[i][j]
            }
          }
        }
      }
      render();
    }  
  }

  var renderItems = new Array();
  for (var i = 0; i < tileXCount; i++) {
    for (var j = 0; j < tileYCount; j++) {
      if (!renderItems[i]) {
        renderItems[i] = new Array();
      }      
      renderItems[i][j] = null;
    }
  }

  const pos = {
    centerY: (y) => { return y * SQUARE_SIZE + (SQUARE_SIZE / 2) },
    centerX: (x) => { return x * SQUARE_SIZE + (SQUARE_SIZE / 2) },
    left: (x) => { return x * SQUARE_SIZE },
    right: (x) => { return x * SQUARE_SIZE + SQUARE_SIZE },
    bottom: (y) => { return y * SQUARE_SIZE + SQUARE_SIZE },
    top: (y) => { return y * SQUARE_SIZE }
  };

  const getCurved = (piece, x, y) => {
    return {
      x: x,
      y: y,
      piece: piece,
      drawTrack: function(x, y, start, end) {
        const width = SQUARE_SIZE / 10;
        ctx.lineWidth = SQUARE_SIZE/(10/3);

        ctx.beginPath();
        ctx.strokeStyle = "#CACBCD";
        ctx.arc(x, y, SQUARE_SIZE/2, start, end);
        ctx.stroke();

        this.drawTies(x, y, start, end);

        ctx.beginPath();
        ctx.strokeStyle = RAIL_COLOR;
        ctx.lineWidth = 2;
        ctx.arc(x, y, SQUARE_SIZE/2-width/2, start, end);
        ctx.stroke();        

        ctx.beginPath();
        ctx.strokeStyle = RAIL_COLOR;
        ctx.lineWidth = 2;
        ctx.arc(x, y, SQUARE_SIZE/2+width/2, start, end);
        ctx.stroke();
      },
      drawTies: function(x, y, start, end) {
        const width = SQUARE_SIZE/(50/9);
        var spacing = Math.PI *.5 / (SQUARE_SIZE/(50/7));
        for (var i = start; i <= end; i+=spacing) {
          var x1 = Math.cos(i) * (SQUARE_SIZE/2 - width/2) + x;
          var y1 = Math.sin(i) * (SQUARE_SIZE/2 - width/2) + y;
          var x2 = Math.cos(i) * (SQUARE_SIZE/2 + width/2) + x;
          var y2 = Math.sin(i) * (SQUARE_SIZE/2 + width/2) + y;
          drawLine(x1, y1, x2, y2, "#000000", 2);
        } 
      },
      render: function(x, y, SQUARE_SIZE) {
        switch (this.piece) {
          case LT:
            this.drawTrack(pos.left(x), pos.top(y), 0, Math.PI*.5);
            break;
          case RT:
            this.drawTrack(pos.right(x), pos.top(y), Math.PI*.5, Math.PI);
            break;    
          case LB:
            this.drawTrack(pos.left(x), pos.bottom(y), Math.PI*1.5, Math.PI*2);
            break;  
          case RB:
            this.drawTrack(pos.right(x), pos.bottom(y), Math.PI, Math.PI*1.5);
            break;                                
        }
      },
      getEnd() {
        return 100;
      },
      move: function(vehicle, speed) {
        var start;
        var increment = Math.PI*.5/100;   
        switch (this.piece) {
          case LT:
            var centerX = pos.left(this.x);
            var centerY = pos.top(this.y);
            if (vehicle.rotation >= Math.PI*.5 && vehicle.rotation <= Math.PI) {
              var start = 0;
              var angle = start + increment * vehicle.position;
            } else {
              increment *= -1;
              var start = Math.PI*.5;
              var angle = start + increment * vehicle.position;
              start += Math.PI * .5;
            }
            var x = Math.ceil(Math.cos(angle) * 50 + centerX);
            var y = Math.ceil(Math.sin(angle) * 50 + centerY);
            var opposite = x - centerX;
            var adjacent = y - centerY;
            break;
          case RT:          
            var centerX = pos.right(this.x);
            var centerY = pos.top(this.y);       
            if (vehicle.rotation >= Math.PI && vehicle.rotation <= Math.PI*1.5) {
              var start = Math.PI * .5;
              var angle = start + increment * vehicle.position;
            } else {
              increment *= -1;
              var start = Math.PI;
              var angle = start + increment * vehicle.position;
              start += Math.PI * .5;
            }
            var x = Math.cos(angle) * 50 + centerX;
            var y = Math.sin(angle) * 50 + centerY;
            var adjacent = centerX - x;
            var opposite = y - centerY;            
            break;         
          case LB:
            var centerX = pos.left(this.x);
            var centerY = pos.bottom(this.y);
            if (vehicle.rotation == Math.PI*2) {
              vehicle.rotation = 0;
            }
            if (vehicle.rotation >= 0 && vehicle.rotation <= Math.PI*.5) {
              var start = Math.PI*1.5;
              var angle = start + increment * vehicle.position;
            } else {
              increment *= -1;
              var start = 0;
              var angle = start + increment * vehicle.position;
              start += Math.PI * .5;
            }
            var x = Math.cos(angle) * 50 + centerX;
            var y = Math.sin(angle) * 50 + centerY;
            var adjacent = x - centerX;
            var opposite = centerY - y;
            break;
          case RB:
            var centerX = pos.right(this.x);
            var centerY = pos.bottom(this.y);
            if (vehicle.rotation == 0 || (vehicle.rotation >= Math.PI*1.5 && vehicle.rotation <= Math.PI*2 )) {
              var start = Math.PI;
              var angle = start + increment * vehicle.position;              
            } else {
              increment *= -1;
              var start = Math.PI*1.5;
              var angle = start + increment * vehicle.position;
              start += Math.PI * .5;              
            }
            var x = Math.cos(angle) * 50 + centerX;
            var y = Math.sin(angle) * 50 + centerY;
            var opposite = centerX - x;
            var adjacent = centerY - y;
            break;
        }
        var rotation = Math.atan(adjacent/opposite);
        vehicle.x = Math.ceil(x);
        vehicle.y = Math.ceil(y);        
        var rotation = (rotation + start + Math.PI * .5);
        rotation = rotation <= Math.PI * 2 ? rotation : rotation % (Math.PI*2);
        vehicle.rotation = rotation;
        vehicle.position+=power>0?1:-1;
      }
    }
  }

  const getStraight = (direction, x, y) => {    
    return {
      x: x,
      y: y,
      direction: direction,
      drawBase: function(x1, y1, x2, y2) {
        drawLine(x1, y1, x2, y2, "#CACBCD", SQUARE_SIZE/(10/3));
      },
      drawRailsVertical: function(x1, y1, x2, y2) {
        const width = SQUARE_SIZE / 10;
        drawLine(x1+width/2, y1, x2+width/2, y2, RAIL_COLOR, 2);
        drawLine(x1-width/2, y1, x2-width/2, y2, RAIL_COLOR, 2);            
      },
      drawTiesVertical: function(x1, y1, x2, y2) {
        const spacing = SQUARE_SIZE / (SQUARE_SIZE / 5);
        const tieWidth = SQUARE_SIZE/(50/9);
        for (var i = 0; i <= SQUARE_SIZE; i+=spacing) {
          drawLine(x1-tieWidth/2, y1+i, x2+tieWidth/2, y2+i, "#000000", 2);
        }  
      },
      drawRailsHorizontal: function(x1, y1, x2, y2) {
        const width = SQUARE_SIZE / 10;
        drawLine(x1, y1+width/2, x2, y2+width/2, RAIL_COLOR, 2);
        drawLine(x1, y1-width/2, x2, y2-width/2, RAIL_COLOR, 2);
      },      
      drawTiesHorizontal: function(x1, y1, x2, y2) {
        const spacing = SQUARE_SIZE / (SQUARE_SIZE / 5);
        const tieWidth = SQUARE_SIZE/(50/9);
        for (var i = 0; i <= SQUARE_SIZE; i+=spacing) {
          drawLine(x1+i, y1-tieWidth/2, x2+i, y2+tieWidth/2, "#000000", 2);
        }          
      },
      render: function(x, y, size) {      
        switch (this.direction) {
          case Pieces.VERTICAL:
            this.drawBase(pos.centerX(x), pos.bottom(y), pos.centerX(x), pos.top(y));
            this.drawTiesVertical(pos.centerX(x), pos.top(y), pos.centerX(x), pos.top(y));  
            this.drawRailsVertical(pos.centerX(x), pos.bottom(y), pos.centerX(x), pos.top(y));
            break;
          case Pieces.HORIZONTAL:
            this.drawBase(pos.left(x), pos.centerY(y), pos.right(x), pos.centerY(y));
            this.drawTiesHorizontal(pos.left(x), pos.centerY(y), pos.left(x), pos.centerY(y));
            this.drawRailsHorizontal(pos.left(x), pos.centerY(y), pos.right(x), pos.centerY(y));
            break;
        }
      },
      getEnd() {
        return 100;
      },
      move: function(vehicle, speed) {
        const increment = Math.PI*.5*50/100;
        switch (this.direction) {
          case Pieces.HORIZONTAL:
            vehicle.y = pos.centerY(y);
            if (vehicle.rotation == Math.PI) {
              vehicle.x = 100 - vehicle.position + pos.left(x);
            } else {
              vehicle.x = vehicle.position + pos.left(x);
            }
            break;
          case Pieces.VERTICAL:
            if (vehicle.rotation == Math.PI * 1.5) {
              vehicle.y = 100 - vehicle.position + pos.top(y);
            } else {
              vehicle.y = vehicle.position + pos.top(y);
            }                      
            vehicle.x = pos.centerX(x);
            break;
        }
        vehicle.position+=power>0?increment:-increment;        
      }
    }    
  }

  const getSwitch = (direction, curve, x, y) => {
    return {
      direction: direction,
      curve: curve,
      x: x,
      y: y,
      switch: 1,
      drawStraightBase: function(x1, y1, x2, y2) {
        drawLine(x1, y1, x2, y2, "#CACBCD", SQUARE_SIZE/(10/3));
      },
      drawRailsVertical: function(x1, y1, x2, y2) {
        const width = SQUARE_SIZE / 10;
        drawLine(x1+width/2, y1, x2+width/2, y2, RAIL_COLOR, 2);
        drawLine(x1-width/2, y1, x2-width/2, y2, RAIL_COLOR, 2);            
      },
      drawTiesVertical: function(x1, y1, x2, y2) {
        const spacing = SQUARE_SIZE / (SQUARE_SIZE / 5);
        const tieWidth = SQUARE_SIZE/(50/9);
        for (var i = 0; i <= SQUARE_SIZE; i+=spacing) {
          drawLine(x1-tieWidth/2, y1+i, x2+tieWidth/2, y2+i, "#000000", 2);
        }  
      },
      drawRailsHorizontal: function(x1, y1, x2, y2) {
        const width = SQUARE_SIZE / 10;
        drawLine(x1, y1+width/2, x2, y2+width/2, RAIL_COLOR, 2);
        drawLine(x1, y1-width/2, x2, y2-width/2, RAIL_COLOR, 2);
      },      
      drawTiesHorizontal: function(x1, y1, x2, y2) {
        const spacing = SQUARE_SIZE / (SQUARE_SIZE / 5);
        const tieWidth = SQUARE_SIZE/(50/9);
        for (var i = 0; i <= SQUARE_SIZE; i+=spacing) {
          drawLine(x1+i, y1-tieWidth/2, x2+i, y2+tieWidth/2, "#000000", 2);
        }          
      },      
      drawBase: function(x, y, start, end) {
        ctx.lineWidth = SQUARE_SIZE/(10/3);
        ctx.beginPath();
        ctx.strokeStyle = "#CACBCD";
        ctx.arc(x, y, SQUARE_SIZE/2, start, end);
        ctx.stroke();
      },
      drawSwitchCurve: function(x, y, start, end) {
        ctx.beginPath();
        ctx.strokeStyle = "#454545";
        ctx.lineWidth = 6;
        ctx.arc(x, y, SQUARE_SIZE/2, start, end);
        ctx.stroke();
      },
      drawSwitchLine: function(x1, y1, x2, y2) {
        drawLine(x1, y1, x2, y2, "#454545", 7);
      },
      drawTrack: function(x, y, start, end) {
        const width = SQUARE_SIZE / 10;
        ctx.beginPath();
        ctx.strokeStyle = RAIL_COLOR;
        ctx.lineWidth = 2;
        ctx.arc(x, y, SQUARE_SIZE/2-width/2, start, end);
        ctx.stroke();        

        ctx.beginPath();
        ctx.strokeStyle = RAIL_COLOR;
        ctx.lineWidth = 2;
        ctx.arc(x, y, SQUARE_SIZE/2+width/2, start, end);
        ctx.stroke();
      },
      drawTies: function(x, y, start, end) {
        const width = SQUARE_SIZE/(50/9);
        var spacing = Math.PI *.5 / (SQUARE_SIZE/(50/7));
        for (var i = start; i <= end; i+=spacing) {
          var x1 = Math.cos(i) * (SQUARE_SIZE/2 - width/2) + x;
          var y1 = Math.sin(i) * (SQUARE_SIZE/2 - width/2) + y;
          var x2 = Math.cos(i) * (SQUARE_SIZE/2 + width/2) + x;
          var y2 = Math.sin(i) * (SQUARE_SIZE/2 + width/2) + y;
          drawLine(x1, y1, x2, y2, "#000000", 2);
        } 
      },
      drawCurve: function(x, y, start, end, offsetStart, offsetEnd) {
        this.drawBase(x, y, start, end);
        this.drawTies(x, y, start+offsetStart, end+offsetEnd);
        this.drawTrack(x, y, start, end);
      }, 
      render: function(x, y, size) {
        const spacing = SQUARE_SIZE / (SQUARE_SIZE / 5);
        const width = SQUARE_SIZE / 10;
        const tieWidth = SQUARE_SIZE/(50/9);        
        switch (this.direction) {
          case Pieces.VERTICAL:  
            this.drawStraightBase(pos.centerX(x), pos.bottom(y), pos.centerX(x), pos.top(y));          
            var args;
            switch (this.curve) {
              case 0:
                args = { x: pos.left(x), y: pos.top(y), start: 0, end: Math.PI*.5, oStart: Math.PI*.1, oEnd: 0 };
                break;
              case 1:
                args = { x: pos.right(x), y: pos.top(y), start: Math.PI*.5, end: Math.PI, oStart: 0, oEnd: -Math.PI*.1 };
                break;    
              case 2:
                args = { x: pos.left(x), y: pos.bottom(y), start: Math.PI*1.5, end: Math.PI*2, oStart: 0, oEnd: -Math.PI*.1 };
                break;  
              case 3:
                args = { x: pos.right(x), y: pos.bottom(y), start: Math.PI, end: Math.PI*1.5, oStart: Math.PI*.1, oEnd: 0 };
                break; 
            }
            this.drawCurve(args.x, args.y, args.start, args.end, args.oStart, args.oEnd);
            this.drawTiesVertical(pos.centerX(x), pos.top(y), pos.centerX(x), pos.top(y));
            this.drawRailsVertical(pos.centerX(x), pos.bottom(y), pos.centerX(x), pos.top(y));
            if (this.switch == 0) {
              this.drawSwitchCurve(args.x, args.y, args.start, args.end);
            } else {
              this.drawSwitchLine(pos.centerX(x), pos.bottom(y), pos.centerX(x), pos.top(y));
            }
            break;
          case Pieces.HORIZONTAL:
            this.drawStraightBase(pos.left(x), pos.centerY(y), pos.right(x), pos.centerY(y));
            var args;
            switch (this.curve) {
              case 0:
                args = { x: pos.left(x), y: pos.top(y), start: 0, end: Math.PI*.5, oStart: 0, oEnd: -Math.PI*.1 };
                break;
              case 1:
                args = { x: pos.right(x), y: pos.top(y), start: Math.PI*.5, end: Math.PI, oStart: Math.PI*.1, oEnd: 0 };
                break;    
              case 2:
                args = { x: pos.left(x), y: pos.bottom(y), start: Math.PI*1.5, end: Math.PI*2, oStart: Math.PI*.1, oEnd: 0 };
                break;  
              case 3:
                args = { x: pos.right(x), y: pos.bottom(y), start: Math.PI, end: Math.PI*1.5, oStart: 0, oEnd: -Math.PI*.1 };
                break; 
            }        
            this.drawCurve(args.x, args.y, args.start, args.end, args.oStart, args.oEnd);
            this.drawTiesHorizontal(pos.left(x), pos.centerY(y), pos.left(x), pos.centerY(y));
            this.drawRailsHorizontal(pos.left(x), pos.centerY(y), pos.right(x), pos.centerY(y));
            if (this.switch == 0) {
              this.drawSwitchCurve(args.x, args.y, args.start, args.end);
            } else {
              this.drawSwitchLine(pos.left(x), pos.centerY(y), pos.right(x), pos.centerY(y));
            }
            break;
        }
      },
      getEnd: function() {
        return 100;
      },
      move: function(vehicle, speed) {
        if (this.switch == 0) {
          // Switch is on curve
          if (power > 0) {
            if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*1.5 && this.curve == RT) {
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);
            } else if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == 0 && this.curve == RT) {
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);            
            } else if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*.5 && this.curve == LB) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);
            } else if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == Math.PI && this.curve == LB) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);                        
            } else if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == Math.PI && this.curve == LT) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);            
            } else if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*1.5 && this.curve == LT) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);
            } else if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*.5 && this.curve == RB) {                        
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);
            } else if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == 0 && this.curve == RB) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);                        
            } else {
              getCurved(this.curve, this.x, this.y).move(vehicle, speed);  
            } 
          } else {           
            if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*.5 && this.curve == RT) {
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);
            } else if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == Math.PI && this.curve == RT) {
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);            
            } else if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*1.5 && this.curve == LB) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);
            } else if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == 0 && this.curve == LB) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);                        
            } else if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == 0 && this.curve == LT) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);            
            } else if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*.5 && this.curve == LT) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);
            } else if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*1.5 && this.curve == RB) {                        
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);
            } else if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == Math.PI && this.curve == RB) {            
              getStraight(this.direction, this.x, this.y).move(vehicle, speed);                        
            } else {
              getCurved(this.curve, this.x, this.y).move(vehicle, speed);  
            }             
          }       
        } else {
          // Switch is on straight
          if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == Math.PI) {
            getStraight(this.direction, this.x, this.y).move(vehicle, speed);
          } else if (this.direction == Pieces.HORIZONTAL && vehicle.y == pos.centerY(this.y) && vehicle.rotation == 0) {
            getStraight(this.direction, this.x, this.y).move(vehicle, speed);
          } else if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*.5) {
            getStraight(this.direction, this.x, this.y).move(vehicle, speed);
          } else if (this.direction == Pieces.VERTICAL && vehicle.x == pos.centerX(this.x) && vehicle.rotation == Math.PI*1.5) {
            getStraight(this.direction, this.x, this.y).move(vehicle, speed);              
          } else {              
            getCurved(this.curve, this.x, this.y).move(vehicle, speed);
          }
        }
      }      
    }
  }

  const getCross = (x, y) => {    
    return {
      x: x,
      y: y,
      drawBase: function(x1, y1, x2, y2) {
        drawLine(x1, y1, x2, y2, "#CACBCD", SQUARE_SIZE/(10/3));
      },
      drawRailsVertical: function(x1, y1, x2, y2) {
        const width = SQUARE_SIZE / 10;
        drawLine(x1+width/2, y1, x2+width/2, y2, RAIL_COLOR, 2);
        drawLine(x1-width/2, y1, x2-width/2, y2, RAIL_COLOR, 2);            
      },
      drawTiesVertical: function(x1, y1, x2, y2) {
        const spacing = SQUARE_SIZE / (SQUARE_SIZE / 5);
        const tieWidth = SQUARE_SIZE/(50/9);
        for (var i = 0; i <= SQUARE_SIZE; i+=spacing) {
          drawLine(x1-tieWidth/2, y1+i, x2+tieWidth/2, y2+i, "#000000", 2);
        }  
      },
      drawRailsHorizontal: function(x1, y1, x2, y2) {
        const width = SQUARE_SIZE / 10;
        drawLine(x1, y1+width/2, x2, y2+width/2, RAIL_COLOR, 2);
        drawLine(x1, y1-width/2, x2, y2-width/2, RAIL_COLOR, 2);
      },      
      drawTiesHorizontal: function(x1, y1, x2, y2) {
        const spacing = SQUARE_SIZE / (SQUARE_SIZE / 5);
        const tieWidth = SQUARE_SIZE/(50/9);
        for (var i = 0; i <= SQUARE_SIZE; i+=spacing) {
          drawLine(x1+i, y1-tieWidth/2, x2+i, y2+tieWidth/2, "#000000", 2);
        }          
      },
      render: function(x, y, size) {         
        this.drawBase(pos.centerX(x), pos.bottom(y), pos.centerX(x), pos.top(y));
        this.drawBase(pos.left(x), pos.centerY(y), pos.right(x), pos.centerY(y));
        this.drawTiesVertical(pos.centerX(x), pos.top(y), pos.centerX(x), pos.top(y));              
        this.drawTiesHorizontal(pos.left(x), pos.centerY(y), pos.left(x), pos.centerY(y));
        this.drawRailsHorizontal(pos.left(x), pos.centerY(y), pos.right(x), pos.centerY(y));
        this.drawRailsVertical(pos.centerX(x), pos.bottom(y), pos.centerX(x), pos.top(y));            
      },
      getEnd() {
        return 100;
      },
      move: function(vehicle, speed) {
        const increment = Math.PI*.5*50/100;
        if (vehicle.rotation == Math.PI*2) {
          vehicle.rotation = 0;
        }
        if (vehicle.rotation == Math.PI) {
          vehicle.y = pos.centerY(y);
          vehicle.x = 100 - vehicle.position + pos.left(x);
        } else if (vehicle.rotation == 0) {
          vehicle.y = pos.centerY(y);
          vehicle.x = vehicle.position + pos.left(x);
        } else if (vehicle.rotation == Math.PI * 1.5) {
          vehicle.y = 100 - vehicle.position + pos.top(y);
        } else {
          vehicle.y = vehicle.position + pos.top(y);
        }
        vehicle.position+=power>0?increment:-increment;        
      }
    }   
  }

  const createPiece = (piece, x, y) => {
    switch (piece) {
      case Pieces.VERTICAL:
        return getStraight(Pieces.VERTICAL, x, y);
      case Pieces.HORIZONTAL:
        return getStraight(Pieces.HORIZONTAL, x, y);
      case Pieces.LT:
        return getCurved(0, x, y);
      case Pieces.RT:
        return getCurved(1, x, y);
      case Pieces.LB:
        return getCurved(2, x, y);
      case Pieces.RB:
        return getCurved(3, x, y);
      case Pieces.CROSS:
        return getCross(x, y);
      case Pieces.VERTICAL_LT:
        return getSwitch(Pieces.VERTICAL, 0, x, y);
      case Pieces.VERTICAL_RT:
        return getSwitch(Pieces.VERTICAL, 1, x, y);
      case Pieces.VERTICAL_LB:
        return getSwitch(Pieces.VERTICAL, 2, x, y);
      case Pieces.VERTICAL_RB:
        return getSwitch(Pieces.VERTICAL, 3, x, y);
      case Pieces.HORIZONTAL_LT:
        return getSwitch(Pieces.HORIZONTAL, 0, x, y);
      case Pieces.HORIZONTAL_RT:
        return getSwitch(Pieces.HORIZONTAL, 1, x, y);
      case Pieces.HORIZONTAL_LB:
        return getSwitch(Pieces.HORIZONTAL, 2, x, y);
      case Pieces.HORIZONTAL_RB:
        return getSwitch(Pieces.HORIZONTAL, 3, x, y);
    }
  }

  const drawLine = (x1, y1, x2, y2, color, lineWidth) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);            
    ctx.stroke();    
  }  

  const render = () => {
    for (var i = 0; i < renderItems.length; i++) {
      if (renderItems[i]) {
        for (var j = 0; j < renderItems[i].length; j++) {
          if (renderItems[i][j]) {
            renderItems[i][j].piece.render(i, j, SQUARE_SIZE);
          }
        }        
      }
    }    
  }

  const checkCenter = (x, y) => {
    var item = renderItems[x][y];
    if (item) {
      return item.index;
    }
    return null;
  }

  const checkLeft = (x, y) => {
    if (x > 0) {
      var item = renderItems[x-1][y];
      if (item) {
        return item.index;
      }
    }
    return null;
  }

  const checkBottom = (x, y) => {
    if (y < tileYCount - 1) {
      var item = renderItems[x][y+1];
      if (item) {
        return item.index;
      }
    }
    return null;
  }

  const checkRight = (x, y) => {
    if (x < tileXCount - 1) {
      var item = renderItems[x+1][y];
      if (item) {
        return item.index;
      }
    }
    return null;    
  }

  const checkTop = (x, y) => {
    if (y > 0) {
      var item = renderItems[x][y-1];
      if (item) {
        return item.index;
      }
    }
    return null;    
  }  

  const checkPiece = (x, y) => {
    var left = checkLeft(x, y);
    var bottom = checkBottom(x, y);
    var top = checkTop(x, y);
    var right = checkRight(x, y);
    var center = checkCenter(x, y);
    var index = 0;
    var leftHorizontal = left == Pieces.HORIZONTAL || left == Pieces.RT || left == Pieces.RB || left == Pieces.CROSS || left == Pieces.HORIZONTAL_LT || left == Pieces.HORIZONTAL_LB || left == Pieces.HORIZONTAL_RT || left == Pieces.HORIZONTAL_RB || left == Pieces.VERTICAL_RT || left == Pieces.VERTICAL_RB;
    var bottomVertical = bottom == Pieces.VERTICAL || bottom == Pieces.LT || bottom == Pieces.RT || bottom == Pieces.CROSS || bottom == Pieces.VERTICAL_LT || bottom == Pieces.VERTICAL_LB || bottom == Pieces.VERTICAL_RT || bottom == Pieces.VERTICAL_RB || bottom == Pieces.HORIZONTAL_LT || bottom == Pieces.HORIZONTAL_RT;
    var rightHorizontal = right == Pieces.HORIZONTAL || right == Pieces.LB || right == Pieces.LT || right == Pieces.CROSS || right == Pieces.HORIZONTAL_LT || right == Pieces.HORIZONTAL_LB || right == Pieces.HORIZONTAL_RT || right == Pieces.HORIZONTAL_RB || right == Pieces.VERTICAL_LT || right == Pieces.VERTICAL_LB;
    var topVertical = top == Pieces.VERTICAL || top == Pieces.RB || top == Pieces.LB || top == Pieces.CROSS || top == Pieces.VERTICAL_LT || top == Pieces.VERTICAL_LB || top == Pieces.VERTICAL_RT || top == Pieces.VERTICAL_RB || top == Pieces.HORIZONTAL_LB || top == Pieces.HORIZONTAL_RB;    
    if (leftHorizontal && rightHorizontal && topVertical && bottomVertical) {
      index = Pieces.CROSS;
    } else if (leftHorizontal && bottomVertical && topVertical) {
      if (center) {     
        if (center == Pieces.VERTICAL_LB) {
          index = Pieces.VERTICAL_LT;  
        } else {
          index = Pieces.VERTICAL_LB;
        }
      } else {
        index = Pieces.VERTICAL_LB;
      }
    } else if (rightHorizontal && bottomVertical && topVertical) {
      if (center) {     
        if (center == Pieces.VERTICAL_RB) {
          index = Pieces.VERTICAL_RT;  
        } else {
          index = Pieces.VERTICAL_RB;
        }
      } else {
        index = Pieces.VERTICAL_RB;
      }
    } else if (leftHorizontal && topVertical && rightHorizontal) {
      if (center) {     
        if (center == Pieces.HORIZONTAL_LT) {
          index = Pieces.HORIZONTAL_RT;  
        } else {
          index = Pieces.HORIZONTAL_LT;
        }
      } else {
        index = Pieces.HORIZONTAL_LT;
      }
    } else if (leftHorizontal && bottomVertical && rightHorizontal) {
      if (center) {     
        if (center == Pieces.HORIZONTAL_LB) {
          index = Pieces.HORIZONTAL_RB;  
        } else {
          index = Pieces.HORIZONTAL_LB;
        }
      } else {
        index = Pieces.HORIZONTAL_LB;
      }
    } else if (leftHorizontal && bottomVertical) {
      index = Pieces.LB;
    } else if (topVertical && leftHorizontal) {
      index = Pieces.LT;
    } else if (topVertical && rightHorizontal) {
      index = Pieces.RT;
    } else if (bottomVertical && rightHorizontal) {
      index = Pieces.RB;
    } else if ( rightHorizontal ) {
      index = Pieces.HORIZONTAL;
    } else if ( leftHorizontal ) {
      index = Pieces.HORIZONTAL;
    }
    if (index != -1) {
      var piece = createPiece(index, x, y);
      renderItems[x][y] = {
        index: index,
        piece: piece
      };
    }    
    return index;
  }

  const matchPiece = (oldX, oldY, newX, newY) => {
    var index = 1;
    if (!renderItems[newX]) {
      renderItems[newX] = new Array();      
    }
    if (newY != oldY) {
      index = Pieces.VERTICAL;
    }
    if (newX != oldX) {
      index = Pieces.HORIZONTAL;
    }
    var piece = createPiece(index, newX, newY);
    renderItems[newX][newY] = {
      index: index,
      piece: piece
    };
    checkPiece(oldX, oldY);
    checkPiece(newX, newY);
    var tile = getTile(oldX, oldY);
    if (tile != null) {
      clearPiece(oldX, oldY);
      tile.piece.render(oldX, oldY);      
    }
    var tile = getTile(newX, newY);
    if (tile != null) {
      clearPiece(newX, newY);
      tile.piece.render(newX, newY);
    }        
  }

  canvas.onmousemove = (e) => {
    var tileX = Math.floor(e.pageX / SQUARE_SIZE) * SQUARE_SIZE;
    var tileY = Math.floor(e.pageY / SQUARE_SIZE) * SQUARE_SIZE;
    const pieceX = tileX/SQUARE_SIZE;
    const pieceY = tileY/SQUARE_SIZE;    
    if (tileX != currentX) {
      if (isDragging) {
        if (e.shiftKey) {
          renderItems[pieceX][pieceY] = null;
          clearPiece(pieceX, pieceY);
        } else {
          matchPiece(currentX/SQUARE_SIZE, currentY/SQUARE_SIZE, tileX/SQUARE_SIZE, tileY/SQUARE_SIZE);
        }             
      }      
      currentX = tileX;
    }
    if (tileY != currentY) {
      if (isDragging) {
        if (e.shiftKey) {
          renderItems[pieceX][pieceY] = null;
          clearPiece(pieceX, pieceY);
        } else {        
          matchPiece(currentX/SQUARE_SIZE, currentY/SQUARE_SIZE, tileX/SQUARE_SIZE, tileY/SQUARE_SIZE);
        }
      }      
      currentY = tileY;
    }
    if (mode == EDIT && isMouseDown == true && isDragging == false) {
       if (Math.abs(mouseX-e.pageX) > 10 || Math.abs(mouseY-e.pageY) > 10 ) {
         isDragging = true;
       }
    }
    if (mode == EDIT && (pieceX != currentPieceX || pieceY != currentPieceY)) {
      if (currentPieceX != null && currentPieceY != null) {
        const oldTile = getTile(currentPieceX, currentPieceY);
        clearPiece(currentPieceX, currentPieceY);
        if (oldTile != null) {          
          oldTile.piece.render(currentPieceX, currentPieceY);
        }
      }
      const tile = getTile(pieceX, pieceY);
      clearPiece(pieceX, pieceY);
      if (tile != null) {
        tile.piece.render(pieceX, pieceY);
      }
      ctx.beginPath();
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#00000022";
      ctx.lineWidth = 2;
      ctx.rect(currentX + 2, currentY + 2, SQUARE_SIZE - 4, SQUARE_SIZE - 4);
      ctx.fillRect(currentX + 2, currentY + 2, SQUARE_SIZE - 4, SQUARE_SIZE - 4);
      ctx.stroke(); 
      currentPieceX = pieceX;
      currentPieceY = pieceY;
    }    
  }
  canvas.onmousedown = (e) => {
    isMouseDown = true;
    if (mouseX == -1 && mouseY == -1) {
      mouseX = e.pageX;
      mouseY = e.pageY;
    }
    var tileX = Math.floor(e.pageX / SQUARE_SIZE);
    var tileY = Math.floor(e.pageY / SQUARE_SIZE);
    if (mode == EDIT) {
      if (e.shiftKey) {
        renderItems[tileX][tileY] = null;
        clearPiece(tileX, tileY);
        return;
      }
      checkPiece(tileX, tileY);      
      const tile = getTile(tileX, tileY);
      clearPiece(tileX, tileY);
      tile.piece.render(tileX, tileY);
    } else {
      if (enginePlaced) {
        var tile = getTile(tileX, tileY);
        if (!carInTile(tileX, tileY)) {
          if (tile.piece && tile.piece.switch != null) {
            tile.piece.switch = tile.piece.switch == 1 ? 0 : 1;
            clearPiece(tileX, tileY);
            tile.piece.render(tileX, tileY);     
          }        
        }        
      } else {
        placeEngine(tileX, tileY);
      }
    }  
  }
  canvas.onmouseup = (e) => {
    isMouseDown = false;
    if (isDragging) {
      mouseX = -1;
      mouseY = -1;
      isDragging = false;
    }
  }

  const getTile = (x, y) => {
    return renderItems[x][y];
  }

  const carInTile = (tileX, tileY) => {
    const engineTileX = Math.floor(engine.x / SQUARE_SIZE);
    const engineTileY = Math.floor(engine.y / SQUARE_SIZE);
    if (engineTileX == tileX && engineTileY == tileY) {
      return true;
    }
    for (var i = 0; i < cars.length; i++) {
      const carTileX = Math.floor(cars[i].x / SQUARE_SIZE);
      const carTileY = Math.floor(cars[i].y / SQUARE_SIZE);
      if (carTileX == tileX && carTileY == tileY) {
        return true;
      }
    }
    return false;
  }

  const getTileByXY = (x, y) => {
    const tileX = Math.floor(x / SQUARE_SIZE);
    const tileY = Math.floor(y / SQUARE_SIZE);
    return renderItems[tileX][tileY];
  }

  const drawGrid = () => {
    for (var i = 0; i < tileXCount; i++) {
      for (var j = 0; j < tileYCount; j++) {
        gctx.rect(i * SQUARE_SIZE, j * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
        gctx.stroke();
      }
    }
  }

  function roundNum(num, number){
    return Math.round(num / number)*number;
  }

  const createBillow = (x, y) => {
    return {
      x: x + Math.random() * 5 * (Math.random() > .5 ? -1 : 1),
      y: y + Math.random() * 5 * (Math.random() > .5 ? -1 : 1),
      radius: 2,
      opacity: .1,
      update: function() {
        this.radius += Math.random() * .1;
        this.opacity -= .0001;
        if (this.radius > 8) {
          var index = billows.indexOf(this);
          billows.splice(index, 1);
        }
      },
      render: function() {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, '+this.opacity+')';
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  var billows = [];

  const createEngine = () => {
    return {
      rotation: 0,
      position: 0,
      x: -1,
      y: -1,
      tile: null,
      fromTop: false,
      fromRight: false,
      fromBottom: false,
      fromLeft: false,    
      render: function() {
        ctx.save()
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        const width = SQUARE_SIZE/5;

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#787878";
        ctx.moveTo(10, -9);
        ctx.lineTo(26, -9);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#787878";
        ctx.moveTo(10, 9);
        ctx.lineTo(26, 9);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = "#232323";
        ctx.fillRect(-20, -9, 20, 18);

        ctx.beginPath();
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, -8, 30, 16);

        ctx.beginPath();
        ctx.arc(-21, 0, 2, 0, Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "#787878";
        ctx.arc(10, 0, 3, 0, Math.PI*2);            
        ctx.fill();

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#454545";
        ctx.arc(24, 0, 5, 0, Math.PI*2);      
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.arc(24, 0, 3, 0, Math.PI*2);
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = "#787878";
        ctx.arc(24, 0, 3, 0, Math.PI*2);      
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = "#343434";
        ctx.moveTo(31, 8);
        ctx.lineTo(40, 0);
        ctx.lineTo(31, -8);
        ctx.lineTo(31, 8);      
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "#000000";
        ctx.fillRect(30, -5, 2, 10);      

        ctx.beginPath();
        ctx.strokeStyle = "#787878";
        ctx.moveTo(31, 0);
        ctx.lineTo(40, 0);
        ctx.stroke();

        ctx.restore();
      }     
    }
  }

  const createCar = () => {
    return {
      rotation: 0,
      x: -1,
      y: -1,
      tile: null,
      fromTop: false,
      fromRight: false,
      fromBottom: false,
      fromLeft: false,
      render: function() {
        ctx.save()
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        const width = SQUARE_SIZE/5;
        ctx.beginPath();
        ctx.fillStyle = "#000000";
        ctx.fillRect(-15, -8, 30, 16);
        ctx.arc(-17, 0, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.arc(17, 0, 2, 0, Math.PI*2);
        ctx.fill();  

        ctx.beginPath();
        ctx.strokeStyle = "#787878";
        ctx.lineWidth = 2;
        ctx.rect(-15, -8, 30, 16);
        ctx.stroke();

        ctx.restore();
      }
    }
  }

  var engine = createEngine();
  var cars = [];
  cars.push(createCar());
  cars.push(createCar());
  cars.push(createCar());
  cars.push(createCar());
  cars.push(createCar());
  cars.push(createCar());
  cars.push(createCar());
  const placeEngine = (startX, startY) => {
    engine.position = 50;
    engine.rotation = Math.PI;
    engine.x = pos.centerX(startX);
    engine.y = pos.centerY(startY);
    for (var i = 0; i < cars.length; i++) {
      cars[i].x = engine.x;
      cars[i].y = engine.y;
      cars[i].position = engine.position;
      cars[i].rotation = Math.PI;
    }
    for (var i = 0; i < cars.length; i++) {  
      for (var j = 0; j < (i + 1) * 50 + 5; j++) {
        tick(cars[i], 1);     
      }      
    }
    enginePlaced = true;
    engine.render();    
    tick(engine, 0);
    for (var i = 0; i < cars.length; i++) {
      cars[i].render();
    }    
  }

  const start = () => {
    interval = setInterval(function() {
      if (enginePlaced) {
        for (var i = 0; i < renderItems.length; i++) {
          for (var j = 0; j < renderItems[i].length; j++) {
            renderPieces(i, j);
          }
        }
        for (var i = 0; i < 3; i++) {
          billows.push(createBillow(engine.x+Math.cos(engine.rotation)*27, engine.y+Math.sin(engine.rotation)*27));
        }    
        for (var i = 0; i < billows.length; i++) {
          billows[i].update();
        }
        engine.render();
        for (var i = 0; i < cars.length; i++) {
          if (mode == PLAY) {
            for (var j = 0; j < Math.abs(power); j++) {
              tick(cars[i], 1);
            }
          }
          cars[i].render();
        }        
        if (mode == PLAY) {
          for (var i = 0; i < Math.abs(power); i++) {
            // if (doTick) {
              tick(engine, 1);            
            // }
          }
        }       
        for (var i = 0; i < billows.length; i++) {
          billows[i].render();
        }  
      }  
    }, 10);     
  }

  const clearPiece = (x, y) => {
    ctx.clearRect(x*SQUARE_SIZE, y*SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
  }

  const renderPieces = (x, y) => {   
    const tile = getTile(x, y);
    if (tile != null) {
      clearPiece(x, y);
      tile.piece.render(x, y);
    }   
  }

  const scan = (vehicle, distance) => {
    var scanX = Math.cos(vehicle.rotation) * distance + vehicle.x;
    var scanY = Math.sin(vehicle.rotation) * distance + vehicle.y;
    return getTileByXY(scanX, scanY);
  }

  tick = (vehicle, speed) => {
    if (vehicle.currentTile == null) {
      vehicle.currentTile = scan(vehicle, 1);
    }
    if (vehicle.currentTile != null) {
      if (vehicle.rotation == Math.PI*2) {
        vehicle.rotation = 0;
      }      
      vehicle.currentTile.piece.move(vehicle, speed);      
      if (vehicle.position>vehicle.currentTile.piece.getEnd()) {
        vehicle.currentTile = scan(vehicle, 10);
        vehicle.position = 0;
      }
      if (vehicle.position<0) {
        vehicle.currentTile = scan(vehicle, -10);
        vehicle.position = vehicle.currentTile.piece.getEnd();
      }
    }
  }

  load([[null,5,0,0,8,0,0,3,null,null],[5,2,null,null,13,0,0,11,null,null],[13,0,3,null,4,0,3,1,null,null],[1,null,1,null,null,null,13,12,null,null],[14,0,2,null,null,null,1,1,null,null],[1,5,0,0,3,5,2,1,null,null],[4,6,0,0,2,1,null,1,null,null],[null,1,null,null,null,14,0,2,null,null],[null,13,0,3,5,11,null,null,null,null],[null,1,null,4,2,1,null,null,null,null],[null,4,0,0,0,2,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null]]);
  placeEngine(3, 0);
  mode = PLAY;
  clearGrid();
  start();
  power = 1;
}