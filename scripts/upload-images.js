const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const files = fs.readdirSync(uploadsDir);

async function uploadImages() {
  console.log(`Starting upload of ${files.length} images from ${uploadsDir} to 'recipes' bucket...`);
  
  for (const filename of files) {
    const filePath = path.join(uploadsDir, filename);
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine content type
    let contentType = 'image/jpeg';
    if (filename.endsWith('.png')) contentType = 'image/png';
    else if (filename.endsWith('.webp')) contentType = 'image/webp';
    
    // We upload to path 'uploads/filename'
    const storagePath = `uploads/${filename}`;
    
    console.log(`Uploading ${filename} (${fileBuffer.length} bytes) as ${contentType}...`);
    
    const { data, error } = await supabase.storage
      .from('recipes')
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true
      });
      
    if (error) {
      console.error(`❌ Failed to upload ${filename}:`, error.message);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('recipes')
        .getPublicUrl(storagePath);
      console.log(`✅ Uploaded ${filename} successfully!`);
      console.log(`   URL: ${publicUrl}`);
    }
  }
  console.log('All done!');
}

uploadImages().catch(err => {
  console.error('Unhandled error:', err);
});
