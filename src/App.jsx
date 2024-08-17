import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { startIcon, endIcon } from './Icons';

// موقعیت مرکزی نقشه (تهران)
const center = [35.6892, 51.3890];

// قیمت به ازای هر کیلومتر
const pricePerKm = 4500;

// کامپوننت برای زوم کردن به موقعیت خاص
function ZoomToLocation({ position }) {
  const map = useMap();

  React.useEffect(() => {
    if (position) {
      map.flyTo(position, 16); // زوم به موقعیت و تغییر لول زوم
    }
  }, [position, map]);

  return null;
}

function App() {
  const [origin, setOrigin] = useState(null); // ذخیره موقعیت مبدا
  const [destination, setDestination] = useState(null); // ذخیره موقعیت مقصد
  const [distance, setDistance] = useState(null); // ذخیره فاصله
  const [price, setPrice] = useState(null); // ذخیره قیمت
  const [editMode, setEditMode] = useState(false); // حالت ویرایش
  const [userLocation, setUserLocation] = useState(null); // ذخیره موقعیت کاربر

  // محاسبه فاصله بین مبدا و مقصد
  const calculateDistance = (origin, destination) => {
    const R = 6371; // شعاع زمین بر حسب کیلومتر
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180; // اختلاف عرض جغرافیایی
    const dLng = ((destination.lng - origin.lng) * Math.PI) / 180; // اختلاف طول جغرافیایی
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // فاصله بر حسب کیلومتر

    if (d > 60) {
      alert('خطا: فاصله بیشتر از 60 کیلومتر است.');
      handleEditClick(); // برگشت به حالت ویرایش
    } else {
      return d.toFixed(2); // برگرداندن فاصله با دقت دو رقم اعشار
    }
  };

  // محاسبه موقعیت مقصد با 1 کیلومتر فاصله از مبدا
  const calculateDestination = (origin, distanceKm, bearing) => {
    const R = 6371; // شعاع زمین بر حسب کیلومتر
    const d = distanceKm / R; // فاصله تقسیم بر شعاع
    const bearingRad = (bearing * Math.PI) / 180; // تبدیل به رادیان
    const lat1 = (origin.lat * Math.PI) / 180; // تبدیل به رادیان
    const lng1 = (origin.lng * Math.PI) / 180; // تبدیل به رادیان

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

  // وقتی کاربر روی دکمه "انتخاب مبدا" کلیک می‌کند
  const handleOriginClick = () => {
    const originCoords = { lat: 35.68839378384561, lng: 51.39163970947266 };
    setOrigin(originCoords);

    if (destination) {
      const dist = calculateDistance(originCoords, destination);
      setDistance(dist);
      setPrice(dist * pricePerKm);
    }
  };

  // وقتی کاربر روی دکمه "انتخاب مقصد" کلیک می‌کند
  const handleDestinationClick = () => {
    if (origin) {
      const bearing = 90; // 90 درجه به معنای حرکت به سمت شرق
      const destinationCoords = calculateDestination(origin, 1, bearing); // محاسبه موقعیت مقصد با 1 کیلومتر فاصله
      const dist = calculateDistance(origin, destinationCoords); // محاسبه فاصله
      setDistance(dist); // ذخیره فاصله
      setPrice(dist * pricePerKm); // ذخیره قیمت
      setDestination(destinationCoords); // ذخیره موقعیت مقصد
    }
  };

  // وقتی کاربر روی دکمه "ویرایش" کلیک می‌کند
  const handleEditClick = () => {
    setEditMode(true); // فعال کردن حالت ویرایش
    setOrigin(null); // پاک کردن مبدا
    setDestination(null); // پاک کردن مقصد
    setDistance(null); // پاک کردن فاصله
    setPrice(null); // پاک کردن قیمت
    setEditMode(false); // غیرفعال کردن حالت ویرایش
  };

  // دریافت موقعیت مکانی کاربر
  const handleMyLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userCoords);
          setOrigin(userCoords); // تنظیم مبدا به موقعیت کاربر
          map.flyTo(userCoords, 16); // پرش به موقعیت کاربر
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
            <Popup closeOnEscapeKey={false} autoClose={false} closeOnClick={false} >
              مقصد
            </Popup>
          </Marker>
        )}
        <ZoomToLocation position={origin} />
        <ZoomToLocation position={destination} />
        <ZoomToLocation position={userLocation} />
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
