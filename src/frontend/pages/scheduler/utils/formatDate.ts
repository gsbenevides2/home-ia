export const formateDateStringInputForAPI = (input: string) => {
  if (input.length === 0) return ''
  const [date, time] = input.split('T')
  const [year, month, day] = date.split('-')
  const [hour, minute] = time.split(':')
  return `${year}-${month}-${day} ${hour}:${minute}:00`
}

export const formatFromAPIToStringInput = (api: string) => {
  if (api.length === 0) return ''
  const [date, time] = api.split(' ')
  const [year, month, day] = date.split('-')
  const [hour, minute] = time.split(':')
  return `${year}-${month}-${day}T${hour}:${minute}`
}
