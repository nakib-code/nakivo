import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";
import {
  ALL_USER_ROLES,
  canManageUserAccount,
  type UserRole,
} from "@/lib/roles";

const ALLOWED_ROLES = ALL_USER_ROLES;
const ALLOWED_STATUSES = ["active", "blocked"] as const;

type UserStatus = (typeof ALLOWED_STATUSES)[number];

interface UserUpdatePayload {
  role?: UserRole;
  status?: UserStatus;
}

function isAllowedRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (ALLOWED_ROLES as readonly string[]).includes(value)
  );
}

function isAllowedStatus(value: unknown): value is UserStatus {
  return (
    typeof value === "string" &&
    (ALLOWED_STATUSES as readonly string[]).includes(value)
  );
}

// =========================
// UPDATE USER
// Role / Status
// =========================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user id",
        },
        {
          status: 400,
        }
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body",
        },
        {
          status: 400,
        }
      );
    }

    const { role, status } = body as {
      role?: unknown;
      status?: unknown;
    };

    const updateData: UserUpdatePayload = {};

    if (role !== undefined) {
      if (!isAllowedRole(role)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid role value",
          },
          {
            status: 400,
          }
        );
      }

      updateData.role = role;
    }

    if (status !== undefined) {
      if (!isAllowedStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid status value",
          },
          {
            status: 400,
          }
        );
      }

      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid fields provided for update",
        },
        {
          status: 400,
        }
      );
    }

    const permission = canManageUserAccount({
      actorRole: auth.user.role,
      actorId: auth.user.id,
      targetId: id,
      nextRole: updateData.role,
      nextStatus: updateData.status,
    });

    if (!permission.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: permission.reason || "Action not permitted",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        data: user,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Update User Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================
// DELETE USER
// =========================

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user id",
        },
        {
          status: 400,
        }
      );
    }

    if (id === auth.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own account",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Delete User Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete user",
      },
      {
        status: 500,
      }
    );
  }
}