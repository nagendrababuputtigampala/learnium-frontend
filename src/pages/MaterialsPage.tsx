import { useState } from 'react'
import { Link } from 'react-router-dom'
import AddMaterialDialog from '../components/materials/AddMaterialDialog'
import ExtractionStatusChip from '../components/materials/ExtractionStatusChip'
import { getApiErrorMessage } from '../lib/api'
import { useMaterials } from '../lib/materials'

export default function MaterialsPage() {
  const [page, setPage] = useState(0)
  const [addOpen, setAddOpen] = useState(false)

  const materialsQuery = useMaterials(page)
  const materials = materialsQuery.data?.content ?? []
  const totalPages = materialsQuery.data?.totalPages ?? 0

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Materials</h1>
          <p className="mt-1 text-sm text-ink/60">
            Chapters uploaded for generating practice questions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
        >
          Add material
        </button>
      </header>

      <section aria-label="All materials">
        {materialsQuery.isPending ? (
          <p className="text-sm text-ink/60">Loading materials…</p>
        ) : materialsQuery.isError ? (
          <p role="alert" className="text-sm text-rose-weak">
            {getApiErrorMessage(
              materialsQuery.error,
              'Could not load materials.',
            )}
          </p>
        ) : materials.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-white p-8 text-center shadow-sm">
            <p className="font-display text-base font-bold">
              No materials yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
              Add a chapter PDF — or paste the chapter text — and Learnium
              will read it so questions can be generated from it.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-4 rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
            >
              Add your first material
            </button>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {materials.map((material) => (
                <li
                  key={material.materialId}
                  className="rounded-2xl border border-card-border bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/materials/${material.materialId}`}
                        className="font-display font-bold text-indigo-primary hover:underline"
                      >
                        {material.title}
                      </Link>
                      <p className="mt-1 text-sm text-ink/60">
                        {material.gradeName} · {material.subjectName}
                      </p>
                      <p className="mt-2 text-sm">
                        {material.extractedChars === null
                          ? 'No extracted text'
                          : `${material.extractedChars.toLocaleString()} characters`}{' '}
                        · Added {material.createdAt.slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ExtractionStatusChip
                        status={material.extractionStatus}
                      />
                      <span className="rounded-full bg-indigo-tint px-2 py-0.5 text-xs font-semibold text-indigo-primary">
                        {material.sourceType === 'PDF' ? 'PDF' : 'Paste'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {totalPages > 0 && (
              <div className="mt-4 flex items-center gap-3 text-sm">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-full border border-card-border px-4 py-1.5 font-semibold hover:bg-paper disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-full border border-card-border px-4 py-1.5 font-semibold hover:bg-paper disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {addOpen && (
        <AddMaterialDialog onClose={() => setAddOpen(false)} />
      )}
    </div>
  )
}
