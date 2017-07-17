// GoogleMaps function:
function initMap() {
  var locations = [
     ['Mayo Clinic', 433.659101, -111.956419, 1],
     ['Cleveland Clinic', 41.502910, -81.620959, 2],
     ['Boulder Community Hospital', 40.016672, -105.236239, 3],
     ['Johns Hopkins', 39.298154, -76.594253, 4],
     ['Tufts Medical Center', 42.353467, -71.062980, 4]
  ];
  var uluru = {lat: 40.015, lng: -105.271};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: uluru
  });
  var infowindow = new google.maps.InfoWindow;
  var marker, i;
  var geocoder = new google.maps.Geocoder();
  document.getElementById('submit').addEventListener('click', function() {
    geocodeAddress(geocoder, map);
  });
  var marker = new google.maps.Marker({
    position: uluru,
    map: map
  });
  for (i = 0; i < locations.length; i++) {  
    marker = new google.maps.Marker({
         position: new google.maps.LatLng(locations[i][1], locations[i][2]),
         map: map
    });

    google.maps.event.addListener(marker, 'click', (function(marker, i) {
         return function() {
             infowindow.setContent(locations[i][0]);
             infowindow.open(map, marker);
         }
    })(marker, i));
  }
}
function geocodeAddress(geocoder, resultsMap) {
  var address = document.getElementById('address').value;
  geocoder.geocode({'address': address}, function(results, status) {
    if (status === 'OK') {
      var filtered_array = results[0].address_components.filter(function(address_component){
        return address_component.types.includes("country");
      }); 
      var country_long = filtered_array.length ? filtered_array[0].long_name: "";
      var country_short = filtered_array.length ? filtered_array[0].short_name: "";
      console.log("country_long: ",country_long);
      console.log("country_short: ",country_short);
      resultsMap.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
        map: resultsMap,
        position: results[0].geometry.location
      });
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}
