const express = require('express')
const app = express()
const http = require('http').createServer(app)

const PORT = process.env.PORT || 3000

http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})

app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

// Socket 
const io = require('socket.io')(http)

let groups = {};  // Stores group information

io.on('connection', (socket) => {
    console.log('Connected...')

    socket.on('createGroup', ({ groupName, user }) => {
        if (!groups[groupName]) {
            groups[groupName] = { participants: [] };
        }
        if (!groups[groupName].participants.includes(user)) {
            groups[groupName].participants.push(user);
        }
        socket.join(groupName);
        io.to(groupName).emit('participants', groups[groupName].participants);
        io.to(socket.id).emit('updateGroupStatus', true);
    });

    socket.on('joinGroup', ({ groupName, user }) => {
        if (groups[groupName]) {
            if (!groups[groupName].participants.includes(user)) {
                groups[groupName].participants.push(user);
                socket.join(groupName);
                io.to(groupName).emit('participants', groups[groupName].participants);
            }
            io.to(socket.id).emit('updateGroupStatus', true);
        } else {
            socket.emit('message', { user: 'System', message: `Group "${groupName}" does not exist.` });
        }
    });

    socket.on('leaveGroup', ({ groupName, user }) => {
        if (groups[groupName]) {
            groups[groupName].participants = groups[groupName].participants.filter(participant => participant !== user);
            socket.leave(groupName);
            io.to(groupName).emit('participants', groups[groupName].participants);
            io.to(socket.id).emit('updateGroupStatus', false);
            if (groups[groupName].participants.length === 0) {
                delete groups[groupName];
            }
        }
    });

    socket.on('message', (msg) => {
        socket.to(msg.group).emit('message', msg)
    });

    socket.on('showParticipants', (groupName) => {
        if (groups[groupName]) {
            io.to(socket.id).emit('participants', groups[groupName].participants);
        }
    });
})
