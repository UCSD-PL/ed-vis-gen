// pulled from http://stackoverflow.com/questions/247483/http-get-request-in-javascript
function sendGet(urlTail, Κ, resType) {
  var url = "http://localhost:8080/" + urlTail;
  log('sending GET ' + urlTail);
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      log("received response for " + urlTail);
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
  log('sending POST ' + urlTail);
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      log("received response for " + urlTail);
      Κ(req.responseText);
    }
  }
  req.open("POST", url, true); // true for asynchronous
  // it turns out headers need to be set after opening the connection
  req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  req.send(JSON.stringify(body));
}

function clearChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}


// given the name of a line shape, print dx = val, dy = val
// reaches in to mainFrame (assumes it's an iframe, etc etc)
// hackish as hell...
function convertLineToVector(name) {
  var scope = document.getElementById('mainFrame').contentWindow;
  var line = scope[name];
  // assumes line is *actually* a Line
  var points = line.points;
  var x0 = points[0];
  var x1 = points[2];
  var y0 = points[1];
  var y1 = points[3];
  console.log("DY = " + (y1 - y0));
  console.log("DX = " + (x1 - x0));
}
