export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};

type UploadOptions = {
  folder?: string;
  tags?: string[];
  onProgress?: (progress: number) => void;
};

function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as
    | string
    | undefined;

  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as
    | string
    | undefined;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file.",
    );
  }

  return {
    cloudName,
    uploadPreset,
    endpoint: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  };
}

function normalizeCloudinaryResponse(data: any): CloudinaryUploadResult {
  if (!data?.secure_url || !data?.public_id) {
    throw new Error("Cloudinary upload failed. No image URL returned.");
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
}

export function uploadImageFileToCloudinary(
  file: File,
  options: UploadOptions = {},
): Promise<CloudinaryUploadResult> {
  const { endpoint, uploadPreset } = getCloudinaryConfig();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  if (options.folder) {
    formData.append("folder", options.folder);
  }

  if (options.tags?.length) {
    formData.append("tags", options.tags.join(","));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", endpoint);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !options.onProgress) return;

      const progress = Math.round((event.loaded / event.total) * 100);
      options.onProgress(progress);
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);

        if (xhr.status < 200 || xhr.status >= 300) {
          reject(
            new Error(
              data?.error?.message || "Cloudinary upload failed. Try again.",
            ),
          );
          return;
        }

        resolve(normalizeCloudinaryResponse(data));
      } catch {
        reject(new Error("Could not read Cloudinary upload response."));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Cloudinary upload failed. Check your connection."));
    };

    xhr.send(formData);
  });
}

export async function uploadImageUrlToCloudinary(
  imageUrl: string,
  options: UploadOptions = {},
): Promise<CloudinaryUploadResult> {
  const { endpoint, uploadPreset } = getCloudinaryConfig();

  const cleanUrl = imageUrl.trim();

  if (!cleanUrl) {
    throw new Error("Please paste an image URL.");
  }

  const formData = new FormData();
  formData.append("file", cleanUrl);
  formData.append("upload_preset", uploadPreset);

  if (options.folder) {
    formData.append("folder", options.folder);
  }

  if (options.tags?.length) {
    formData.append("tags", options.tags.join(","));
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Cloudinary URL upload failed. Try again.",
    );
  }

  return normalizeCloudinaryResponse(data);
}