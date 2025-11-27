import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import ReferenceDialog from "../dialogs/ReferenceDialog";
import { ReferenceReportDialog } from "../dialogs/ReferenceReportDialog";

interface Reference {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  commission_percentage: number;
  notes: string;
  is_active: boolean;
  created_at: string;
}

export default function ReferencesSection() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [filteredReferences, setFilteredReferences] = useState<Reference[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReference, setReportReference] = useState<Reference | null>(null);

  useEffect(() => {
    fetchReferences();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = references.filter(ref =>
        ref.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.phone?.includes(searchTerm) ||
        ref.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReferences(filtered);
    } else {
      setFilteredReferences(references);
    }
  }, [searchTerm, references]);

  const fetchReferences = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("booking_references")
        .select("*")
        .order("name");

      if (error) throw error;
      setReferences(data || []);
      setFilteredReferences(data || []);
    } catch (error: any) {
      console.error("Error fetching references:", error);
      toast.error("Failed to load references");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reference?")) return;

    try {
      const { error } = await supabase
        .from("booking_references")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Reference deleted successfully");
      fetchReferences();
    } catch (error: any) {
      console.error("Error deleting reference:", error);
      toast.error("Failed to delete reference");
    }
  };

  const handleEdit = (reference: Reference) => {
    setSelectedReference(reference);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedReference(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedReference(null);
    fetchReferences();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#006938]">Reference Management</h2>
          <p className="text-gray-600">Manage travel agencies and booking references</p>
        </div>
        <Button onClick={handleAdd} className="bg-[#006938] hover:bg-[#005030]">
          <Plus className="w-4 h-4 mr-2" />
          Add Reference
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, contact person, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* References Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#006938] text-white">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Contact Person</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">City</th>
                <th className="px-4 py-3 text-left">Commission %</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Loading references...
                  </td>
                </tr>
              ) : filteredReferences.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? "No references found matching your search" : "No references yet. Click 'Add Reference' to create one."}
                  </td>
                </tr>
              ) : (
                filteredReferences.map((reference) => (
                  <tr key={reference.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-[#006938]">{reference.name}</td>
                    <td className="px-4 py-3">{reference.contact_person || "-"}</td>
                    <td className="px-4 py-3">{reference.phone || "-"}</td>
                    <td className="px-4 py-3">{reference.email || "-"}</td>
                    <td className="px-4 py-3">{reference.city || "-"}</td>
                    <td className="px-4 py-3">{reference.commission_percentage}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        reference.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {reference.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReportReference(reference);
                            setIsReportDialogOpen(true);
                          }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="View Report"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(reference)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reference.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <ReferenceDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        reference={selectedReference}
      />

      <ReferenceReportDialog
        reference={reportReference}
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
      />
    </div>
  );
}

