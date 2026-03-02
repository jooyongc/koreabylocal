import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { useUpdateAdminNotes } from "@/hooks/useOrderMutation";
import toast from "react-hot-toast";

interface Props {
  orderId: number;
  initialNotes: string;
}

export default function AdminNotes({ orderId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const mutation = useUpdateAdminNotes();

  const isDirty = notes !== initialNotes;

  const handleSave = async () => {
    try {
      await mutation.mutateAsync({ orderId, notes });
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Admin Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Internal notes about this order..."
      />
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="mt-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Notes
        </button>
      )}
    </section>
  );
}
