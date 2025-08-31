"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PIN_TYPE } from "@/constants/enum";

// Remove default icon URLs for Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  created_at?: string;
  updated_at?: string;
  user_agent?: string;
  type: PIN_TYPE;
  ip_address?: string;
}

const TYPE_CONFIG: Record<PIN_TYPE, { color: string; desc: string; message: string; borderColor: string }> = {
  [PIN_TYPE.SIDEWALK_OR_MOTORBIKE]: {
    color: "#16a34a",
    borderColor: "white",
    desc: "Motorbike on Sidewalk",
    message: "🚗 Motorbike reported on sidewalk!",
  },
  [PIN_TYPE.ZEBRA_CROSSING_MISUSE]: {
    color: "#2563eb",
    borderColor: "white",
    desc: "Zebra Crossing Misuse",
    message: "🚶 Zebra crossing misuse detected!",
  },
  [PIN_TYPE.WRONG_DIRECTION]: {
    color: "#facc15",
    borderColor: "#4f4f4f",
    desc: "Wrong Direction",
    message: "↔️ Wrong direction driving!",
  },
  [PIN_TYPE.TRAFFIC_LIGHT_BLINDNESS]: {
    color: "#dc2626",
    borderColor: "white",
    desc: "Traffic Light Blindness",
    message: "🚦 Traffic light blindness incident!",
  },
};

const getTypeConfig = (type: PIN_TYPE) =>
  TYPE_CONFIG[type] || {
    color: "#ec4899",
    desc: "Unknown",
    message: "⚠️ Unknown event type.",
  };

const getVehicleIconHtml = (type: PIN_TYPE) => {
  const { color, borderColor } = getTypeConfig(type);
  return `
		<div style="
			background: ${color};
			width: 40px;
			height: 40px;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 2px solid ${borderColor};
			box-shadow: 0 1px 5px rgba(0,0,0,0.3);
			animation: bounce 2s infinite;
		">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="${borderColor}" xmlns="http://www.w3.org/2000/svg">
				<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H15V4C15 2.9 14.1 2 13 2H11C9.9 2 9 2.9 9 4V5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM11 4H13V5H11V4ZM6.5 16C5.67 16 5 15.33 5 14.5S5.67 13 6.5 13 8 13.67 8 14.5 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5S16.67 13 17.5 13 19 13.67 19 14.5 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z"/>
			</svg>
		</div>
		<style>
			@keyframes bounce {
				0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
				40% { transform: translateY(-10px); }
				60% { transform: translateY(-5px); }
			}
		</style>
	`;
};

const createVehicleIcon = (type: PIN_TYPE) =>
  L.divIcon({
    html: getVehicleIconHtml(type),
    className: "custom-vehicle-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });

interface MapProps {
  locations: Location[];
}

const getPopupContent = (location: Location) => {
  const { desc, message } = getTypeConfig(location.type);

  return `
		<div class="p-3 text-center">
			<div class="flex items-center justify-center gap-2 mb-2">
				<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H15V4C15 2.9 14.1 2 13 2H11C9.9 2 9 2.9 9 4V5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM11 4H13V5H11V4ZM6.5 16C5.67 16 5 15.33 5 14.5S5.67 13 6.5 13 8 13.67 8 14.5 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5S16.67 13 17.5 13 19 13.67 19 14.5 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z"/>
				</svg>
				<p class="font-bold">${desc}</p>
			</div>
			<p class="text-xs">Journey ID: ${location.id}</p>
			<p class="text-sm text-gray-700 font-medium">
				${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
			</p>
			<p class="text-xs mt-1 font-medium">
				${message}
			</p>
		</div>
	`;
};

export default function Map({ locations }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    const mapEl = mapRef.current;
    if (!mapEl) return;

    // Initialize map once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapEl).setView([13.7563, 100.5018], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(mapInstanceRef.current);
    }

    // Remove previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    // Add markers for locations
    if (locations.length) {
      const markers = locations.map((loc) =>
        L.marker([loc.latitude, loc.longitude], { icon: createVehicleIcon(loc.type) })
          .bindPopup(getPopupContent(loc))
          .addTo(mapInstanceRef.current!)
      );
      markersRef.current = markers;

      navigator.geolocation.getCurrentPosition((pos) => {
        console.log("🏳️", pos)
        const userLatLng: [number, number] = [pos.coords.latitude, pos.coords.longitude];

        const userMarker = L.marker(userLatLng, {
          icon: L.divIcon({
            html: `
                  <div style="
                    width:20px;
                    height:20px;
                    border-radius:50%;
                    background:#2563eb;
                    border:2px solid white;
                    animation: blink 1.2s infinite ease-in-out;
                  ">

                  </div>
                  <style>
                    @keyframes blink {
                      0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                      }
                      50% {
                        opacity: 0.5;
                        transform: scale(1.2);
                      }
                    }
                  </style>
            `,
            className: "",
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).bindPopup("📍 You are here")
          .openPopup();

        userMarker.addTo(mapInstanceRef.current!);
        markers.push(userMarker);

        // Fit map to include both user location + pins
        const group = L.featureGroup([userMarker]);
        mapInstanceRef.current!.fitBounds(group.getBounds().pad(0.1));
      });

      // Fit bounds to markers
      // const group = L.featureGroup(markers);
      // mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [locations]);

  return <div ref={mapRef} className="w-full h-full" />;
}
