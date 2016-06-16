
// initialize jcarousel frames
function init_frames() {
  var jc = function(str){ return $('.variants').jcarousel(str); };
  var transition = function (forward) {
    data.viewed = data.viewed + 1; // @BENCH
    // stop current sim, start next sim
    var currIdx = jc('items').index(jc('first'));
    var oldFrame = $(jc('items')[currIdx]).children('iframe')[0];
    // index is for old frame
    // we're going to the right...
    if (forward && (currIdx < jc('items').length - 1)) {
      currIdx += 1;
    } else if (!forward && currIdx > 0) {
      // we're going to the left
      currIdx -= 1;
    }

    var nextFrame = $(jc('items')[currIdx]).children('iframe')[0];

    // we're either learning interactions, or learning physics configurations.
    if (learningInteractions) {
      // if the former, call start/stop display.
      oldFrame.contentWindow['stopDisplay']();
      nextFrame.contentWindow['startDisplay']();
    } else {
      // if the latter, stop and reset the old frame and start the new frame.
      oldFrame.contentWindow['stop']();
      oldFrame.contentWindow['reset']();
      nextFrame.contentWindow['start']();
    }

  };
  $('.variants').jcarousel();
  $('.variant-prev')
  .on('jcarouselcontrol:active', function() {
    $(this).removeClass('inactive');
  })
  .on('jcarouselcontrol:inactive', function() {
    $(this).addClass('inactive');
  })
  .on('click', function() {
    transition(false);
    // stop current sim, start next sim
  })
  .jcarouselControl({
    target: '-=1'
  });

  $('.variant-next')
  .on('jcarouselcontrol:active', function() {
    $(this).removeClass('inactive');
  })
  .on('jcarouselcontrol:inactive', function() {
    $(this).addClass('inactive');
  })
  .on('click', function() {
    transition(true);
  })
  .jcarouselControl({
    target: '+=1'
  });
}

function save() {
  clearView();
  sendGet("view-ir", function(src) {
    calculateView(src);
    $("#currentProgram").dialog("open");
  });
}

function init_state() {
  current_points = [];
  accepted_points = {};
  program_frames = {};
  mainWindow = {};
  // clearFrames();
  learningInteractions = false;
  clearView();

  data = {clicks:0, points: 0, viewed:0, total:0}; // @BENCH


}

// TODO: refactor
function learnInteraction() {

  init_state();

  var prog = JSON.parse(document.getElementById('export').builder())
  // console.log(prog)

  sendPost(prog, "loadJSON", function() {

  // benchmarking: measure num of clicks, num of diagrams viewed, total num of diagrams


  // document.body.addEventListener("mousedown", function() {
  //   console.log('clicking');
  //   data.clicks = data.clicks + 1; // @BENCH
  // });
  getPoints( function (payload) {
    var points = JSON.parse(payload);
    sendGet("main/1000/1000/false", function (html) {
      updateFrame(html, "mainFrame", function() {
      mainWindow = document.getElementById("mainFrame").contentWindow

      // the order of points matters, so we can't use mainWindow.drag_points
      for (var i in points) {
        current_points[i] = mainWindow[points[i]];
      }
      mainWindow.drag_points = [];


      for (var i in current_points) {
        var newPoint = current_points[i];
        newPoint.fill = "red";
        newPoint.cr = 4;
        newPoint.selected = false;
      }

      mainWindow.global_redraw();

      mainWindow.addEventListener("mousedown", function (e) {
        if (e.button == 0) {
          console.log('clicking');
          data.clicks = data.clicks + 1; // @BENCH
          var x = e.layerX;
          var y = e.layerY;
          for (var i = 0; i < current_points.length; i++) {
            if (withinRadius(x, y, current_points[i])) {
              var currPoint = current_points[i]
              if (currPoint.selected) {
                currPoint.fill = "red";
              } else {
                currPoint.fill = "green";
              }
              currPoint.selected = !currPoint.selected;
              mainWindow.global_redraw();
            }
          }
        }
      }, true);

      $("#mainPopup").dialog("open");

    });
    });
  });
});


}


