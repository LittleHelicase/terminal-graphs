
var maxBy = require('lodash/maxBy');
var bresenham = require('bresenham');

function field(obj) {
  return Array.apply(null, Array(obj.height | 0 + 1)).map(() => Array.apply(null, Array(obj.width | 0 + 1)).map(() => ' '));
}

function fieldToString(field) {
  return field.map(row => row.join('')).join('\n');
}

function pos(x, y) {
  return { x: x | 0, y: y | 0 };
}

function leftUpper(obj) {
  return pos(obj.x, obj.y);
}

function leftLower(obj) {
  return pos(obj.x, obj.y + obj.height);
}

function rightUpper(obj) {
  return pos(obj.x + obj.width, obj.y);
}

function rightLower(obj) {
  return pos(obj.x + obj.width, obj.y + obj.height);
}

function lineAngle(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function angleDir(angle) {
  var shortAngle = Math.atan(Math.tan(angle)); // yes this can be done faster
  if (shortAngle > -0.3 && shortAngle < 0.3) return 'horizontal';else if (shortAngle >= 0.3 && shortAngle < 1.3) return 'down-diagonal';else if (shortAngle <= -0.3 && shortAngle > -1.3) return 'up-diagonal';else return 'vertical';
}

function dirToCharacter(dir) {
  if (dir === 'horizontal') return '─';
  if (dir === 'vertical') return '│';
  if (dir === 'up-diagonal') return '/';
  if (dir === 'down-diagonal') return '\\';
}

function angleToArrowhead(angle) {
  if (-0.3 < angle && angle < 0.3) return '►';
  if (Math.PI - 0.3 < angle && angle < Math.PI + 0.3) return '◄';
  if (Math.PI * 0.5 - 0.3 < angle && angle < Math.PI * 0.5 + 0.3) return '▼';
  if (-Math.PI * 0.5 - 0.3 < angle && angle < -Math.PI * 0.5 + 0.3) return '▲';
  var dir = angleDir(angle);
  if (dir === 'up-diagonal') return '/';
  if (dir === 'down-diagonal') return '\\';
}

function drawLine(from, to) {
  return field => {
    var dir = angleDir(lineAngle(from, to));
    var char = dirToCharacter(dir);
    bresenham(from.x, from.y, to.x, to.y, (x, y) => setCharacter(pos(x, y), char)(field));
    return field;
  };
}

function drawCenteredLabelLine(line, pos, lineNumber, width) {
  return field => {
    const diffX = Math.floor((width - line.length) * 0.5);
    for (var i = 0; i < line.length; i++) {
      field[pos.y + lineNumber][pos.x + diffX + i] = line[i];
    }
    return field;
  };
}

function drawLabel(box) {
  const label = box.labels[0].text;
  const labelLines = label.split('\n');
  const center = { x: Math.floor(box.x + box.width * 0.5), y: Math.floor(box.y + box.height * 0.5) };
  const width = maxBy(labelLines, str => str.length).length;
  const height = labelLines.length;
  const lu = { x: center.x - Math.floor(width * 0.5), y: center.y - Math.floor(height * 0.5) };
  return combine(labelLines.map((line, idx) => drawCenteredLabelLine(line, lu, idx, width)));
}

function combine(ops, opt) {
  if (ops.length > 0 && typeof ops[0] !== 'function' && !Array.isArray(ops[0])) throw new Error('Cannot combine non functions or arrays');
  return field => {
    return ops.reduce((f, op) => {
      if (Array.isArray(op)) {
        return combine(op)(f);
      }
      return op(f);
    }, field);
  };
}

function setCharacter(pos, char) {
  return field => {
    field[pos.y][pos.x] = char;
    return field;
  };
}

function drawBox(box) {
  if (box.id === 'root') return x => x;else return combine([drawLine(leftUpper(box), leftLower(box)), drawLine(rightUpper(box), rightLower(box)), drawLine(leftUpper(box), rightUpper(box)), drawLine(leftLower(box), rightLower(box)), setCharacter(leftUpper(box), '┌'), setCharacter(leftLower(box), '└'), setCharacter(rightUpper(box), '┐'), setCharacter(rightLower(box), '┘'), drawLabel(box)]);
}

const betweenPairs = (callback, sequence) => {
  return sequence.reduce((acc, cur) => {
    if (acc[0] == null) return [cur, acc[1]];else {
      var prev = acc[0];
      return [cur, acc[1].concat(callback(prev, cur))];
    }
  }, [null, []])[1];
};

const triples = (callback, sequence) => {
  return sequence.reduce((acc, cur) => {
    if (acc[0] == null) return [[cur], acc[1]];else if (acc[0].length === 1) return [[acc[0][0], cur], acc[1]];else {
      var fst = acc[0][0];
      var sec = acc[0][1];
      return [[sec, cur], acc[1].concat(callback(fst, sec, cur))];
    }
  }, [null, []])[1];
};

function corner(from, mid, end) {
  var dir1 = angleDir(lineAngle(from, mid));
  var dir2 = angleDir(lineAngle(mid, end));
  if (dir1 === dir2) return dirToCharacter(dir1);
  if ((dir1 === 'horizontal' || dir1 === 'vertical') && (dir2 === 'vertical' || dir2 === 'horizontal')) {
    if (from.y < mid.y) {
      // first downwards
      if (from.x < end.x) return 'left-lower';else return 'right-lower';
    } else if (from.y > mid.y) {
      // first upwards
      if (from.x < end.x) return 'right-upper';else return 'left-upper';
    } else if (from.x < mid.x) {
      // first right
      if (from.y < end.y) return 'right-upper';else return 'right-lower';
    } else if (from.x > mid.x) {
      // first left
      if (from.y < end.y) return 'left-upper';
      return 'left-lower';
    }
  }
  return dirToCharacter(dir1);
}

function cornerCharacter(corner) {
  if (corner === 'left-upper') return '┌';
  if (corner === 'left-lower') return '└';
  if (corner === 'right-upper') return '┐';
  if (corner === 'right-lower') return '┘';
}

function stepBack(from, to) {
  var angle = lineAngle(from, to);
  if (-0.3 < angle && angle < 0.3) return { x: -1, y: 0 };
  if (Math.PI - 0.3 < angle && angle < Math.PI + 0.3) return { x: 1, y: 0 };
  if (Math.PI * 0.5 - 0.3 < angle && angle < Math.PI * 0.5 + 0.3) return { x: 0, y: -1 };
  if (-Math.PI * 0.5 - 0.3 < angle && angle < -Math.PI * 0.5 + 0.3) return { x: 0, y: 1 };
  return { x: 0, y: 0 };
}

function drawEdge(edge) {
  var pts = [edge.sourcePoint].concat(edge.bendPoints || []).concat([edge.targetPoint]);
  var last = pts[pts.length - 1];
  var endMarker = angleToArrowhead(lineAngle(pts[pts.length - 2], last));
  var dlast = stepBack(pts[pts.length - 2], last); // we need to go one step back...
  return combine(betweenPairs((a, b) => drawLine(a, b), pts).concat(triples((from, mid, end) => {
    var chr = cornerCharacter(corner(from, mid, end));
    return setCharacter(pos(mid.x, mid.y), chr);
  }, pts).concat([setCharacter(pos(last.x + dlast.x, last.y + dlast.y), endMarker)])));
}

module.exports = {
  combine, drawBox, field, fieldToString, drawEdge, pos
};
