import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import './App.css';
import { startIcon, endIcon } from './Icons';

const center = [35.6892, 51.3890];
const pricePerKm = 4500;

function ZoomToLocation({ position }) {
  const map = useMap();

  React.useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);

  return null;
}

function RoutingMachine({ origin, destination }) {
  const map = useMap();

  React.useEffect(() => {
    if (origin && destination) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(origin.lat, origin.lng),
          L.latLng(destination.lat, destination.lng)
        ],
        lineOptions: {
          styles: [{ color: 'purple', weight: 5 }] // تنظیم رنگ و ضخامت خط مسیر
        },
        createMarker: () => null // مخفی کردن مارکر‌های پیش‌فرض
      }).addTo(map);

      return () => {
        map.removeControl(routingControl);
      };
    }
  }, [origin, destination, map]);

  return null;
}

function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [price, setPrice] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const calculateDistance = (origin, destination) => {
    const R = 6371;
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
    const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    if (d > 60) {
      alert('خطا: فاصله بیشتر از 60 کیلومتر است.');
      handleEditClick();
    } else {
      return d.toFixed(2);
    }
  };

  const calculateDestination = (origin, distanceKm, bearing) => {
    const R = 6371;
    const d = distanceKm / R;
    const bearingRad = (bearing * Math.PI) / 180;
    const lat1 = (origin.lat * Math.PI) / 180;
    const lng1 = (origin.lng * Math.PI) / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad)
    );

    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
      );

    return {
      lat: (lat2 * 180) / Math.PI,
      lng: (lng2 * 180) / Math.PI,
    };
  };

  const handleOriginClick = () => {
    const originCoords = { lat: 35.68839378384561, lng: 51.39163970947266 };
    setOrigin(originCoords);

    if (destination) {
      const dist = calculateDistance(originCoords, destination);
      setDistance(dist);
      setPrice(dist * pricePerKm);
    }
  };

  const handleDestinationClick = () => {
    if (origin) {
      const bearing = 90;
      const destinationCoords = calculateDestination(origin, 1, bearing);
      const dist = calculateDistance(origin, destinationCoords);
      setDistance(dist);
      setPrice(dist * pricePerKm);
      setDestination(destinationCoords);
    }
  };

  const handleEditClick = () => {
    setEditMode(true);
    setOrigin(null);
    setDestination(null);
    setDistance(null);
    setPrice(null);
    setEditMode(false);
  };

  const handleMyLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userCoords);
          setOrigin(userCoords);
        },
        (error) => {
          alert('دریافت موقعیت مکانی ناموفق بود.');
        }
      );
    } else {
      alert('مرورگر شما از قابلیت موقعیت‌یابی پشتیبانی نمی‌کند.');
    }
  };




  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100vh', width: '100%' }}
      >
     <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {origin && (
          <Marker
            position={origin}
            draggable={true}
            icon={startIcon}
            eventHandlers={{
              dragend: (event) => {
                const newPos = event.target.getLatLng();
                setOrigin(newPos);
                if (destination) {
                  const dist = calculateDistance(newPos, destination);
                  setDistance(dist);
                  setPrice(dist * pricePerKm);
                }
              },
            }}
          >
            <Popup autoClose={false} closeOnClick={false} >
              مبدا
            </Popup>
          </Marker>
        )}
        {destination && (
          <Marker
            position={destination}
            draggable={true}
            icon={endIcon}
            eventHandlers={{
              dragend: (event) => {
                const newPos = event.target.getLatLng();
                setDestination(newPos);
                const dist = calculateDistance(origin, newPos);
                setDistance(dist);
                setPrice(dist * pricePerKm);
              },
            }}
         
          >
            <Popup  closeOnEscapeKey={false} autoClose={false} closeOnClick={false} >
              مقصد
            </Popup>
          </Marker>
        )}
        <ZoomToLocation position={origin} />
        <ZoomToLocation position={destination} />
        <ZoomToLocation position={userLocation} />
        {origin && destination && (
          <RoutingMachine origin={origin} destination={destination} />
        )}
      </MapContainer>
      <div className="bottom-box">
        <div>
          <button className='first-bottoms' onClick={handleOriginClick} disabled={editMode || !!origin}>
            انتخاب مبدا
          </button>
          <button onClick={handleDestinationClick} disabled={editMode || !origin || !!destination}>
            انتخاب مقصد
          </button>
        </div>
        <button className='my-locations-btn' onClick={handleMyLocationClick} disabled={editMode}>
          موقعیت من
        </button>
        {(origin || destination) && (
          <button onClick={handleEditClick} className="edit-button">
            ویرایش
          </button>
        )}
        {distance && (
          <div className='details-rout'>
            <div className="distance-box">
              طول مسیر: {distance !== "NaN" ? distance : 0} کیلومتر
            </div>
            <div className="distance-box">
              قیمت مسیر: {price ? price.toLocaleString() : 0} تومان
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
