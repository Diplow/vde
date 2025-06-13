import { assert } from "console";

const ZOOM_FACTOR = 7; // We want to fit 7 hexagons in one larger hexagon, 1 central one and 6 surrounding ones (1 on each side of the central one)
const BASE_HEX_SIZE = 10;
const HEX_SIZE_RATIO = Math.sqrt(ZOOM_FACTOR); // Regular hexagons have an area proportional to the square of their side length
const MAP_BASE_RADIUS = 1;
const MAP_RADIUS_RATIO = 3;

export const HEX_SIZE = {
  XS: 10 as const satisfies 10,
  S: 26.457 as const satisfies 26.457,
  M: 70 as const satisfies 70,
  L: 185.2 as const satisfies 185.2,
  XL: 490 as const satisfies 490,
} as const;

assert(HEX_SIZE.XS === BASE_HEX_SIZE);
assert(HEX_SIZE.S === BASE_HEX_SIZE * HEX_SIZE_RATIO);
assert(HEX_SIZE.M === BASE_HEX_SIZE * HEX_SIZE_RATIO ** 2);
assert(HEX_SIZE.L === BASE_HEX_SIZE * HEX_SIZE_RATIO ** 3);
assert(HEX_SIZE.XL === BASE_HEX_SIZE * HEX_SIZE_RATIO ** 4);

export const MAP_RADIUS = {
  XS: 1 as const satisfies 1,
  S: 3 as const satisfies 3,
  M: 9 as const satisfies 9,
  L: 27 as const satisfies 27,
  XL: 81 as const satisfies 81,
} as const;

assert(MAP_RADIUS.XS === MAP_BASE_RADIUS * MAP_RADIUS_RATIO ** 0);
assert(MAP_RADIUS.S === MAP_BASE_RADIUS * MAP_RADIUS_RATIO ** 1);
assert(MAP_RADIUS.M === MAP_BASE_RADIUS * MAP_RADIUS_RATIO ** 2);
assert(MAP_RADIUS.L === MAP_BASE_RADIUS * MAP_RADIUS_RATIO ** 3);
assert(MAP_RADIUS.XL === MAP_BASE_RADIUS * MAP_RADIUS_RATIO ** 4);

export const MAP_SIZE = {
  XS: {
    radius: MAP_RADIUS.XS,
    baseSize: HEX_SIZE.XL,
    count: 7 as const satisfies 7,
    box: 1960 as const satisfies 1960,
  },
  S: {
    radius: MAP_RADIUS.S,
    baseSize: HEX_SIZE.L,
    count: 49 as const satisfies 49,
    box: 2223 as const satisfies 2223,
  },
  M: {
    radius: MAP_RADIUS.M,
    baseSize: HEX_SIZE.M,
    count: 343 as const satisfies 343,
    box: 2520 as const satisfies 2520,
  },
  L: {
    radius: MAP_RADIUS.L,
    baseSize: HEX_SIZE.S,
    count: 2401 as const satisfies 2401,
    box: 2808 as const satisfies 2808,
  },
  XL: {
    radius: MAP_RADIUS.XL,
    baseSize: HEX_SIZE.XS,
    count: 16807 as const satisfies 16807,
    box: 3240 as const satisfies 3240,
  },
} as const;

assert(MAP_SIZE.XS.count === ZOOM_FACTOR ** 1);
assert(MAP_SIZE.S.count === ZOOM_FACTOR ** 2);
assert(MAP_SIZE.M.count === ZOOM_FACTOR ** 3);
assert(MAP_SIZE.L.count === ZOOM_FACTOR ** 4);
assert(MAP_SIZE.XL.count === ZOOM_FACTOR ** 5);

assert(MAP_SIZE.XS.box === 2 * MAP_RADIUS.XS * HEX_SIZE.XL);
assert(MAP_SIZE.S.box === 2 * MAP_RADIUS.S * HEX_SIZE.L);
assert(MAP_SIZE.M.box === 2 * MAP_RADIUS.M * HEX_SIZE.M);
assert(MAP_SIZE.L.box === 2 * MAP_RADIUS.L * HEX_SIZE.S);
assert(MAP_SIZE.XL.box === 2 * MAP_RADIUS.XL * HEX_SIZE.XS);
