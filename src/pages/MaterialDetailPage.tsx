import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ExtractionStatusChip from '../components/materials/ExtractionStatusChip'
import { getApiErrorMessage } from '../lib/api'
import {
  extractionStatusInfo,
  useDeleteMaterial,
  useMaterial,
} from '../lib/materials'

export default function MaterialDetailPage() {
  const params = useParams()
  const materialId = params.materialId as string
  const location = useLocation()
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const materialQuery = useMaterial(materialId)
  const deleteMutation = useDeleteMaterial()

  const deduplicated =
    (location.state as { deduplicated?: boolean } | null)?.deduplicated ===
    true

  const onConfirmDelete = () => {
    setActionError(null)
    deleteMutation.mutate(materialId, {
      onSuccess: () => {
        navigate('/materials')
      },
      onError: (error) => {
        setActionError(
          getApiErrorMessage(error, 'Could not remove the material.'),
        )
      },
    })
  }

  if (materialQuery.isPending) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-ink/60">Loading material…</p>
      </div>
    )
  }

  if (materialQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl">
        <p role="alert" className="text-sm text-rose-weak">
          {getApiErrorMessage(
            materialQuery.error,
            'Could not load the material.',
          )}
        </p>
      </div>
    )
  }

  const material = materialQuery.data
  const statusInfo = extractionStatusInfo(material.extractionStatus)

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/materials"
        className="text-sm font-semibold text-indigo-primary hover:underline"
      >
        ← Back to materials
      </Link>

      {deduplicated && (
        <p className="mt-4 rounded-lg bg-emerald-progress/10 px-3 py-2 text-sm text-emerald-progress">
          You already had this chapter — opened your existing copy.
        </p>
      )}
      {actionError !== null && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
        >
          {actionError}
        </p>
      )}

      <section className="mt-4 rounded-2xl border border-card-border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">
              {material.title}
            </h1>
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
            <ExtractionStatusChip status={material.extractionStatus} />
            <span className="rounded-full bg-indigo-tint px-2 py-0.5 text-xs font-semibold text-indigo-primary">
              {material.sourceType === 'PDF' ? 'PDF' : 'Paste'}
            </span>
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-sm text-ink/80">
          {statusInfo.explanation}
        </p>

        <h2 className="mt-6 font-display text-base font-bold">
          Extracted text
        </h2>
        {material.extractedText ? (
          <pre className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border border-card-border bg-paper p-4 text-sm">
            {material.extractedText}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-ink/60">
            No extracted text is available for this material.
          </p>
        )}

        <div className="mt-6 border-t border-card-border pt-4">
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm">
                Remove this material from your materials?
              </p>
              <button
                type="button"
                onClick={onConfirmDelete}
                className="rounded-full bg-rose-weak px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Confirm remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-full border border-card-border px-4 py-1.5 text-sm font-semibold hover:bg-paper"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-full border border-card-border px-4 py-2 text-sm font-semibold text-rose-weak hover:bg-paper"
            >
              Remove from your materials
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
