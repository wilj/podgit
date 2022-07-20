function optional(key: string) {
  return process.env[key] || '';
}

function required(key: string) {
  const val = optional(key);
  if (!val) {
    throw new Error("Server misconfigured");
  }
  return val;
}

export default {
    SECRET: required('SECRET')
}
