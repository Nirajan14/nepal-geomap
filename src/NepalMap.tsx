import { useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet marker icon fix
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// GeoJSON Data
import provincesData from "./data/provinces.json";
import districtsData from "./data/districts.json";
import municipalitiesData from "./data/municipalities.json";

// Province Colors
const provinceColors = [
  "#FF6B6B",
  "#ffce00",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9B59B6",
];

export default function NepalMap() {
  const [showMunicipalities, setShowMunicipalities] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Nepal Bounds
  const nepalBounds = L.latLngBounds(
    [26.35, 80.05],
    [30.45, 88.20]
  );

  // ----------------------------
  // ✅ MASK OUTSIDE NEPAL
  // ----------------------------
  const nepalMask: any = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        // Outer world rectangle
        [
          [-180, -90],
          [-180, 90],
          [180, 90],
          [180, -90],
          [-180, -90],
        ],

        // Inner hole: Nepal boundary (all provinces merged)
        ...provincesData.features.flatMap(
          (f: any) => f.geometry.coordinates
        ),
      ],
    },
  };

  // ----------------------------
  // Styles
  // ----------------------------
  const provinceStyle = (feature?: any) => {
    const code =
      feature?.properties?.province_code ||
      feature?.properties?.PROVINCE ||
      "1";

    const index = parseInt(code, 10) - 1;

    return {
      fillColor: provinceColors[index % 7],
      weight: 2,
      color: "#222",
      fillOpacity: 0.65,
    };
  };

  const districtStyle = () => ({
    fillColor: "transparent",
    weight: 1.2,
    color: "#444",
  });

  const municipalityStyle = () => ({
    fillColor: "transparent",
    weight: 0.6,
    color: "#1e60a9",
    opacity: 0.6,
  });

  // ----------------------------
  // Tooltip Helpers
  // ----------------------------
  const getProvinceName = (props: any) =>
    props?.province_name_en || props?.PROVINCE_NAME || "Province";

  const getDistrictName = (props: any) =>
    props?.district_name_en || props?.DISTRICT || "District";

  const getMunicipalityName = (props: any) =>
    props?.gapa_napa || props?.municipality_name_en || "Local Level";

  // ----------------------------
  // Feature Events
  // ----------------------------
  const onEachProvince = (feature: any, layer: any) => {
    const name = getProvinceName(feature.properties);

    layer.bindTooltip(name, {
      permanent: false,
      direction: "center",
      className: "province-label",
    });

    layer.on({
      mouseover: (e: any) => {
        e.target.setStyle({
          weight: 4,
          color: "#000",
          fillOpacity: 0.8,
        });
      },
      mouseout: (e: any) => {
        e.target.setStyle(provinceStyle(feature));
      },
    });
  };

  const onEachDistrict = (feature: any, layer: any) => {
    const name = getDistrictName(feature.properties);

    layer.bindPopup(`<strong>${name}</strong>`);
  };

  const onEachMunicipality = (feature: any, layer: any) => {
    const name = getMunicipalityName(feature.properties);

    layer.bindPopup(`<strong>${name}</strong>`);
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer
        center={[28.4, 84.1]}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        maxBounds={nepalBounds}
        minZoom={6}
        maxZoom={15}
        whenCreated={(map) => {
          mapRef.current = map;
          map.fitBounds(nepalBounds);
        }}
      >
        {/* Base Tiles */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* ✅ White Mask Outside Nepal */}
        <GeoJSON
          data={nepalMask}
          style={{
            fillColor: "white",
            fillOpacity: 1,
            stroke: false,
          }}
        />

        {/* Provinces */}
        <GeoJSON
          data={provincesData}
          style={provinceStyle}
          onEachFeature={onEachProvince}
        />

        {/* District Borders */}
        <GeoJSON
          data={districtsData}
          style={districtStyle}
          onEachFeature={onEachDistrict}
        />

        {/* Municipalities Toggle */}
        {showMunicipalities && (
          <GeoJSON
            data={municipalitiesData}
            style={municipalityStyle}
            onEachFeature={onEachMunicipality}
          />
        )}
      </MapContainer>

      {/* Toggle Button */}
      <button
        onClick={() => setShowMunicipalities(!showMunicipalities)}
        style={{
          position: "absolute",
          top: 15,
          right: 15,
          zIndex: 1000,
          padding: "10px 18px",
          background: "white",
          border: "1px solid #444",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {showMunicipalities
          ? "Hide Municipalities"
          : "Show Municipalities"}
      </button>
    </div>
  );
}