function setMain(html, Κ) {
  updateFrame(html, "mainFrame", Κ);
}

function getDiv(i) {
  var div = "variants";
  return div;
}
function regenVariants() {
  for (var i in program_frames) {
    var div = getDiv(i);
    populateFrame(i, div);
  }
}

function acceptPoints() {
  learningInteractions = true;
  var acceptedPoints = [];

  for (var i = 0; i < current_points.length; ++i) {
    if (current_points[i].selected) {
      accepted_points[i] = current_points[i];
      acceptedPoints.push(i);
    } else {
      // mainWindow.removePoint(current_points[i]);
    }
  }

  data.points = acceptedPoints.length; // @BENCH

  // mainWindow.global_redraw();

  sendPost(acceptedPoints, "accept-points", function() {
    // set mainFrame to variantFrame
    // clear
    clearFrames();
    $(".variant-prev")[0].style.display = 'inline';
    $(".variant-next")[0].style.display = 'inline';
    document.getElementById('accept').onclick = function() {
      var jc = function(str){ return $('.variants').jcarousel(str); };
      jc('first')[0].childNodes[0].donezo();
    }
    learnNextMotive();
  });
}

function learnNextMotive() {
  var nextI = Object.keys(accepted_points).shift();
  if (nextI === undefined) {
    learningInteractions = false;
    learnPhysics();
    // loadMain(learnFVs, false);
    // TODO
  } else {
    var nextPoint = accepted_points[nextI];
    // nextPoint.fill = 'yellow';
    // nextPoint.cr = 8;
    // mainWindow.global_redraw();
    learnMotive(nextI, function () {
      data.viewed = data.viewed + 1; // @BENCH
      // nextPoint.fill = 'green';
      // nextPoint.cr = 3.5;
      delete accepted_points[nextI];
    });
  }
}

function learnPhysics() {
  // clear variants and hide left/right arrows
  clearFrames();
  $(".variant-prev")[0].style.display = 'none';
  $(".variant-next")[0].style.display = 'none';
  document.getElementById('physics').style.display = 'inline';
  document.getElementById('free_vars').style.display = 'inline';
  document.getElementById('on_release').style.display = 'inline';

  document.getElementById('accept').onclick = function () {
    // send the physics information off to the server, open the response in a new window
    var physics = {};
    physics.eqs = document.getElementById('physics').value;
    physics.frees = document.getElementById('free_vars').value;
    physics.onrelease = document.getElementById('on_release').value;
    // console.log(physics);
    sendPost(physics, 'physics', function(html) {
      var uri = "data:text/html," + encodeURIComponent(html);
      var newWindow = window.open(uri);
    });
  }

  // load main into frame
  // console.log('loading:');
  loadFromSource("foo", 600, 600, function(html) {
    // console.log('received:');
    // console.log(html);
    initFrame(0, 0, "main", html, function(){}, false);
    $($('li#main_0')[0].childNodes[0]).load(function() {
      // check for hover over
      var receiver = $('li#main_0')[0].childNodes[0];
      var scope = receiver.contentWindow;
      // console.log(scope);
      // console.log($(scope.document.getElementById('mainCanvas')));
      scope.document.getElementById('mainCanvas').addEventListener('mousemove', function(e) {
        var x = e.clientX;
        var y = e.clientY;
        // console.log('clicked: ' + x + ", " + y);
        // console.log('targets: ' + drag_points.toString());
        // console.log(scope.all_objects);
        // console.log(div);
        // console.log(div.style)
        var div = document.getElementById('shapeDisplay');
        var closestDist = 10000000;
        var smallestText = '';
        div.style.display = 'inline';
        var objs = scope.all_objects.concat(scope.snap_points)
        for (var i = 0; i < objs.length; i++) {
          var shape = objs[i];
          var objDist = withinShape(x, y, objs[i]);
          if (objDist.within) {
            // console.log('detected hit!');
            // console.log(objDist);
            // console.log(scope.all_objects[i]);
            if (shape.type == 'ipoint') {
              objDist.dist = -1;
              // console.log(shape.ctor);
            }
            if (objDist.dist < closestDist) {
              closestDist = objDist.dist;
              smallestText = shape.ctor;

            }
            // console.log(div);
          } else {
            // div.style.display = 'none';
          }
        }

        replaceText(div, smallestText);

        // if (closestDist == 10000000)
          // div.style.display = 'none';

      });
    });
    // $('li#main_0')[0].childNodes[0].contentWindow.location.reload(true);
  }, false, true);
}

