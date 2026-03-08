import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, LogOut, Plus } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

type Photo = {
  id: string;
  src: string;
  alt: string | null;
  location: string | null;
  category: string;
  sort_order: number;
  created_at: string;
};

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [alt, setAlt] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<"landscape" | "portrait">("landscape");
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("photos").insert({
        src: publicUrl,
        alt: alt || file.name.split(".")[0],
        location: location || null,
        category,
      });

      if (insertError) {
        toast({ title: "Save failed", description: insertError.message, variant: "destructive" });
      }
    }

    setUploading(false);
    setAlt("");
    setLocation("");
    toast({ title: "Photos uploaded!" });
    fetchPhotos();
    e.target.value = "";
  };

  const handleDelete = async (photo: Photo) => {
    // Extract file path from URL
    const url = new URL(photo.src);
    const pathParts = url.pathname.split("/storage/v1/object/public/photos/");
    const filePath = pathParts[1];

    if (filePath) {
      await supabase.storage.from("photos").remove([filePath]);
    }
    await supabase.from("photos").delete().eq("id", photo.id);
    toast({ title: "Photo deleted" });
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input placeholder="Alt text" value={alt} onChange={(e) => setAlt(e.target.value)} />
            <Input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as "landscape" | "portrait")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer nav-pill active">
            <Plus size={16} />
            {uploading ? "Uploading..." : "Choose Files"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-border">
              <img src={photo.src} alt={photo.alt || ""} className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                <p className="text-xs text-muted-foreground">{photo.category}{photo.location ? ` · ${photo.location}` : ""}</p>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <Upload size={48} className="mx-auto mb-4 opacity-30" />
            <p>No photos yet. Upload some above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
