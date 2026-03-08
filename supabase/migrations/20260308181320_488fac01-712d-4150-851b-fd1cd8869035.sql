-- Photos table for gallery metadata
CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  src text NOT NULL,
  alt text,
  location text,
  category text NOT NULL DEFAULT 'landscape',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view photos (public gallery)
CREATE POLICY "Anyone can view photos" ON public.photos
  FOR SELECT USING (true);

-- Only authenticated users can manage photos
CREATE POLICY "Authenticated users can insert photos" ON public.photos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update photos" ON public.photos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete photos" ON public.photos
  FOR DELETE TO authenticated USING (true);

-- Storage bucket for photo uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Storage policies
CREATE POLICY "Anyone can view photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Authenticated users can delete photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'photos');