import Category from "@/models/Category";

import {
  CreateCategoryValues,
  UpdateCategoryValues,
} from "@/lib/validations/category";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createCategory(
  data: CreateCategoryValues
) {
  const slug = createSlug(data.name);

  const existingCategory = await Category.findOne({
    $or: [
      { name: data.name.trim() },
      { slug },
    ],
  });

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  const category = await Category.create({
    name: data.name.trim(),
    slug,
    description: data.description?.trim() || "",
    image: data.image || "",
  });

  return category;
}

export async function getAllCategories() {
  return Category.find().sort({ createdAt: -1 });
}

export async function getCategoryById(id: string) {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryValues
) {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  if (data.name) {
    const slug = createSlug(data.name);

    const existingCategory = await Category.findOne({
      $or: [
        { name: data.name.trim() },
        { slug },
      ],
      _id: { $ne: id },
    });

    if (existingCategory) {
      throw new Error("Category name already exists");
    }

    category.name = data.name.trim();
    category.slug = slug;
  }

  if (data.description !== undefined) {
    category.description = data.description.trim();
  }

  if (data.image !== undefined) {
    category.image = data.image;
  }

  await category.save();

  return category;
}

export async function deleteCategory(id: string) {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  await Category.findByIdAndDelete(id);

  return category;
}
