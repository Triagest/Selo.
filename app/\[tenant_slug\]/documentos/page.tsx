"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Document {
  id: string;
  nome: string;
  status: string;
  criado_em: string;
  assinantesCount: number;
  assinacoesConcluidas: number;
}

export default function DocumentosPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenant_slug as string;

  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentos();
  }, [tenantSlug]);

  async function fetchDocumentos() {
    try {
      const res = await fetch(`/api/${tenantSlug}/documentos`);
      const data = await res.json();
      if (res.ok) {
        setDocs(data.documentos);
      }
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  }

  const statusColor: Record<string, string> = {
    RASCUNHO: "bg-gray-100 text-gray-800",
    AGUARDANDO_ASSINATURA: "bg-yellow-100 text-yellow-800",
    EM_ASSINATURA: "bg-blue-100 text-blue-800",
    COMPLETO: "bg-green-100 text-green-800",
    ARQUIVADO: "bg-gray-200 text-gray-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Documentos</h1>
          <button
            onClick={() =>
              router.push(`/${tenantSlug}/documentos/novo`)
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Novo Documento
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Assinaturas
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-800 font-medium">
                      {doc.nome}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded ${
                          statusColor[doc.status]
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {doc.assinacoesConcluidas} de {doc.assinantesCount}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(doc.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() =>
                          router.push(
                            `/${tenantSlug}/documentos/${doc.id}`
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {docs.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                Nenhum documento criado ainda
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
