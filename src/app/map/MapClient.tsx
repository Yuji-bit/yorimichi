"use client";

import { useState, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import { Plus, X } from "lucide-react";
import type { Place } from "@/types";
import PlacePanel from "@/components/map/PlacePanel";
import AddPlaceForm from "@/components/map/AddPlaceForm";
import { findOrCreatePlace } from "@/app/actions/places";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-stone-100">
      <p className="text-stone-400 text-sm">地図を読み込み中...</p>
    </div>
  ),
});

type ClickedLocation = { lat: number; lng: number; address: string };
type PoiInfo = { name: string; lat: number; lng: number; category?: string };

type Props = {
  places: Place[];
  currentUserId: string | null;
};

export default function MapClient({ places, currentUserId }: Props) {
  const [allPlaces, setAllPlaces] = useState<Place[]>(places);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<ClickedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handlePlaceClick = useCallback((placeId: string) => {
    const place = allPlaces.find((p) => p.id === placeId) ?? null;
    setSelectedPlace(place);
  }, [allPlaces]);

  // Mapbox既存POIクリック → 自動でDB登録 or 既存を開く
  const handlePoiClick = useCallback((poi: PoiInfo) => {
    if (addMode) return;
    setIsLoading(true);
    startTransition(async () => {
      const result = await findOrCreatePlace(poi);
      if (result.place) {
        // 既存リストに含まれていなければ追加
        setAllPlaces((prev) => {
          const exists = prev.some((p) => p.id === result.place.id);
          return exists ? prev : [...prev, result.place as Place];
        });
        setSelectedPlace(result.place as Place);
      }
      setIsLoading(false);
    });
  }, [addMode]);

  const handleMapClick = useCallback((location: ClickedLocation) => {
    setClickedLocation(location);
    setSelectedPlace(null);
  }, []);

  const handleAddModeToggle = () => {
    setAddMode((v) => !v);
    setClickedLocation(null);
    setSelectedPlace(null);
  };

  const handleFormClose = () => {
    setClickedLocation(null);
    setAddMode(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 relative">
        <MapView
          places={allPlaces}
          onPlaceClick={handlePlaceClick}
          onPoiClick={handlePoiClick}
          addMode={addMode}
          onMapClick={handleMapClick}
        />

        {/* ローディング表示 */}
        {(isLoading || isPending) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-stone-200 rounded-full px-4 py-2 text-sm text-stone-600 shadow z-10 flex items-center gap-2">
            <span className="animate-spin">⏳</span> 場所を確認中...
          </div>
        )}

        {/* 場所追加ボタン */}
        {currentUserId && (
          <button
            onClick={handleAddModeToggle}
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 shadow-lg rounded-full px-4 py-2.5 text-sm font-medium transition-colors z-10 ${
              addMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            {addMode ? (
              <><X size={16} /> クリックして場所を選ぶ（キャンセル）</>
            ) : (
              <><Plus size={16} className="text-green-600" /> 場所を追加</>
            )}
          </button>
        )}

        {/* 追加モード中のガイド */}
        {addMode && !clickedLocation && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-sm rounded-full px-4 py-2 shadow z-10">
            追加したい場所をクリックしてください
          </div>
        )}
      </div>

      {/* 場所パネル */}
      {selectedPlace && !addMode && (
        <div className="w-full sm:w-96 h-full overflow-y-auto bg-white border-l border-stone-200 shadow-lg absolute right-0 top-0 sm:relative z-20">
          <PlacePanel
            place={selectedPlace}
            currentUserId={currentUserId}
            onClose={() => setSelectedPlace(null)}
          />
        </div>
      )}

      {/* 手動追加フォーム */}
      {clickedLocation && (
        <AddPlaceForm
          lat={clickedLocation.lat}
          lng={clickedLocation.lng}
          address={clickedLocation.address}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
