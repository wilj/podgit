const makeDebug = () => process.env.NODE_ENV === `development` ? console.log : () => {}

export const debug = makeDebug()
export const log = console.log
export const error = console.error
