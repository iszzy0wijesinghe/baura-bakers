import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  uploadImageFileToCloudinary,
  uploadImageUrlToCloudinary,
} from "../../lib/cloudinary";

type ImageUploadValue = {
  imageUrl: string;
  imagePublicId: string;
};

type ImageUploadFieldProps = {
  label: string;
  value: ImageUploadValue;
  folder: string;
  helperText?: string;
  onChange: (value: ImageUploadValue) => void;
};

export default function ImageUploadField({
  label,
  value,
  folder,
  helperText,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [imageUrlText, setImageUrlText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorText, setErrorText] = useState("");

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorText("Please select an image file.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setErrorText("");

      const result = await uploadImageFileToCloudinary(file, {
        folder,
        tags: ["baura-bakers"],
        onProgress: setUploadProgress,
      });

      onChange({
        imageUrl: result.secureUrl,
        imagePublicId: result.publicId,
      });

      setUploadProgress(100);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function uploadPastedUrl() {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setErrorText("");

      const result = await uploadImageUrlToCloudinary(imageUrlText, {
        folder,
        tags: ["baura-bakers"],
      });

      onChange({
        imageUrl: result.secureUrl,
        imagePublicId: result.publicId,
      });

      setImageUrlText("");
      setUploadProgress(100);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Image URL upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      uploadFile(file);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      uploadFile(file);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-ink/60">
          {label}
        </p>

        {helperText && (
          <p className="mt-1 text-xs leading-5 text-brand-ink/55">
            {helperText}
          </p>
        )}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          "rounded-3xl border border-dashed p-4 transition",
          isDragging
            ? "border-brand-ink bg-white/80"
            : "border-brand-ink/20 bg-white/50",
        ].join(" ")}
      >
        <div className="grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
          <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-brand-ink/10 bg-brand-bg/70">
            {value.imageUrl ? (
              <img
                src={value.imageUrl}
                alt={label}
                className="h-full w-full object-contain p-3"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-9 w-9 text-brand-ink/35"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
                <path d="M12 4v11" />
                <path d="m8 8 4-4 4 4" />
              </svg>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="rounded-2xl bg-brand-ink px-4 py-2.5 text-xs font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/45"
              >
                {isUploading ? "Uploading..." : "Choose image"}
              </button>

              <button
                type="button"
                onClick={() =>
                  onChange({
                    imageUrl: "",
                    imagePublicId: "",
                  })
                }
                disabled={isUploading || !value.imageUrl}
                className="rounded-2xl border border-brand-ink/15 bg-white/65 px-4 py-2.5 text-xs font-semibold text-brand-ink/65 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remove
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={imageUrlText}
                onChange={(event) => setImageUrlText(event.target.value)}
                className="w-full rounded-2xl border border-brand-ink/10 bg-white/70 px-4 py-2.5 text-xs font-medium text-brand-ink outline-none placeholder:text-brand-ink/35 focus:border-brand-ink/25 focus:ring-2 focus:ring-brand-ink/10"
                placeholder="Paste image URL, then upload to Cloudinary"
              />

              <button
                type="button"
                onClick={uploadPastedUrl}
                disabled={isUploading || !imageUrlText.trim()}
                className="rounded-2xl border border-brand-ink/15 bg-white/75 px-4 py-2.5 text-xs font-semibold text-brand-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                Upload URL
              </button>
            </div>

            <p className="text-xs leading-5 text-brand-ink/45">
              Drag & drop, local file select, or paste an image URL. The image
              uploads to Cloudinary and only the Cloudinary URL is saved.
            </p>
          </div>
        </div>

        {isUploading && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-ink/10">
            <div
              className="h-full rounded-full bg-brand-ink transition-all"
              style={{ width: `${uploadProgress || 35}%` }}
            />
          </div>
        )}

        {errorText && (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {errorText}
          </div>
        )}
      </div>

      {value.imageUrl && (
        <div className="rounded-2xl border border-brand-ink/10 bg-white/50 px-4 py-3">
          <p className="break-all text-xs text-brand-ink/55">
            {value.imageUrl}
          </p>
        </div>
      )}
    </div>
  );
}