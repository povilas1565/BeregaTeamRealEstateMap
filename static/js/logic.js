const street = L.tileLayer("https://api.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, BubbleBeregaTeam © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.satellite",
  accessToken: API_KEY
});

map = L.map("map", {
  center: [38.9072, -77.0369],
  zoom: 12,
  layers: [street]
});

// POINTS DATA

//This function returns an emoji based on the string name
function getEmoji(name) {
  var emojis = [["🚗", ["Parking"]],
  ['⛽', ["Fuel"]],
  ['☕', ["Cafe"]],
  ['🚰', ["Drinking water source"]],
  ['🍔', ["Fast Food Restaurant"]],
  ['🍻', ["Pub"]],
  ['🥘', ["Restaurant"]],
  ['🚁', ['Aerodrome']],
  ['🚲', ['Bicycle']],
  ['🚏', ['Bus Stop', 'Bus station']],
  ['👩‍🎓', ['Court house']],
  ['👨‍🚒', ['Fire station']],
  ['⚰', ['Grave yard']],
  ['📚', ['Library']],
  ['⛪', ['Place of Worship']],
  ['👮‍', ['Police station']],
  ['📫', ['Post Box', 'Post office']],
  ['🚂', ['Railway']],
  ['🏫', ['School', 'University']],
  ['🚇', ['Subway Entrance']],
  ['💉', ['Hospital', 'Veterinary']],
  ['💊', ['Pharmacy']],
  ['🎪', ['Attraction']],
  ['🌳', ['Park', 'Picnic spot', 'Significant tree']],
  ['🎭', ['Theater']],
  ['🏬', ['Building', 'Residential', 'Tower', 'Townhall']],
  ['🏩', ['Hotel']],
  ['🏦', ['ATM', 'Bank']],
  ['🏀', ['Basketball', 'Sports Center']],
  ['🏟', ['Stadium']],
  ['🏊‍', ['Swimming']],
  ['🎾', ['Tennis']],
  ['🗺', ['Information source', 'Peak']],
  ['🏛', ['Museum']]
  ];
  for (var i = 0; i < emojis.length; i++) {
    for (var j = 0; j < emojis[i][1].length; j++) {
      if (name.includes(emojis[i][1][j])) {
        return emojis[i][0];
      }
    }
  }
  return "🔵"
}
// Get the POINS DATA and add markerpoints (emoji) to the map
features_link = "http://data.codefordc.org/dataset/511db4d1-d4ae-437c-a5a0-3794e9a8f608/resource/e3b4476c-3d96-461a-baea-d9b54752ab41/download/district-of-columbia-poi.geojson"
d3.json(features_link, function (data) {
   let i;
  const features = data.features;
//features.length
  let category = features[i].properties.CATEGORY;
  const markers_dict = {};
  for (i = 0; i < features.length; i++) {
    const name = features[i].properties.NAME;
    const coord = features[i].geometry.coordinates;
    if (category in markers_dict) {
      markers_dict[category].push(L.marker([coord[1], coord[0]], { icon: L.divIcon({ html: getEmoji(name) }) }).bindPopup(name));
    } else {
      markers_dict[category] = [L.marker([coord[1], coord[0]], { icon: L.divIcon({ html: getEmoji(name) }) }).bindPopup(name)];
    }
  }
  const overlayMaps = {};
  let layerGrList = [];
  for (category in markers_dict) {
    overlayMaps[category] = L.layerGroup(markers_dict[category]);
    layerGrList.push(L.layerGroup(markers_dict[category]));
  }

  const baseMap = {"streetMap": street};

  L.control.layers(baseMap, overlayMaps, {
    collapsed: false
  }).addTo(map);
});

//WARDS and CENSUS DATA 
census_link = "https://opendata.arcgis.com/datasets/0ef47379cbae44e88267c01eaec2ff6e_31.geojson";
d3.json(census_link, function (data) {
  L.geoJson(data, {
    onEachFeature: function (feature, layer) {
      //Add div tags to the Ward Popups. Here is where the plots will go
      layer.bindPopup('<div id=plots>\
      <div id="pie"></div>\
      <div id="bar"></div></div>\
      <script src="plots.js"></script>\
      <p style="height:900px; width:900px">static content</p>',
        { maxWidth: 800, maxHeight: 400 });
      layer.on({
        mouseover: function (event) {
          layer = event.target;
          layer.setStyle({ fillOpacity: 0.9 });
        },
        mouseout: function (event) {
          layer = event.target;
          layer.setStyle({ fillOpacity: 0.2 });
        },
        click: function onMarkerClick(e) {
          // Every time the user clicks on a ward, plots will show up;
          d3.select('.pie').html("");
          d3.select('.bar').html("");
          let ward = feature.properties
          // Pie Chart
          const black = parseInt(ward.POP_BLACK);
          const native = parseInt(ward.POP_NATIVE_AMERICAN);
          const asian = parseInt(ward.POP_ASIAN);
          const hawaii = parseInt(ward.POP_HAWAIIAN);
          const other = parseInt(ward.POP_OTHER_RACE);
          const hispanic = parseInt(ward.HISPANIC_OR_LATINO);
          const white = parseInt(ward.POP_2011_2015) - (black + native + asian + hawaii + other);
          const trace1 = [{
            values: [white, black, hispanic, native, asian, hawaii, other],
            labels: ["White", "Black/African American", "Hispanic/Latino", "Native American", "Asian", "Hawaiian", "other"],
            type: "pie"
          }];
          const layout = {
            height: 400,
            width: 600,
            title: ward.NAME.concat(" Demographics"),
          };
          Plotly.plot("pie", trace1, layout);

          //Bar Chart
          const ages_category = ["AGE_5_9", "AGE_10_14", "AGE_15_17", "AGE_18_19", "AGE_20", "AGE_21", "AGE_22_24", "AGE_25_29",
            "AGE_30_34", "AGE_35_39", "AGE_40_44", "AGE_45_49", "AGE_50_54", "AGE_55_59", "AGE_60_61", "AGE_65_66",
            "AGE_67_69", "AGE_70_74", "AGE_75_79", "AGE_80_84", "AGE_85_PLUS"];
          const ages_counts = [];
          for (let i = 0; i < ages_category.length; i++) {
            ages_counts.push(ward[ages_category[i]]);
          }
          const trace2 = {
            x: ages_category,
            y: ages_counts,
            type: "bar"
          };
          const data = [trace2];
          const layout2 = {
            title: ward.NAME.concat(" Age Group")
          };
          Plotly.newPlot("bar", data, layout2);

          //Set the contents of the popup
          const popup = e.target.getPopup();
          const chart_div = document.getElementById("plots");
          popup.setContent(chart_div);

          popup._closeButton.onclick = function () {
            d3.select('.pie').html("");
            d3.select('.bar').html("");
          }
        }
      });
    }
  }).addTo(map);

})
