function init_state() {
  current_points = [];
  accepted_points = {};
  program_frames = {};
  mainWindow = {};
  clearFrames();
}

function captureMovement(e) {
  if (!e) e = window.event;
  log(e);
  e.stopPropagation();
  e.preventDefault();
  e.bubbles=false;
  log(e.bubbles);
  return false;
}
function main() {

  init_state();

  // capture mouse events over variants so that simulated display movements are not
  // interrupted

  loadMain( function() {
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
  }, true);

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
    loadMain(learnFVs, false);
  } else {
    var nextPoint = accepted_points[nextI];
    nextPoint.fill = 'yellow';
    nextPoint.cr = 8;
    mainWindow.global_redraw();
    learnMotive(nextI, function () {
      nextPoint.fill = 'green';
      nextPoint.cr = 2;
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
          loadMain(clearFrames, false);
        });
      });
    }
  });
}


function clearFrames(){
  var frames = document.getElementById('variants');

  while (frames.firstChild) {
    frames.removeChild(frames.firstChild);
  }
  ["mousedown", "mouseup", "mousemove"].map( function(e) {
    frames.addEventListener(e, captureMovement, true);
  });
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
  // disableInterface();
  sendGet("accept-variant/" + ident, function () {
    Κ();
    learnNextMotive();
  });
}

function disableInterface() {
  document.getElementById('loading').style.display = 'block';
}
function enableInterface() {
  document.getElementById('loading').style.display = 'none';
}


// given an ident and width, make a new frame and add it to the end of some element
function initFrame(index, widthP, divID, html, learner) {
  var newContainer = document.createElement('div');
  newContainer.id = divID + '_' + index.toString();
  var newFrame = document.createElement('iframe');
  var aButton = document.createElement('button');
  aButton.id = newContainer.id + '_accept';
  newContainer.style.width = widthP.toString() + "%";
  newContainer.classList.add("smallFrame");
  newContainer.style.float = 'left';

  aButton.onclick = function() {learner(index);}

  aButton.style = {float: 'right', background_color: '#00FF33'};
  aButton.textContent = "Accept";

  newFrame.srcdoc = html;
  newFrame.style.height = "100%";
  newFrame.style.width = "100%";
  newFrame.style.borderStyle = "none";

  var parent = document.getElementById(divID);
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
// pulled from http://stackoverflow.com/questions/247483/http-get-request-in-javascript
function sendGet(urlTail, Κ, resType) {
  var url = "http://localhost:8080/" + urlTail;
  console.log('sending GET ' + urlTail);
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      console.log("received response for " + urlTail);
      Κ(req.responseText);
    }
  }
  req.open("GET", url, true); // true for asynchronous
  req.send(null);
}

// converts a plain JS object into a json object and posts it to the server.
function sendPost(body, urlTail, Κ) {
  urlTail = urlTail || "";
  var url = "http://localhost:8080/" + urlTail;
  console.log('sending POST ' + urlTail);
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      console.log("received response for " + urlTail);
      Κ(req.responseText);
    }
  }
  req.open("POST", url, true); // true for asynchronous
  // it turns out headers need to be set after opening the connection
  req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  req.send(JSON.stringify(body));
}
