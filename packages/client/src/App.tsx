import { useComponentValue } from "@latticexyz/react";
import { SyncState } from "@latticexyz/network";
import { useMUD } from "./MUDContext";
import { GameBoard } from "./GameBoard";
import { EmbeddableChat } from "./EmbeddableChat";

import { Has } from "@latticexyz/recs";

export const App = () => {
  const {
    components: { LoadingState, Player, Position },
    network: { playerEntity, singletonEntity },
  } = useMUD();

  const loadingState = useComponentValue(LoadingState, singletonEntity, {
    state: SyncState.CONNECTING,
    msg: "Connecting",
    percentage: 0,
  });

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      {loadingState.state !== SyncState.LIVE ? (
        <div>
          {loadingState.msg} ({Math.floor(loadingState.percentage)}%)
        </div>
      ) : (
        <GameBoard />
      )}
      <EmbeddableChat
        as={playerEntity}
        withEntityQuery={[Has(Player), Has(Position)]}
      />
    </div>
  );
};
