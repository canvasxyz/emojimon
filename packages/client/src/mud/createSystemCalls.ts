import { Has, HasValue, getComponentValue, runQuery } from "@latticexyz/recs";
import { uuid, awaitStreamValue } from "@latticexyz/utils";
import { MonsterCatchResult } from "../monsterCatchResult";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { singletonEntity, playerEntity, worldSend, txReduced$ }: SetupNetworkResult,
  {
    MonsterCatchAttempt,
    MonsterCatchResult,
    Encounter,
    MapConfig,
    Obstruction,
    Player,
    Position,
  }: ClientComponents
) {
  const wrapPosition = (x: number, y: number) => {
    const mapConfig = getComponentValue(MapConfig, singletonEntity);
    if (!mapConfig) throw new Error("map must be initialized");
    return [
      (x + mapConfig.width) % mapConfig.width,
      (y + mapConfig.height) % mapConfig.height,
    ];
  };

  const isObstructed = (x: number, y: number) => {
    return runQuery([Has(Obstruction), HasValue(Position, { x, y })]).size > 0;
  };

  const moveTo = async (inputX: number, inputY: number) => {
    if (!playerEntity) throw new Error("no player");
    if (!!getComponentValue(Encounter, playerEntity))
      throw new Error("cannot move during encounter");
    const [x, y] = wrapPosition(inputX, inputY);
    if (isObstructed(x, y)) throw new Error("cannot move to obstructed space");

    const positionId = uuid();
    Position.addOverride(positionId, {
      entity: playerEntity,
      value: { x, y },
    });

    try {
      const tx = worldSend("move", [x, y]);
      await awaitStreamValue(txReduced$, (txHash) => txHash === tx.hash);
    } finally {
      Position.removeOverride(positionId);
    }
  };

  const moveBy = async (deltaX: number, deltaY: number) => {
    if (!playerEntity) throw new Error("no player");

    const playerPosition = getComponentValue(Position, playerEntity);
    if (!playerPosition) {
      console.warn("player not positioned");
      return;
    }

    await moveTo(playerPosition.x + deltaX, playerPosition.y + deltaY);
  };

  const spawn = async (inputX: number, inputY: number) => {
    if (!playerEntity) throw new Error("no player");
    const [x, y] = wrapPosition(inputX, inputY);
    if (isObstructed(x, y)) throw new Error("cannot spawn on obstructed space");

    // const positionId = uuid();
    // Position.addOverride(positionId, {
    //   entity: playerEntity,
    //   value: { x, y },
    // });
    // const playerId = uuid();
    // Player.addOverride(playerId, {
    //   entity: playerEntity,
    //   value: { value: true },
    // });

    const canSpawn = getComponentValue(Player, playerEntity)?.value !== true;
    if (!canSpawn) {
      throw new Error("Already spawned");
    }

    try {
      const tx = await worldSend("spawn", [x, y]);
      await awaitStreamValue(txReduced$, (txHash) => txHash === tx.hash);
    } finally {
      // Position.removeOverride(positionId);
      // Player.removeOverride(playerId);
    }
  };

  const throwBall = async () => {
    const player = playerEntity;
    if (!player) throw new Error("no player");

    const encounter = getComponentValue(Encounter, player);
    if (!encounter) throw new Error("no encounter");

    const tx = await worldSend("throwBall", []);
    await awaitStreamValue(txReduced$, (txHash) => txHash === tx.hash);

    const catchAttempt = getComponentValue(MonsterCatchAttempt, player);
    if (!catchAttempt) {
      throw new Error("no catch attempt found");
    }

    return catchAttempt.result as MonsterCatchResult;
  };

  const fleeEncounter = async () => {
    const tx = await worldSend("flee", []);
    await awaitStreamValue(txReduced$, (txHash) => txHash === tx.hash);
  };

  return {
    moveTo,
    moveBy,
    spawn,
    throwBall,
    fleeEncounter,
  };
}
