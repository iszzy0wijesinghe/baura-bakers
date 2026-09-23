export type ImageDimensions = {
  width: number;
  height: number;
  aspectRatio: number;
};

function loadImage(
  url: string,
) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const image = new Image();

      image.crossOrigin =
        "anonymous";

      image.decoding =
        "async";

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        reject(
          new Error(
            "Could not load the uploaded image.",
          ),
        );
      };

      image.src = url;
    },
  );
}

export async function getImageDimensions(
  imageUrl: string,
): Promise<ImageDimensions> {
  const image =
    await loadImage(
      imageUrl,
    );

  return {
    width:
      image.naturalWidth,

    height:
      image.naturalHeight,

    aspectRatio:
      image.naturalWidth /
      image.naturalHeight,
  };
}