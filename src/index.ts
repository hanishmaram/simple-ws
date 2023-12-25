import { server as WebSocketServer, connection } from "websocket";
import http from "http";
import { IncomingMessage, SupportedMessage } from "./messages/incomingMessages";
import { OutgoingMessage, SupportedMessage as OutgoingSupportedMessage  } from "./messages/outgoingMessages";
import { InMemoryStore } from "./Store/InMemoryStore";
import { UserManager } from "./UserManager";

var server = http.createServer(function(request: any, response:any) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});


const userManager = new UserManager();
const store = new InMemoryStore();

server.listen(8081, function() {
    console.log((new Date()) + ' Server is listening on port 8081');
});

const wsServer = new WebSocketServer({
    httpServer: server,    
    autoAcceptConnections: false
});

function originIsAllowed(origin: string) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    console.log('on connection');
    if (!originIsAllowed(request.origin)) {

        console.log('conneciton allowed');
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        console.log('on message')
        if (message.type === 'utf8') {
            console.log('on message type utf8')
            try {
                messageHandler(connection,JSON.parse(message.utf8Data));
            } catch (e) {
                
            }

            // console.log('Received Message: ' + message.utf8Data);
            // connection.sendUTF(message.utf8Data);
        }
        // else if (message.type === 'binary') {
        //     console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        //     connection.sendBytes(message.binaryData);
        // }
    });
    // connection.on('close', function(reasonCode, description) {
    //     console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    // });
});


function messageHandler(ws:connection, message: IncomingMessage) {

    console.log(`Incoming message:${JSON.stringify(message)}`);

    if(message.type == SupportedMessage.JoinRoom) {
        const payload = message.payload;
        userManager.addUser(payload.name,payload.userId, payload.roomId, ws);
    }

    if(message.type == SupportedMessage.SendMessage) {
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId, payload.userId);
        if(!user) {
            console.error("User not found in the db");
            return;
        }
        let chat = store.addChat(payload.roomId,payload.userId,payload.message,user.name);

        if(!chat) {
            console.error("chat not found");
            return;
        }

        // TODO: add broadcast logic here

        const outgoingPayload : OutgoingMessage = {
            type: OutgoingSupportedMessage.AddChat,
            payload : {
                chatId: chat.id,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes: 0
            }
        }

        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }

    if(message.type == SupportedMessage.UpvotedMessage) {
        const payload = message.payload;
        let chat = store.upvote(payload.userId, payload.roomId, payload.chatId);

        if(!chat) {
            console.error("chat not found");
            return;
        }

        const outgoingPayload : OutgoingMessage = {
            type: OutgoingSupportedMessage.UpdateChat,
            payload : {
                chatId: chat.id,
                roomId: payload.roomId,
                upvotes: chat.upvotes.length
            }
        }

        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);

    }
}