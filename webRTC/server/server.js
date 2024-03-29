const HTTPS_PORT = 8443; //default port for https is 443
const HTTP_PORT = 8001; //default port for http is 80

const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
// based on examples at https://www.npmjs.com/package/ws 
const WebSocketServer = WebSocket.Server;

// ws = WebsocketServer(host='0.0.0.0', port=9001)
// console.log('websocketserver:')
console.log(WebSocket);
// console.log(WebSocketServer);

// Yes, TLS is required
const serverConfig = {
  key: fs.readFileSync('https://jiujiu-blue.github.io/webRTC/key.pem'),
  cert: fs.readFileSync('https://jiujiu-blue.github.io/webRTC/cert.pem'),
};

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
const handleRequest = function (request, response) {
  // Render the single client html file for any request the HTTP server receives
  console.log('request received: ' + request.url);

  if (request.url === 'https://jiujiu-blue.github.io/webRTC/client/webrtc.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('https://jiujiu-blue.github.io/webRTC/client/webrtc.js'));
  } else if (request.url === 'https://jiujiu-blue.github.io/webRTC/client/style.css') {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.end(fs.readFileSync('https://jiujiu-blue.github.io/webRTC/client/style.css'));
  }else if(request.url === 'https://jiujiu-blue.github.io/webRTC/client/index.html'){
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(fs.readFileSync('https://jiujiu-blue.github.io/webRTC/client/index.html'));
  }else {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(fs.readFileSync('https://jiujiu-blue.github.io/webRTC/client/login.html'));
  }
};

const httpsServer = https.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT);

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
const wss = new WebSocketServer({ server: httpsServer });
var io=require('socket.io')(httpsServer); 
wss.on('connection', function (ws) {
  ws.on('message', function (message) {
    // Broadcast any received message to all clients
    console.log('received: %s', message);
    wss.broadcast(message);
  });
  ws.on('error', () => ws.terminate());
});
wss.broadcast = function (data) {
  this.clients.forEach(function (client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};
io.on('connection',(socket)=>{
  console.log('a user connected:'+socket.id);
  socket.on('disconnect',()=>{
      console.log('user disconnect:'+socket.id);
  });
  socket.on('chat message',(msg)=>{
      console.log(socket.id+'say'+msg);
      io.emit('chat user',socket.id);
      io.emit('chat message',msg);
  })
})

console.log('Server running ' + HTTPS_PORT);

// ----------------------------------------------------------------------------------------

// Separate server to redirect from http to https
http.createServer(function (req, res) {
  console.log(req.headers['host'] + req.url);
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(HTTP_PORT);
