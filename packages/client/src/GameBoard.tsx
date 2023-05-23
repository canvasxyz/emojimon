import { useEffect } from "react";
import { GameMap } from "./GameMap";
import { useMUD } from "./MUDContext";
import { useKeyboardMovement } from "./useKeyboardMovement";
import { EncounterScreen } from "./EncounterScreen";
import { useComponentValue, useEntityQuery } from "@latticexyz/react";
import { Entity, Has, getComponentValueStrict } from "@latticexyz/recs";
import { hexToArray, toEthAddress } from "@latticexyz/utils";
import { MonsterType, monsterTypes } from "./monsterTypes";
import { TerrainType, terrainTypes } from "./terrainTypes";

export const GameBoard = () => {
  useKeyboardMovement();

  const {
    components: {
      Encounter,
      Encounterable,
      MapConfig,
      Monster,
      Player,
      Position,
    },
    network: { playerEntity, singletonEntity },
    systemCalls: { spawn },
  } = useMUD();

  const encounter = useComponentValue(Encounter, playerEntity);
  const monsterType = useComponentValue(
    Monster,
    encounter ? (encounter.monster as Entity) : undefined
  )?.value;
  const monster =
    monsterType != null && monsterType in MonsterType
      ? monsterTypes[monsterType as MonsterType]
      : null;

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
  const terrain = Array.from(hexToArray(terrainData)).map((value, index: number) => {
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
      encounter={
        encounter ? (
          <EncounterScreen
            monsterName={monster?.name ?? "MissingNo"}
            monsterEmoji={monster?.emoji ?? ""}
          />
        ) : undefined
      }
    />
  );
};
