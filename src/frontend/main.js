
// initialize jcarousel frames
function init_frames() {
  var jc = function(str){ return $('.variants').jcarousel(str); };
  var transition = function (forward) {
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
  clearFrames();
  learningInteractions = false;
  clearView();


}

// TODO: refactor
function learnInteraction() {

  init_state();


  getPoints( function (payload) {
    var points = JSON.parse(payload);
    loadMain( function () {
      mainWindow = document.getElementById("mainFrame").contentWindow

      // the order of points matters, so we can't use mainWindow.drag_points
      for (var i in points) {
        current_points[i] = mainWindow[points[i]];
      }
      mainWindow.drag_points = [];

      for (var i in current_points) {
        var newPoint = current_points[i];
        newPoint.fill = "red";
        newPoint.selected = false;
      }

      mainWindow.global_redraw();

      mainWindow.addEventListener("mousedown", function (e) {
        if (e.button == 0) {
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
      mainWindow.removePoint(current_points[i]);
    }
  }

  mainWindow.global_redraw();

  sendPost(acceptedPoints, "accept-points", learnNextMotive);
}

function learnNextMotive() {
  var nextI = Object.keys(accepted_points).shift();
  if (nextI === undefined) {
    learningInteractions = false;
    loadMain(learnFVs, false);
  } else {
    var nextPoint = accepted_points[nextI];
    nextPoint.fill = 'yellow';
    nextPoint.cr = 8;
    mainWindow.global_redraw();
    learnMotive(nextI, function () {
      nextPoint.fill = 'green';
      nextPoint.cr = 3.5;
      delete accepted_points[nextI];
    });
  }
}

function learnFVs() {
  clearFrames();

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

  sendGet("variants/" + i.toString() + "/300/300", function(variants) {
    var newFrames = responseToArray(variants);
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
function loadFromSource(name, h, w, Κ, reset) {
  if (reset) {
    sendGet("loadfile/" + name + "/" + h + "/" + w, Κ);
  } else {
    sendGet("main/" + h + "/" + w, Κ)
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
  var aButton = document.createElement('button');
  aButton.id = newContainer.id + '_accept';
  newContainer.classList.add("smallFrame");

  aButton.onclick = function() {learner(index);}

  aButton.style = {float: 'right', background_color: '#00FF33'};
  aButton.textContent = "Accept";

  newFrame.srcdoc = html;
  newFrame.style.height = "100%";
  newFrame.style.width = "100%";
  newFrame.style.borderStyle = "none";

  var parent = $(".variants")[0].children[0];

  //console.log();
  newContainer.appendChild(aButton);
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
