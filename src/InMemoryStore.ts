import { Chat, Store, UserId } from "./Store/Store";

let globalChatId = 0;

export interface Room {
    roomId: string;
    chats: Chat[];
}

export class InMemoryStore implements Store {

    private store: Map<string, Room>;

    constructor() {
        this.store = new Map<string, Room>()
    }

    initRoom(roomId: string) {

        this.store.set(roomId, {
            roomId,
            chats: []
        });

    }

    // last 50 chats => limit =50, offset=0
    // after above limit = 50, offset= 50
    getChats(roomId: string, limit: number, offset: number) {
        const room = this.store.get(roomId);

        if (!room) {
            return [];
        }

        return room.chats.reverse().slice(0, offset).slice(-1 * limit);

        //return this.store.get(roomId)?.chats.reverse().slice(0,offset).slice(offset,limit);
    }

    addChat(roomId: string, userId: UserId, message: string, name: string) {
        const room = this.store.get(roomId);

        if (!room) {
            return [];
        }

        room.chats.push({
            id: (globalChatId++).toString(),
            userId,
            name,
            message,
            upvotes: []
        })
    }

    upvote(userId: UserId, roomId: string, chatId: string) {

        const room = this.store.get(roomId);

        if (!room) {
            return [];
        }

        const chat = room.chats.find(({ id }) => id === chatId);

        if (chat) {
            chat.upvotes.push(userId);
        }

    }

}