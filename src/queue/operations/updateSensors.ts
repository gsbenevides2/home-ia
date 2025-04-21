import { addToQueue } from '../queue.ts'

export async function updateSensors() {
  await addToQueue('update-train-sensors')
  await addToQueue('update-codespaces-sensor')
  await addToQueue('update-page-status-sensors')
  await addToQueue('update-dns-sensors')
}
