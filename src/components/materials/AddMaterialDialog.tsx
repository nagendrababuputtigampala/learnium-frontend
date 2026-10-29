import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage, type MaterialDto } from '../../lib/api'
import {
  useCreateMaterialFromText,
  useGradeSubjects,
  useUploadMaterial,
} from '../../lib/materials'

const MAX_FILE_BYTES = 20 * 1024 * 1024

type AddMaterialTab = 'upload' | 'paste'

interface FieldErrors {
  file?: string
  title?: string
  gradeSubjectId?: string
  text?: string
}

const inputClassName =
  'w-full rounded-lg border border-card-border px-3 py-2 text-sm outline-none focus:border-indigo-bright focus:ring-2 focus:ring-indigo-bright/30'

export default function AddMaterialDialog({
  onClose,
}: {
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<AddMaterialTab>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [gradeSubjectId, setGradeSubjectId] = useState('')
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const gradeSubjectsQuery = useGradeSubjects()
  const uploadMutation = useUploadMaterial()
  const textMutation = useCreateMaterialFromText()

  const gradeSubjects = gradeSubjectsQuery.data ?? []
  const isSubmitting = uploadMutation.isPending || textMutation.isPending
  const fileTooLarge = file !== null && file.size > MAX_FILE_BYTES

  const handleCreated = (material: MaterialDto) => {
    if (material.deduplicated) {
      navigate(`/materials/${material.materialId}`, {
        state: { deduplicated: true },
      })
    } else {
      navigate(`/materials/${material.materialId}`)
    }
  }

  const handleSubmitError = (error: unknown) => {
    setSubmitError(getApiErrorMessage(error, 'Could not add the material.'))
  }

  const validateShared = (next: FieldErrors): boolean => {
    let valid = true
    if (title.trim() === '') {
      next.title = 'Title is required'
      valid = false
    }
    if (gradeSubjectId === '') {
      next.gradeSubjectId = 'Choose a grade and subject'
      valid = false
    }
    return valid
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    const next: FieldErrors = {}
    let valid = validateShared(next)
    if (tab === 'upload') {
      if (file === null) {
        next.file = 'Choose a PDF file'
        valid = false
      } else if (fileTooLarge) {
        next.file = 'This file is larger than the 20 MB limit'
        valid = false
      }
    } else if (text.trim() === '') {
      next.text = 'Paste the chapter text'
      valid = false
    }
    setErrors(next)
    if (!valid) {
      return
    }
    if (tab === 'upload' && file !== null) {
      uploadMutation.mutate(
        { file, title: title.trim(), gradeSubjectId },
        { onSuccess: handleCreated, onError: handleSubmitError },
      )
    } else {
      textMutation.mutate(
        { title: title.trim(), gradeSubjectId, text },
        { onSuccess: handleCreated, onError: handleSubmitError },
      )
    }
  }

  const tabClassName = (value: AddMaterialTab) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition ${
      tab === value
        ? 'bg-indigo-primary text-white'
        : 'text-ink/60 hover:bg-indigo-tint'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add material"
        className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Add material</h2>
            <p className="mt-1 text-sm text-ink/60">
              Add a chapter PDF, or paste the chapter text directly.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full border border-card-border px-3 py-1 text-sm font-semibold hover:bg-paper"
          >
            ✕
          </button>
        </div>

        {submitError !== null && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-rose-weak/10 px-3 py-2 text-sm text-rose-weak"
          >
            {submitError}
          </p>
        )}

        <form noValidate onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="material-title"
                className="mb-1 block text-sm font-medium"
              >
                Title
              </label>
              <input
                id="material-title"
                className={inputClassName}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              {errors.title && (
                <p role="alert" className="mt-1 text-sm text-rose-weak">
                  {errors.title}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="material-grade-subject"
                className="mb-1 block text-sm font-medium"
              >
                Grade and subject
              </label>
              <select
                id="material-grade-subject"
                className={inputClassName}
                value={gradeSubjectId}
                onChange={(event) => setGradeSubjectId(event.target.value)}
              >
                <option value="">Select grade and subject</option>
                {gradeSubjects.map((gradeSubject) => (
                  <option
                    key={gradeSubject.gradeSubjectId}
                    value={gradeSubject.gradeSubjectId}
                  >
                    {gradeSubject.label}
                  </option>
                ))}
              </select>
              {errors.gradeSubjectId && (
                <p role="alert" className="mt-1 text-sm text-rose-weak">
                  {errors.gradeSubjectId}
                </p>
              )}
            </div>
          </div>

          <div
            role="tablist"
            aria-label="How to add the material"
            className="mt-5 flex gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'upload'}
              onClick={() => setTab('upload')}
              className={tabClassName('upload')}
            >
              Upload PDF
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'paste'}
              onClick={() => setTab('paste')}
              className={tabClassName('paste')}
            >
              Paste text
            </button>
          </div>

          {tab === 'upload' ? (
            <div className="mt-4">
              <label
                htmlFor="material-file"
                className="mb-1 block text-sm font-medium"
              >
                Chapter PDF
              </label>
              <input
                id="material-file"
                type="file"
                accept="application/pdf,.pdf"
                className={inputClassName}
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
              />
              {fileTooLarge && (
                <p role="alert" className="mt-1 text-sm text-rose-weak">
                  This file is larger than the 20 MB limit. Please choose a
                  smaller file.
                </p>
              )}
              {errors.file && (
                <p role="alert" className="mt-1 text-sm text-rose-weak">
                  {errors.file}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <label
                htmlFor="material-text"
                className="mb-1 block text-sm font-medium"
              >
                Chapter text
              </label>
              <textarea
                id="material-text"
                rows={8}
                className={inputClassName}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
              <p className="mt-1 text-sm text-ink/60">
                {text.length} characters
              </p>
              {errors.text && (
                <p role="alert" className="mt-1 text-sm text-rose-weak">
                  {errors.text}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-card-border px-5 py-2.5 text-sm font-semibold hover:bg-paper"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
            >
              Add material
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
