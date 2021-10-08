var app = require('express')();
const cors = require('cors');
const server = require('http').Server(app);
const io = require('socket.io')
    (server, {
        cors: {
          origin: '*',
          methods: ["GET", "POST"]
        }
      });



const port = process.env.PORT || 4000;
var light_data = undefined;
const MAX_ROOMS = 100;
const MAX_LIGHTS = 2;
const MAX_NODES = 5;

app.use(cors());

function emit(io, namespace, room, data) {
    io.of('/' + namespace).emit(room, JSON.stringify(data));
}

function initlaiseLights() {
    light_data = {};

    for (var room = 0; room < MAX_ROOMS; room++) {
        light_data[`B${room + 1}`] = [];

        for (var node = 0; node < MAX_LIGHTS * MAX_NODES; node++) {
            light_data[`B${room + 1}`].push("off");
        }
    }
}

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, PUT, GET, OPTIONS, REQUEST");
    res.header("Access-Control-Allow-Headers", "Origin, X-RequestedWith, Content-Type, Accept");

    next();
});

app.get('/', function (req, res) {
    return res.send(light_data || {});
});

app.get('/refresh', function (req, res) {
    initlaiseLights();
    return res.send(light_data || {});
});

io.on("connection", function (socket) {
    if (light_data == undefined) {
        initlaiseLights();
    }

    //Client Ping Server
    socket.on("connection_status", function (data) {
        socket.emit("connection_status", { message: 'pong' });
    });

    //Client Ping Server
    socket.on("light_event", function (data) {
        //All lights in row
        if (data.node_id != "*" && data.type == "ACTION" && data.light_action.startsWith("*")) {
            light_data[data.head_id][data.node_id] = data.light_action.split('=')[1];
        }

        io.emit("light_event", data);
    });

});

console.log("Server will be listening on port " + port);
server.listen(port);
//cool