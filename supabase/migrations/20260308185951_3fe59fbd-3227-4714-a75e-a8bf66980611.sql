
ALTER TABLE public.photos
ADD COLUMN homepage boolean NOT NULL DEFAULT false,
ADD COLUMN description text,
ADD COLUMN subtitle text,
ADD COLUMN color text,
ADD COLUMN text_gradient text;
