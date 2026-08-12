import type { SupabaseClient } from '@supabase/supabase-js'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024
const BUCKET_NAME = 'avatars'

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

const MAGIC_BYTES: Record<AllowedMimeType, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
}

const MIME_EXTENSIONS: Record<AllowedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const
const MAX_VIDEO_SIZE = 50 * 1024 * 1024
type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number]

const VIDEO_MIME_EXTENSIONS: Record<AllowedVideoMimeType, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
}

function getExtension(mimeType: string): string | null {
  const entry = Object.entries(MIME_EXTENSIONS).find(([mime]) => mime === mimeType)
  if (entry) return entry[1]
  const vidEntry = Object.entries(VIDEO_MIME_EXTENSIONS).find(([mime]) => mime === mimeType)
  return vidEntry ? vidEntry[1] : null
}

function checkMagicBytes(buffer: ArrayBuffer, mimeType: AllowedMimeType): boolean {
  const magic = MAGIC_BYTES[mimeType]
  if (!magic) return false
  const view = new Uint8Array(buffer)
  for (let i = 0; i < magic.length; i++) {
    if (view[i] !== magic[i]) return false
  }
  if (mimeType === 'image/webp') {
    if (view.length < 12) return false
    const riff = String.fromCharCode(...view.slice(0, 4))
    const webp = String.fromCharCode(...view.slice(8, 12))
    if (riff !== 'RIFF' || webp !== 'WEBP') return false
  }
  return true
}

export function validateVideoFile(file: File): { valid: true } | { valid: false; error: string; status: number } {
  if (!file || file.size === 0) {
    return { valid: false, error: 'File is empty', status: 400 }
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 50 MB', status: 413 }
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  const isValidMime = ALLOWED_VIDEO_MIME_TYPES.includes(file.type as AllowedVideoMimeType)
  const isValidExt = ['mp4', 'mov', 'webm'].includes(ext || '')

  if (!isValidMime && !isValidExt) {
    return { valid: false, error: 'Invalid file type. Allowed: MP4, MOV, WebM', status: 400 }
  }

  return { valid: true }
}

export function validateImageFile(file: File): { valid: true } | { valid: false; error: string; status: number } {
  if (!file || file.size === 0) {
    return { valid: false, error: 'File is empty', status: 400 }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 5 MB', status: 413 }
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  const isValidMime = ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)
  const isValidExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')

  if (!isValidMime && !isValidExt) {
    return { valid: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP', status: 400 }
  }

  return { valid: true }
}

export async function validateImageSignature(file: File): Promise<{ valid: true } | { valid: false; error: string; status: number }> {
  // If browser sent an empty or generic type, but file extension is valid, bypass signature check
  const ext = file.name.split('.').pop()?.toLowerCase()
  const isValidExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType) && isValidExt) {
    return { valid: true }
  }

  const buffer = await file.arrayBuffer()
  const mimeType = file.type as AllowedMimeType

  if (!checkMagicBytes(buffer, mimeType)) {
    return { valid: false, error: 'File content does not match file type', status: 400 }
  }

  return { valid: true }
}

export function generateStoragePath(userId: string, mimeType: string, filename?: string): string | null {
  let ext = getExtension(mimeType)
  if (!ext && filename) {
    const fileExt = filename.split('.').pop()?.toLowerCase()
    if (fileExt && ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm'].includes(fileExt)) {
      ext = fileExt === 'jpeg' ? 'jpg' : fileExt
    }
  }
  if (!ext) return null
  const uuid = crypto.randomUUID()
  return `${userId}/${uuid}.${ext}`
}

export function getPublicUrl(supabase: SupabaseClient, path: string, bucket: string = BUCKET_NAME): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export function extractPathFromPublicUrl(url: string, bucket: string = BUCKET_NAME): string | null {
  const bucketPrefix = `/object/public/${bucket}/`
  if (!url.includes(bucketPrefix)) return null
  const idx = url.indexOf(bucketPrefix)
  if (idx === -1) return null
  return url.slice(idx + bucketPrefix.length)
}

export async function uploadFileToBucket(
  supabase: SupabaseClient, 
  file: File, 
  path: string, 
  bucket: string = BUCKET_NAME
): Promise<{ data: { path: string }; error: null } | { data: null; error: string }> {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) {
    return { data: null, error: error.message }
  }
  return { data: { path: data.path }, error: null }
}

export async function uploadAvatar(supabase: SupabaseClient, file: File, path: string): Promise<{ data: { path: string }; error: null } | { data: null; error: string }> {
  return uploadFileToBucket(supabase, file, path, BUCKET_NAME)
}

export async function deleteAvatar(supabase: SupabaseClient, url: string, authUserId: string): Promise<{ success: true } | { success: false; error: string }> {
  const path = extractPathFromPublicUrl(url, BUCKET_NAME)
  if (!path) {
    return { success: false, error: 'URL does not belong to avatars bucket' }
  }

  const ownerId = path.split('/')[0]
  if (ownerId !== authUserId) {
    return { success: false, error: 'Cannot delete another user\'s avatar' }
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])
  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteFileByUrl(supabase: SupabaseClient, url: string, bucket?: string): Promise<boolean> {
  const targetBucket = bucket || (url.includes('/object/public/recipes/') ? 'recipes' : BUCKET_NAME)
  const path = extractPathFromPublicUrl(url, targetBucket)
  if (!path) return false
  const { error } = await supabase.storage.from(targetBucket).remove([path])
  return !error
}

export async function deleteUserFolder(supabase: SupabaseClient, userId: string, bucket: string = BUCKET_NAME): Promise<boolean> {
  try {
    const { data: files, error: listError } = await supabase.storage.from(bucket).list(userId)
    if (listError || !files || files.length === 0) return true

    const pathsToDelete = files.map((file) => `${userId}/${file.name}`)
    const { error: removeError } = await supabase.storage.from(bucket).remove(pathsToDelete)
    return !removeError
  } catch (err) {
    console.error(`Failed to cleanup user folder in ${bucket}:`, err)
    return false
  }
}


