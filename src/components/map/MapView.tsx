"use client";

import { useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Place } from "@/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const SAGA_CENTER: [number, number] = [130.2988, 33.2635];
const OSM_ZOOM_THRESHOLD = 12;

type ClickedLocation = { lat: number; lng: number; address: string };
type PoiInfo = { name: string; lat: number; lng: number; category?: string };
type OsmElement = {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

type Props = {
  places: Place[];
  onPlaceClick: (placeId: string) => void;
  onPoiClick?: (poi: PoiInfo) => void;
  addMode?: boolean;
  onMapClick?: (location: ClickedLocation) => void;
};

const OVERPASS_SERVERS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

async function fetchOsmPois(bounds: mapboxgl.LngLatBounds): Promise<OsmElement[]> {
  const s = bounds.getSouth().toFixed(5);
  const w = bounds.getWest().toFixed(5);
  const n = bounds.getNorth().toFixed(5);
  const e = bounds.getEast().toFixed(5);

  const query = `
    [out:json][timeout:20];
    (
      node["name"]["amenity"~"restaurant|cafe|bar|fast_food|pub|izakaya|bakery|ice_cream|onsen|spa|library|cinema|community_centre"](${s},${w},${n},${e});
      node["name"]["shop"~"convenience|supermarket|bakery|clothes|books|gift|souvenir"](${s},${w},${n},${e});
      node["name"]["tourism"~"attraction|museum|hotel|viewpoint|ryokan|guest_house"](${s},${w},${n},${e});
      node["name"]["historic"](${s},${w},${n},${e});
      node["name"]["leisure"~"park|garden|sports_centre"](${s},${w},${n},${e});
    );
    out body 100;
  `;

  for (const server of OVERPASS_SERVERS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(server, {
        method: "POST",
        body: query,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      return (data.elements ?? []) as OsmElement[];
    } catch {
      // 次のサーバーで再試行
    }
  }
  return [];
}

function getOsmName(tags: Record<string, string>): string {
  return tags["name:ja"] || tags["name"] || "";
}
function getOsmCategory(tags: Record<string, string>): string {
  return tags["amenity"] || tags["tourism"] || tags["historic"] || tags["shop"] || tags["leisure"] || "";
}

async function reverseGeocode(lng: number, lat: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=ja&types=address,poi,place`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name ?? "";
  } catch {
    return "";
  }
}

export default function MapView({ places, onPlaceClick, onPoiClick, addMode = false, onMapClick }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const registeredMarkers = useRef<mapboxgl.Marker[]>([]);
  const osmMarkers = useRef<mapboxgl.Marker[]>([]);
  const previewMarker = useRef<mapboxgl.Marker | null>(null);
  const addModeRef = useRef(addMode);
  const onPoiClickRef = useRef(onPoiClick);
  const onMapClickRef = useRef(onMapClick);
  const placesRef = useRef(places);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onPoiClickRef.current = onPoiClick; }, [onPoiClick]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  // placesが変わったら参照を更新 + OSMマーカーを再整理
  useEffect(() => {
    placesRef.current = places;
    refreshOsmMarkers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  useEffect(() => {
    addModeRef.current = addMode;
    if (map.current) map.current.getCanvas().style.cursor = addMode ? "crosshair" : "";
    if (!addMode && previewMarker.current) {
      previewMarker.current.remove();
      previewMarker.current = null;
    }
  }, [addMode]);

  // 既存のOSMマーカーのうち、登録済みになったものを削除（名前で判定）
  const refreshOsmMarkers = useCallback(() => {
    if (!map.current) return;
    const registeredNames = new Set(placesRef.current.map((p) => p.name));

    osmMarkers.current = osmMarkers.current.filter((marker) => {
      // markerのdata属性に名前を保存しているので取得
      const el = marker.getElement();
      const markerName = el.dataset.osmName ?? "";
      const isNowRegistered = registeredNames.has(markerName);
      if (isNowRegistered) {
        marker.remove();
        return false;
      }
      return true;
    });
  }, []);

  // Overpass APIを叩いてOSMマーカーを描画
  const updateOsmPois = useCallback(async () => {
    if (!map.current) return;
    const zoom = map.current.getZoom();

    if (zoom < OSM_ZOOM_THRESHOLD) {
      osmMarkers.current.forEach((m) => m.remove());
      osmMarkers.current = [];
      return;
    }

    const bounds = map.current.getBounds();
    if (!bounds) return;

    const elements = await fetchOsmPois(bounds);
    if (!map.current) return;

    // 既存のOSMマーカーを全削除して再描画
    osmMarkers.current.forEach((m) => m.remove());
    osmMarkers.current = [];

    const registeredNames = new Set(placesRef.current.map((p) => p.name));

    elements.forEach((el) => {
      const name = getOsmName(el.tags);
      if (!name) return;

      // 登録済みの場所と名前が一致すればスキップ
      if (registeredNames.has(name)) return;

      const category = getOsmCategory(el.tags);
      const div = document.createElement("div");
      div.className = "cursor-pointer group";
      div.dataset.osmName = name; // refreshOsmMarkersで使う
      div.innerHTML = `
        <div class="relative">
          <div class="w-6 h-6 rounded-full bg-white border-2 border-stone-400 shadow flex items-center justify-center text-stone-500 text-xs hover:border-green-500 hover:text-green-600 hover:scale-125 transition-all">＋</div>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-stone-800 text-white text-xs rounded px-2 py-1 shadow whitespace-nowrap z-50 pointer-events-none">${name}</div>
        </div>
      `;

      div.addEventListener("click", (e) => {
        if (addModeRef.current) return;
        e.stopPropagation();
        onPoiClickRef.current?.({ name, lat: el.lat, lng: el.lon, category });
      });

      const marker = new mapboxgl.Marker({ element: div })
        .setLngLat([el.lon, el.lat])
        .addTo(map.current!);

      osmMarkers.current.push(marker);
    });
  }, []);

  // デバウンス付きでOSM更新をスケジュール
  const scheduleOsmUpdate = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateOsmPois();
    }, 1200);
  }, [updateOsmPois]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: SAGA_CENTER,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(
      new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
      "top-right"
    );

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.current?.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 14,
            duration: 1500,
          });
        },
        () => {}
      );
    }

    map.current.on("moveend", scheduleOsmUpdate);
    map.current.on("zoomend", scheduleOsmUpdate);

    // スタイルがすでに読み込み済みなら即実行、そうでなければloadイベントを待つ
    if (map.current.isStyleLoaded()) {
      scheduleOsmUpdate();
    } else {
      map.current.on("load", scheduleOsmUpdate);
    }

    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      if (addModeRef.current && onMapClickRef.current) {
        if (previewMarker.current) previewMarker.current.remove();
        const el = document.createElement("div");
        el.innerHTML = `<div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-base">📌</div>`;
        previewMarker.current = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map.current!);
        const address = await reverseGeocode(lng, lat);
        onMapClickRef.current({ lat, lng, address });
      }
    });
  }, [scheduleOsmUpdate]);

  // 登録済み場所のマーカー
  const addRegisteredMarkers = useCallback(() => {
    if (!map.current) return;
    registeredMarkers.current.forEach((m) => m.remove());
    registeredMarkers.current = [];

    places.forEach((place) => {
      const el = document.createElement("div");
      el.className = "cursor-pointer";
      const hookCount = place.hooks?.length ?? 0;
      el.innerHTML = `
        <div class="relative group">
          <div class="w-8 h-8 rounded-full bg-green-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform">
            ${hookCount > 0 ? `<span>${hookCount}</span>` : "📍"}
          </div>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-white text-stone-800 text-xs rounded px-2 py-1 shadow whitespace-nowrap z-50">${place.name}</div>
        </div>
      `;

      el.addEventListener("click", (e) => {
        if (addModeRef.current) return;
        e.stopPropagation();
        onPlaceClick(place.id);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([place.lng, place.lat])
        .addTo(map.current!);

      registeredMarkers.current.push(marker);
    });
  }, [places, onPlaceClick]);

  useEffect(() => {
    if (!map.current) return;
    if (map.current.isStyleLoaded()) {
      addRegisteredMarkers();
    } else {
      map.current.on("load", addRegisteredMarkers);
    }
  }, [addRegisteredMarkers]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute bottom-16 right-3 bg-white rounded-lg shadow px-3 py-2 text-xs text-stone-600 space-y-1.5 z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-600 border border-white shadow-sm shrink-0" />
          <span>登録済みの場所</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-white border-2 border-stone-400 flex items-center justify-center text-stone-500 text-xs shrink-0">＋</div>
          <span>タップで追加できる場所</span>
        </div>
      </div>
    </div>
  );
}
