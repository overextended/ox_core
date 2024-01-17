import './vehicles';

console.info = (...args: any[]) => console.log(`^3${args.join('\t')}^0`);

DEV: console.info(
  `Resource ${GetCurrentResourceName()} is running in development mode!`
);

export function Sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms, null));
}

export function GetRandomInt(min = 0, max = 9) {
  if (min > max) [min, max] = [max, min];

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function GetRandomChar() {
  return String.fromCharCode(GetRandomInt(65, 90));
}

export function GetRandomAlphanumeric() {
  return Math.random() > 0.5 ? GetRandomChar() : GetRandomInt();
}

const formatChar: Record<string, () => string | number> = {
  '1': GetRandomInt,
  A: GetRandomChar,
  '.': GetRandomAlphanumeric,
};

export function GetRandomString(pattern: string, length?: number): string {
  const len = length || pattern.replace(/\^/g, '').length;
  const arr: Array<string | number> = Array(len).fill(0);
  let size = 0;
  let i = 0;

  while (size < len) {
    i += 1;
    let char: string | number = pattern.charAt(i - 1);

    if (char === '') {
      arr[size] = ' '.repeat(len - size);
      break;
    } else if (char === '^') {
      i += 1;
      char = pattern.charAt(i - 1);
    } else {
      const fn = formatChar[char];
      char = fn ? fn() : char;
    }

    size += 1;
    arr[size - 1] = char;
  }

  return arr.join('');
}
