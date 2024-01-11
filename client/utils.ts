export function netEvent(event: string, fn: Function) {
  onNet(event, (...args: any[]) => {
    if ((source as any) !== '') fn(...args);
  });
}
