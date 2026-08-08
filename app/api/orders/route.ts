import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    // 1. NextAuth Session theke user detect kora
    const session = await getServerSession(authOptions);

    if (!session || !session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized! Please login first." },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID not found in session. Please re-login." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { items, totalAmount, shippingAddress, phone, paymentMethod, paymentStatus } = body;

    // 2. Safely Map Order Items (Ensure Image field is never empty)
    const formattedOrderItems = items?.map((item: any) => {
      // Product image extract
      const img =
        item.image ||
        (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : "") ||
        "https://via.placeholder.com/150";

      return {
        title: item.title || "Untitled Product",
        quantity: item.quantity || 1,
        image: img, // Empty hobe na
        price: item.price || 0,
        product: item._id || item.product,
      };
    });

    // 3. Create Order
    const newOrder = await Order.create({
      user: userId, // Pass verified user ID
      orderItems: formattedOrderItems,
      totalPrice: totalAmount,
      shippingAddress: {
        address: shippingAddress?.street || shippingAddress?.address || "N/A",
        city: shippingAddress?.city || "N/A",
        phone: phone || shippingAddress?.phone || "N/A",
      },
      paymentMethod: paymentMethod || "COD",
      isPaid: paymentStatus === "Paid",
      status: "Pending",
    });

    return NextResponse.json(
      { success: true, message: "Order placed successfully!", data: newOrder },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Order Creation Validation Error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}