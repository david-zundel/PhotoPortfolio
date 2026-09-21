# Welcome to your Lovable project

## Photo storage: Cloudinary

Photos are compressed in the browser (2560 px long edge, JPEG ~86 %) and uploaded straight to
[Cloudinary](https://cloudinary.com) from the admin page. Supabase still holds the `photos`
table and admin login; it no longer stores image files.

### One-time setup

1. **Cloudinary account** (free plan is fine). From the dashboard note your **Cloud name**.
2. **Unsigned upload preset**: Settings → Upload → Upload presets → *Add upload preset* →
   Signing mode **Unsigned** → Save. Note the preset name.
3. **Env vars** – add to `.env` locally and as repository secrets for the GitHub Pages deploy:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
   ```
4. **Database column** – run the migration in `supabase/migrations/20260920230000_add_public_id.sql`
   (`supabase db push`, or paste it into the SQL editor in the Supabase dashboard).
5. **Deletes (optional but recommended)** – deleting a Cloudinary file needs the API secret, so
   the admin page calls a Supabase Edge Function:
   ```sh
   supabase functions deploy delete-cloudinary
   supabase secrets set CLOUDINARY_CLOUD_NAME=… CLOUDINARY_API_KEY=… CLOUDINARY_API_SECRET=…
   ```
   Until it's deployed, deleting a photo removes the row but leaves the file in Cloudinary.

### Migrating the photos already in Supabase Storage

```sh
cp .env.migrate.example .env.migrate   # fill in service-role key + Cloudinary API key/secret
npm run migrate:cloudinary -- --dry-run          # shows before/after sizes, changes nothing
npm run migrate:cloudinary                       # compress + upload + update rows
npm run migrate:cloudinary -- --delete-supabase  # once the site looks right: free the Supabase space
```

`.env.migrate` is git-ignored — it holds secrets that must never reach the browser bundle.

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
