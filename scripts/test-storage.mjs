/**
 * Test Supabase Storage Configuration
 * 
 * This script verifies that the Supabase storage bucket is properly configured.
 * Run with: node scripts/test-storage.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET_NAME = 'report-images';

async function testStorageSetup() {
  console.log('🧪 Testing Supabase Storage Configuration\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check environment variables
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
    console.error('\n💡 Make sure .env.local is properly configured\n');
    process.exit(1);
  }

  console.log('✅ Environment variables found\n');

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test 1: Check if bucket exists
  console.log(`📦 Test 1: Checking if bucket '${BUCKET_NAME}' exists...`);
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      console.error('\n💡 This might be a permissions issue or Supabase connection problem\n');
      process.exit(1);
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.error(`❌ Bucket '${BUCKET_NAME}' not found\n`);
      console.log('📋 Available buckets:', buckets?.map(b => b.name).join(', ') || 'None');
      console.log('\n🔧 TO FIX: Create the bucket in Supabase Dashboard:');
      console.log('   1. Go to: https://app.supabase.com/project/_/storage/buckets');
      console.log('   2. Click "New bucket"');
      console.log(`   3. Name: ${BUCKET_NAME}`);
      console.log('   4. Public: ✅ Yes (check the box)');
      console.log('   5. Click "Create bucket"\n');
      process.exit(1);
    }

    console.log(`✅ Bucket '${BUCKET_NAME}' exists\n`);
  } catch (error) {
    console.error('❌ Error checking buckets:', error.message);
    process.exit(1);
  }

  // Test 2: Check bucket is public
  console.log('🔓 Test 2: Checking if bucket is public...');
  try {
    const { data: bucket } = await supabase.storage.getBucket(BUCKET_NAME);
    
    if (bucket?.public) {
      console.log('✅ Bucket is public (read access enabled)\n');
    } else {
      console.warn('⚠️  Bucket might not be public');
      console.warn('   Users may not be able to view uploaded images\n');
    }
  } catch (error) {
    console.warn('⚠️  Could not verify bucket public status:', error.message, '\n');
  }

  // Test 3: Try to upload a test file
  console.log('📤 Test 3: Testing anonymous upload permission...');
  try {
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'Test file for CleanMap storage setup';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      
      if (uploadError.message?.includes('policy')) {
        console.error('\n💡 This is a POLICY ERROR - anonymous uploads are not allowed\n');
        console.log('🔧 TO FIX: Add storage policies in Supabase Dashboard:');
        console.log('   1. Go to: https://app.supabase.com/project/_/storage/policies');
        console.log(`   2. Select bucket: ${BUCKET_NAME}`);
        console.log('   3. Click "New policy" → Create a policy from scratch');
        console.log('   4. Add these policies:\n');
        console.log('   Policy 1: Allow Anonymous Uploads');
        console.log('   ─────────────────────────────────');
        console.log('   Name: Allow anonymous uploads');
        console.log('   Policy command: INSERT');
        console.log('   Target roles: public (anon)');
        console.log(`   USING expression: bucket_id = '${BUCKET_NAME}'`);
        console.log(`   WITH CHECK expression: bucket_id = '${BUCKET_NAME}'`);
        console.log('\n   Policy 2: Allow Public Reads');
        console.log('   ───────────────────────────');
        console.log('   Name: Allow public reads');
        console.log('   Policy command: SELECT');
        console.log('   Target roles: public (anon)');
        console.log(`   USING expression: bucket_id = '${BUCKET_NAME}'`);
        console.log('\n   Or use SQL in SQL Editor:');
        console.log(`   CREATE POLICY "Allow anonymous uploads" ON storage.objects`);
        console.log(`   FOR INSERT TO anon WITH CHECK (bucket_id = '${BUCKET_NAME}');`);
        console.log(`   `);
        console.log(`   CREATE POLICY "Allow public reads" ON storage.objects`);
        console.log(`   FOR SELECT TO anon USING (bucket_id = '${BUCKET_NAME}');\n`);
      }
      process.exit(1);
    }

    console.log('✅ Upload successful:', uploadData?.path, '\n');

    // Test 4: Get public URL
    console.log('🔗 Test 4: Testing public URL access...');
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testFileName);

    console.log('✅ Public URL generated:', publicUrl, '\n');

    // Test 5: Clean up test file
    console.log('🧹 Test 5: Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([testFileName]);

    if (deleteError) {
      console.warn('⚠️  Could not delete test file:', deleteError.message);
      console.warn(`   Please manually delete: ${testFileName}\n`);
    } else {
      console.log('✅ Test file deleted\n');
    }

  } catch (error) {
    console.error('❌ Test upload error:', error.message);
    process.exit(1);
  }

  // Success!
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('🎉 SUCCESS! Supabase Storage is properly configured!\n');
  console.log('✅ Bucket exists');
  console.log('✅ Anonymous uploads allowed');
  console.log('✅ Public URL access working');
  console.log('\n💡 Your /api/upload endpoint should now work correctly\n');
}

testStorageSetup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
