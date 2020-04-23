var GeoFences = (function () {
    function GeoFences() {
        this.markersFence = new Array();
    }
    GeoFences.prototype.deviceReady = function () {
        var defaultLatLng = new google.maps.LatLng(14.645866, -90.55291745);
        var self = this;
        try {
            var sondaDbSession = window.openDatabase("MY_FENCE_ROUTE", "1.0", "MY_FENCE_ROUTE", 10000000);
            sondaDbSession.transaction(function (tx) {
                tx.executeSql('DROP TABLE IF EXISTS MY_FENCES');
                tx.executeSql('CREATE TABLE IF NOT EXISTS MY_FENCES(FENCE_INDEX, POSITION)');
            }, function (err) {
                alert(err.message);
            }, function () {
                if (navigator.geolocation) {
                    var success = function (pos) {
                        self.drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                    };
                    var fail = function () {
                        self.drawMap(defaultLatLng);
                    };
                    navigator.geolocation.getCurrentPosition(success, fail, { maximumAge: 500000, enableHighAccuracy: true, timeout: 6000 });
                }
                else {
                    self.drawMap(defaultLatLng);
                }
            });
        }
        catch (e) {
            notify("error en el ready:" + e.message);
        }
    };
    GeoFences.prototype.drawMap = function (latlng) {
        var _this = this;
        var myOptions = {
            zoom: 18,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
        map.addListener('click', function (e) {
            _this.placeMarkerAndPanTo(e.latLng, map);
        });
        var marker = new google.maps.Marker({
            position: latlng,
            icon: 'http://www.google.com/mapfiles/arrow.png',
            map: map,
            title: "Greetings!"
        });
        marker.addListener('click', function () {
            map.setZoom(8);
            map.setCenter(marker.getPosition());
        });
    };
    GeoFences.prototype.placeMarkerAndPanTo = function (latLng, map) {
        var xindex = this.markersFence.length + 1;
        var iconname = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=' + xindex + '|00FF00|000000';
        var marker = new google.maps.Marker({
            position: latLng,
            icon: iconname,
            map: map
        });
        map.panTo(latLng);
        this.markersFence.push(marker);
    };
    return GeoFences;
}());
//# sourceMappingURL=GeoFences.js.map