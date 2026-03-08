

## Plan: Update Portfolio for David Zundel with Placeholder Images

### Changes

1. **Update name and branding** across all components:
   - `HeroSection.tsx`: Change "Elena Vasquez" to "David Zundel"
   - `ContactSection.tsx`: Update any name references

2. **Switch images to placeholder URLs** using `picsum.photos` or `unsplash` placeholder URLs for 3:2 aspect ratio (e.g., 1200x800), so the layout is ready for David to swap in his own photos later. Remove the local asset imports.

3. **Update image aspect ratios** to 3:2 horizontal format:
   - `LandscapeCountry.tsx`: Change `h-[60vh]` to use `aspect-[3/2]` with `w-full` instead
   - `PortraitsSection.tsx`: Change `h-[70vh]` to `aspect-[3/2]` with `w-full`

4. **Keep pastel color palette** as-is since David confirmed he wants pastels. Slightly adjust the gradient tones to feel more neutral/masculine -- shifting from coral-heavy to a balanced mix with more sky blue, mint, and slate-lavender tones.

5. **Clean up unused asset files** -- remove the generated `.jpg` files from `src/assets/` since we're moving to external placeholders.

### Files to modify
- `src/components/HeroSection.tsx` -- name change
- `src/components/LandscapesSection.tsx` -- placeholder image URLs, remove asset imports
- `src/components/LandscapeCountry.tsx` -- 3:2 aspect ratio
- `src/components/PortraitsSection.tsx` -- placeholder image URLs, remove asset imports, 3:2 aspect ratio
- `src/components/ContactSection.tsx` -- name update
- `src/index.css` -- subtle palette shift (less coral-dominant, more balanced pastels)
- Delete 10 asset files from `src/assets/`

### How to swap in real photos later
After implementation, David can replace the placeholder URLs with his own images by either:
- Compressing photos under 20MB and uploading them to the chat
- Hosting them externally and providing URLs
- Using the code editor to update the image paths directly

