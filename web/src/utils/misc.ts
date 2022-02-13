// Will return whether the current environment is in a regular browser
// and not CEF
export const isEnvBrowser = (): boolean => !(window as any).invokeNative;

// Basic no operation function
export const noop = () => {};

export const firstToUpper = (str: string) => {

  str = str.toLowerCase()
  return str.charAt(0).toUpperCase() + str.slice(1);
}