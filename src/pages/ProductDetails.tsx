import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../app/cart";
import Section from "../components/Section";
import {
  products,
  type SizeOption,
  type SugarLevel,
} from "../content/products";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackProductClick } from "../lib/productClicks";
import DeliveryBadges from "../components/DeliveryBadges";

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

export default function ProductDetails() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { addItem } = useCart();

  const product = useMemo(() => products.find((p) => p.slug === slug), [slug]);

  if (!product) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <Link className="text-sm underline" to="/menu">
          Back to menu
        </Link>
      </div>
    );
  }

  useEffect(() => {
    trackProductClick(product.slug);
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [product.slug, slug]);

  const [imgIndex, setImgIndex] = useState(0);
  const [size, setSize] = useState<SizeOption>(product.sizes[0]);
  const [sugar, setSugar] = useState<SugarLevel>(product.sugarLevels[0]);
  const [qty, setQty] = useState(1);

  // ✅ Added notification state
  const [added, setAdded] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  const mainImg = product.images[imgIndex];

  const showAddedToast = () => {
    setAdded(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setAdded(false), 2200);
  };

  const addToCart = () => {
    addItem({
      productSlug: product.slug,
      productName: product.name,
      image: product.images[0]?.src,
      size,
      sugar,
      quantity: qty,
      unitPriceLkr: size.priceLkr,
    });

    showAddedToast();
  };

  const buyNow = () => {
    addToCart();
    nav("/cart");
  };

  return (
    <div className="space-y-10">
      <Link to="/menu" className="text-sm text-brand-ink/70 underline">
        ← Back to menu
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        {/* Images */}
        <section className="space-y-3">
          <div className="rounded-3xl border border-brand-ink/15 bg-white/40 p-3 shadow-sm">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-black/5">
              {mainImg ? (
                <GalleryMainImage src={mainImg.src} alt={mainImg.alt} />
              ) : (
                <div className="grid h-full place-items-center text-sm text-brand-ink/60">
                  Add product image
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {product.images.map((im, i) => {
                  const active = i === imgIndex;

                  return (
                    <button
                      key={im.src}
                      type="button"
                      onClick={() => setImgIndex(i)}
                      className={[
                        "shrink-0 overflow-hidden rounded-xl border",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
                        active ? "border-brand-ink/40" : "border-brand-ink/15",
                      ].join(" ")}
                      aria-current={active ? "true" : undefined}
                      aria-label={`View image ${i + 1}`}
                    >
                      <img
                        src={im.src}
                        alt={im.alt}
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

          {/* Delivery badges */}
          <DeliveryBadges />
        </section>

        {/* Details */}
        <section className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="text-sm text-brand-ink/75">{product.slogan}</p>
            <p className="text-sm leading-relaxed text-brand-ink/80">
              {product.description}
            </p>
          </header>

          <div className="rounded-3xl border border-brand-ink/15 bg-white/40 p-5 shadow-sm">
            <div className="grid gap-4">
              {/* Size */}
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                  SIZE
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSize(s)}
                      className={[
                        "rounded-xl border px-3 py-2 text-sm transition",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
                        size.id === s.id
                          ? "border-brand-ink/40 bg-brand-bg/70"
                          : "border-brand-ink/15 bg-white/30 hover:bg-white/45",
                      ].join(" ")}
                    >
                      <span className="font-semibold">{s.label}</span>
                      <span className="ml-2 text-xs text-brand-ink/70">
                        {s.serves ? `Serves ${s.serves} • ` : ""}
                        LKR {s.priceLkr.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar */}
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                  SUGAR
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sugarLevels.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSugar(lvl)}
                      className={[
                        "rounded-xl border px-3 py-2 text-sm transition",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
                        sugar === lvl
                          ? "border-brand-ink/40 bg-brand-bg/70"
                          : "border-brand-ink/15 bg-white/30 hover:bg-white/45",
                      ].join(" ")}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-brand-ink/60">
                  *No sugar means no added sugar (natural sweetness may remain).
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
                    QUANTITY
                  </p>
                  <p className="mt-1 text-sm text-brand-ink/75">
                    Choose how many you need.
                  </p>
                </div>

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

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={addToCart}
                  className="rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
                >
                  Add to cart
                </button>

                <button
                  type="button"
                  onClick={buyNow}
                  className="rounded-xl border border-brand-ink/25 bg-transparent px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
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

              {/* ✅ Notification under buttons */}
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

          {/* Extra info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Section eyebrow="NUTRITION" title="Nutrition facts">
              <div className="rounded-2xl border border-brand-ink/15 bg-white/40 p-4 text-sm text-brand-ink/80">
                <p className="text-xs text-brand-ink/60">
                  Serving: {product.nutrition.serving}
                </p>
                <ul className="mt-2 space-y-1">
                  <li>Calories: {product.nutrition.calories}</li>
                  <li>Carbs: {product.nutrition.carbsG}g</li>
                  <li>Protein: {product.nutrition.proteinG}g</li>
                  <li>Fat: {product.nutrition.fatG}g</li>
                </ul>
              </div>
            </Section>

            <Section eyebrow="PACKAGE" title="What’s in the package">
              <div className="rounded-2xl border border-brand-ink/15 bg-white/40 p-4 text-sm text-brand-ink/80">
                <ul className="space-y-1">
                  {product.inPackage.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                </ul>
              </div>
            </Section>
          </div>
        </section>
      </div>
    </div>
  );
}




// import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// import { Link, useNavigate, useParams } from "react-router-dom";
// import { useCart } from "../app/cart";
// import Section from "../components/Section";
// import {
//   products,
//   type SizeOption,
//   type SugarLevel,
// } from "../content/products";
// import { useEffect, useMemo, useState } from "react";
// import { trackProductClick } from "../lib/productClicks";
// import DeliveryBadges from "../components/DeliveryBadges";

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

// export default function ProductDetails() {
//   const { slug } = useParams();
//   const nav = useNavigate();
//   const { addItem } = useCart();

//   const product = useMemo(() => products.find((p) => p.slug === slug), [slug]);

//   if (!product) {
//     return (
//       <div className="space-y-3">
//         <h1 className="text-2xl font-semibold">Not found</h1>
//         <Link className="text-sm underline" to="/menu">
//           Back to menu
//         </Link>
//       </div>
//     );
//   }

//   useEffect(() => {
//     trackProductClick(product.slug);
//     window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
//   }, [product.slug, slug]);

//   const [imgIndex, setImgIndex] = useState(0);
//   const [size, setSize] = useState<SizeOption>(product.sizes[0]);
//   const [sugar, setSugar] = useState<SugarLevel>(product.sugarLevels[0]);
//   const [qty, setQty] = useState(1);

//   const mainImg = product.images[imgIndex];

//   const addToCart = () => {
//     addItem({
//       productSlug: product.slug,
//       productName: product.name,
//       image: product.images[0]?.src,
//       size,
//       sugar,
//       quantity: qty,
//       unitPriceLkr: size.priceLkr,
//     });
//   };

//   const buyNow = () => {
//     addToCart();
//     nav("/cart");
//   };

//   return (
//     <div className="space-y-10">
//       <Link to="/menu" className="text-sm text-brand-ink/70 underline">
//         ← Back to menu
//       </Link>

//       <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
//         {/* Images */}
//         <section className="space-y-3">
//           <div className="rounded-3xl border border-brand-ink/15 bg-white/40 p-3 shadow-sm">
//             <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-black/5">
//               {mainImg ? (
//                 <GalleryMainImage src={mainImg.src} alt={mainImg.alt} />
//               ) : (
//                 <div className="grid h-full place-items-center text-sm text-brand-ink/60">
//                   Add product image
//                 </div>
//               )}
//             </div>

//             {product.images.length > 1 && (
//               <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
//                 {product.images.map((im, i) => {
//                   const active = i === imgIndex;

//                   return (
//                     <button
//                       key={im.src}
//                       type="button"
//                       onClick={() => setImgIndex(i)}
//                       className={[
//                         "shrink-0 overflow-hidden rounded-xl border",
//                         "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                         active ? "border-brand-ink/40" : "border-brand-ink/15",
//                       ].join(" ")}
//                       aria-current={active ? "true" : undefined}
//                       aria-label={`View image ${i + 1}`}
//                     >
//                       <img
//                         src={im.src}
//                         alt={im.alt}
//                         className={[
//                           "h-16 w-20 object-cover transition",
//                           active
//                             ? "opacity-100"
//                             : "opacity-80 hover:opacity-100",
//                         ].join(" ")}
//                         loading="lazy"
//                         decoding="async"
//                       />
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>

//           {/* Delivery badges */}
//           <DeliveryBadges />
//         </section>

//         {/* Details */}
//         <section className="space-y-6">
//           <header className="space-y-2">
//             <h1 className="text-3xl font-semibold tracking-tight">
//               {product.name}
//             </h1>
//             <p className="text-sm text-brand-ink/75">{product.slogan}</p>
//             <p className="text-sm leading-relaxed text-brand-ink/80">
//               {product.description}
//             </p>
//           </header>

//           <div className="rounded-3xl border border-brand-ink/15 bg-white/40 p-5 shadow-sm">
//             <div className="grid gap-4">
//               {/* Size */}
//               <div className="space-y-2">
//                 <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                   SIZE
//                 </p>
//                 <div className="flex flex-wrap gap-2">
//                   {product.sizes.map((s) => (
//                     <button
//                       key={s.id}
//                       type="button"
//                       onClick={() => setSize(s)}
//                       className={[
//                         "rounded-xl border px-3 py-2 text-sm transition",
//                         "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                         size.id === s.id
//                           ? "border-brand-ink/40 bg-brand-bg/70"
//                           : "border-brand-ink/15 bg-white/30 hover:bg-white/45",
//                       ].join(" ")}
//                     >
//                       <span className="font-semibold">{s.label}</span>
//                       <span className="ml-2 text-xs text-brand-ink/70">
//                         {s.serves ? `Serves ${s.serves} • ` : ""}
//                         LKR {s.priceLkr.toLocaleString()}
//                       </span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Sugar */}
//               <div className="space-y-2">
//                 <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                   SUGAR
//                 </p>
//                 <div className="flex flex-wrap gap-2">
//                   {product.sugarLevels.map((lvl) => (
//                     <button
//                       key={lvl}
//                       type="button"
//                       onClick={() => setSugar(lvl)}
//                       className={[
//                         "rounded-xl border px-3 py-2 text-sm transition",
//                         "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
//                         sugar === lvl
//                           ? "border-brand-ink/40 bg-brand-bg/70"
//                           : "border-brand-ink/15 bg-white/30 hover:bg-white/45",
//                       ].join(" ")}
//                     >
//                       {lvl}
//                     </button>
//                   ))}
//                 </div>
//                 <p className="text-[11px] text-brand-ink/60">
//                   *No sugar means no added sugar (natural sweetness may remain).
//                 </p>
//               </div>

//               {/* Quantity */}
//               <div className="flex items-center justify-between gap-4">
//                 <div>
//                   <p className="text-xs font-semibold tracking-widest text-brand-ink/60">
//                     QUANTITY
//                   </p>
//                   <p className="mt-1 text-sm text-brand-ink/75">
//                     Choose how many you need.
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     type="button"
//                     onClick={() => setQty((q) => Math.max(1, q - 1))}
//                     className="h-10 w-10 rounded-xl border border-brand-ink/15 bg-white/30 text-lg hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                     aria-label="Decrease quantity"
//                   >
//                     −
//                   </button>
//                   <div className="min-w-10 text-center text-sm font-semibold">
//                     {qty}
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => setQty((q) => q + 1)}
//                     className="h-10 w-10 rounded-xl border border-brand-ink/15 bg-white/30 text-lg hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                     aria-label="Increase quantity"
//                   >
//                     +
//                   </button>
//                 </div>
//               </div>

//               {/* Actions */}
//               <div className="flex flex-wrap gap-3 pt-2">
//                 <button
//                   type="button"
//                   onClick={addToCart}
//                   className="rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-brand-bg hover:bg-brand-ink/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                 >
//                   Add to cart
//                 </button>
//                 <button
//                   type="button"
//                   onClick={buyNow}
//                   className="rounded-xl border border-brand-ink/25 bg-transparent px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                 >
//                   Buy now
//                 </button>
//                 <Link
//                   to="/cart"
//                   className="rounded-xl bg-black/5 px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
//                 >
//                   Go to cart
//                 </Link>
//               </div>
//             </div>
//           </div>

          

//           {/* Extra info */}
//           <div className="grid gap-4 sm:grid-cols-2">
//             <Section eyebrow="NUTRITION" title="Nutrition facts">
//               <div className="rounded-2xl border border-brand-ink/15 bg-white/40 p-4 text-sm text-brand-ink/80">
//                 <p className="text-xs text-brand-ink/60">
//                   Serving: {product.nutrition.serving}
//                 </p>
//                 <ul className="mt-2 space-y-1">
//                   <li>Calories: {product.nutrition.calories}</li>
//                   <li>Carbs: {product.nutrition.carbsG}g</li>
//                   <li>Protein: {product.nutrition.proteinG}g</li>
//                   <li>Fat: {product.nutrition.fatG}g</li>
//                 </ul>
//               </div>
//             </Section>

//             <Section eyebrow="PACKAGE" title="What’s in the package">
//               <div className="rounded-2xl border border-brand-ink/15 bg-white/40 p-4 text-sm text-brand-ink/80">
//                 <ul className="space-y-1">
//                   {product.inPackage.map((x) => (
//                     <li key={x}>• {x}</li>
//                   ))}
//                 </ul>
//               </div>
//             </Section>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }
