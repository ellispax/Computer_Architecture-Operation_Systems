const cluster = require("cluster");
const http = require("http");
const { Server } = require("socket.io");
const redisAdapter = require("socket.io-redis");
const numCPUs = require("os").cpus().length;
const { setupMaster, setupWorker } = require("@socket.io/sticky");

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  const httpServer = http.createServer();
  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });
  httpServer.listen(3000);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);

  const httpServer = http.createServer();
  const io = new Server(httpServer);
  io.adapter(redisAdapter({ host: "localhost", port: 6379 }));
  setupWorker(io);

  io.on("connection", (socket) => {
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
}