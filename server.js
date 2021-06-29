const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName ='Bot :) ';

//run when client connects
io.on('connection',socket => {
    //console.log('New WS Connection...');
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);
        
        socket.join(user.room);

        //welcome current user
        socket.emit('message',formatMessage(botName,'Welcome To ChatRooms'));


        //broadcast when a user joins chat
        socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat`));
        
        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
    

    //listen for chat-message
    socket.on('chatMessage', msg =>{
        //console.log(msg);
        const user = getCurrentUser(socket.id);

        io.emit('message',formatMessage(user.username, msg));
    });

    //broadcast when user leaves the chat
    socket.on('disconnect', ()=> {
        const user = userLeave(socket.id);

        if (user){
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat.`));
            
            //send users and room info
            io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
            });
        };
        
         });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));