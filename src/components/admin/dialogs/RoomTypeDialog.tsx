import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X } from "lucide-react";

interface RoomTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any | null;
  onSuccess: () => void;
}

export const RoomTypeDialog = ({ open, onOpenChange, item, onSuccess }: RoomTypeDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    capacity: "2",
    size: "",
    base_price: "",
    bed_type: "",
    category_label: "",
    is_active: true,
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        slug: item.slug || "",
        description: item.description || "",
        capacity: item.capacity?.toString() || "2",
        size: item.size || "",
        base_price: item.base_price || "",
        bed_type: item.bed_type || "",
        category_label: item.category_label || "",
        is_active: item.is_active ?? true,
      });
      setImages(item.images || []);
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        capacity: "2",
        size: "",
        base_price: "",
        bed_type: "",
        category_label: "",
        is_active: true,
      });
      setImages([]);
    }
  }, [item, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `room-images/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('room-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('room-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setImages([...images, ...uploadedUrls]);
    setUploading(false);
    if (uploadedUrls.length > 0) {
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      ...formData,
      capacity: parseInt(formData.capacity),
      images: images,
    };

    const { error } = item
      ? await supabase.from("room_types").update(dataToSave).eq("id", item.id)
      : await supabase.from("room_types").insert([dataToSave]);

    if (error) {
      toast.error("Failed to save room type");
      console.error(error);
    } else {
      toast.success(`Room type ${item ? "updated" : "created"} successfully`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit" : "Add"} Room Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  setFormData({ ...formData, name, slug });
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g., 400 sq ft"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_price">Base Price (₹)</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="bed_type">Bed Type</Label>
              <Input
                id="bed_type"
                value={formData.bed_type}
                onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="category_label">Category</Label>
              <Input
                id="category_label"
                value={formData.category_label}
                onChange={(e) => setFormData({ ...formData, category_label: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Room Images</Label>
            <div className="mt-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className="mb-4"
              />
              {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}

              <div className="grid grid-cols-4 gap-4 mt-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Room ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

