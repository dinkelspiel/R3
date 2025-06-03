import type { CtoSPacket } from "~/shared/game";
import { useGameStore } from "./state";

export const sendPacket = (packet: CtoSPacket) => {
  const { socket } = useGameStore.getState();
  if (socket == null) {
    throw Error("Socket is null when sending packet");
  }
  console.log(`Sent packet`, packet);
  socket.send(JSON.stringify(packet));
};