function replaceText(elem, txt) {
  clearChildren(elem);
  var bod = document.createElement('p');
  var txt = document.createTextNode(txt);
  bod.appendChild(txt);
  elem.appendChild(bod);
}

function lineDistance(start, end, point) {
    var linedy = end.y - start.y;
    var linedx = end.x - start.x;
    var numer = Math.abs(linedy * point.x - linedx * point.y + end.x * start.y - end.y * start.x);
    var denom = Math.sqrt(linedy * linedy + linedx * linedx);
    return numer/denom;
}

// returns {within: bool, dist: number}
function withinShape(x, y, shape) {
  var ret = {};
  // use boxes
  // console.log("point: " + x.toString() + ", " + y.toString());
  // console.log("shape: " + shape.x.toString() + ", " + shape.y.toString());

// line circle image ipoint rectangle arrow
  switch (shape.type) {
    case "line":
    case "arrow":
    case "spring":
      var start = {x: shape.x, y: shape.y};
      var end = {x: shape.x + shape.dx, y: shape.y + shape.dy};
      var pnt = {x: x, y: y};
      var width = 25;
      // make a rectangle from the line
      ret.dist = lineDistance(start, end, pnt);
      ret.within = ret.dist <= width;
      break;
    case "rectangle":
      // middle = (x1 + x2/2)
      // diff = x - (x1 + x2)/2
      var ddx = x - (shape.x1 + shape.x2)/2;
      var ddy = y - (shape.x1 + shape.y2)/2;
      ret.dist = Math.sqrt(ddx*ddx + ddy*ddy);
      ret.within = (shape.x1 <= x && shape.x2 >= x && shape.y1 <= y && shape.y2 >= y);
      break;
    case "image":
      // middle = (x1 + x2/2) = x
      // diff = x - (x1 + x2)/2
      var ddx = x - shape.x;
      var ddy = y - shape.y;
      ret.dist = Math.sqrt(ddx*ddx + ddy*ddy);
      ret.within = ((shape.x - shape.w) <= x && (shape.x + shape.w) >= x && (shape.y - shape.h) <= y && (shape.y + shape.h) >= y);
      break;
    case "circle":
    case "ipoint":
      var thresh = 10
      var dx = x - shape.x
      var dy = y - shape.y
      ret.dist = Math.sqrt(dx*dx + dy*dy);
      ret.within = ret.dist <= (shape.r + thresh)
      break;
    default:

  }

  // console.log(shape.type)

  return ret;
}





function learnFVs() {
  clearFrames();

  console.log(data);

  sendGet("free-vars/300/300", function(variants) {
    var newFrames = responseToArray(variants);



    for (var i = 0; i < newFrames.length; ++i) {
      initFrame(i, 32.3, "variants", newFrames[i], function(index) {
        sendGet("accept-fv/" + index, function() {
          loadMain(function() {
            clearFrames();

            // pass mouse events to new main
            ["mousedown", "mouseup", "mousemove"].forEach( function(eType) {
                var mFrame = document.getElementById('mainFrame')
                             .contentWindow.document.getElementById('mainCanvas');
                mFrame.addEventListener(eType, function(e) {
                  var offset = mFrame.getBoundingClientRect();
                  var newEv = wrapEvent(e, {
                    dx: -1 * offset.left,
                    dy: -1 * offset.top
                  });

                  dispatchEvent(mFrame, newEv);
              });
            });


          }, false);
        });
      });
    }

    $(".variants").jcarousel('reload');
    $(".variants").jcarousel('scroll', 0, false);

    // start the first frame
    var iframe = ($($(".variants").jcarousel('items')[0]).children('iframe')[0]);
    $(iframe).on('load', function() {
      iframe.contentWindow.start();
    });

  });
}


