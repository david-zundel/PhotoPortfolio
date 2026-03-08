import { useState, useRef, useCallback, useEffect } from "react";
import { Move, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProgressiveImage from "./ProgressiveImage";

interface DraggableCropProps {
  src: string;
  photoId: string;
  initialX: number;
  initialY: number;
  isAdmin: boolean;
  className?: string;
  aspectClass?: string;
  onSave?: (x: number, y: number) => void;
}

const DraggableCrop = ({
  src,
  photoId,
  initialX,
  initialY,
  isAdmin,
  className = "",
  aspectClass = "aspect-[2/3]",
  onSave,
}: DraggableCropProps) => {
  const [cropX, setCropX] = useState(initialX);
  const [cropY, setCropY] = useState(initialY);
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCropX(initialX);
    setCropY(initialY);
  }, [initialX, initialY]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!editing) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragStart({ x: e.clientX, y: e.clientY, cx: cropX, cy: cropY });
    },
    [editing, cropX, cropY]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.x) / rect.width) * -100;
      const dy = ((e.clientY - dragStart.y) / rect.height) * -100;
      setCropX(Math.min(100, Math.max(0, dragStart.cx + dx)));
      setCropY(Math.min(100, Math.max(0, dragStart.cy + dy)));
    },
    [dragStart]
  );

  const handlePointerUp = useCallback(() => {
    setDragStart(null);
  }, []);

  const handleSave = async () => {
    const { error } = await supabase
      .from("photos")
      .update({ crop_x: cropX, crop_y: cropY } as any)
      .eq("id", photoId);
    if (error) {
      toast.error("Failed to save position");
    } else {
      toast.success("Position saved");
      onSave?.(cropX, cropY);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setCropX(initialX);
    setCropY(initialY);
    setEditing(false);
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-muted ${aspectClass} ${className}`}>
      <img
        src={src}
        alt=""
        title=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        } ${editing ? "cursor-grab active:cursor-grabbing" : ""} ${
          !editing ? "group-hover:scale-105 transition-transform duration-700" : ""
        }`}
        style={{ objectPosition: `${cropX}% ${cropY}%`, willChange: "opacity" }}
        draggable={false}
        fetchPriority="high"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {isAdmin && !editing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="absolute top-3 left-3 z-20 bg-foreground/60 backdrop-blur-md text-primary-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Adjust crop position"
        >
          <Move size={16} />
        </button>
      )}

      {editing && (
        <>
          <div className="absolute inset-0 border-2 border-dashed border-primary-foreground/50 pointer-events-none z-10" />
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              className="bg-green-600/90 backdrop-blur-md text-white rounded-full p-2 hover:bg-green-600 transition-colors"
            >
              <Check size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              className="bg-red-600/90 backdrop-blur-md text-white rounded-full p-2 hover:bg-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-foreground/60 backdrop-blur-md text-primary-foreground rounded-full px-4 py-2 text-xs font-body">
            Drag to reposition
          </div>
        </>
      )}
    </div>
  );
};

export default DraggableCrop;
