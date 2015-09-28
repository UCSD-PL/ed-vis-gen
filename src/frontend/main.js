function main() {

  current_points = [];
  program_frames = {};
  loadMain( function() {
    getPoints( function (payload) {
      console.log(payload);
    });
  });

}

function nop () {}
function setMain(html) {
  updateFrame(html, "mainFrame");
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

function initFrames() {

  // TODO: ask for list of frames, populate each of them
  // merge with populate frame

    initFrame(i, 32.3, "variants");
    populateFrame(i, div);

}

function populateFrame(ident, type) {
  getVariants(type, ident, 300, 300, function(html) {
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
    Κ();
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
  disableInterface();
  sendGet("accept-variant/" + ident, function (h) {
    setMain(h);
    regenVariants();
    enableInterface();
    //console.log("accepted");
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



function getVariants(h, w, Κ) {
  var prefix = ["variants", h.toString(), w.toString()];
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
