function initView() {
  $("#currentProgram").dialog({autoOpen : false, modal : true, show : "blind", hide : "blind"});
  $("#mainPopup").dialog({autoOpen : false,
    height: 750,
    width: 800,
    modal : true, show : "blind", hide : "blind"});
}

function clearView() {
  var view = $('#currentProgram')[0];
  clearChildren(view);
  // view = $('#mainFrame')[0];
  // clearChildren(view);
}

function calculateView(src) {
  var view = document.getElementById('currentProgram');
  //$('#currentProgram');


  //console.log(src);
  var bod = document.createElement('p');
  var txt = document.createTextNode(src);
  bod.appendChild(txt);
  view.appendChild(bod);
  //view.append('<p>' + src + '</p>');
}
