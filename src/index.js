
var dot2graphlib = require('graphlib-dot')
var graphlib = require('graphlib')
var graphlib2kgraph = require('graphlib2kgraph')
var graphify = require('graphify-node')
var draw = require('./draw')
var maxBy = require('lodash/maxBy')

function drawNode (node) {
  return draw.combine([
      (node.edges || []).map((edge) => draw.drawEdge(edge)),
      (node.children || []).map((child) => drawNode(child)),
    draw.drawBox(node)
  ])
}

function drawGraphToString (graph) {
  var output = draw.field(graph)
  return draw.fieldToString(drawNode(graph)(output))
}

function monospace (str, style) {
  return {width: maxBy(str.split('\n'), (line) => line.length).length, height: str.split('\n').length}
}

module.exports = {
  renderDot: (input) =>
    dot2graphlib.read(input)
    >> graphlib2kgraph.default
    >> module.exports.render,
  render: (input) =>
    graphify.layout(input, monospace, graphify.terminalDefaults)
    .then(drawGraphToString)
}
