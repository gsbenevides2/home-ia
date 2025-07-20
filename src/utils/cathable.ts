export const cathable = async <T>(fn: () => T | Promise<T>): Promise<T> => {
  // eslint-disable-next-line no-useless-catch
  try {
    return await fn()
  } catch (error) {
    throw error
  }
}
