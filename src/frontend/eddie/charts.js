// return an array of num evenly spaced rgba strings, adapted from
// http://krazydad.com/tutorials/makecolors.php
function generateColors(num) {
  var ret = [];
  var frequency = 2*Math.PI/num;
  for (var i = 0; i < num; ++i) {
     var r = Math.round(Math.sin(frequency*i + 0) * 127 + 128).toString();
     var g = Math.round(Math.sin(frequency*i + 2) * 127 + 128).toString();
     var b = Math.round(Math.sin(frequency*i + 4) * 127 + 128).toString();
     ret.push('rgb(' + [r,g,b].join(',') + ')');
  }

  return ret;
}




function chartInit(h, w) {
  var canvas = document.getElementById("chartCanvas");
  canvas.height = h;
  canvas.width = w;
  var ctx = canvas.getContext("2d");
  chart_ctx = ctx;
  freeChartVars = {}; // {varname: variable}

  charts = []; // [{chart: VecChart, name: string}]
  chartData = {}; // {chart-name: {visible: boolean, expr: varmap -> int}}

}

function addChart(name, expr, config) {
  // place the new chart at the next free slot in the canvas
  var w = 50;
  var h = chart_ctx.canvas.height/1.5;
  var ncx = (w + 10) * charts.length;
  // x, y, h, w, config, stroke, simple
  var nc = new VecChart(ncx, 20, h, w, config, 'black', true);
  chartData[name] = {visible: true, expr: expr};
  charts.push({chart: nc, name: name});

  makeTicker(name);
}

function drawCharts () {
  chart_ctx.clearRect(0,0, chart_ctx.canvas.width, chart_ctx.canvas.height);
  var colors = generateColors(charts.length);
  for (var i in charts) {
    if (chartData[charts[i].name].visible) {
      charts[i].chart.stroke = colors[i];
      charts[i].chart.draw(chart_ctx);
    }
  }
}

// given a map of variables from varname -> variable, pass the values to each
// chart
function recordChartValues() {
  var varMap = _.mapObject(freeChartVars, function(varbl) { return varbl.value; });
  for (var i in charts) {
    var evalFunc = chartData[charts[i].name].expr;
    charts[i].chart.record({y: evalFunc(varMap)});
  }
}

// given the name of a chart, make a toggle for the chart and attach to dom
function makeTicker(name) {
  var container = document.createElement('div');
  container.style.float='left';
  container.style.marginRight='7px';
  var newTicker = document.createElement('input');
  newTicker.type = 'checkbox';
  container.style.font = '18pt MS Comic Sans';

  newTicker.onchange = function() {
    chartData[name].visible = !chartData[name].visible;
    global_redraw();
  }

  container.appendChild(newTicker);
  container.appendChild(document.createTextNode(name));
  document.getElementById('tickers').appendChild(container);
}
