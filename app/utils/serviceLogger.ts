export const throwServiceError = (context: string, error: unknown) => {
  const normalizedError =
    error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : JSON.stringify(error))

  console.error(`[${context}]`, normalizedError)
  throw normalizedError
}
