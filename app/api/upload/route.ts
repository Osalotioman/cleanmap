import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * POST /api/upload
 * Upload an image to Supabase Storage
 * Supports both authenticated (volunteers) and anonymous (reports) uploads
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        400
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        400
      );
    }

    // Get Supabase client
    const supabase = await createClient();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    // Note: Make sure you've created a public bucket called 'report-images' in Supabase
    const { data, error } = await supabase.storage
      .from("report-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return errorResponse("Failed to upload image", 500);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("report-images").getPublicUrl(fileName);

    return successResponse(
      {
        fileName: data.path,
        url: publicUrl,
        size: file.size,
        type: file.type,
      },
      201,
      "Image uploaded successfully"
    );
  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}

/**
 * DELETE /api/upload?fileName=<fileName>
 * Delete an image from Supabase Storage
 * Only authenticated users can delete
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return errorResponse("fileName parameter required", 400);
    }

    // Delete from storage
    const { error } = await supabase.storage
      .from("report-images")
      .remove([fileName]);

    if (error) {
      console.error("Supabase storage delete error:", error);
      return errorResponse("Failed to delete image", 500);
    }

    return successResponse({ fileName }, 200, "Image deleted successfully");
  } catch (error) {
    console.error("Delete error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500
    );
  }
}
