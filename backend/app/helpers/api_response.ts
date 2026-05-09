export interface ApiError {
  message: string
  field?: string
  code?: string
}

export function apiError(message: string, code?: string, field?: string) {
  const err: ApiError = { message }
  if (code) err.code = code
  if (field) err.field = field
  return { errors: [err] }
}
