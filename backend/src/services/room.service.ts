import { rooms } from "../storage/roomStore";
import { generateRoomCode } from "../utils/generateRoomCode";
import { Member, Room } from "../types/room";
import songsData from "../data/songs.json";

class RoomService {
  createRoom(hostName: string, password?: string) {
    let code = generateRoomCode();

    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const host: Member = {
      id: crypto.randomUUID(),
      name: hostName,
      isHost: true,
    };
    
    // Pre-populate with first 50 songs so there's always something to play
    const initialQueue = songsData.slice(0, 50).map(s => ({
      id: crypto.randomUUID(),
      songId: s.id,
      addedBy: "System"
    }));

    const room: Room = {
      code,
      hostId: host.id,
      members: [host],
      queue: initialQueue,
      playback: {
        songId: null,
        currentTime: 0,
        playing: false,
        updatedAt: null,
      },
    };

    rooms.set(code, room);

    return room;
  }

  joinRoom(code: string, name: string) {
    const room = rooms.get(code);

    if (!room) throw new Error("Room not found");

    if (room.members.length >= 3) throw new Error("Room is full");

    const member: Member = {
      id: crypto.randomUUID(),
      name,
      isHost: false,
    };

    room.members.push(member);

    return room;
  }

  leaveRoom(code: string, memberId: string) {
    const room = rooms.get(code);

    if (!room) return;

    // The Admin (Host) is a permanent member of their own room.
    // We never remove them from the members list, even if they disconnect.
    // This ensures they never lose their admin privileges.
    if (room.hostId === memberId) {
      return;
    }

    room.members = room.members.filter((m) => m.id !== memberId);

    if (room.members.length === 0) {
      rooms.delete(code);
      return;
    }
  }

  getRoom(code: string) {
    return rooms.get(code);
  }

  deleteRoom(code: string) {
    rooms.delete(code);
  }
}

export default new RoomService();
