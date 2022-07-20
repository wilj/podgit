const env = (key:string) : string => process.env[key] || ``

export const Config = {
    rootUrl: () => env(`REACT_APP_ROOT_URL`)
}

