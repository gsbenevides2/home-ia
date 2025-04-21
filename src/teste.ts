import schedule from 'node-schedule'

// A cada segundo exibir a hora atual
const pattern = '* * * * * *'
const job = schedule.scheduleJob(pattern, () => {
    console.log(new Date().toLocaleTimeString())
})

process.on('SIGINT', async () => {
  await schedule.gracefulShutdown()
  console.log('Graceful shutdown')
  process.exit(0)
})

//job.invoke()