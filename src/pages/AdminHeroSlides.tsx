import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import ImageUploadField from "../components/admin/ImageUploadField";
import {
  createHeroSlide,
  deleteHeroSlide,
  EMPTY_HERO_SLIDE,
  getAdminHeroSlides,
  heroSlideToForm,
  toggleHeroSlide,
  updateHeroSlide,
  type AdminHeroSlide,
  type HeroImagePosition,
  type HeroSlideForm,
} from "../lib/adminHeroSlides";

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

type ArtworkInfo = {
  width: number;
  height: number;
  aspectRatio: number;
} | null;

const inputClass =
  "w-full rounded-2xl border border-brand-ink/10 bg-white/75 px-4 py-3 text-sm font-medium text-brand-ink outline-none transition placeholder:text-brand-ink/30 focus:border-brand-ink/25 focus:ring-2 focus:ring-brand-ink/10";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.14em] text-brand-ink/55";

function nextSortOrder(
  slides: AdminHeroSlide[],
) {
  if (!slides.length) {
    return 0;
  }

  return (
    Math.max(
      ...slides.map(
        (slide) =>
          slide.sortOrder,
      ),
    ) + 1
  );
}

function artworkQuality(
  info: ArtworkInfo,
) {
  if (!info) {
    return null;
  }

  if (
    info.width >= 2400 &&
    info.height >= 1350
  ) {
    return {
      label: "Ideal hero quality",
      className:
        "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  }

  if (
    info.width >= 1920 &&
    info.height >= 1080
  ) {
    return {
      label: "High resolution",
      className:
        "text-emerald-700 bg-emerald-50 border-emerald-200",
    };
  }

  if (
    info.width >= 1400 &&
    info.height >= 788
  ) {
    return {
      label: "Good resolution",
      className:
        "text-brand-ink/65 bg-white/60 border-brand-ink/10",
    };
  }

  return {
    label: "Low resolution",
    className:
      "text-amber-800 bg-amber-50 border-amber-200",
  };
}

function loadArtworkDimensions(
  imageUrl: string,
) {
  return new Promise<ArtworkInfo>(
    (resolve) => {
      if (!imageUrl) {
        resolve(null);
        return;
      }

      const image =
        new Image();

      image.onload = () => {
        if (
          !image.naturalWidth ||
          !image.naturalHeight
        ) {
          resolve(null);
          return;
        }

        resolve({
          width:
            image.naturalWidth,
          height:
            image.naturalHeight,
          aspectRatio:
            image.naturalWidth /
            image.naturalHeight,
        });
      };

      image.onerror = () => {
        resolve(null);
      };

      image.src =
        imageUrl;
    },
  );
}

export default function AdminHeroSlides() {
  const [slides, setSlides] =
    useState<
      AdminHeroSlide[]
    >([]);

  const [form, setForm] =
    useState<HeroSlideForm>({
      ...EMPTY_HERO_SLIDE,
    });

  const [
    artworkInfo,
    setArtworkInfo,
  ] =
    useState<ArtworkInfo>(
      null,
    );

  const [
    editingId,
    setEditingId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    isEditorOpen,
    setIsEditorOpen,
  ] =
    useState(false);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    isReadingImage,
    setIsReadingImage,
  ] =
    useState(false);

  const [busyId, setBusyId] =
    useState<number | null>(
      null,
    );

  const [notice, setNotice] =
    useState<Notice>(null);

  const sortedSlides =
    useMemo(
      () =>
        [...slides].sort(
          (a, b) =>
            a.sortOrder -
              b.sortOrder ||
            a.id - b.id,
        ),
      [slides],
    );

  const loadSlides =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setNotice(null);

          const result =
            await getAdminHeroSlides();

          setSlides(
            result,
          );
        } catch (error) {
          setNotice({
            type: "error",
            message:
              error instanceof
              Error
                ? error.message
                : "Could not load hero slides.",
          });
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    void loadSlides();
  }, [loadSlides]);

  function patchForm(
    patch: Partial<HeroSlideForm>,
  ) {
    setForm(
      (current) => ({
        ...current,
        ...patch,
      }),
    );
  }

  async function readArtworkInfo(
    imageUrl: string,
  ) {
    if (!imageUrl) {
      setArtworkInfo(
        null,
      );
      return;
    }

    try {
      setIsReadingImage(
        true,
      );

      const info =
        await loadArtworkDimensions(
          imageUrl,
        );

      setArtworkInfo(
        info,
      );
    } finally {
      setIsReadingImage(
        false,
      );
    }
  }

  function openCreate() {
    setEditingId(null);

    setArtworkInfo(
      null,
    );

    setForm({
      ...EMPTY_HERO_SLIDE,

      /*
       * Background colour is retained only because
       * the existing API/database model still expects
       * the field.
       *
       * It is NOT used to generate the hero artwork.
       */
      backgroundColor:
        "#17120f",

      imagePosition:
        "right",

      overlayStrength:
        32,

      sortOrder:
        nextSortOrder(
          slides,
        ),
    });

    setNotice(null);

    setIsEditorOpen(
      true,
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openEdit(
    slide: AdminHeroSlide,
  ) {
    const slideForm =
      heroSlideToForm(
        slide,
      );

    setEditingId(
      slide.id,
    );

    setForm(
      slideForm,
    );

    setArtworkInfo(
      null,
    );

    setNotice(null);

    setIsEditorOpen(
      true,
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (slide.imageUrl) {
      void readArtworkInfo(
        slide.imageUrl,
      );
    }
  }

  function closeEditor() {
    if (isSaving) {
      return;
    }

    setEditingId(null);

    setIsEditorOpen(
      false,
    );

    setForm({
      ...EMPTY_HERO_SLIDE,
    });

    setArtworkInfo(
      null,
    );
  }

  async function handleArtworkChange(
    image: {
      imageUrl: string;
      imagePublicId: string;
    },
  ) {
    patchForm({
      imageUrl:
        image.imageUrl,

      imagePublicId:
        image.imagePublicId,
    });

    if (!image.imageUrl) {
      setArtworkInfo(
        null,
      );
      return;
    }

    await readArtworkInfo(
      image.imageUrl,
    );
  }

  async function saveSlide() {
    if (!form.name.trim()) {
      setNotice({
        type: "error",
        message:
          "Give this slide an internal name.",
      });

      return;
    }

    if (!form.title.trim()) {
      setNotice({
        type: "error",
        message:
          "Hero title is required.",
      });

      return;
    }

    if (!form.imageUrl) {
      setNotice({
        type: "error",
        message:
          "Upload a hero image before saving.",
      });

      return;
    }

    try {
      setIsSaving(true);

      setNotice(null);

      if (
        editingId === null
      ) {
        await createHeroSlide(
          form,
        );

        setNotice({
          type: "success",
          message:
            "Hero slide created successfully.",
        });
      } else {
        await updateHeroSlide(
          editingId,
          form,
        );

        setNotice({
          type: "success",
          message:
            "Hero slide updated successfully.",
        });
      }

      setEditingId(null);

      setIsEditorOpen(
        false,
      );

      setForm({
        ...EMPTY_HERO_SLIDE,
      });

      setArtworkInfo(
        null,
      );

      await loadSlides();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof
          Error
            ? error.message
            : "Could not save hero slide.",
      });
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function changeActive(
    slide: AdminHeroSlide,
    active: boolean,
  ) {
    try {
      setBusyId(
        slide.id,
      );

      setNotice(null);

      const updated =
        await toggleHeroSlide(
          slide.id,
          active,
        );

      setSlides(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              updated.id
                ? updated
                : item,
          ),
      );

      setNotice({
        type: "success",
        message: active
          ? `"${slide.name}" is now live.`
          : `"${slide.name}" has been hidden.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof
          Error
            ? error.message
            : "Could not update slide visibility.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function removeSlide(
    slide: AdminHeroSlide,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${slide.name}" permanently?\n\nThis cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setBusyId(
        slide.id,
      );

      setNotice(null);

      await deleteHeroSlide(
        slide.id,
      );

      setSlides(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              slide.id,
          ),
      );

      if (
        editingId ===
        slide.id
      ) {
        closeEditor();
      }

      setNotice({
        type: "success",
        message: `"${slide.name}" was deleted.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof
          Error
            ? error.message
            : "Could not delete hero slide.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function moveSlide(
    slide: AdminHeroSlide,
    direction: -1 | 1,
  ) {
    const index =
      sortedSlides.findIndex(
        (item) =>
          item.id ===
          slide.id,
      );

    const target =
      sortedSlides[
        index + direction
      ];

    if (!target) {
      return;
    }

    const currentForm =
      heroSlideToForm(
        slide,
      );

    const targetForm =
      heroSlideToForm(
        target,
      );

    const currentOrder =
      slide.sortOrder;

    const targetOrder =
      target.sortOrder;

    try {
      setBusyId(
        slide.id,
      );

      setNotice(null);

      await updateHeroSlide(
        slide.id,
        {
          ...currentForm,
          sortOrder:
            targetOrder,
        },
      );

      await updateHeroSlide(
        target.id,
        {
          ...targetForm,
          sortOrder:
            currentOrder,
        },
      );

      await loadSlides();

      setNotice({
        type: "success",
        message:
          "Hero order updated.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof
          Error
            ? error.message
            : "Could not reorder hero slides.",
      });
    } finally {
      setBusyId(null);
    }
  }

  const quality =
    artworkQuality(
      artworkInfo,
    );

  const isIdealRatio =
    artworkInfo
      ? Math.abs(
          artworkInfo.aspectRatio -
            16 / 9,
        ) <= 0.04
      : false;

  return (
    <main className="min-h-screen bg-brand-bg text-brand-ink">
      <div className="mx-auto w-full max-w-[1500px] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-brand-ink/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              to="/admin/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink/55 transition hover:text-brand-ink"
            >
              <ArrowLeft
                size={15}
              />
              Dashboard
            </Link>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-ink/45">
              Storefront content
            </p>

            <h1 className="text-3xl font-semibold tracking-[-0.015em] sm:text-4xl">
              Hero Slides
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-ink/60">
              Manage the home
              page slideshow,
              wording, artwork,
              calls to action and
              slide visibility.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadSlides()
              }
              disabled={
                isLoading
              }
              className="inline-flex items-center gap-2 rounded-2xl border border-brand-ink/15 bg-white/55 px-4 py-3 text-sm font-semibold transition hover:bg-white disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  isLoading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={
                openCreate
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg transition hover:opacity-90"
            >
              <Plus
                size={17}
              />
              New slide
            </button>
          </div>
        </header>

        {notice && (
          <div
            className={[
              "mb-6 rounded-2xl border px-4 py-3 text-sm font-medium",
              notice.type ===
              "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700",
            ].join(" ")}
          >
            {notice.message}
          </div>
        )}

        {isEditorOpen && (
          <section className="mb-12 border-y border-brand-ink/10">
            <div className="flex items-center justify-between py-5">
              <div>
                <p
                  className={
                    labelClass
                  }
                >
                  {editingId ===
                  null
                    ? "Create slide"
                    : "Edit slide"}
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {editingId ===
                  null
                    ? "New home hero"
                    : form.name ||
                      "Hero slide"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeEditor
                }
                className="grid h-10 w-10 place-items-center rounded-full border border-brand-ink/10 bg-white/60 transition hover:bg-white"
                aria-label="Close editor"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <div className="pb-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p
                    className={
                      labelClass
                    }
                  >
                    Live composition
                  </p>

                  <p className="mt-1 text-xs text-brand-ink/45">
                    Preview uses the
                    same image +
                    blur + darkness
                    approach as the
                    storefront.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isReadingImage && (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-ink/50">
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Reading artwork
                    </span>
                  )}

                  {artworkInfo &&
                    quality && (
                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]",
                          quality.className,
                        ].join(" ")}
                      >
                        {
                          quality.label
                        }
                      </span>
                    )}

                  {artworkInfo && (
                    <span
                      className={[
                        "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]",
                        isIdealRatio
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-800",
                      ].join(" ")}
                    >
                      {isIdealRatio
                        ? "16:9 ratio"
                        : "Non 16:9 ratio"}
                    </span>
                  )}
                </div>
              </div>

              <HeroPreview
                form={form}
              />

              <div className="mx-auto mt-10 max-w-6xl">
                <div className="mb-8">
                  <p
                    className={
                      labelClass
                    }
                  >
                    Hero content
                  </p>

                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.01em]">
                    Slide settings
                  </h3>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-ink/55">
                    For the most
                    consistent result
                    across the site,
                    upload 16:9 hero
                    artwork. The ideal
                    source is
                    2400×1350 px.
                    1920×1080 px is
                    also supported.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="grid gap-5 md:grid-cols-3">
                    <label className="space-y-2">
                      <span
                        className={
                          labelClass
                        }
                      >
                        Internal name
                      </span>

                      <input
                        value={
                          form.name
                        }
                        onChange={(
                          event,
                        ) =>
                          patchForm({
                            name:
                              event
                                .target
                                .value,
                          })
                        }
                        className={
                          inputClass
                        }
                        placeholder="Jar Cakes"
                      />
                    </label>

                    <label className="space-y-2">
                      <span
                        className={
                          labelClass
                        }
                      >
                        Eyebrow
                      </span>

                      <input
                        value={
                          form.eyebrow
                        }
                        onChange={(
                          event,
                        ) =>
                          patchForm({
                            eyebrow:
                              event
                                .target
                                .value,
                          })
                        }
                        className={
                          inputClass
                        }
                        placeholder="BAURA BAKERS"
                      />
                    </label>

                    <label className="space-y-2">
                      <span
                        className={
                          labelClass
                        }
                      >
                        Display order
                      </span>

                      <input
                        type="number"
                        min={0}
                        max={9999}
                        value={
                          form.sortOrder
                        }
                        onChange={(
                          event,
                        ) =>
                          patchForm({
                            sortOrder:
                              Math.max(
                                0,
                                Number(
                                  event
                                    .target
                                    .value,
                                ) ||
                                  0,
                              ),
                          })
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <label className="block space-y-2">
                      <span
                        className={
                          labelClass
                        }
                      >
                        Hero title
                      </span>

                      <textarea
                        value={
                          form.title
                        }
                        onChange={(
                          event,
                        ) =>
                          patchForm({
                            title:
                              event
                                .target
                                .value,
                          })
                        }
                        rows={4}
                        className={`${inputClass} resize-none text-base`}
                        placeholder="Freshly baked. Seriously delicious."
                      />
                    </label>

                    <label className="block space-y-2">
                      <span
                        className={
                          labelClass
                        }
                      >
                        Supporting
                        text
                      </span>

                      <textarea
                        value={
                          form.description
                        }
                        onChange={(
                          event,
                        ) =>
                          patchForm({
                            description:
                              event
                                .target
                                .value,
                          })
                        }
                        rows={4}
                        className={`${inputClass} resize-none`}
                        placeholder="Cakes, desserts and bakery favourites..."
                      />
                    </label>
                  </div>

                  <div className="border-y border-brand-ink/10 py-8">
                    <ImageUploadField
                      label="Hero artwork"
                      value={{
                        imageUrl:
                          form.imageUrl,
                        imagePublicId:
                          form.imagePublicId,
                      }}
                      folder="baura-bakers/hero"
                      helperText="Recommended: 2400×1350 px WebP (16:9). Use a high-quality landscape image with the important subject positioned toward the selected artwork side."
                      onChange={(
                        image,
                      ) =>
                        void handleArtworkChange(
                          image,
                        )
                      }
                    />

                    {artworkInfo && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-brand-ink/50">
                        <span>
                          {
                            artworkInfo.width
                          }
                          ×
                          {
                            artworkInfo.height
                          }{" "}
                          px
                        </span>

                        <span>·</span>

                        <span>
                          {artworkInfo.aspectRatio >
                          1.15
                            ? "Landscape"
                            : artworkInfo.aspectRatio <
                                0.87
                              ? "Portrait"
                              : "Square / near-square"}
                        </span>

                        <span>·</span>

                        <span>
                          Ratio{" "}
                          {artworkInfo.aspectRatio.toFixed(
                            2,
                          )}
                        </span>

                        {!isIdealRatio && (
                          <>
                            <span>·</span>

                            <span className="font-semibold text-amber-700">
                              16:9 is
                              recommended
                              for this
                              hero.
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <label className="space-y-2">
                      <span
                        className={
                          labelClass
                        }
                      >
                        Image alt text
                      </span>

                      <input
                        value={
                          form.imageAlt
                        }
                        onChange={(
                          event,
                        ) =>
                          patchForm({
                            imageAlt:
                              event
                                .target
                                .value,
                          })
                        }
                        className={
                          inputClass
                        }
                        placeholder="Baura Bakers jar cakes"
                      />
                    </label>

                    <label className="space-y-2">
                      <span
                        className={
                          labelClass
                        }
                      >
                        Artwork side
                      </span>

                      <select
                        value={
                          form.imagePosition ===
                          "left"
                            ? "left"
                            : form.imagePosition ===
                                "center"
                              ? "center"
                              : "right"
                        }
                        onChange={(
                          event,
                        ) =>
                          patchForm({
                            imagePosition:
                              event
                                .target
                                .value as HeroImagePosition,
                          })
                        }
                        className={
                          inputClass
                        }
                      >
                        <option value="right">
                          Right
                        </option>

                        <option value="center">
                          Center
                        </option>

                        <option value="left">
                          Left
                        </option>
                      </select>
                    </label>

                    <label className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={
                            labelClass
                          }
                        >
                          Darkness
                        </span>

                        <span className="text-xs font-semibold text-brand-ink/55">
                          {
                            form.overlayStrength
                          }
                          %
                        </span>
                      </div>

                      <div className="flex h-[46px] items-center">
                        <input
                          type="range"
                          min={0}
                          max={75}
                          step={1}
                          value={
                            form.overlayStrength
                          }
                          onChange={(
                            event,
                          ) =>
                            patchForm({
                              overlayStrength:
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                            })
                          }
                          className="w-full accent-brand-ink"
                        />
                      </div>

                      <p className="text-[11px] leading-5 text-brand-ink/45">
                        Controls only
                        the dark
                        treatment over
                        the original
                        image.
                      </p>
                    </label>
                  </div>

                  <div className="grid gap-7 border-t border-brand-ink/10 pt-8 lg:grid-cols-2">
                    <div>
                      <p
                        className={
                          labelClass
                        }
                      >
                        Primary action
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          value={
                            form.primaryButtonLabel
                          }
                          onChange={(
                            event,
                          ) =>
                            patchForm({
                              primaryButtonLabel:
                                event
                                  .target
                                  .value,
                            })
                          }
                          className={
                            inputClass
                          }
                          placeholder="Explore the menu"
                        />

                        <input
                          value={
                            form.primaryButtonUrl
                          }
                          onChange={(
                            event,
                          ) =>
                            patchForm({
                              primaryButtonUrl:
                                event
                                  .target
                                  .value,
                            })
                          }
                          className={
                            inputClass
                          }
                          placeholder="/menu"
                        />
                      </div>
                    </div>

                    <div>
                      <p
                        className={
                          labelClass
                        }
                      >
                        Secondary
                        action
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          value={
                            form.secondaryButtonLabel
                          }
                          onChange={(
                            event,
                          ) =>
                            patchForm({
                              secondaryButtonLabel:
                                event
                                  .target
                                  .value,
                            })
                          }
                          className={
                            inputClass
                          }
                          placeholder="Something special?"
                        />

                        <input
                          value={
                            form.secondaryButtonUrl
                          }
                          onChange={(
                            event,
                          ) =>
                            patchForm({
                              secondaryButtonUrl:
                                event
                                  .target
                                  .value,
                            })
                          }
                          className={
                            inputClass
                          }
                          placeholder="/contact"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5 border-t border-brand-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={
                          form.isActive
                        }
                        onChange={(
                          event,
                        ) =>
                          patchForm({
                            isActive:
                              event
                                .target
                                .checked,
                          })
                        }
                        className="h-5 w-5 accent-brand-ink"
                      />

                      <div>
                        <p className="text-sm font-semibold">
                          Active
                        </p>

                        <p className="mt-0.5 text-xs text-brand-ink/50">
                          Show this
                          slide on the
                          public
                          storefront.
                        </p>
                      </div>
                    </label>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={
                          closeEditor
                        }
                        disabled={
                          isSaving
                        }
                        className="rounded-2xl border border-brand-ink/15 bg-white/65 px-5 py-3 text-sm font-semibold disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void saveSlide()
                        }
                        disabled={
                          isSaving ||
                          isReadingImage
                        }
                        className="inline-flex items-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {isSaving ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Save
                            size={17}
                          />
                        )}

                        {editingId ===
                        null
                          ? "Create slide"
                          : "Save changes"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p
                className={
                  labelClass
                }
              >
                Current slideshow
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {slides.length}{" "}
                {slides.length ===
                1
                  ? "slide"
                  : "slides"}
              </h2>
            </div>

            <p className="hidden text-xs text-brand-ink/45 sm:block">
              Lower display order
              appears first.
            </p>
          </div>

          {isLoading ? (
            <div className="grid min-h-[260px] place-items-center rounded-[28px] border border-brand-ink/10 bg-white/35">
              <div className="text-center">
                <Loader2
                  size={25}
                  className="mx-auto animate-spin"
                />

                <p className="mt-3 text-sm text-brand-ink/55">
                  Loading hero
                  slides...
                </p>
              </div>
            </div>
          ) : sortedSlides.length ===
            0 ? (
            <div className="rounded-[28px] border border-dashed border-brand-ink/20 bg-white/35 px-6 py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-ink/5">
                <ImageIcon
                  size={24}
                  className="text-brand-ink/45"
                />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No hero slides
                yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-ink/55">
                Create your first
                slide and upload
                16:9 artwork
                through Cloudinary.
              </p>

              <button
                type="button"
                onClick={
                  openCreate
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg"
              >
                <Plus
                  size={17}
                />
                Create first slide
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedSlides.map(
                (
                  slide,
                  index,
                ) => {
                  const busy =
                    busyId ===
                    slide.id;

                  return (
                    <article
                      key={
                        slide.id
                      }
                      className="grid gap-4 rounded-[26px] border border-brand-ink/10 bg-white/45 p-4 shadow-sm sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="aspect-square overflow-hidden rounded-[18px] bg-brand-ink/5">
                        <img
                          src={
                            slide.imageUrl
                          }
                          alt={
                            slide.imageAlt ||
                            slide.name
                          }
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold">
                            {
                              slide.name
                            }
                          </h3>

                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                              slide.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-brand-ink/7 text-brand-ink/45",
                            ].join(
                              " ",
                            )}
                          >
                            {slide.isActive
                              ? "Live"
                              : "Hidden"}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm font-medium text-brand-ink/65">
                          {
                            slide.title
                          }
                        </p>

                        <p className="mt-2 text-xs text-brand-ink/40">
                          Order{" "}
                          {
                            slide.sortOrder
                          }{" "}
                          · Artwork{" "}
                          {
                            slide.imagePosition
                          }{" "}
                          · Darkness{" "}
                          {
                            slide.overlayStrength
                          }
                          %
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            void moveSlide(
                              slide,
                              -1,
                            )
                          }
                          disabled={
                            busy ||
                            index ===
                              0
                          }
                          className="grid h-10 w-10 place-items-center rounded-xl border border-brand-ink/10 bg-white/60 disabled:opacity-30"
                          aria-label="Move slide earlier"
                        >
                          <ChevronLeft
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void moveSlide(
                              slide,
                              1,
                            )
                          }
                          disabled={
                            busy ||
                            index ===
                              sortedSlides.length -
                                1
                          }
                          className="grid h-10 w-10 place-items-center rounded-xl border border-brand-ink/10 bg-white/60 disabled:opacity-30"
                          aria-label="Move slide later"
                        >
                          <ChevronRight
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void changeActive(
                              slide,
                              !slide.isActive,
                            )
                          }
                          disabled={
                            busy
                          }
                          className="grid h-10 w-10 place-items-center rounded-xl border border-brand-ink/10 bg-white/60 disabled:opacity-40"
                          aria-label={
                            slide.isActive
                              ? "Deactivate slide"
                              : "Activate slide"
                          }
                        >
                          {slide.isActive ? (
                            <EyeOff
                              size={17}
                            />
                          ) : (
                            <Eye
                              size={17}
                            />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              slide,
                            )
                          }
                          disabled={
                            busy
                          }
                          className="grid h-10 w-10 place-items-center rounded-xl border border-brand-ink/10 bg-white/60 disabled:opacity-40"
                          aria-label="Edit slide"
                        >
                          <Pencil
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void removeSlide(
                              slide,
                            )
                          }
                          disabled={
                            busy
                          }
                          className="grid h-10 w-10 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-700 disabled:opacity-40"
                          aria-label="Delete slide"
                        >
                          {busy ? (
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={17}
                            />
                          )}
                        </button>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =======================================================
   HERO PREVIEW
======================================================= */

function HeroPreview({
  form,
}: {
  form: HeroSlideForm;
}) {
  const imagePosition =
    form.imagePosition ===
    "left"
      ? "left"
      : form.imagePosition ===
          "center"
        ? "center"
        : "right";

  const objectPosition =
    imagePosition === "left"
      ? "left center"
      : imagePosition ===
          "center"
        ? "center center"
        : "right center";

  const copyAlignment =
    imagePosition === "left"
      ? "justify-end"
      : "justify-start";

  /*
   * EXACT ADMIN VALUE.
   *
   * 0%  = no global dark layer.
   * 30% = rgba(0,0,0,.30).
   * 60% = rgba(0,0,0,.60).
   *
   * There is no palette calculation.
   */
  const darkness =
    Math.min(
      1,
      Math.max(
        0,
        form.overlayStrength /
          100,
      ),
    );

  return (
    <div className="relative isolate min-h-[500px] w-full overflow-hidden bg-[#17120f] shadow-[0_24px_70px_rgba(55,38,25,0.13)] sm:min-h-[560px] lg:min-h-[620px]">
      {form.imageUrl ? (
        <>
          {/*
           * BLURRED COPY
           *
           * Same image behind the main photograph.
           * The scale prevents blur edges becoming
           * visible.
           */}
          <img
            src={
              form.imageUrl
            }
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-[1.08] object-cover blur-[28px]"
            style={{
              objectPosition,
            }}
          />

          {/*
           * MAIN IMAGE
           *
           * Single full-frame 16:9 composition.
           * No masks. No colour bridge. No split.
           */}
          <img
            src={
              form.imageUrl
            }
            alt={
              form.imageAlt ||
              form.name ||
              ""
            }
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[#17120f]">
          <div className="text-center text-white/35">
            <ImageIcon
              size={30}
              className="mx-auto"
            />

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em]">
              Upload hero artwork
            </p>
          </div>
        </div>
      )}

      {/*
       * GLOBAL DARKNESS
       *
       * Controlled ONLY by the admin slider.
       */}
      <div
        className="absolute inset-0 z-[2] bg-black"
        style={{
          opacity:
            darkness,
        }}
        aria-hidden="true"
      />

      {/*
       * HEADER READABILITY
       *
       * Small fixed shade only around the navigation
       * area. This does not alter image composition.
       */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-[150px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,.24), rgba(0,0,0,.08) 48%, transparent)",
        }}
        aria-hidden="true"
      />

      {/*
       * TEXT READABILITY
       *
       * Soft local vignette behind the copy rather
       * than a solid colour panel.
       */}
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            imagePosition ===
            "left"
              ? "linear-gradient(270deg, rgba(0,0,0,.34) 0%, rgba(0,0,0,.16) 34%, transparent 66%)"
              : imagePosition ===
                  "center"
                ? "linear-gradient(90deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,.08) 42%, transparent 68%)"
                : "linear-gradient(90deg, rgba(0,0,0,.34) 0%, rgba(0,0,0,.16) 34%, transparent 66%)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[150px]"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,.24), transparent)",
        }}
        aria-hidden="true"
      />

      <div
        className={[
          "relative z-20 mx-auto flex min-h-[500px] w-full max-w-[1380px] items-center px-7 pb-16 pt-20 sm:min-h-[560px] sm:px-11 lg:min-h-[620px] lg:px-16",
          copyAlignment,
        ].join(" ")}
      >
        <div className="w-full max-w-[610px] text-white">
          {form.eyebrow && (
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-7 bg-white/40" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70 sm:text-[11px]">
                {
                  form.eyebrow
                }
              </p>
            </div>
          )}

          <h3 className="whitespace-pre-line text-[clamp(3rem,5.8vw,6.5rem)] font-semibold leading-[0.94] tracking-[-0.012em]">
            {form.title ||
              "Your hero title"}
          </h3>

          {form.description && (
            <p className="mt-6 max-w-[500px] text-sm leading-6 text-white/75 sm:text-base">
              {
                form.description
              }
            </p>
          )}

          {(form.primaryButtonLabel ||
            form.secondaryButtonLabel) && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {form.primaryButtonLabel && (
                <span className="inline-flex items-center rounded-full bg-[#f9f4e0] px-5 py-3 text-xs font-semibold text-[#372619] shadow-sm">
                  {
                    form.primaryButtonLabel
                  }

                  <span className="ml-3">
                    →
                  </span>
                </span>
              )}

              {form.secondaryButtonLabel && (
                <span className="inline-flex items-center px-3 py-3 text-xs font-semibold text-white/85">
                  {
                    form.secondaryButtonLabel
                  }

                  <span className="ml-2 text-white/50">
                    ›
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-7 z-30 hidden items-center gap-2 text-[10px] font-medium text-white/55 sm:flex lg:left-16">
        <span className="h-2 w-2 rounded-full bg-[#e2bb66]" />

        Freshly prepared with
        care
      </div>

      <div className="absolute bottom-6 right-7 z-30 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45 lg:right-16">
        {form.isActive ? (
          <>
            <Check
              size={11}
            />
            Active
          </>
        ) : (
          <>
            <EyeOff
              size={11}
            />
            Hidden
          </>
        )}
      </div>
    </div>
  );
}