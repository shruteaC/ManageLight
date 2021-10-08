const args = window.location.href.split('/');
const ROOM_ID = args[args.length - 1];
const MAIN_PAGE = args[args.length - 1] == '';
const MAX_NUM_BULBS = 10;
const MAX_LIGHTS = 2;
const MAX_NODES = 5;
const SEND_ROOM_ID = localStorage.getItem('send_room_id');



//Connect to socket.io server
const socket = io('https://samrtlightwebbackend.herokuapp.com/');
// 'http://localhost:4000/'
// 


socket.on('connect', () => {
    $('#conn_status').attr('type', 'success');
    $('#conn_status').text('CONNECTED TO SERVER');
    socket.emit('connection_status', 'ping');
});

socket.on('disconnect', () => {
    $('#conn_status').attr('type', 'failed');
    $('#conn_status').text('DISCONNECTED FROM SERVER');
});

// handle the event sent with socket.send()
socket.on('connection_status', data => {
    console.log(data);
    $('title').text('Room ' + ROOM_ID.toUpperCase());
});

socket.on('light_event', data => {
    console.log(data);
    
    if (MAIN_PAGE) updateTable(data);
    else updateLight(data);
});


//Functioanlity ofthe button
function sendBBC(light_id, button_id) {
    const invertedState = $(`.${button_id}`).attr('state') === 'off' ? 'on': 'off';
    $(`.${button_id}`).attr('state', invertedState);
    
    var payload = {
        head_id : SEND_ROOM_ID,
        node_id : light_id,
        type: "ACTION" ,
        light_action : `*=${invertedState}`
    };

    socket.emit("light_event", payload);
}

function updateTable(data) {
    const rowActivity = $(`.room_${data.head_id}[activity]`);
    rowActivity.text(`${new Date().toDateString() + ', ' + new Date().toLocaleTimeString()}`);
}

function updateLight(data) {

    //Toggle a light
    if (data.node_id != "*" && data.type == "ACTION" && ROOM_ID.toLowerCase() == data.head_id.toLowerCase() && data.light_action.startsWith("*")) {
        const action = data.light_action.split("=")[1];
        document.getElementById(`light_${data.node_id}`).setAttribute('src', `./${action}.jpg`);
    }
}

function generateLightHTMLCode(row) {
    var body = "";
    for (var i = 0; i < MAX_LIGHTS; i++) {
        body += `<td> 
                    <img class="light_icon" src="./off.jpg" id="light_${row > 0 ? row + row + i: row + i}">  
                 </td>`; 
    }

    return `<tr> ${body} </tr>`;
}

//Populate table with 50 rooms
if (MAIN_PAGE) {
    var counter = -1;
    var subId = 1;
    for (var i = 0; i < MAX_NUM_BULBS; i++) {
        $('tbody').append(`
        <tr class="room_B${i + 1}" onclick="sendBBC(${i}, 'room_B${i + 1}');" state="off">
            <td class="room_B${i + 1}"> Node <b>${i + 1}</b> </td>
            <td class="room_B${i + 1}"> <button type="button">Click Me!</button> </td>
        </tr>
        `);
    }
}
//Populate room page with light images
else {
    for (var i = 0; i < MAX_NODES; i++) { 
        $('tbody').append(generateLightHTMLCode(i));
    }
}

//Chaneg header in index.html
$('h1').text(`Controling room ${SEND_ROOM_ID}`);
