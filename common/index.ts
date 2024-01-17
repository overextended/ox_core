import './vehicles';

console.info = (...args: any[]) => console.log(`^3${args.join('\t')}^0`);

DEV: console.info(`Resource ${GetCurrentResourceName()} is running in development mode!`);
