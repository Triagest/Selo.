"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface PendingSignature {
  id: string;
  documento_id: string;
  documento: {
    nome: string;
  };
  ordem_sequencia: number;
  created_at: string;
}

export default function PendentesPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenant_slug as string;

  const [pendentes, setPendentes] = useState<PendingSignature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendentes();
  }, [tenantSlug]);

  async function fetchPendentes() {
    try {
      const res = await fetch(`/api/${tenantSlug}/assinaturas/pendentes`);
      const data = await res.json();
      if (res.ok) {
        setPendentes(data.pendentes);
      }
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Documentos Pendentes
        </h1>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : pendentes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">
              Nenhum documento pendente de assinatura
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendentes.map((pending) => (
              <div
                key={pending.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {pending.documento.nome}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Posição na fila: #{pending.ordem_sequencia}
                    </p>
                    <p className="text-xs text-gray-500">
                      Criado em:{" "}
                      {new Date(pending.created_at).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/${tenantSlug}/documentos/${pending.documento_id}`
                      )
                    }
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Assinar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
