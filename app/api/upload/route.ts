import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { errorResponse, successResponse } from "@/lib/api-utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * POST /api/upload
 * Upload an image to Supabase Storage
 * Uses service role key for backend-only access (no RLS policies needed)
 * Supports both authenticated (volunteers) and anonymous (reports) uploads
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Verify service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured!");
      return errorResponse(
        "Server configuration error: SUPABASE_SERVICE_ROLE_KEY not found. Please add it to your .env.local file.",
        500,
        { setupRequired: true }
      );
    }

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

    // Get Supabase admin client (bypasses RLS)
    const supabase = createAdminClient();

    console.log("🔑 Using admin client for upload");
    console.log("📦 Target bucket: report-images");

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;

    console.log(`📄 Uploading file: ${fileName}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("report-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase storage error:", error);
      console.error("Error details:", {
        message: error.message,
        status: (error as unknown as { status?: number }).status,
        statusCode: (error as unknown as { statusCode?: string }).statusCode,
      });
      
      // Provide more specific error messages
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        return errorResponse(
          "Storage bucket 'report-images' not found. Please create it in Supabase Dashboard: Storage → Create bucket → Name: 'report-images'",
          500,
          { bucketName: 'report-images', setupRequired: true }
        );
      }

      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        return errorResponse(
          "Storage bucket RLS policy error. The bucket may have RLS enabled. Please disable RLS on the bucket or contact support.",
          500,
          { 
            error: error.message,
            solution: "In Supabase Dashboard: Storage → report-images → Settings → Disable 'Enable RLS' OR delete and recreate bucket as Public"
          }
        );
      }
      
      return errorResponse(
        `Failed to upload image: ${error.message || 'Unknown error'}`,
        500,
        { error: error.message }
      );
    }

    console.log("✅ Upload successful:", data.path);

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
    // Use regular client to verify authentication
    const { createClient } = await import("@/lib/supabase/server");
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

    // Use admin client for actual deletion (bypasses RLS)
    const adminSupabase = createAdminClient();

    // Delete from storage
    const { error } = await adminSupabase.storage
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
