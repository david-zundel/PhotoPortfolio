ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS crop_x double precision NOT NULL DEFAULT 50;
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS crop_y double precision NOT NULL DEFAULT 50;
