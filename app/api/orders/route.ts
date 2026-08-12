import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

import Order from "@/models/Order";
import Product from "@/models/Product";

// ==================================================
// TYPES
// ==================================================

interface OrderItemInput {
  product: string;
  quantity: number;
}

interface ShippingAddressInput {
  address: string;
  city: string;
  phone: string;
}

// ==================================================
// FLASH SALE PRICE HELPER
// ==================================================

function getActiveProductPrice(product: {
  price: number;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleStart?: Date | string;
  flashSaleEnd?: Date | string;
}) {
  const regularPrice = Number(product.price);

  // ----------------------------------------
  // Invalid regular price
  // ----------------------------------------

  if (
    !Number.isFinite(regularPrice) ||
    regularPrice < 0
  ) {
    return {
      price: 0,
      isFlashSale: false,
    };
  }

  // ----------------------------------------
  // No flash sale
  // ----------------------------------------

  if (
    !product.isFlashSale ||
    product.flashSalePrice === undefined ||
    !product.flashSaleStart ||
    !product.flashSaleEnd
  ) {
    return {
      price: regularPrice,
      isFlashSale: false,
    };
  }

  // ----------------------------------------
  // Flash Sale Dates
  // ----------------------------------------

  const now = Date.now();

  const start = new Date(
    product.flashSaleStart
  ).getTime();

  const end = new Date(
    product.flashSaleEnd
  ).getTime();

  const flashPrice = Number(
    product.flashSalePrice
  );

  // ----------------------------------------
  // Validate Flash Sale
  // ----------------------------------------

  const isActive =
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    Number.isFinite(flashPrice) &&
    start <= end &&
    now >= start &&
    now <= end &&
    flashPrice > 0 &&
    flashPrice < regularPrice;

  // ----------------------------------------
  // Active Flash Sale
  // ----------------------------------------

  if (isActive) {
    return {
      price: flashPrice,
      isFlashSale: true,
    };
  }

  // ----------------------------------------
  // Flash Sale Inactive / Expired
  // ----------------------------------------

  return {
    price: regularPrice,
    isFlashSale: false,
  };
}

// ==================================================
// CREATE ORDER
// ==================================================

export async function POST(req: NextRequest) {
  try {
    // ========================================
    // Authentication
    // ========================================

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================
    // Database
    // ========================================

    await connectDB();

    // ========================================
    // Request Body
    // ========================================

    const body = await req.json();

    const {
      items,
      shippingAddress,
      paymentMethod = "COD",
    } = body as {
      items: OrderItemInput[];
      shippingAddress: ShippingAddressInput;
      paymentMethod?: "COD" | "STRIPE";
    };

    // ========================================
    // Validate Items
    // ========================================

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Order must contain at least one product",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================
    // Validate Shipping Address
    // ========================================

    if (!shippingAddress) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Shipping address is required",
        },
        {
          status: 400,
        }
      );
    }

    const {
      address,
      city,
      phone,
    } = shippingAddress;

    if (!address?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Shipping address is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!city?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "City is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone number is required",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================
    // Validate Payment Method
    // ========================================

    if (
      !["COD", "STRIPE"].includes(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid payment method",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================
    // Prepare Order Items
    // ========================================

    const orderItems = [];

    let totalPrice = 0;

    // ========================================
    // Process Each Product
    // ========================================

    for (const item of items) {
      // ----------------------------------------
      // Validate Product ID
      // ----------------------------------------

      if (!item.product) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Product ID is required",
          },
          {
            status: 400,
          }
        );
      }

      // ----------------------------------------
      // Validate Quantity
      // ----------------------------------------

      const quantity = Number(
        item.quantity
      );

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid product quantity",
          },
          {
            status: 400,
          }
        );
      }

      // ----------------------------------------
      // Find Product
      // ----------------------------------------

      const product =
        await Product.findById(
          item.product
        );

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One of the selected products was not found",
          },
          {
            status: 404,
          }
        );
      }

      // ----------------------------------------
      // Check Stock
      // ----------------------------------------

      if (
        product.stock < quantity
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${product.title} has only ${product.stock} items available`,
          },
          {
            status: 400,
          }
        );
      }

      // ----------------------------------------
      // Get Server-Side Price
      // ----------------------------------------

      const {
        price: finalPrice,
        isFlashSale,
      } =
        getActiveProductPrice(
          product
        );

      // ----------------------------------------
      // Validate Final Price
      // ----------------------------------------

      if (
        !Number.isFinite(
          finalPrice
        ) ||
        finalPrice <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid price for ${product.title}`,
          },
          {
            status: 400,
          }
        );
      }

      // ----------------------------------------
      // Calculate Item Total
      // ----------------------------------------

      const itemTotal =
        finalPrice * quantity;

      totalPrice += itemTotal;

      // ----------------------------------------
      // Product Image
      // ----------------------------------------

      const image =
        product.images?.[0]?.url ||
        "";

      // ----------------------------------------
      // Save Order Item
      // ----------------------------------------

      orderItems.push({
        product: product._id,
        title: product.title,
        quantity,
        image,

        // IMPORTANT:
        // Save the actual price paid
        price: finalPrice,

        // This is optional.
        // Remove if your OrderSchema
        // does not contain this field.
        isFlashSale,
      });
    }

    // ========================================
    // Validate Total
    // ========================================

    if (
      !Number.isFinite(totalPrice) ||
      totalPrice <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid order total",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================
    // Create Order
    // ========================================

    const order =
      await Order.create({
        user: user.id,

        orderItems,

        shippingAddress: {
          address:
            address.trim(),

          city: city.trim(),

          phone: phone.trim(),
        },

        paymentMethod,

        totalPrice,

        isPaid: false,

        status: "Pending",
      });

    // ========================================
    // Reduce Product Stock
    // ========================================

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: -item.quantity,
          },
        }
      );
    }

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Order created successfully",

        data: order,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST Order Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to create order",
      },
      {
        status: 500,
      }
    );
  }
}

// ==================================================
// GET ORDERS
// ==================================================

export async function GET() {
  try {
    // ========================================
    // Authentication
    // ========================================

    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required",
        },
        {
          status: 401,
        }
      );
    }

    // ========================================
    // Database
    // ========================================

    await connectDB();

    // ========================================
    // Admin → All Orders
    // Customer → Own Orders
    // ========================================

    const query =
      user.role === "admin"
        ? {}
        : {
            user: user.id,
          };

    // ========================================
    // Fetch Orders
    // ========================================

    const orders =
      await Order.find(query)
        .populate(
          "user",
          "name email image"
        )
        .populate(
          "orderItems.product",
          "title price images isFlashSale flashSalePrice flashSaleStart flashSaleEnd"
        )
        .sort({
          createdAt: -1,
        });

    // ========================================
    // Response
    // ========================================

    return NextResponse.json(
      {
        success: true,
        data: orders,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET Orders Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch orders",
      },
      {
        status: 500,
      }
    );
  }
}