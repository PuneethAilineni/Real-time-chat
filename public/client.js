const socket = io()
let name;
let currentGroup = null;
let textarea = document.querySelector('#textarea')
let messageArea = document.querySelector('.message__area')
let participantsArea = document.querySelector('#participantsArea')

// Prompt for username
do {
    name = prompt('Please enter your name: ')
} while (!name)

// Modal elements
const modal = document.getElementById("groupModal");
const createGroupBtn = document.getElementById("createGroupBtn");
const closeModal = document.getElementsByClassName("close")[0];
const modalCreateGroup = document.getElementById("modalCreateGroup");

// Open modal when Create Group button is clicked
createGroupBtn.onclick = function() {
    modal.style.display = "block";
}

// Close modal when X is clicked
closeModal.onclick = function() {
    modal.style.display = "none";
}

// Create group from modal input
modalCreateGroup.onclick = function() {
    const groupName = document.getElementById('modalGroupName').value;
    if (groupName) {
        currentGroup = groupName;
        socket.emit('createGroup', { groupName, user: name });
        alert(`Group "${groupName}" created and joined!`);
        modal.style.display = "none";
        document.getElementById('modalGroupName').value = '';  // Clear input
    }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Handle joining an existing group
document.getElementById('joinGroup').addEventListener('click', () => {
    const groupName = prompt("Enter the group name to join:");
    if (groupName) {
        currentGroup = groupName;
        socket.emit('joinGroup', { groupName, user: name });
        alert(`Joined group "${groupName}"!`);
    }
});

// Handle leaving a group with confirmation
document.getElementById('leaveGroup').addEventListener('click', () => {
    if (currentGroup) {
        if (confirm("Do you want to exit the group?")) {
            socket.emit('leaveGroup', { groupName: currentGroup, user: name });
            alert(`Left group "${currentGroup}"`);
            currentGroup = null;
            messageArea.innerHTML = '';
            participantsArea.innerHTML = '';
            document.getElementById('leaveGroup').style.display = 'none';
        }
    }
});

// Show participants of the current group
document.getElementById('showParticipants').addEventListener('click', () => {
    if (currentGroup) {
        socket.emit('showParticipants', currentGroup);
    }
});

textarea.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && currentGroup) {
        sendMessage(e.target.value)
    }
})

function sendMessage(message) {
    let msg = {
        user: name,
        message: message.trim(),
        group: currentGroup
    }
    // Append 
    appendMessage(msg, 'outgoing')
    textarea.value = ''
    scrollToBottom()

    // Send to server 
    socket.emit('message', msg)
}

function appendMessage(msg, type) {
    let mainDiv = document.createElement('div')
    let className = type
    mainDiv.classList.add(className, 'message')

    let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
    `
    mainDiv.innerHTML = markup
    messageArea.appendChild(mainDiv)
}

// Receive messages 
socket.on('message', (msg) => {
    if (msg.group === currentGroup) {
        appendMessage(msg, 'incoming')
        scrollToBottom()
    }
})

// Receive participants list 
socket.on('participants', (participants) => {
    participantsArea.innerHTML = `<h4>Participants in "${currentGroup}":</h4><p>${participants.join(', ')}</p>`;
})

// Update the visibility of leave group button
socket.on('updateGroupStatus', (isMember) => {
    const leaveGroupBtn = document.getElementById('leaveGroup');
    leaveGroupBtn.style.display = isMember ? 'block' : 'none';
})

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight
}
