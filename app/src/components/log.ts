// TODO add check for prod vs dev for debug logs
export const debug = console.log
export const log = console.log
export const logError = (message: string, error: any, data?: any) => {
  console.error(message, data)
  fetch('/api/log/client', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({level: `ERROR`, message, error, data})
  });

}
