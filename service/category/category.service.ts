import { cache } from "react";

import connectDB from "@/lib/db";
import Category from "@/models/Category";

import {
  CreateCategoryValues,
  UpdateCategoryValues,
} from "@/lib/validations/category";

export function createCategorySlug(input: string): string {
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `category-${Date.now().toString(36)}`;
}

export async function createCategory(
  data: CreateCategoryValues & { slug?: string; imagePublicId?: string }
) {
  const slug = data.slug?.trim()
    ? createCategorySlug(data.slug)
    : createCategorySlug(data.name);

  const existingCategory = await Category.findOne({
    $or: [{ name: data.name.trim() }, { slug }],
  })
    .select("_id")
    .lean();

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  const category = await Category.create({
    name: data.name.trim(),
    slug,
    description: data.description?.trim() || "",
    image: data.image || "",
    imagePublicId: data.imagePublicId || "",
  });

  return category;
}

export const getAllCategories = cache(async () => {
  await connectDB();
  return Category.find()
    .select("name slug description image")
    .sort({ createdAt: -1 })
    .lean();
});

export async function getCategoryById(id: string) {
  await connectDB();
  const category = await Category.findById(id).lean();

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
    const slug = createCategorySlug(data.name);

    const existingCategory = await Category.findOne({
      $or: [{ name: data.name.trim() }, { slug }],
      _id: { $ne: id },
    })
      .select("_id")
      .lean();

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
  const category = await Category.findByIdAndDelete(id).lean();

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
}
