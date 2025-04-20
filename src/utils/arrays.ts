export async function asyncFind<T>(array: T[], callback: (item: T) => Promise<boolean>): Promise<T | undefined> {
  for (const item of array) {
    if (await callback(item)) {
      return item
    }
  }
}
