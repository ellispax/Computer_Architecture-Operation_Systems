const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
//get username and room from URL

const {username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

//console.log(username, room);
const socket = io();

// join chatroom
socket.emit('joinRoom', {username, room});

//Get room and users
socket.on('roomUsers', ({room, users}) => {
    outputRoomName(room);
    outputUsers(users);
});

//message from server
socket.on('message', message => {
    console.log(message);
    outputMessage(message);

    //chat scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;


});

//message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const msg = e.target.elements.msg.value;

    //console.log(msg);
    socket.emit('chatMessage',msg);

    //clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

//outputMessage to dom
function outputMessage(message){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class = "meta">${message.username} <pan>${message.time}</span></p>
    <p class = "text">
        ${message.text}
    </p>`
    document.querySelector('.chat-messages').appendChild(div);
}

//Add room name to dom
function outputRoomName(room){
    roomName.innerText = room;
}

//add users to DOM
function outputUsers(users){
    userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}