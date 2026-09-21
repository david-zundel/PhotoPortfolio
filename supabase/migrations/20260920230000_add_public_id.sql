-- Cloudinary public_id for each photo (null for legacy Supabase Storage rows).
-- Needed so the delete-cloudinary edge function can remove the file when a photo is deleted.
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS public_id text;
