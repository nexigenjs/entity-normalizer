export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const randomFrom = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
