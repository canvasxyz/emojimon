import { Has, HasValue, getComponentValue, runQuery } from "@latticexyz/recs";
import { uuid, awaitStreamValue } from "@latticexyz/utils";
import { MonsterCatchResult } from "../monsterCatchResult";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { singletonEntity, playerEntity, worldSend, txReduced$ }: SetupNetworkResult,
  { Player, Position }: ClientComponents
) {
  const moveTo = async (x: number, y: number) => {
    if (!playerEntity) throw new Error("no player");
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

  const spawn = async (x: number, y: number) => {
    if (!playerEntity) throw new Error("no player");

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
    // TODO
    return null as any;
  };

  const fleeEncounter = async () => {
    // TODO
    return null as any;
  };

  return {
    moveTo,
    moveBy,
    spawn,
    throwBall,
    fleeEncounter,
  };
}
