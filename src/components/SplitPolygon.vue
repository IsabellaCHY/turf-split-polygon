<template>
  <div id="map"></div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import splitPolygon from "../core/turf-polygon-split";
import * as turf from "@turf/turf";
export default {
  name: "SplitPolygon",
  data() {
    return {
      map: null,
      markers: []
    };
  },
  mounted() {
    // accessToken
    mapboxgl.accessToken =
      "pk.eyJ1IjoiZmVuZ3lrIiwiYSI6ImNqdHMybGZ4MTB3bGw0M280eHRld2VuanoifQ.8_MwO6kp9B4DNZcdO0mi4Q";
    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v9",
      center: [113.91994813504948, 23.014754298221476],
      zoom: 10
    });
    this.map.on("click", e => {
      console.log([e.lngLat.lng, e.lngLat.lat]);
    });

    let coords = [
      [
        [
          [113.86020997584563, 23.096888137018198],
          [113.7936053615835, 23.05835465322214],
          [113.78467896998285, 23.017282240187384],
          [113.77643922389643, 22.95975984569057],
          [113.82931092800033, 22.90600802716152],
          [113.99273255885555, 22.89272488092564],
          [114.02431825221504, 22.955966299720586],
          [114.0270648342439, 23.01601827513015],
          [113.97419313013995, 23.086150407190942],
          [113.86020997584563, 23.096888137018198]
        ],
        [
          [113.8375506740868, 23.03308080377478],
          [113.91033509792072, 23.04129532504335],
          [113.91720155299276, 23.00148182571482],
          [113.90003541529154, 22.967978830254637],
          [113.82931092800033, 22.985047432303546],
          [113.8375506740868, 23.03308080377478]
        ]
      ]
    ];

    let line = [
      [113.79051545681222, 23.103519835569912],
      [113.8076815945073, 22.98283495735427],
      [113.8790927273156, 22.985363497177488],
      [113.90449861110608, 22.93288660333228],
      [114.09057954372378, 23.000533741993976]
    ];

    let poly = turf.multiPolygon(coords);
    let split = turf.lineString(line);

    let resPolygon = splitPolygon(poly, split);
    console.log(resPolygon);
    let resLines = [];
    resPolygon.map(item => {
      resLines.push(turf.polygonToLine(item));
    });
    this.map.on("load", () => {
      this.map.addLayer({
        id: "poly",
        type: "fill",
        source: {
          type: "geojson",
          data: poly
        },
        layout: {},
        paint: {
          "fill-color": "#088",
          "fill-opacity": 0.5
        }
      });
      this.map.addLayer({
        id: "line",
        type: "line",
        source: {
          type: "geojson",
          data: turf.polygonToLine(poly)
        },
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#fff",
          "line-width": 4
        }
      });

      // 裁剪结果
      this.map.addLayer({
        id: "result",
        type: "fill",
        source: {
          type: "geojson",
          data: turf.featureCollection(resPolygon)
        },
        layout: {},
        paint: {
          "fill-color": "#90EE90",
          "fill-opacity": 0.5
        }
      });
      this.map.addLayer({
        id: "resLine",
        type: "line",
        source: {
          type: "geojson",
          data: turf.featureCollection(resLines)
        },
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "red",
          "line-width": 2
        }
      });
    });
  },
  methods: {}
};
</script>

<style scoped>
body {
  margin: 0;
  padding: 0;
}
#map {
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  position: absolute;
}
</style>
