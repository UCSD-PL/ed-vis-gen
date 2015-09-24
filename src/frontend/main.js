function main() {
  // common_init();
  // SHAPES = makeEnum(["RECTANGLE", "TRIANGLE", "ARROW", "CIRCLE"]);
  //sendGet("", loadPage);
  program_frames = {};
  NUM_FRAMES = 9;
  loadMain( function() {
    // map program IDs to their containing frames, for ease of updating sources
    initFrames();
  });

}

function nop () {}
function updateVars(Κ) {
  var currValues = {};
  for (var cv in constrained_vars) {
    currValues[cv] = constrained_vars[cv].value;
  }
  sendPost(currValues, "updatevars", Κ);
}
function setMain(html) {
  updateFrame(html, "mainFrame");
}

function getDiv(i) {
  var div = ""
  if (i < NUM_FRAMES/3) {
    div = "near"
  } else if (i < 2* NUM_FRAMES/3) {
    div = "medium"
  } else {
    div = "far"
  }
  return div;
}
function regenVariants() {
  for (var i in program_frames) {
    var div = getDiv(i);
    populateFrame(i, div);
  }
}

function initFrames() {
  for (var i = 0; i < NUM_FRAMES; ++i) {
    var div = getDiv(i);
    initFrame(i, 100/(NUM_FRAMES/3)-1, div);
    populateFrame(i, div);
  }
}

function populateFrame(ident, type) {
  getVariant(type, ident, 300, 300, function(html) {
    program_frames[ident].srcdoc = html;
  });
}
// load into the main display
function loadMain(Κ) {
  var h = "300";
  var w = "300";
  var html = document.getElementById("filename").value
  loadFromSource(html, h, w, function (h) {
    setMain(h);
    Κ()
  });
}

function reset(Κ) {
  sendGet("reset", Κ);
}

// set a frame's source to an html string
function updateFrame(html, fid) {
  document.getElementById(fid).srcdoc = html;
}

// given a file name, asks the server to load the file
function loadFromSource(name, h, w, Κ) {
  sendGet("loadfile/" + name + "/" + h + "/" + w, Κ);
}


function acceptVariant(ident) {
  //console.log("accepting " + ident);
  sendGet("accept-variant/" + ident, function (h) {
    setMain(h);
    regenVariants();
    //console.log("accepted");
  });
}
function rejectVariant(ident, type) {
  // TODO: make server return next variant here
  sendGet("reject-variant/" + ident, function () {
    populateFrame(ident, type);
  });
}

// given an ident and width, make a new frame and add it to the end of some element
function initFrame(ident, widthP, divID) {
  var newContainer = document.createElement('div');
  newContainer.id = divID + '_' + ident.toString();
  var newFrame = document.createElement('iframe');
  var aButton = document.createElement('button');
  aButton.id = newContainer.id + '_accept';
  var rButton = document.createElement('button');
  rButton.id = newContainer.id + '_reject';
  newContainer.style.width = widthP.toString() + "%";
  newContainer.style.float = 'left';
  newContainer.style.height = "100%";
  newContainer.style.borderStyle = 'solid';

  aButton.onclick = function() {acceptVariant(ident);};

  aButton.style = {float: 'right', color: '#00FF33'};
  aButton.textContent = "Accept";

  rButton.onclick = function() {rejectVariant(ident, divID);};
  rButton.style = {float: 'right', color: '#FF6600'};
  rButton.textContent = "Reject";

  newFrame.srcdoc = "";
  newFrame.style.height = "100%";
  newFrame.style.width = "100%";
  newFrame.style.borderStyle = "none";

  var parent = document.getElementById(divID);
  newContainer.appendChild(aButton);
  newContainer.appendChild(rButton);
  newContainer.appendChild(newFrame);
  parent.appendChild(newContainer);
  program_frames[ident] = newFrame;
}

function getVariant(type, n, h, w, Κ) {
  var prefix = ["variants", type, n.toString(), h.toString(), w.toString()];
  sendGet(prefix.join("/"), Κ);
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
