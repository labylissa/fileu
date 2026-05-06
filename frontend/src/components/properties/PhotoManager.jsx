import { useState, useRef } from "react";
import { Upload, X, Star, Trash2, ImagePlus } from "lucide-react";
import { clsx } from "clsx";
import { propertiesApi } from "../../api/client";
import { Spinner } from "../ui/index.jsx";

export default function PhotoManager({ propertyId, photos = [], onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  const handleFiles = async (files) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of list) {
        await propertiesApi.uploadPhoto(propertyId, file);
      }
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.detail ?? "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (photoId) => {
    try {
      await propertiesApi.deletePhoto(propertyId, photoId);
      onUpdate();
    } catch {
      setError("Impossible de supprimer la photo");
    }
  };

  const handleSetCover = async (photoId) => {
    try {
      await propertiesApi.setCover(propertyId, photoId);
      onUpdate();
    } catch {
      setError("Impossible de définir la couverture");
    }
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4",
          uploading
            ? "border-blue-300 bg-blue-50"
            : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner className="w-8 h-8" />
            <p className="text-sm text-blue-600">Upload en cours…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <ImagePlus size={32} />
            <p className="text-sm font-medium text-gray-600">Glissez vos photos ici</p>
            <p className="text-xs">ou cliquez pour sélectionner (JPEG, PNG, WebP — max 10 MB)</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Grid photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((photo) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-video">
                <img
                  src={photo.thumbnail_url || photo.url}
                  alt={photo.caption ?? ""}
                  className="w-full h-full object-cover"
                />
                {/* Cover badge */}
                {photo.is_cover && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> Couverture
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!photo.is_cover && (
                    <button
                      onClick={() => handleSetCover(photo.id)}
                      className="bg-yellow-400 text-yellow-900 rounded-full p-1.5 hover:bg-yellow-300 transition-colors"
                      title="Définir comme couverture"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <p className="text-center text-sm text-gray-400 py-4">Aucune photo pour ce bien</p>
      )}
    </div>
  );
}
