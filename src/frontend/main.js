function main() {
  // common_init();
  // SHAPES = makeEnum(["RECTANGLE", "TRIANGLE", "ARROW", "CIRCLE"]);
  //sendGet("", loadPage);
  loadMain();
  loadFromSource("sspring.txt", "300", "300", function(h) {
    addFramesToDiv([h,h,h], "exact");
    addFramesToDiv([h,h,h], "inexact");
  });


  getDifferents(3, 300, 300, function(diffs) {
    var rDiffs = JSON.parse(diffs);
    console.log(rDiffs);
    //var realDiffs = Object.keys(JSON.parse(diffs)).map(function(k) { return diffs[k] });
    console.log(rDiffs.length);
    var res = [];
    for (var i in rDiffs) {
      res.push(rDiffs[i]);
    }
    addFramesToDiv(res, "far");

  });
  // loadFromSource("spendulum.txt", "300", "300", function(h1) {
  //   loadFromSource("spendulum.txt", "300", "300", function(h2) {
  //     loadFromSource("spendulum.txt", "300", "300", function(h3) {
  //       addFramesToDiv([h1,h2,h3], "far");
  //     });
  //   });
  // });

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
// load into the main display
function loadMain(html) {
  var h = "300";
  var w = "300";
  html = html || document.getElementById("filename").value
  loadFromSource(html, h, w, setMain);
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

// given a list of html sources and a div, add the sources to the div as frames
function addFramesToDiv(htmls, divID) {
  var width = (100.0/htmls.length)-1;
  for (var i = 0; i < htmls.length; ++i) {
    addFrameToDiv(htmls[i], width, divID);
  }
}

// given some html source, make a new frame and add it to the end of some element
function addFrameToDiv(html, widthP, divID) {
  var newFrame = document.createElement('iframe');
  newFrame.srcdoc = html;
  newFrame.style.height = "100%";
  newFrame.style.width = widthP.toString() + "%";
  newFrame.style.borderStyle = "none";
  document.getElementById(divID).appendChild(newFrame);
}

function getDifferents(n, h, w, Κ) {
  sendGet("differents/" + n.toString() + "/" + h.toString() + "/" + w.toString(), Κ);
}
// pulled from http://stackoverflow.com/questions/247483/http-get-request-in-javascript
function sendGet(urlTail, Κ, resType) {
  var url = "http://localhost:8080/" + urlTail;
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200)
      Κ(req.responseText);
  }
  req.open("GET", url, true); // true for asynchronous
  req.send(null);
}

// converts a plain JS object into a json object and posts it to the server.
function sendPost(body, urlTail, Κ) {
  urlTail = urlTail || "";
  var url = "http://localhost:8080/" + urlTail;
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200)
      Κ(req.responseText);
  }
  req.open("POST", url, true); // true for asynchronous
  // it turns out headers need to be set after opening the connection
  req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  req.send(JSON.stringify(body));
}
