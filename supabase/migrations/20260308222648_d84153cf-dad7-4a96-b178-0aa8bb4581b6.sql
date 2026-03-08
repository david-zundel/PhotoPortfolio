ALTER TABLE public.photos ADD COLUMN crop_x double precision NOT NULL DEFAULT 50;
ALTER TABLE public.photos ADD COLUMN crop_y double precision NOT NULL DEFAULT 50;