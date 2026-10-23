export const isAbsolute = (url: string) => /^https?:\/\//.test(url);

export const join = (paths: string[]) =>
  paths
    .join("/")
    .replace(/(?!:)\/{1,}/g, "/")
    .replace(":/", "://");
