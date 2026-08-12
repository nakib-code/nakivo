"use client";

import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "./ProductTable";



interface FlashSaleDialogProps {
  product: Product | null;

  open: boolean;

  onOpenChange: (open: boolean) => void;

  onSuccess?: (product: Product) => void;
}

/* =========================================================
   FORMAT DATE FOR DATETIME-LOCAL
========================================================= */

function formatDateTimeLocal(date?: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();

  const month = String(
    parsedDate.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    parsedDate.getDate()
  ).padStart(2, "0");

  const hours = String(
    parsedDate.getHours()
  ).padStart(2, "0");

  const minutes = String(
    parsedDate.getMinutes()
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function FlashSaleDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: FlashSaleDialogProps) {
  /*
   * Important:
   * No useEffect here.
   *
   * Dialog opening with a different product creates fresh
   * component state when used with key from parent.
   */

  const [price, setPrice] = useState(
    product?.flashSalePrice !== undefined
      ? String(product.flashSalePrice)
      : ""
  );

  const [start, setStart] = useState(
    formatDateTimeLocal(product?.flashSaleStart)
  );

  const [end, setEnd] = useState(
    formatDateTimeLocal(product?.flashSaleEnd)
  );

  const [loading, setLoading] = useState(false);

  if (!product) {
    return null;
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!price || !start || !end) {
      toast.error("Please fill all flash sale fields.");
      return;
    }

    const flashSalePrice = Number(price);

    if (
      !Number.isFinite(flashSalePrice) ||
      flashSalePrice <= 0
    ) {
      toast.error("Please enter a valid flash sale price.");
      return;
    }

    if (flashSalePrice >= Number(product.price)) {
      toast.error(
        "Flash sale price must be lower than regular price."
      );
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      toast.error("Invalid flash sale date or time.");
      return;
    }

    if (endDate <= startDate) {
      toast.error(
        "End time must be after start time."
      );
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "isFlashSale",
        "true"
      );

      formData.append(
        "flashSalePrice",
        String(flashSalePrice)
      );

      formData.append(
        "flashSaleStart",
        startDate.toISOString()
      );

      formData.append(
        "flashSaleEnd",
        endDate.toISOString()
      );

      const response = await fetch(
        `/api/products/${product._id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to activate flash sale."
        );
      }

      /*
       * IMPORTANT FIX
       *
       * API should normally return result.data.
       * But if backend doesn't return updated product,
       * we safely create it from the existing product.
       */

      const updatedProduct: Product =
        result.data ?? {
          ...product,
          isFlashSale: true,
          flashSalePrice,
          flashSaleStart:
            startDate.toISOString(),
          flashSaleEnd:
            endDate.toISOString(),
        };

      toast.success(
        product.isFlashSale
          ? "Flash sale updated successfully."
          : "Flash sale activated successfully."
      );

      /*
       * Send updated product to parent.
       */
      onSuccess?.(updatedProduct);

      /*
       * Close popup.
       */
      onOpenChange(false);
    } catch (error) {
      console.error(
        "Flash Sale Error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to activate flash sale."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!loading) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
            <Zap
              className="h-5 w-5 text-red-500"
              fill="currentColor"
            />
          </div>

          <DialogTitle className="text-xl">
            {product.isFlashSale
              ? "Edit Flash Sale"
              : "Create Flash Sale"}
          </DialogTitle>

          <DialogDescription>
            Set a discounted price and schedule
            for{" "}
            <span className="font-medium text-slate-900">
              {product.title}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 pt-2"
        >
          {/* Regular Price */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Regular Price
            </label>

            <Input
              value={`$${Number(
                product.price
              ).toFixed(2)}`}
              disabled
              className="bg-slate-50"
            />
          </div>

          {/* Flash Price */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Flash Sale Price
            </label>

            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) =>
                setPrice(
                  event.target.value
                )
              }
              placeholder="e.g. 49.99"
              disabled={loading}
              required
            />

            <p className="text-xs text-slate-500">
              Must be lower than the regular price.
            </p>
          </div>

          {/* Start */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Start Time
            </label>

            <Input
              type="datetime-local"
              value={start}
              onChange={(event) =>
                setStart(
                  event.target.value
                )
              }
              disabled={loading}
              required
            />
          </div>

          {/* End */}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              End Time
            </label>

            <Input
              type="datetime-local"
              value={end}
              onChange={(event) =>
                setEnd(
                  event.target.value
                )
              }
              disabled={loading}
              required
            />
          </div>

          {/* Actions */}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Zap
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                  />

                  {product.isFlashSale
                    ? "Update Flash Sale"
                    : "Activate Flash Sale"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}