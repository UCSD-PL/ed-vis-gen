function loadjson(){
  var json= canvas.toJSON();
  canvas.clear();
  canvas.loadFromJSON(json, canvas.renderAll(canvas));
}
