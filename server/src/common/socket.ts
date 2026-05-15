import { Server } from "socket.io";


let io : Server

export function initSocket(server : Server){
    io = server
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized')
    }
    return io
}

