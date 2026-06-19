import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "../components/Page";
import ImageUploadField from "../components/admin/ImageUploadField";
import {
  getAdminCategories,
  getAdminProducts,
  getAdminSubcategories,
  getAdminSugarLevels,
  productToPayload,
  saveCategory,
  saveProduct,
  saveSubcategory,
  slugify,
  type AdminCategory,
  type AdminProduct,
  type AdminProductImage,
  type AdminProductSize,
  type AdminSubcategory,
  type AdminSugarLevel,
  type CategoryPayload,
  type ProductPayload,
  type SubcategoryPayload,
} from "../lib/adminCatalog";
import { supabase } from "../lib/supabase";

type TabKey = "products" | "categories" | "subcategories";

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function emptyProductPayload(
  categories: AdminCategory[],
  sugarLevels: AdminSugarLevel[],
): ProductPayload {
  return {
    categoryId: categories[0]?.id || 0,
    subcategoryId: null,

    slug: "",
    name: "",
    slogan: "",
    shortDesc: "",
    description: "",

    thumbnailUrl: "",
    thumbnailPublicId: "",

    isActive: true,
    isCombo: false,
    comboConfig: null,

    sortOrder: 0,

    sizes: [{ label: "Regular", serves: "1", priceLkr: 0, sortOrder: 0 }],
    images: [],
    tags: [],
    sugarLevelIds: sugarLevels[0]?.id ? [sugarLevels[0].id] : [],
  };
}

function emptyCategoryPayload(): CategoryPayload {
  return {
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    imagePublicId: "",
    isActive: true,
    sortOrder: 0,
  };
}

function emptySubcategoryPayload(
  categories: AdminCategory[],
): SubcategoryPayload {
  return {
    categoryId: categories[0]?.id || 0,
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    imagePublicId: "",
    isActive: true,
    sortOrder: 0,
  };
}

