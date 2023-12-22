
export type UserId = string;

export interface Chat {
    id: string;
    userId: UserId;
    name: string;
    message: string;
    upvotes: UserId[]; // who has upvoted what

}


export abstract class Store {

    constructor() {

    }

    initRoom(roomId: string) {

    }

    getChats(room: string, limit: number, offset: number) { }

    addChat(roomId: string, userId: UserId, message: string, name: string) { }

    upvote(userId: UserId, room: string, chatId: string) { }

}