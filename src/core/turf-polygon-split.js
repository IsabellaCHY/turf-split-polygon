/* eslint-disable */
import * as turf from '@turf/turf'

console.log(turf)
function splitPolygon(polygon, clipLine) {
  let clipLineType = clipLine.geometry.type
  switch (clipLineType) {
    case 'LineString':
      return splitPolygonWithLine(polygon, clipLine);
    case 'Polygon':
      return splitPolygonWithPolygon(polygon, clipLine);
  }
}

/**
 * 合并多边形
 */
function unionPolygon(polygons) {
  var polygon = polygons[0]
  for (var i = 1; i < polygons.length; i++) {
    if (polygons[i]) {
      polygon = turf.union(polygon, polygons[i])
    }
  };
  return polygon;
}

/**
 * 线分割面
 * 面类型只能是polygon 但可以是环
 * 注:线与多边形必须有两个交点
 */
function splitPolygonWithLine(polygon, clipLine) {
  let p1 = null
  let p2 = null

  // 判断线与面的交点个数
  let intersects = turf.lineIntersect(turf.polygonToLine(polygon), clipLine)
  if (!intersects || intersects.features.length < 2) { return }

  let bufferPolygon = turf.buffer(clipLine, 0.0001, { units: 'meters' })
  let poly = turf.difference(polygon, bufferPolygon)

  if (poly.geometry.coordinates.length < 2) {
    return
  } else if (poly.geometry.coordinates.length === 2) {
    let poly1 = turf.polygon(poly.geometry.coordinates[0])
    let poly2 = turf.polygon(poly.geometry.coordinates[1])

    let res = combinePolygons([poly1, poly2], clipLine)
    p1 = res.leftPolygons[0]
    p2 = res.rightPolygons[0]

  } else if (poly.geometry.coordinates.length > 2) {
    let polygons = []
    poly.geometry.coordinates.map(item => {
      polygons.push(turf.polygon(item))
    })

    let res = combinePolygons(polygons, clipLine)
    p1 = polygons2MultiPolygon(res.leftPolygons)
    p2 = polygons2MultiPolygon(res.rightPolygons)
  }
  return [p1, p2]
}

function splitPolygonWithPolygon(polygon, splitter) {
  if (polygon.geometry.type === 'Polygon') {
    return splitSinglePolygon(polygon, splitter)
  } else if (polygon.geometry.type === 'MultiPolygon') {
    return splitMultiPolygon(polygon, splitter)
  }
}

function combinePolygons(polygons, clipLine) {
  if (polygons.length === 0) { return }
  let leftPolygons = []
  let rightPolygons = []

  polygons.map(item => {
    let leftOffsetLine = turf.lineOffset(clipLine, -0.0001, { units: 'meters' })
    let rightOffsetLine = turf.lineOffset(clipLine, 0.0001, { units: 'meters' })

    let isLeftDisjoint = turf.booleanDisjoint(leftOffsetLine, item)
    let isRightDisjoint = turf.booleanDisjoint(rightOffsetLine, item)

    if (!isLeftDisjoint) {
      rightPolygons.push(item)
    } else if (!isRightDisjoint) {
      leftPolygons.push(item)
    } else {
      let center = turf.center(item)
      let dis1 = turf.pointToLineDistance(center, leftOffsetLine)
      let dis2 = turf.pointToLineDistance(center, rightOffsetLine)
      if (dis1 > dis2) {
        leftPolygons.push(item)
      } else {
        rightPolygons.push(item)
      }
    }
  })

  return {
    leftPolygons: leftPolygons,
    rightPolygons: rightPolygons
  }
}


function splitSinglePolygon(polygon, clipPolygon) {
  // 选中多边形和绘制多边形之间的公共部分
  let intersection = intersect(polygon, clipPolygon)
  if (!intersection) { return }
  intersection.properties = polygon.properties

  // 选中多边形和绘制多边形中不一样的部分
  let difference = difference(polygon, clipPolygon)
  if (!difference) { return }

  return [difference, intersection]
}

function splitMultiPolygon(polygon, clipPolygon) {
  let polygons = multiPolygon2polygons(polygon)
  let intersectArr = []
  polygons.forEach(function (poly) {
    let intersection = intersect(poly, clipPolygon)
    if (intersection) {
      intersectArr.push(intersection)
    }
  })

  // 选中多边形和绘制多边形中不一样的部分
  let difference = difference(polygon, clipPolygon)
  difference.properties = polygon.properties
  let uPolygon = unionPolygon(intersectArr)

  if (!difference || !uPolygon) { return }
  return [difference, uPolygon]
}

/**
 * multiPolygon转polygons,不涉及属性
 */
function multiPolygon2polygons(multiPolygon) {
  if (multiPolygon.geometry.type !== 'MultiPolygon') {
    return
  }
  var polygons = [];
  multiPolygon.geometry.coordinates.forEach((item) => {
    var polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: []
      }
    };
    polygon.geometry.coordinates = item;
    polygons.push(polygon)
  });
  return polygons;
}


/**
* polygons转multiPolygon,不涉及属性，只输出属性为{}
* 考虑polygons中就存在多面的情况
*/
function polygons2MultiPolygon(polygons) {
  if (polygons.length === 0) { return }
  let coords = []

  polygons.forEach((item) => {
    if (item.geometry.type === 'Polygon') {
      coords.push(item.geometry.coordinates)
    } else {
      item.geometry.coordinates.forEach((item) => {
        coords.push(item)
      })
    }
  })
  let multiPolygon = turf.multiPolygon(coords)
  return multiPolygon
}

export default splitPolygon