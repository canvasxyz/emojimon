// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import { System } from "@latticexyz/world/src/System.sol";

import { Encounter, EncounterData, MonsterCatchAttempt, OwnedBy, Monster } from "../codegen/Tables.sol";
import { MonsterCatchResult } from "../codegen/Types.sol";
import { addressToEntityKey } from "../addressToEntityKey.sol";

contract EncounterSystem is System {
  function flee() public {
    bytes32 player = addressToEntityKey(_msgSender());

    EncounterData memory encounter = Encounter.get(player);
    require(encounter.exists, "not in encounter");

    Monster.deleteRecord(encounter.monster);
    Encounter.deleteRecord(player);
  }
}
