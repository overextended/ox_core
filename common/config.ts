export const SV_LAN = GetConvarInt('sv_lan', 0) === 1;
export const CHARACTER_SLOTS = GetConvarInt('ox:characterSlots', 1);
export const PLATE_PATTERN = GetConvar('ox:plateFormat', '........').toUpperCase();

export const DEBUG = (() => {
  DEV: return true;
  //@ts-ignore
  return SV_LAN || GetConvarInt('ox:debug', 0) === 1;
})();
