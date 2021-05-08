const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const  path = require('path'); //built in path module, used to resolve paths of relative files
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = {};
server.listen(3000);
const ejs = require("ejs");
const mongoose= require('mongoose');
var flash = require('connect-flash');
//add-signup
const session= require('express-session');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/frosthackDB", {useNewUrlParser: true, useUnifiedTopology: true , useFindAndModify: false} );
mongoose.set("useCreateIndex",true);

// Routes
app.use('/messages', require('./routes/messages'));

const chatSchema = mongoose.Schema({

    nick: String,
    msg: String,
    group:String,
    created: {type: Date, default: Date.now}
})
var Chat = mongoose.model('Message', chatSchema);


app.use(express.static(path.join(__dirname + '/assets'))); //allows html file to reference stylesheet "helloworld.css" that is stored in ./css directory
var username='not available';
app.post('/storename', function (req, res) {
    username=req.body.username;
  console.log(username+" "+req.body);
  res.send();
})
app.get('/storename', function (req, res) {
    username=req.body.username;
  console.log(username+" "+req.body);
    res.redirect("/");
})
app.get('/', function (req, res) {
    res.render("home");
})
app.get('/chat', function (req, res) {
    res.render("chat",{name:username});
})
app.get("/track",function(req,res){
    res.render("track");
});

//signup
app.get("/signup",function(req,res){
    res.render("signup");
});
//login
app.get("/login",function(req,res){
    res.render("login");
});



var rooms = ['Global Room','Manufacturer1','Manufacturer2','Manufacturer3','Manufacturer4'];


io.sockets.on('connection',function (socket) {



    Chat.find({}, function (err, docs) {
        if (err) throw err;
        socket.emit('load old msgs', docs);
    })
    socket.on('new user', function (data ,callback) {
        if (data in users){
            callback(false);
        }
        else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();


            socket.room = 'Global Room';
            // add the client's username to the global list
            // send client to Global Room
            socket.join('Global Room');
            // echo to client they've connected
            // echo toGlobal Room that a person has connected to their room
            socket.emit('updatechat', 'SERVER', 'you have connected to Global Room');

            socket.broadcast.to('Global Room').emit('updatechat', 'SERVER', socket.nickname + ' has connected to this room');
            socket.emit('updaterooms', rooms, 'Global Room');
        }
        // send client to Global Room

    })



    function updateNicknames() {
        io.sockets.emit('usernames', Object.keys(users));
    }

    //creating a chat room
    socket.on('create', function(room) {
        rooms.push(room);
        socket.emit('updaterooms', rooms, socket.room);
    });


    socket.on('send message', function (data, callback) {
        var msg = data.trim();
        if(msg.substr(0,3) === '/w '){
            msg = msg.substr(3);
            var ind = msg.indexOf(' ');
            if(ind !== -1) {
                var name = msg.substring(0, ind);
                var msg  = msg.substring(ind+1);

                if(name in users){
                    users[name].emit('whisper', {msg: msg ,nick: socket.nickname});
                    console.log('Private Message!');
                }else {
                    callback('Error! Enter a valid user');
                }
                console.log('Whisper');
            }else {
                callback('Error! Please enter a message for your whisper');
            }
        }
        else {
            var newMsg = new Chat({msg: msg, nick: socket.nickname,group: socket.room})
            newMsg.save(function (err) {
                if (err) throw err;
                io.sockets.in(socket.room).emit('new message', {msg: msg, nick: socket.nickname,group: socket.room})

            })
        }
    })




    socket.on('switchRoom', function(newroom){
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.nickname+' has left this room');
        // update socket session room title
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.nickname+' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });



    socket.on('disconnect', function (data) {
       if (!socket.nickname) return;
       delete  users[socket.nickname];
        //io.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'SERVER', socket.nickname + ' has disconnected');
        socket.leave(socket.room);

        updateNicknames();
    });
})
