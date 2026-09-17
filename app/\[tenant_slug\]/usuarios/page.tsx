"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface User {
  id: string;
  nome: string;
  email: string;
  username: string;
  isMaster: boolean;
  permissions: { permissionId: string; name: string }[];
  created_at: string;
}

interface Permission {
  id: string;
  name: string;
}

const PERMISSIONS = [
  { id: "criar_usuarios", name: "Criar Usuários" },
  { id: "editar_usuarios", name: "Editar Usuários" },
  { id: "deletar_usuarios", name: "Deletar Usuários" },
  { id: "gerenciar_documentos", name: "Gerenciar Documentos" },
  { id: "assinar_documentos", name: "Assinar Documentos" },
  { id: "visualizar_auditoria", name: "Visualizar Auditoria" },
];

export default function UsuariosPage() {
  const params = useParams();
  const tenantSlug = params.tenant_slug as string;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    nome: "",
    email: "",
    username: "",
    phone_number: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchUsers();
  }, [tenantSlug]);

  async function fetchUsers() {
    try {
      const res = await fetch(
        `/api/${tenantSlug}/usuarios`
      );
      const data = await res.json();
      if (res.ok) {
        setUsers(data.usuarios);
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!form.nome.trim() || !form.email.trim() || !form.username.trim()) {
      setError("Preencha todos os campos");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/${tenantSlug}/usuarios/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          username: form.username,
          phone_number: form.phone_number,
          permissions: form.permissions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar usuário");
        return;
      }

      setSuccess("Usuário criado com sucesso!");
      setForm({ nome: "", email: "", username: "", phone_number: "", permissions: [] });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError("Erro ao conectar ao servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function togglePermission(permId: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Usuários</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? "Cancelar" : "Novo Usuário"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Criar Novo Usuário</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) =>
                      setForm({ ...form, nome: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="joao@igi.gov.br"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuário
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="joao.silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={form.phone_number}
                  onChange={(e) =>
                    setForm({ ...form, phone_number: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+55XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissões
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PERMISSIONS.map((perm) => (
                    <label key={perm.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {perm.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Criando..." : "Criar Usuário"}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Permissões
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-800">
                    {user.nome}
                    {user.isMaster && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Master
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {user.username}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.length > 0 ? (
                        user.permissions.map((p) => (
                          <span
                            key={p.permissionId}
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                          >
                            {p.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">
                          Sem permissões
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              Nenhum usuário criado ainda
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
