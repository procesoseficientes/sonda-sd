/// <reference path="../../../typings/tsd.d.ts" />

class GeoFences {
    markersFence: Array<google.maps.Marker> = new Array<google.maps.Marker>();

   deviceReady(): void {

        var defaultLatLng = new google.maps.LatLng(14.645866, -90.55291745);  // Default to Hollywood, CA when no geolocation support
        var self = this;
        try {
            var sondaDbSession = window.openDatabase("MY_FENCE_ROUTE", "1.0", "MY_FENCE_ROUTE", 10000000);//10mg

            sondaDbSession.transaction(tx => {
                tx.executeSql('DROP TABLE IF EXISTS MY_FENCES');
                tx.executeSql('CREATE TABLE IF NOT EXISTS MY_FENCES(FENCE_INDEX, POSITION)');
            }, err => {
                alert(err.message);
            },
                () => {
                    if (navigator.geolocation) {

                        const success = (pos: any)=> {
                            self.drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                        };
                        const fail = () => {
                            self.drawMap(defaultLatLng); // Failed to find location, show default map
                        };

                        navigator.geolocation.getCurrentPosition(success, fail, { maximumAge: 500000, enableHighAccuracy: true, timeout: 6000 });
                    } else {
                        self.drawMap(defaultLatLng);  // No geolocation support, show default map
                    }

                });


        } catch (e) {
            notify("error en el ready:" + e.message);
        }

    }

    drawMap(latlng: any) {
        var myOptions = {
            zoom: 18,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
        // Add an overlay to the map of current lat/lng

        map.addListener('click', e => {
            this.placeMarkerAndPanTo(e.latLng, map);
        });


        var marker = new google.maps.Marker({
            position: latlng,
            icon: 'http://www.google.com/mapfiles/arrow.png',
            map: map,
            title: "Greetings!"
        });

        marker.addListener('click', () => {
            map.setZoom(8);
            map.setCenter(marker.getPosition());
        });
    }

    placeMarkerAndPanTo(latLng: any, map: google.maps.Map) {
        //this.socket.emit('validatecredentials', { 'loginid': "oper1@granjazul", 'pin': "123" });
        var xindex = this.markersFence.length + 1;
        //var iconname = 'http://maps.google.com/mapfiles/kml/paddle/' + xindex + '-lv.png';
        var iconname = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=' + xindex + '|00FF00|000000';
        //alert(iconname);

        var marker = new google.maps.Marker({
            position: latLng,
            icon: iconname,
            map: map
        });
        map.panTo(latLng);

        this.markersFence.push(marker);
    }
}