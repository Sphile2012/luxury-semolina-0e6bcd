import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, UserCheck } from "lucide-react";
import ContactCard from "@/components/contacts/ContactCard";
import ContactForm from "@/components/contacts/ContactForm";

export default function Contacts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: contacts = [], isLoading: loading } = useQuery({
    queryKey: ['contacts', user?.email],
    queryFn: () => entities.EmergencyContact.filter({ owner_email: user.email }, 'priority', 20),
    enabled: !!user?.email,
    staleTime: 30000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['contacts', user?.email] });

  const { mutate: handleSave } = useMutation({
    mutationFn: async (data) => {
      if (editing) {
        await entities.EmergencyContact.update(editing.id, data);
      } else {
        await entities.EmergencyContact.create({ ...data, owner_email: user.email });
      }
    },
    onSuccess: () => { invalidate(); setShowForm(false); setEditing(null); },
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: (id) => entities.EmergencyContact.delete(id),
    onSuccess: invalidate,
  });

  const handleEdit = (contact) => { setEditing(contact); setShowForm(true); };

  return (
    <div className="min-h-screen text-white page-enter" style={{ background: "var(--nt-bg)" }}>
      <div className="nt-blob-cyan" style={{ width: 350, height: 350, top: -80, right: -80 }} />
      <div className="max-w-md mx-auto px-4 pb-24 pt-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#f1f5f9" }}>Emergency Contacts</h1>
            <p className="text-sm mt-1" style={{ color: "#475569" }}>Who to notify in an emergency</p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: "linear-gradient(135deg,#dc2626,#ef4444)",
              boxShadow: "0 0 16px rgba(239,68,68,0.3), 0 4px 12px rgba(220,38,38,0.2)",
              border: "1px solid rgba(239,68,68,0.4)",
            }}
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-white font-semibold mb-1">No contacts yet</p>
            <p className="text-[#555] text-sm">Add trusted people who will receive your emergency alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map(c => (
              <ContactCard key={c.id} contact={c} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {showForm && (
          <ContactForm
            contact={editing}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditing(null); }}
          />
        )}
      </div>
    </div>
  );
}