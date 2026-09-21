import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, LogOut, Plus, Home, Star, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Session } from "@supabase/supabase-js";
import { compressImage, formatBytes } from "@/lib/image-compress";
import { isCloudinaryConfigured, isCloudinaryUrl, uploadToCloudinary } from "@/lib/cloudinary";

type Photo = {
  id: string;
  src: string;
  public_id: string | null;
  alt: string | null;
  location: string | null;
  category: string;
  sort_order: number;
  created_at: string;
  homepage: boolean;
  description: string | null;
  subtitle: string | null;
  color: string | null;
  text_gradient: string | null;
};

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [alt, setAlt] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [subtitle, setSubtitle] = useState("");
  const [homepage, setHomepage] = useState(false);
  const [category, setCategory] = useState<"landscape" | "portrait">("landscape");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editPhoto, setEditPhoto] = useState<Photo | null>(null);
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/login");
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate("/login");
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) fetchPhotos();
  }, [session]);

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (data) setPhotos(data as Photo[]);
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    if (!isCloudinaryConfigured()) {
      toast({
        title: "Cloudinary not configured",
        description: "Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env and restart the dev server.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let uploaded = 0;
    let originalBytes = 0;
    let compressedBytes = 0;

    for (const [i, file] of selectedFiles.entries()) {
      const label = `${i + 1}/${selectedFiles.length} ${file.name}`;
      try {
        // 1. Shrink in the browser (2560px long edge, ~86% JPEG) so we never store raw camera files.
        setUploadStatus(`Compressing ${label}…`);
        const { blob, originalBytes: orig, compressedBytes: comp } = await compressImage(file);

        // 2. Upload the compressed file straight to Cloudinary (unsigned preset, no secrets in the browser).
        setUploadStatus(`Uploading ${label} (${formatBytes(comp)})…`);
        const result = await uploadToCloudinary(blob, { publicId: crypto.randomUUID() });

        // 3. Save the row exactly as before, plus public_id so we can delete it later.
        const { error: insertError } = await supabase.from("photos").insert({
          src: result.secure_url,
          public_id: result.public_id,
          alt: alt || file.name.split(".")[0],
          location: location || null,
          category,
          homepage,
          description: description || null,
          subtitle: subtitle || null,
        });
        if (insertError) throw new Error(insertError.message);

        uploaded += 1;
        originalBytes += orig;
        compressedBytes += comp;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast({ title: `Upload failed: ${file.name}`, description: message, variant: "destructive" });
      }
    }

    setUploading(false);
    setUploadStatus("");
    setAlt("");
    setLocation("");
    setDescription("");
    setSubtitle("");
    setHomepage(false);
    setSelectedFiles([]);
    if (uploaded > 0) {
      toast({
        title: `${uploaded} photo(s) uploaded!`,
        description: `${formatBytes(originalBytes)} → ${formatBytes(compressedBytes)} after compression`,
      });
    }
    fetchPhotos();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleToggleHomepage = async (photo: Photo) => {
    await supabase
      .from("photos")
      .update({ homepage: !photo.homepage })
      .eq("id", photo.id);
    fetchPhotos();
    toast({ title: photo.homepage ? "Removed from homepage" : "Added to homepage" });
  };

  const handleDelete = async (photo: Photo) => {
    let fileNote: string | undefined;

    if (isCloudinaryUrl(photo.src)) {
      // Deleting from Cloudinary needs the API secret, which must never be in the browser,
      // so we go through the `delete-cloudinary` Supabase Edge Function (see supabase/functions).
      // If it isn't deployed yet, the row is still removed and the file stays in Cloudinary.
      if (photo.public_id) {
        const { error } = await supabase.functions.invoke("delete-cloudinary", {
          body: { public_id: photo.public_id },
        });
        if (error) fileNote = "Row removed, but the file is still in Cloudinary (delete function not deployed?).";
      } else {
        fileNote = "Row removed; no public_id stored, delete the file from Cloudinary manually.";
      }
    } else {
      // Legacy Supabase Storage photo (pre-migration)
      const url = new URL(photo.src);
      const filePath = url.pathname.split("/storage/v1/object/public/photos/")[1];
      if (filePath) await supabase.storage.from("photos").remove([filePath]);
    }

    await supabase.from("photos").delete().eq("id", photo.id);
    toast({ title: "Photo deleted", description: fileNote });
    fetchPhotos();
  };

  const openEdit = (photo: Photo) => {
    setEditPhoto(photo);
    setEditLocation(photo.location || "");
    setEditDescription(photo.description || "");
    setEditAlt(photo.alt || "");
  };

  const handleSaveEdit = async () => {
    if (!editPhoto) return;
    await supabase
      .from("photos")
      .update({ location: editLocation || null, description: editDescription || null, alt: editAlt || null })
      .eq("id", editPhoto.id);
    setEditPhoto(null);
    toast({ title: "Photo updated" });
    fetchPhotos();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-bold font-display gradient-text">Photo Admin</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut size={16} className="mr-2" /> Sign Out
          </Button>
        </div>

        {/* Upload form */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-12 space-y-4">
          <h2 className="text-lg font-semibold font-display">Upload Photos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input placeholder="Title / Alt text" value={alt} onChange={(e) => setAlt(e.target.value)} />
            <Input placeholder="Location (for landscapes)" value={location} onChange={(e) => setLocation(e.target.value)} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as "landscape" | "portrait")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
            <Input placeholder="Description (for homepage landscapes)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input placeholder="Subtitle (for homepage portraits)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            <label className="flex items-center gap-2 h-10 px-3 cursor-pointer">
              <input
                type="checkbox"
                checked={homepage}
                onChange={(e) => setHomepage(e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <span className="text-sm flex items-center gap-1">
                <Home size={14} /> Show on homepage
              </span>
            </label>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
            disabled={uploading}
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Plus size={16} className="mr-2" />
              {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Choose Files"}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            {uploadStatus && (
              <span className="text-sm text-muted-foreground truncate">{uploadStatus}</span>
            )}
          </div>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-border">
              <img 
                src={photo.src}
                alt={photo.alt || ""} 
                className="block max-w-full max-h-48 w-auto h-auto mx-auto bg-muted"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = photo.src;
                }}
              />
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(photo)}
                  title="Edit details"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant={photo.homepage ? "default" : "secondary"}
                  size="sm"
                  onClick={() => handleToggleHomepage(photo)}
                  title={photo.homepage ? "Remove from homepage" : "Add to homepage"}
                >
                  <Star size={16} className={photo.homepage ? "fill-current" : ""} />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(photo)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm">
                <p className="text-xs font-medium truncate">{photo.alt}</p>
                <p className="text-xs text-muted-foreground">
                  {photo.category}{photo.location ? ` · ${photo.location}` : ""}
                  {photo.homepage && <span className="ml-1 text-primary">★</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <Plus size={48} className="mx-auto mb-4 opacity-30" />
            <p>No photos yet. Upload some above!</p>
          </div>
        )}

        <Dialog open={!!editPhoto} onOpenChange={(open) => !open && setEditPhoto(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Photo Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title / Alt</label>
                <Input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditPhoto(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
