export type GridType = {
  type: Tiles;
  wallX: boolean;
  wallY: boolean;
}[][];

export type N2 = {
  x: number;
  y: number;
};

export const tiles = [
  "empty",
  "joker",
  "green_cog",
  "green_moon",
  "green_planet",
  "green_star",
  "blue_cog",
  "blue_moon",
  "blue_planet",
  "blue_star",
  "red_cog",
  "red_moon",
  "red_planet",
  "red_star",
  "yellow_cog",
  "yellow_moon",
  "yellow_planet",
  "yellow_star",
] as const;

export type Tiles = (typeof tiles)[number];

export const tilesNoEmpty = tiles.filter(
  (t): t is TilesNoEmpty => t !== "empty",
);

export type TilesNoEmpty = Exclude<Tiles, "empty">;

export type Rockets = {
  red: N2;
  green: N2;
  blue: N2;
  yellow: N2;
  silver: N2;
};

export type Rocket = keyof Rockets;
