import { useEffect } from "react";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { toEthAddress } from "@latticexyz/utils";
import { GameMap } from "./GameMap";
import { useMUD } from "./MUDContext";
import { useKeyboardMovement } from "./useKeyboardMovement";
import { Entity, Has, getComponentValueStrict } from "@latticexyz/recs";
import { hexToArray } from "@latticexyz/utils";
import { TerrainType, terrainTypes } from "./terrainTypes";

export const GameBoard = () => {
  useKeyboardMovement();

  const {
    components: { MapConfig, Player, Position },
    network: { playerEntity, singletonEntity },
    systemCalls: { spawn },
  } = useMUD();

  const canSpawn = useComponentValue(Player, playerEntity)?.value !== true;
  const players = useEntityQuery([Has(Player), Has(Position)]).map((entity) => {
    const position = getComponentValueStrict(Position, entity);
    return {
      entity,
      x: position.x,
      y: position.y,
      emoji: toEthAddress(entity) === playerEntity ? "😇" : "🥸",
    };
  });

  const mapConfig = useComponentValue(MapConfig, singletonEntity);
  if (mapConfig === null || mapConfig === undefined) {
    // throw new Error("map config not ready");
    return <>Loading map...</>;
  }

  const { width, height, terrain: terrainData } = mapConfig;
  const terrain = Array.from(hexToArray(terrainData)).map((value, index) => {
    const { emoji } =
      value in TerrainType ? terrainTypes[value as TerrainType] : { emoji: "" };
    return {
      x: index % width,
      y: Math.floor(index / width),
      emoji,
    };
  });

  return (
    <GameMap
      width={20}
      height={20}
      terrain={terrain}
      onTileClick={canSpawn ? spawn : undefined}
      players={players}
    />
  );
};
