function main() {

  current_points = [];
  program_frames = {};
  mainWindow = {};
  loadMain( function() {
    getPoints( function (payload) {
      var points = JSON.parse(payload);
      loadMain( function () {
        mainWindow = document.getElementById("mainFrame").contentWindow

        // the order of points matters, so we can't use mainWindow.drag_points
        for (var i in points) {
          console.log(points[i]);
          console.log(mainWindow[points[i]]);
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
              console.log("clicked");
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

function nop () {}
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
      acceptedPoints.push(i);
    } else {
      mainWindow.removePoint(current_points[i]);
    }
  }

  mainWindow.global_redraw();

  sendPost(acceptedPoints, "accept-points", learnMotives);
}

function learnMotives() {
  for (var i = 0; i < current_points.length; ++i) {
    if (current_points[i].selected) {
      var thePoint = current_points[i];
      thePoint.fill = 'yellow';
      thePoint.cr = 8;
      mainWindow.global_redraw();
      learnMotive(i);
      thePoint.fill = 'green';
      thePoint.cr = 2;
    }
  }
}

function clearFrames(){
  var frames = document.getElementById('variants');

  while (frames.firstChild) {
    frames.removeChild(frames.firstChild);
  }
}
function learnMotive(i) {
  clearFrames();
  sendGet("variants/" + i.toString() + "/300/300", function(variants) {
    var newFrames = JSON.parse(variants)
    console.log(newFrames.length);
    // for (var i = 0; i < variants.length; ++i) {
    //   // initFrame(i, 32.3, "variants");
    //   // populateFrame(i, div);
    //   // TODO
    //   console.log(variants[i]);
    // }
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


function acceptVariant(ident) {
  disableInterface();
  sendGet("accept-variant/" + ident, function (h) {
    setMain(h);
    regenVariants();
    enableInterface();
  });
}

function disableInterface() {
  document.getElementById('loading').style.display = 'block';
}
function enableInterface() {
  document.getElementById('loading').style.display = 'none';
}


// given an ident and width, make a new frame and add it to the end of some element
function initFrame(ident, widthP, divID) {
  var newContainer = document.createElement('div');
  newContainer.id = divID + '_' + ident.toString();
  var newFrame = document.createElement('iframe');
  var aButton = document.createElement('button');
  aButton.id = newContainer.id + '_accept';
  newContainer.style.width = widthP.toString() + "%";
  newContainer.style.float = 'left';
  newContainer.style.height = "100%";
  newContainer.style.borderStyle = 'solid';

  aButton.onclick = function() {acceptVariant(ident);};

  aButton.style = {float: 'right', background_color: '#00FF33'};
  aButton.textContent = "Accept";

  newFrame.srcdoc = "";
  newFrame.style.height = "100%";
  newFrame.style.width = "100%";
  newFrame.style.borderStyle = "none";

  var parent = document.getElementById(divID);
  newContainer.appendChild(aButton);
  newContainer.appendChild(newFrame);
  parent.appendChild(newContainer);
  program_frames[ident] = newFrame;
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
