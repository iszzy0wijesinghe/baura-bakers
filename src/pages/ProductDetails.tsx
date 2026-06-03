import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../app/cart";
import DeliveryBadges from "../components/DeliveryBadges";
import Page from "../components/Page";
import Section from "../components/Section";
import {
  getItemBySlug,
  type MenuItem,
  type MenuItemSize,
  type MenuSugarLevel,
} from "../lib/items";
import { trackProductClick } from "../lib/productClicks";

function GalleryMainImage({ src, alt }: { src: string; alt: string }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="eager"
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.img
        key={src}
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        initial={{ opacity: 0.0, scale: 1.01 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0.0, scale: 0.99 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        loading="eager"
        decoding="async"
      />
    </AnimatePresence>
  );
}

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

export default function ProductDetails() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<MenuItem | null>(null);
  const [size, setSize] = useState<MenuItemSize | null>(null);
  const [sugar, setSugar] = useState<MenuSugarLevel | null>(null);
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [added, setAdded] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) {
        setErrorText("Product not found.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorText("");

        const item = await getItemBySlug(slug);

        setProduct(item);
        setSize(item.sizes[0] || null);
        setSugar(item.sugarLevels[0] || null);
        setImgIndex(0);

        trackProductClick(item.slug);
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } catch (error) {
        setErrorText(
          error instanceof Error ? error.message : "Product not found.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const imageList = product.images.length
      ? product.images
      : product.thumbnailUrl
        ? [
            {
              id: 0,
              imageUrl: product.thumbnailUrl,
              alt: `${product.name} image`,
              sortOrder: 0,
            },
          ]
        : [];

    return imageList;
  }, [product]);

  const mainImg = galleryImages[imgIndex];

  const showAddedToast = () => {
    setAdded(true);

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = window.setTimeout(() => setAdded(false), 2200);
  };

  const addToCart = () => {
    if (!product || !size || !sugar) return;

    addItem({
      itemId: product.id,
      itemSizeId: size.id,
      sugarLevelId: sugar.id,
      productSlug: product.slug,
      productName: product.name,
      image: product.thumbnailUrl || galleryImages[0]?.imageUrl,
      size: {
        id: size.id,
        label: size.label,
        serves: size.serves ?? undefined,
        priceLkr: size.priceLkr,
      },
      sugar: sugar.name,
      quantity: qty,
      unitPriceLkr: size.priceLkr,
    });

    showAddedToast();
  };

  const buyNow = () => {
    addToCart();
    nav("/cart");
  };

  if (isLoading) {
    return (
      <Page>
        <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70 shadow-sm backdrop-blur">
          Loading product...
        </div>
      </Page>
    );
  }

  if (errorText || !product) {
    return (
      <Page>
        <div className="space-y-3 rounded-3xl border border-black/10 bg-white/55 p-8 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold text-brand-ink">
            Product not found
          </h1>
          <p className="text-sm text-brand-ink/65">
            {errorText || "This product is unavailable or inactive."}
          </p>
          <Link className="text-sm font-semibold underline" to="/menu">
            Back to menu
          </Link>
        </div>
      </Page>
    );
  }

  const canAddToCart = Boolean(size && sugar);

  const productHeader = (
    <header className="space-y-2">
      <p className="text-xs font-semibold tracking-[0.25em] text-brand-ink/50">
        {product.category}
      </p>

      <h1 className="text-3xl font-semibold tracking-tight text-brand-ink">
        {product.name}
      </h1>

      {product.slogan && (
        <p className="text-sm text-brand-ink/75">{product.slogan}</p>
      )}

      {product.description && (
        <p className="text-sm leading-relaxed text-brand-ink/80">
          {product.description}
        </p>
      )}
    </header>
  );

  const galleryBlock = (
    <div className="rounded-3xl border border-brand-ink/15 bg-white/40 p-3 shadow-sm">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-black/5">
        {mainImg ? (
          <GalleryMainImage
            src={mainImg.imageUrl}
            alt={mainImg.alt || product.name}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-brand-ink/60">
            Add product image
          </div>
        )}
      </div>

      {galleryImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {galleryImages.map((image, index) => {
            const active = index === imgIndex;

            return (
              <button
                key={`${image.id}-${image.imageUrl}`}
                type="button"
                onClick={() => setImgIndex(index)}
                className={[
                  "shrink-0 overflow-hidden rounded-xl border",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
                  active ? "border-brand-ink/40" : "border-brand-ink/15",
                ].join(" ")}
                aria-current={active ? "true" : undefined}
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={image.imageUrl}
                  alt={image.alt || product.name}
                  className={[
                    "h-16 w-20 object-cover transition",
                    active ? "opacity-100" : "opacity-80 hover:opacity-100",
                  ].join(" ")}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const orderBox = (
    <div className="rounded-3xl border border-brand-ink/15 bg-white/40 p-5 shadow-sm">
      <div className="grid gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
            SIZE
          </p>

          {product.sizes.length ? (
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSize(option)}
                  className={[
                    "rounded-xl border px-3 py-2 text-sm transition",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
                    size?.id === option.id
                      ? "border-brand-ink/40 bg-brand-bg/70"
                      : "border-brand-ink/15 bg-white/30 hover:bg-white/45",
                  ].join(" ")}
                >
                  <span className="font-semibold">{option.label}</span>
                  <span className="ml-2 text-xs text-brand-ink/70">
                    {option.serves ? `Serves ${option.serves} • ` : ""}
                    {formatLkr(option.priceLkr)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-ink/60">
              No active sizes available.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
            SUGAR
          </p>

          {product.sugarLevels.length ? (
            <div className="flex flex-wrap gap-2">
              {product.sugarLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSugar(level)}
                  className={[
                    "rounded-xl border px-3 py-2 text-sm transition",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
                    sugar?.id === level.id
                      ? "border-brand-ink/40 bg-brand-bg/70"
                      : "border-brand-ink/15 bg-white/30 hover:bg-white/45",
                  ].join(" ")}
                >
                  {level.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-ink/60">
              No sugar options available.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
            QUANTITY
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="h-10 w-10 rounded-xl border border-brand-ink/15 bg-white/30 text-lg hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <div className="min-w-10 text-center text-sm font-semibold">
              {qty}
            </div>

            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="h-10 w-10 rounded-xl border border-brand-ink/15 bg-white/30 text-lg hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={addToCart}
            disabled={!canAddToCart}
            className={[
              "rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
              canAddToCart
                ? "bg-brand-ink hover:bg-brand-ink/95"
                : "cursor-not-allowed bg-brand-ink/40",
            ].join(" ")}
          >
            Add to cart
          </button>

          <button
            type="button"
            onClick={buyNow}
            disabled={!canAddToCart}
            className={[
              "rounded-xl border px-4 py-2.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
              canAddToCart
                ? "border-brand-ink/25 bg-transparent text-brand-ink hover:bg-black/5"
                : "cursor-not-allowed border-brand-ink/10 text-brand-ink/35",
            ].join(" ")}
          >
            Buy now
          </button>

          <Link
            to="/cart"
            className="rounded-xl bg-black/5 px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
          >
            Go to cart
          </Link>
        </div>

        <AnimatePresence>
          {added && (
            <motion.div
              initial={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl border border-brand-ink/15 bg-white/55 px-3 py-2 text-xs font-semibold text-brand-ink/80"
              role="status"
              aria-live="polite"
            >
              <span className="text-base leading-none">✓</span>
              Item added to cart
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const packageAndNote = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Section eyebrow="PACKAGE" title="What’s in the package">
        <div className="rounded-2xl border border-brand-ink/15 bg-white/40 p-4 text-sm text-brand-ink/80">
          <ul className="space-y-1">
            <li>• Sealed package</li>
            <li>• Spoon on request</li>
            <li>• Carry bag on request</li>
          </ul>
        </div>
      </Section>

      <Section eyebrow="NOTE" title="Fresh order">
        <div className="rounded-2xl border border-brand-ink/15 bg-white/40 p-4 text-sm leading-relaxed text-brand-ink/80">
          Final delivery time is confirmed after your order is reviewed by Baura
          Bakers.
        </div>
      </Section>
    </div>
  );

  return (
    <Page>
      {/* Mobile layout only */}
      <div className="space-y-5 lg:hidden">
        

        {productHeader}
        {galleryBlock}
        {orderBox}

        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.22em] text-brand-ink/50">
            DELIVERY OPTIONS
          </p>
          <DeliveryBadges />
        </div>

        {packageAndNote}
      </div>

      {/* Desktop layout only - kept same structure */}
      <div className="hidden space-y-10 lg:block">
        

        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-3">
            {galleryBlock}
            <DeliveryBadges />
          </section>

          <section className="space-y-6">
            {productHeader}
            {orderBox}
            {packageAndNote}
          </section>
        </div>
      </div>
    </Page>
  );
}

// import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import { useCart } from "../app/cart";
// import DeliveryBadges from "../components/DeliveryBadges";
// import Page from "../components/Page";
// import Section from "../components/Section";
// import {
//   getItemBySlug,
//   type MenuItem,
//   type MenuItemSize,
//   type MenuSugarLevel,
// } from "../lib/items";
// import { trackProductClick } from "../lib/productClicks";

// function GalleryMainImage({ src, alt }: { src: string; alt: string }) {
//   const reduce = useReducedMotion();

//   if (reduce) {
//     return (
//       <img
//         src={src}
//         alt={alt}
//         className="h-full w-full object-cover"
//         loading="eager"
//       />
//     );
//   }

//   return (
//     <AnimatePresence mode="wait">
//       <motion.img
//         key={src}
//         src={src}
//         alt={alt}
//         className="h-full w-full object-cover"
//         initial={{ opacity: 0.0, scale: 1.01 }}
//         animate={{ opacity: 1, scale: 1 }}
//         exit={{ opacity: 0.0, scale: 0.99 }}
//         transition={{ duration: 0.35, ease: "easeOut" }}
//         loading="eager"
//         decoding="async"
//       />
//     </AnimatePresence>
//   );
// }

// function formatLkr(value: number) {
//   return `LKR ${Number(value || 0).toLocaleString()}`;
// }

// export default function ProductDetails() {
//   const { slug } = useParams();
//   const nav = useNavigate();
//   const { addItem } = useCart();

//   const [product, setProduct] = useState<MenuItem | null>(null);
//   const [size, setSize] = useState<MenuItemSize | null>(null);
//   const [sugar, setSugar] = useState<MenuSugarLevel | null>(null);
//   const [qty, setQty] = useState(1);
//   const [imgIndex, setImgIndex] = useState(0);

//   const [isLoading, setIsLoading] = useState(true);
//   const [errorText, setErrorText] = useState("");

//   const [added, setAdded] = useState(false);
//   const hideTimerRef = useRef<number | null>(null);

//   useEffect(() => {
//     async function loadProduct() {
//       if (!slug) {
//         setErrorText("Product not found.");
//         setIsLoading(false);
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setErrorText("");

//         const item = await getItemBySlug(slug);

//         setProduct(item);
//         setSize(item.sizes[0] || null);
//         setSugar(item.sugarLevels[0] || null);
//         setImgIndex(0);

//         trackProductClick(item.slug);
//         window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
//       } catch (error) {
//         setErrorText(
//           error instanceof Error ? error.message : "Product not found.",
//         );
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     loadProduct();
//   }, [slug]);

//   useEffect(() => {
//     return () => {
//       if (hideTimerRef.current) {
//         window.clearTimeout(hideTimerRef.current);
//       }
//     };
//   }, []);

//   const galleryImages = useMemo(() => {
//     if (!product) return [];

//     const imageList = product.images.length
//       ? product.images
//       : product.thumbnailUrl
//         ? [
//             {
//               id: 0,
//               imageUrl: product.thumbnailUrl,
//               alt: `${product.name} image`,
//               sortOrder: 0,
//             },
//           ]
//         : [];

//     return imageList;
//   }, [product]);

//   const mainImg = galleryImages[imgIndex];

//   const showAddedToast = () => {
//     setAdded(true);

//     if (hideTimerRef.current) {
//       window.clearTimeout(hideTimerRef.current);
//     }

//     hideTimerRef.current = window.setTimeout(() => setAdded(false), 2200);
//   };

//   const addToCart = () => {
//     if (!product || !size || !sugar) return;

//     addItem({
//       itemId: product.id,
//       itemSizeId: size.id,
//       sugarLevelId: sugar.id,
//       productSlug: product.slug,
//       productName: product.name,
//       image: product.thumbnailUrl || galleryImages[0]?.imageUrl,
//       size: {
//         id: size.id,
//         label: size.label,
//         serves: size.serves ?? undefined,
//         priceLkr: size.priceLkr,
//       },
//       sugar: sugar.name,
//       quantity: qty,
//       unitPriceLkr: size.priceLkr,
//     });

//     showAddedToast();
//   };

//   const buyNow = () => {
//     addToCart();
//     nav("/cart");
//   };

//   if (isLoading) {
//     return (
//       <Page>
//         <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70 shadow-sm backdrop-blur">
//           Loading product...
//         </div>
//       </Page>
//     );
//   }

//   if (errorText || !product) {
//     return (
//       <Page>
//         <div className="space-y-3 rounded-3xl border border-black/10 bg-white/55 p-8 shadow-sm backdrop-blur">
//           <h1 className="text-2xl font-semibold text-brand-ink">
//             Product not found
//           </h1>
//           <p className="text-sm text-brand-ink/65">
//             {errorText || "This product is unavailable or inactive."}
//           </p>
//           <Link className="text-sm font-semibold underline" to="/menu">
//             Back to menu
//           </Link>
//         </div>
//       </Page>
//     );
//   }

//   const canAddToCart = Boolean(size && sugar);

//   return (
//     <Page>
//       <div className="space-y">
//         <header className="space-y-2 lg:hidden">
//           <p className="text-xs font-semibold tracking-[0.25em] text-brand-ink/50">
//             {product.category}
//           </p>

//           <h1 className="text-3xl font-semibold tracking-tight text-brand-ink">
//             {product.name}
//           </h1>

//           {product.slogan && (
//             <p className="text-sm text-brand-ink/75">{product.slogan}</p>
//           )}

//           {product.description && (
//             <p className="text-sm leading-relaxed text-brand-ink/80">
//               {product.description}
//             </p>
//           )}
//         </header>

//         <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
//           <section className="space-y-3">
//             <div className="rounded-3xl border border-brand-ink/15 bg-white/40 p-3 shadow-sm">
//               <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-black/5">
//                 {mainImg ? (
//                   <GalleryMainImage
//                     src={mainImg.imageUrl}
//                     alt={mainImg.alt || product.name}
//                   />
//                 ) : (
//                   <div className="grid h-full place-items-center text-sm text-brand-ink/60">
//                     Add product image
//                   </div>
//                 )}
//               </div>

//               {galleryImages.length > 1 && (
//                 <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
//                   {galleryImages.map((image, index) => {
//                     const active = index === imgIndex;

//                     return (
//                       <button
//                         key={`${image.id}-${image.imageUrl}`}
//                         type="button"
//                         onClick={() => setImgIndex(index)}
//                         className={[
//                           "shrink-0 overflow-hidden rounded-xl border",
//                           "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                           active
//                             ? "border-brand-ink/40"
//                             : "border-brand-ink/15",
//                         ].join(" ")}
//                         aria-current={active ? "true" : undefined}
//                         aria-label={`View image ${index + 1}`}
//                       >
//                         <img
//                           src={image.imageUrl}
//                           alt={image.alt || product.name}
//                           className={[
//                             "h-16 w-20 object-cover transition",
//                             active
//                               ? "opacity-100"
//                               : "opacity-80 hover:opacity-100",
//                           ].join(" ")}
//                           loading="lazy"
//                           decoding="async"
//                         />
//                       </button>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>

//             <DeliveryBadges />
//           </section>

//           <section className="space-y-6">
//             <header className="space-y-2">
//               <p className="text-xs font-semibold tracking-[0.25em] text-brand-ink/50">
//                 {product.category}
//               </p>
//               <h1 className="text-3xl font-semibold tracking-tight text-brand-ink">
//                 {product.name}
//               </h1>
//               <p className="text-sm text-brand-ink/75">{product.slogan}</p>
//               <p className="text-sm leading-relaxed text-brand-ink/80">
//                 {product.description}
//               </p>
//             </header>

//             <div className="rounded-3xl border border-brand-ink/15 bg-white/40 p-5 shadow-sm">
//               <div className="grid gap-4">
//                 <div className="space-y-2">
//                   <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                     SIZE
//                   </p>

//                   {product.sizes.length ? (
//                     <div className="flex flex-wrap gap-2">
//                       {product.sizes.map((option) => (
//                         <button
//                           key={option.id}
//                           type="button"
//                           onClick={() => setSize(option)}
//                           className={[
//                             "rounded-xl border px-3 py-2 text-sm transition",
//                             "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                             size?.id === option.id
//                               ? "border-brand-ink/40 bg-brand-bg/70"
//                               : "border-brand-ink/15 bg-white/30 hover:bg-white/45",
//                           ].join(" ")}
//                         >
//                           <span className="font-semibold">{option.label}</span>
//                           <span className="ml-2 text-xs text-brand-ink/70">
//                             {option.serves ? `Serves ${option.serves} • ` : ""}
//                             {formatLkr(option.priceLkr)}
//                           </span>
//                         </button>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-sm text-brand-ink/60">
//                       No active sizes available.
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                     SUGAR
//                   </p>

//                   {product.sugarLevels.length ? (
//                     <div className="flex flex-wrap gap-2">
//                       {product.sugarLevels.map((level) => (
//                         <button
//                           key={level.id}
//                           type="button"
//                           onClick={() => setSugar(level)}
//                           className={[
//                             "rounded-xl border px-3 py-2 text-sm transition",
//                             "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                             sugar?.id === level.id
//                               ? "border-brand-ink/40 bg-brand-bg/70"
//                               : "border-brand-ink/15 bg-white/30 hover:bg-white/45",
//                           ].join(" ")}
//                         >
//                           {level.name}
//                         </button>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-sm text-brand-ink/60">
//                       No sugar options available.
//                     </p>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                     QUANTITY
//                   </p>

//                   <div className="flex items-center gap-2">
//                     <button
//                       type="button"
//                       onClick={() => setQty((q) => Math.max(1, q - 1))}
//                       className="h-10 w-10 rounded-xl border border-brand-ink/15 bg-white/30 text-lg hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                       aria-label="Decrease quantity"
//                     >
//                       −
//                     </button>

//                     <div className="min-w-10 text-center text-sm font-semibold">
//                       {qty}
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() => setQty((q) => q + 1)}
//                       className="h-10 w-10 rounded-xl border border-brand-ink/15 bg-white/30 text-lg hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                       aria-label="Increase quantity"
//                     >
//                       +
//                     </button>
//                   </div>
//                 </div>

//                 <div className="flex flex-wrap gap-3 pt-2">
//                   <button
//                     type="button"
//                     onClick={addToCart}
//                     disabled={!canAddToCart}
//                     className={[
//                       "rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                       canAddToCart
//                         ? "bg-brand-ink hover:bg-brand-ink/95"
//                         : "cursor-not-allowed bg-brand-ink/40",
//                     ].join(" ")}
//                   >
//                     Add to cart
//                   </button>

//                   <button
//                     type="button"
//                     onClick={buyNow}
//                     disabled={!canAddToCart}
//                     className={[
//                       "rounded-xl border px-4 py-2.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                       canAddToCart
//                         ? "border-brand-ink/25 bg-transparent text-brand-ink hover:bg-black/5"
//                         : "cursor-not-allowed border-brand-ink/10 text-brand-ink/35",
//                     ].join(" ")}
//                   >
//                     Buy now
//                   </button>

//                   <Link
//                     to="/cart"
//                     className="rounded-xl bg-black/5 px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                   >
//                     Go to cart
//                   </Link>
//                 </div>

//                 <AnimatePresence>
//                   {added && (
//                     <motion.div
//                       initial={{ opacity: 0, y: -6, filter: "blur(2px)" }}
//                       animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
//                       exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
//                       transition={{ duration: 0.25, ease: "easeOut" }}
//                       className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl border border-brand-ink/15 bg-white/55 px-3 py-2 text-xs font-semibold text-brand-ink/80"
//                       role="status"
//                       aria-live="polite"
//                     >
//                       <span className="text-base leading-none">✓</span>
//                       Item added to cart
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </div>
//             </div>

//             <div className="grid gap-4 sm:grid-cols-2">
//               <Section eyebrow="PACKAGE" title="What’s in the package">
//                 <div className="rounded-2xl border border-brand-ink/15 bg-white/40 p-4 text-sm text-brand-ink/80">
//                   <ul className="space-y-1">
//                     <li>• Sealed package</li>
//                     <li>• Spoon on request</li>
//                     <li>• Carry bag on request</li>
//                   </ul>
//                 </div>
//               </Section>

//               <Section eyebrow="NOTE" title="Fresh order">
//                 <div className="rounded-2xl border border-brand-ink/15 bg-white/40 p-4 text-sm leading-relaxed text-brand-ink/80">
//                   Final delivery time is confirmed after your order is reviewed
//                   by Baura Bakers.
//                 </div>
//               </Section>
//             </div>
//           </section>
//         </div>
//       </div>
//     </Page>
//   );
// }