function clearFrames(){
  var frames = $(".variants")[0].children[0];
  clearChildren(frames);
}

function learnMotive(i, Κ) {
  clearFrames();

  sendGet("variants/" + i.toString() + "/600/600", function(variants) {
    var newFrames = responseToArray(variants);
    data.total = data.total + newFrames.length; // @BENCH
    for (var j = 0; j < newFrames.length; ++j) {
      initFrame(j, 32.3, "variants", newFrames[j], function(index) {
        acceptVariant(index, Κ);
      });
    }
    $(".variants").jcarousel('reload');
    $(".variants").jcarousel('scroll', 0, false);
    $($('.variants').jcarousel('first').children('iframe')[0]).on('load',
      function() {
        $('.variants').jcarousel('first').children('iframe')[0].contentWindow['startDisplay']();
      }
    );
  });
}



function populateFrame(ident, type) {
  getVariants(type, ident, 300, 300, function(html) {
    program_frames[ident].srcdoc = html;
  });
}
// load into the main display
function loadMain(Κ, reset) {
  var h = "300";
  var w = "300";
  var html = document.getElementById("filename").value
  loadFromSource(html, h, w, function (h) {
    setMain(h, Κ);
  }, reset);
}

function reset(Κ) {
  sendGet("reset", Κ);
}

// set a frame's source to an html string
function updateFrame(html, fid, Κ) {
  var frame = document.getElementById(fid)
  frame.srcdoc = html;
  frame.onload = Κ;
}


// given a file name, asks the server to load the file
function loadFromSource(name, h, w, kont, reset, snaps) {
  if (reset) {
    sendGet("loadfile/" + name + "/" + h + "/" + w, kont);
  } else {
    var snapStr;
    if (snaps) {
      snapStr = "true";
    } else {
      snapStr = "false";
    }
    sendGet("main/" + h + "/" + w + "/" + snapStr, kont)
  }
}


function acceptVariant(ident, Κ) {
  sendGet("accept-variant/" + ident, function () {
    Κ();
    learnNextMotive();
  });
}


// given an ident and width, make a new frame and add it to the end of some element
function initFrame(index, widthP, divID, html, learner) {
  var newContainer = document.createElement('li');
  newContainer.id = divID + '_' + index.toString();
  var newFrame = document.createElement('iframe');
  // var aButton = document.createElement('button');
  // aButton.id = newContainer.id + '_accept';
  newContainer.classList.add("smallFrame");

  newFrame.donezo = function() {learner(index);}

  // aButton.style = {float: 'right', background_color: '#00FF33'};
  // aButton.textContent = "Accept";

  newFrame.srcdoc = html;
  newFrame.style.height = "100%";
  newFrame.style.width = "100%";
  newFrame.style.borderStyle = "none";

  var parent = $(".variants")[0].children[0];

  //console.log();
  // newContainer.appendChild(aButton);
  newContainer.appendChild(newFrame);
  parent.appendChild(newContainer);
  program_frames[index] = newFrame;
}



function getVariants(i, h, w, Κ) {
  var prefix = ["variants", i.toString(), h.toString(), w.toString()];
  sendGet(prefix.join("/"), Κ);
}

function getPoints(Κ) {
  sendGet("points", Κ);
}

function passMouseEvents () {
  var innerFrame = document.getElementById('mainFrame').contentWindow;
  var innerCanvas = innerFrame.document.getElementById('mainCanvas');
  addEddieWrappers(innerCanvas);
}