export default function AdminProducts() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabKey>("products");
  const [searchText, setSearchText] = useState("");

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);
  const [sugarLevels, setSugarLevels] = useState<AdminSugarLevel[]>([]);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);

  const [productForm, setProductForm] = useState<ProductPayload>(
    emptyProductPayload([], []),
  );

  const [categoryForm, setCategoryForm] = useState<CategoryPayload>(
    emptyCategoryPayload(),
  );

  const [subcategoryForm, setSubcategoryForm] = useState<SubcategoryPayload>(
    emptySubcategoryPayload([]),
  );

  const [tagText, setTagText] = useState("");
  const [comboNotes, setComboNotes] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  async function verifyAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      navigate("/account");
      return false;
    }

    return true;
  }

  async function loadData() {
    try {
      setIsLoading(true);
      setErrorText("");

      if (!(await verifyAdmin())) return;

      const [categoryRows, subcategoryRows, sugarRows, productRows] =
        await Promise.all([
          getAdminCategories(),
          getAdminSubcategories(),
          getAdminSugarLevels(),
          getAdminProducts(),
        ]);

      setCategories(categoryRows);
      setSubcategories(subcategoryRows);
      setSugarLevels(sugarRows);
      setProducts(productRows);
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Could not load product management.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return products.filter((product) => {
      if (!query) return true;

      return [
        product.name,
        product.slug,
        product.categoryName,
        product.subcategoryName || "",
        ...product.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [products, searchText]);

  const filteredCategories = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return categories.filter((category) => {
      if (!query) return true;

      return [category.name, category.slug, category.description || ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [categories, searchText]);

  const filteredSubcategories = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return subcategories.filter((subcategory) => {
      if (!query) return true;

      const parent =
        categories.find((category) => category.id === subcategory.categoryId)
          ?.name || "";

      return [subcategory.name, subcategory.slug, parent]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [subcategories, categories, searchText]);

  const productSubcategories = useMemo(() => {
    return subcategories.filter(
      (subcategory) => subcategory.categoryId === productForm.categoryId,
    );
  }, [subcategories, productForm.categoryId]);

  function openAddProduct() {
    setProductForm(emptyProductPayload(categories, sugarLevels));
    setTagText("");
    setComboNotes("");
    setProductModalOpen(true);
  }

  function openEditProduct(product: AdminProduct) {
    const payload = productToPayload(product);

    setProductForm(payload);
    setTagText(payload.tags.join(", "));

    setComboNotes(
      typeof payload.comboConfig?.notes === "string"
        ? payload.comboConfig.notes
        : "",
    );

    setProductModalOpen(true);
  }

  function openAddCategory() {
    setCategoryForm(emptyCategoryPayload());
    setCategoryModalOpen(true);
  }

  function openEditCategory(category: AdminCategory) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      imagePublicId: category.imagePublicId || "",
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });

    setCategoryModalOpen(true);
  }

  function openAddSubcategory() {
    setSubcategoryForm(emptySubcategoryPayload(categories));
    setSubcategoryModalOpen(true);
  }

  function openEditSubcategory(subcategory: AdminSubcategory) {
    setSubcategoryForm({
      id: subcategory.id,
      categoryId: subcategory.categoryId,
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description || "",
      imageUrl: subcategory.imageUrl || "",
      imagePublicId: subcategory.imagePublicId || "",
      isActive: subcategory.isActive,
      sortOrder: subcategory.sortOrder,
    });

    setSubcategoryModalOpen(true);
  }

  function updateProductSize(index: number, patch: Partial<AdminProductSize>) {
    setProductForm((prev) => ({
      ...prev,
      sizes: prev.sizes.map((size, i) =>
        i === index ? { ...size, ...patch } : size,
      ),
    }));
  }

  function addProductSize() {
    setProductForm((prev) => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        {
          label: "",
          serves: "",
          priceLkr: 0,
          sortOrder: prev.sizes.length,
        },
      ],
    }));
  }

  function removeProductSize(index: number) {
    setProductForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  }

  function updateGalleryImage(
    index: number,
    patch: Partial<AdminProductImage>,
  ) {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.map((image, i) =>
        i === index ? { ...image, ...patch } : image,
      ),
    }));
  }

  function addGalleryImage() {
    setProductForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          imageUrl: "",
          imagePublicId: "",
          alt: prev.name || "Product image",
          sortOrder: prev.images.length,
        },
      ],
    }));
  }

  function removeGalleryImage(index: number) {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  async function handleProductSave(event: FormEvent) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setErrorText("");
      setMessage("");

      await saveProduct({
        ...productForm,
        slug: productForm.slug || slugify(productForm.name),
        tags: tagText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        comboConfig: productForm.isCombo
          ? {
              notes: comboNotes,
              managedAsSingleSellableProduct: true,
            }
          : null,
      });

      setProductModalOpen(false);
      setMessage("Product saved successfully.");
      await loadData();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Product could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCategorySave(event: FormEvent) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setErrorText("");
      setMessage("");

      await saveCategory({
        ...categoryForm,
        slug: categoryForm.slug || slugify(categoryForm.name),
      });

      setCategoryModalOpen(false);
      setMessage("Category saved successfully.");
      await loadData();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Category could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubcategorySave(event: FormEvent) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setErrorText("");
      setMessage("");

      await saveSubcategory({
        ...subcategoryForm,
        slug: subcategoryForm.slug || slugify(subcategoryForm.name),
      });

      setSubcategoryModalOpen(false);
      setMessage("Subcategory saved successfully.");
      await loadData();
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Subcategory could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Page>
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-brand-ink/55">
              PRODUCT MANAGEMENT
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
              Menu catalogue
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-ink/70">
              Manage products, categories, subcategories, prices, active status,
              and Cloudinary image URLs.
            </p>
          </div>

          <Link
            to="/admin/dashboard"
            className="rounded-2xl border border-brand-ink/20 bg-white/55 px-5 py-3 text-sm font-semibold text-brand-ink hover:bg-white/75"
          >
            Back to dashboard
          </Link>
        </header>

        {errorText && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorText}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        <section className="rounded-3xl border border-black/10 bg-white/55 p-4 shadow-sm backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <TabButton
                active={tab === "products"}
                onClick={() => setTab("products")}
              >
                Products
              </TabButton>

              <TabButton
                active={tab === "categories"}
                onClick={() => setTab("categories")}
              >
                Categories
              </TabButton>

              <TabButton
                active={tab === "subcategories"}
                onClick={() => setTab("subcategories")}
              >
                Subcategories
              </TabButton>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="w-full rounded-2xl border border-brand-ink/10 bg-white/70 px-4 py-3 text-sm font-medium text-brand-ink outline-none placeholder:text-brand-ink/35 focus:border-brand-ink/25 focus:ring-2 focus:ring-brand-ink/10 sm:w-72"
                placeholder="Search..."
              />

              {tab === "products" && (
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg"
                >
                  Add product
                </button>
              )}

              {tab === "categories" && (
                <button
                  type="button"
                  onClick={openAddCategory}
                  className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg"
                >
                  Add category
                </button>
              )}

              {tab === "subcategories" && (
                <button
                  type="button"
                  onClick={openAddSubcategory}
                  className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg"
                >
                  Add subcategory
                </button>
              )}
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-black/10 bg-white/55 p-8 text-sm text-brand-ink/70">
            Loading catalogue...
          </div>
        ) : (
          <>
            {tab === "products" && (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>Category</Th>
                    <Th>Price</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t border-black/10">
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-black/10 bg-brand-bg/70">
                            {product.thumbnailUrl ? (
                              <img
                                src={product.thumbnailUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full place-items-center text-xs text-brand-ink/40">
                                No img
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-brand-ink">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-xs text-brand-ink/50">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </Td>

                      <Td>
                        <p className="font-medium text-brand-ink">
                          {product.categoryName}
                        </p>
                        <p className="mt-0.5 text-xs text-brand-ink/50">
                          {product.subcategoryName || "No subcategory"}
                        </p>
                      </Td>

                      <Td>
                        {product.sizes[0]
                          ? formatLkr(product.sizes[0].priceLkr)
                          : "No price"}
                      </Td>

                      <Td>
                        <StatusBadge active={product.isActive} />
                      </Td>

                      <Td>
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="rounded-xl border border-brand-ink/15 bg-white/70 px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-white"
                        >
                          Edit
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}

            {tab === "categories" && (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Category</Th>
                    <Th>Slug</Th>
                    <Th>Sort</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="border-t border-black/10">
                      <Td>
                        <div className="flex items-center gap-3">
                          <IconPreview
                            imageUrl={category.imageUrl}
                            label={category.name}
                          />

                          <div>
                            <p className="font-semibold text-brand-ink">
                              {category.name}
                            </p>
                            <p className="mt-0.5 text-xs text-brand-ink/50">
                              {category.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </Td>

                      <Td>{category.slug}</Td>
                      <Td>{category.sortOrder}</Td>
                      <Td>
                        <StatusBadge active={category.isActive} />
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => openEditCategory(category)}
                          className="rounded-xl border border-brand-ink/15 bg-white/70 px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-white"
                        >
                          Edit
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}

            {tab === "subcategories" && (
              <DataTable>
                <thead>
                  <tr>
                    <Th>Subcategory</Th>
                    <Th>Parent</Th>
                    <Th>Sort</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubcategories.map((subcategory) => (
                    <tr
                      key={subcategory.id}
                      className="border-t border-black/10"
                    >
                      <Td>
                        <div className="flex items-center gap-3">
                          <IconPreview
                            imageUrl={subcategory.imageUrl}
                            label={subcategory.name}
                          />

                          <div>
                            <p className="font-semibold text-brand-ink">
                              {subcategory.name}
                            </p>
                            <p className="mt-0.5 text-xs text-brand-ink/50">
                              /{subcategory.slug}
                            </p>
                          </div>
                        </div>
                      </Td>

                      <Td>
                        {
                          categories.find(
                            (category) =>
                              category.id === subcategory.categoryId,
                          )?.name
                        }
                      </Td>

                      <Td>{subcategory.sortOrder}</Td>

                      <Td>
                        <StatusBadge active={subcategory.isActive} />
                      </Td>

                      <Td>
                        <button
                          type="button"
                          onClick={() => openEditSubcategory(subcategory)}
                          className="rounded-xl border border-brand-ink/15 bg-white/70 px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-white"
                        >
                          Edit
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </>
        )}

        {productModalOpen && (
          <Modal
            title={productForm.id ? "Edit product" : "Add product"}
            onClose={() => setProductModalOpen(false)}
          >
            <form onSubmit={handleProductSave} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name">
                  <input
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                        slug: prev.id ? prev.slug : slugify(event.target.value),
                      }))
                    }
                    className="input-admin"
                    placeholder="Chocolate Jar Cake"
                  />
                </Field>

                <Field label="Slug">
                  <input
                    value={productForm.slug}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        slug: slugify(event.target.value),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <Field label="Category">
                  <select
                    value={productForm.categoryId}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        categoryId: Number(event.target.value),
                        subcategoryId: null,
                      }))
                    }
                    className="input-admin"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Subcategory">
                  <select
                    value={productForm.subcategoryId || ""}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        subcategoryId: event.target.value
                          ? Number(event.target.value)
                          : null,
                      }))
                    }
                    className="input-admin"
                  >
                    <option value="">No subcategory</option>

                    {productSubcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <ImageUploadField
                label="Product thumbnail"
                folder="baura-bakers/products"
                helperText="This image appears on product cards."
                value={{
                  imageUrl: productForm.thumbnailUrl,
                  imagePublicId: productForm.thumbnailPublicId,
                }}
                onChange={(value) =>
                  setProductForm((prev) => ({
                    ...prev,
                    thumbnailUrl: value.imageUrl,
                    thumbnailPublicId: value.imagePublicId,
                  }))
                }
              />

              <Field label="Slogan">
                <input
                  value={productForm.slogan}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      slogan: event.target.value,
                    }))
                  }
                  className="input-admin"
                />
              </Field>

              <Field label="Short description">
                <input
                  value={productForm.shortDesc}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      shortDesc: event.target.value,
                    }))
                  }
                  className="input-admin"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="input-admin min-h-[110px]"
                />
              </Field>

              <section className="rounded-3xl border border-black/10 bg-white/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-brand-ink">Prices</h3>

                  <button
                    type="button"
                    onClick={addProductSize}
                    className="rounded-xl border border-brand-ink/15 bg-white/70 px-3 py-2 text-xs font-semibold text-brand-ink"
                  >
                    Add size
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {productForm.sizes.map((size, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-2xl border border-black/10 bg-white/60 p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
                    >
                      <input
                        value={size.label}
                        onChange={(event) =>
                          updateProductSize(index, {
                            label: event.target.value,
                          })
                        }
                        className="input-admin"
                        placeholder="Regular"
                      />

                      <input
                        value={size.serves || ""}
                        onChange={(event) =>
                          updateProductSize(index, {
                            serves: event.target.value,
                          })
                        }
                        className="input-admin"
                        placeholder="Serves"
                      />

                      <input
                        type="number"
                        value={size.priceLkr}
                        onChange={(event) =>
                          updateProductSize(index, {
                            priceLkr: Number(event.target.value || 0),
                          })
                        }
                        className="input-admin"
                        placeholder="Price"
                      />

                      <button
                        type="button"
                        onClick={() => removeProductSize(index)}
                        disabled={productForm.sizes.length === 1}
                        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-black/10 bg-white/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-brand-ink">
                    Gallery images
                  </h3>

                  <button
                    type="button"
                    onClick={addGalleryImage}
                    className="rounded-xl border border-brand-ink/15 bg-white/70 px-3 py-2 text-xs font-semibold text-brand-ink"
                  >
                    Add gallery image
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {productForm.images.length === 0 ? (
                    <p className="text-sm text-brand-ink/55">
                      No gallery images yet.
                    </p>
                  ) : (
                    productForm.images.map((image, index) => (
                      <div
                        key={index}
                        className="rounded-3xl border border-black/10 bg-white/60 p-4"
                      >
                        <div className="mb-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                          >
                            Remove image
                          </button>
                        </div>

                        <ImageUploadField
                          label={`Gallery image ${index + 1}`}
                          folder="baura-bakers/products/gallery"
                          value={{
                            imageUrl: image.imageUrl,
                            imagePublicId: image.imagePublicId || "",
                          }}
                          onChange={(value) =>
                            updateGalleryImage(index, {
                              imageUrl: value.imageUrl,
                              imagePublicId: value.imagePublicId,
                            })
                          }
                        />

                        <input
                          value={image.alt || ""}
                          onChange={(event) =>
                            updateGalleryImage(index, {
                              alt: event.target.value,
                            })
                          }
                          className="input-admin mt-3"
                          placeholder="Image alt text"
                        />
                      </div>
                    ))
                  )}
                </div>
              </section>

              <Field label="Tags comma separated">
                <input
                  value={tagText}
                  onChange={(event) => setTagText(event.target.value)}
                  className="input-admin"
                  placeholder="Best seller, Fresh, New"
                />
              </Field>

              <section className="rounded-3xl border border-black/10 bg-white/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-ink/60">
                  Sugar levels
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {sugarLevels.map((level) => {
                    const checked = productForm.sugarLevelIds.includes(
                      level.id,
                    );

                    return (
                      <label
                        key={level.id}
                        className={[
                          "cursor-pointer rounded-full border px-3 py-2 text-xs font-semibold transition",
                          checked
                            ? "border-brand-ink bg-brand-ink text-brand-bg"
                            : "border-brand-ink/15 bg-white/70 text-brand-ink",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setProductForm((prev) => ({
                              ...prev,
                              sugarLevelIds: checked
                                ? prev.sugarLevelIds.filter(
                                    (id) => id !== level.id,
                                  )
                                : [...prev.sugarLevelIds, level.id],
                            }))
                          }
                          className="sr-only"
                        />

                        {level.name}
                      </label>
                    );
                  })}
                </div>
              </section>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Sort order">
                  <input
                    type="number"
                    value={productForm.sortOrder}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        sortOrder: Number(event.target.value || 0),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/50 px-4 py-3 text-sm font-semibold text-brand-ink">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Active
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/50 px-4 py-3 text-sm font-semibold text-brand-ink">
                  <input
                    type="checkbox"
                    checked={productForm.isCombo}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        isCombo: event.target.checked,
                      }))
                    }
                  />
                  Combo
                </label>
              </div>

              {productForm.isCombo && (
                <Field label="Combo notes">
                  <textarea
                    value={comboNotes}
                    onChange={(event) => setComboNotes(event.target.value)}
                    className="input-admin min-h-[90px]"
                    placeholder="What is included in this combo?"
                  />
                </Field>
              )}

              <ModalActions
                isSaving={isSaving}
                onCancel={() => setProductModalOpen(false)}
                saveText="Save product"
              />
            </form>
          </Modal>
        )}

        {categoryModalOpen && (
          <Modal
            title={categoryForm.id ? "Edit category" : "Add category"}
            onClose={() => setCategoryModalOpen(false)}
          >
            <form onSubmit={handleCategorySave} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category name">
                  <input
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                        slug: prev.id ? prev.slug : slugify(event.target.value),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <Field label="Slug">
                  <input
                    value={categoryForm.slug}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        slug: slugify(event.target.value),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>
              </div>

              <ImageUploadField
                label="Category menu icon"
                folder="baura-bakers/categories"
                helperText="Upload a black stroke-style icon like your cupcake example."
                value={{
                  imageUrl: categoryForm.imageUrl,
                  imagePublicId: categoryForm.imagePublicId,
                }}
                onChange={(value) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    imageUrl: value.imageUrl,
                    imagePublicId: value.imagePublicId,
                  }))
                }
              />

              <Field label="Description">
                <textarea
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="input-admin min-h-[90px]"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sort order">
                  <input
                    type="number"
                    value={categoryForm.sortOrder}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        sortOrder: Number(event.target.value || 0),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/50 px-4 py-3 text-sm font-semibold text-brand-ink">
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Active
                </label>
              </div>

              <ModalActions
                isSaving={isSaving}
                onCancel={() => setCategoryModalOpen(false)}
                saveText="Save category"
              />
            </form>
          </Modal>
        )}

        {subcategoryModalOpen && (
          <Modal
            title={subcategoryForm.id ? "Edit subcategory" : "Add subcategory"}
            onClose={() => setSubcategoryModalOpen(false)}
          >
            <form onSubmit={handleSubcategorySave} className="space-y-5">
              <Field label="Parent category">
                <select
                  value={subcategoryForm.categoryId}
                  onChange={(event) =>
                    setSubcategoryForm((prev) => ({
                      ...prev,
                      categoryId: Number(event.target.value),
                    }))
                  }
                  className="input-admin"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Subcategory name">
                  <input
                    value={subcategoryForm.name}
                    onChange={(event) =>
                      setSubcategoryForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                        slug: prev.id ? prev.slug : slugify(event.target.value),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <Field label="Slug">
                  <input
                    value={subcategoryForm.slug}
                    onChange={(event) =>
                      setSubcategoryForm((prev) => ({
                        ...prev,
                        slug: slugify(event.target.value),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>
              </div>

              <ImageUploadField
                label="Subcategory menu icon"
                folder="baura-bakers/subcategories"
                helperText="Optional. If empty, the menu can use the parent category icon."
                value={{
                  imageUrl: subcategoryForm.imageUrl,
                  imagePublicId: subcategoryForm.imagePublicId,
                }}
                onChange={(value) =>
                  setSubcategoryForm((prev) => ({
                    ...prev,
                    imageUrl: value.imageUrl,
                    imagePublicId: value.imagePublicId,
                  }))
                }
              />

              <Field label="Description">
                <textarea
                  value={subcategoryForm.description}
                  onChange={(event) =>
                    setSubcategoryForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="input-admin min-h-[90px]"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sort order">
                  <input
                    type="number"
                    value={subcategoryForm.sortOrder}
                    onChange={(event) =>
                      setSubcategoryForm((prev) => ({
                        ...prev,
                        sortOrder: Number(event.target.value || 0),
                      }))
                    }
                    className="input-admin"
                  />
                </Field>

                <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/50 px-4 py-3 text-sm font-semibold text-brand-ink">
                  <input
                    type="checkbox"
                    checked={subcategoryForm.isActive}
                    onChange={(event) =>
                      setSubcategoryForm((prev) => ({
                        ...prev,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Active
                </label>
              </div>

              <ModalActions
                isSaving={isSaving}
                onCancel={() => setSubcategoryModalOpen(false)}
                saveText="Save subcategory"
              />
            </form>
          </Modal>
        )}
      </div>
    </Page>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
        active
          ? "border-brand-ink bg-brand-ink text-brand-bg"
          : "border-brand-ink/15 bg-white/55 text-brand-ink hover:bg-white/75",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white/60 shadow-sm backdrop-blur">
      <div className="max-h-[720px] overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full text-left text-sm">
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="sticky top-0 z-10 bg-brand-bg px-5 py-4 text-xs font-semibold uppercase tracking-widest text-brand-ink/55">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-5 py-4 text-brand-ink/75">{children}</td>;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "rounded-full border px-2.5 py-1 text-xs font-semibold",
        active
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700",
      ].join(" ")}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function IconPreview({
  imageUrl,
  label,
}: {
  imageUrl: string | null;
  label: string;
}) {
  return (
    <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-black/10 bg-brand-bg/70">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className="h-full w-full object-contain p-2.5"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="text-xs text-brand-ink/40">No icon</span>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-brand-ink/60">
        {label}
      </span>

      {children}
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/10 bg-brand-bg shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 bg-white/55 px-5 py-4">
          <h2 className="text-xl font-semibold text-brand-ink">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-brand-ink/10 bg-white/70 text-brand-ink hover:bg-white"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[calc(92vh-74px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalActions({
  isSaving,
  onCancel,
  saveText,
}: {
  isSaving: boolean;
  onCancel: () => void;
  saveText: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-black/10 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="rounded-2xl border border-brand-ink/15 bg-white/65 px-5 py-3 text-sm font-semibold text-brand-ink disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-2xl bg-brand-ink px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:bg-brand-ink/45"
      >
        {isSaving ? "Saving..." : saveText}
      </button>
    </div>
  );
}
