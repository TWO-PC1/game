// server.js
const WebSocket = require('ws');
const crypto = require('crypto');

// 웹소켓 서버 생성
const wss = new WebSocket.Server({ port: 8080 });







/*

ERROR 401:지금 접근 가능하지 않은 상태
ERROR 400:올바르지 않은 접근
ERROR 300:이미 설정된 값




*/
// 연결된 클라이언트들을 저장할 맵
const clients = new Map();
const clientId = new Map();
const room = new Map();


async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log(hashHex)
  return hashHex;
}
function makesessionid() {
  let sessionId = Math.random().toString(36).substring(2);
  if (clients.has(sessionId) == false) {
    console.log('성공')
    console.log(sessionId)
    return sessionId

  } else {
    console.log('겹치는 sessionid가 존재합니다.')
    makesessionid()

  }


}


function makeroomid() {
  let roomId = Math.random().toString(36).substring(2);
  if (room.has(roomId) == false) {
    console.log('성공')
    return roomId

  } else {
    console.log('겹치는 roomid가 존재합니다.')
    makeroomid()

  }


}




// 클라이언트가 연결되었을 때 호출되는 콜백
wss.on('connection', (ws, req) => {

  // 세션 ID 생성



  let sessionId = makesessionid()

  // 클라이언트 정보를 저장
  clients.set(sessionId, { 'name': null, 'sessionId': sessionId, 'ws': ws, 'ip': (req.headers['x-forwarded-for'] || req.socket.remoteAddress), 'nowroomid': null });
  clientId.set(ws, sessionId)
  console.log(`Client connected: ${sessionId}`);
  ws.send(sessionId)

  // 메시지 수신 이벤트 리스너 등록
  ws.on('message', (message) => {
    // 세션 ID 추출

    userData = clients.get(JSON.parse(message).sessionId);
    // console.log()
    console.log(message)
    console.log(JSON.parse(message))
    console.log(JSON.parse(message).sessionId)

    let msessionId = clientId.get(ws)
    Data = JSON.parse(message)
    if (clients.has(JSON.parse(message).sessionId) && clientId.has(ws) && userData.sessionId == msessionId && JSON.parse(message).sessionId == msessionId) {


      switch (Data.type) {
        case 'nameset':
          //이름 설정




          if (clients.get(msessionId).name == null) {
            clients.get(msessionId).name = JSON.parse(message).data;
            console.log('이름이 설정되었습니다!')
            ws.send(JSON.stringify({ 'type': 'status', 'data': 'name set successed' }));
            break;
          } else {
            clients.get(msessionId).ws.send(JSON.stringify({ 'type': 'error', 'data': '300' }));
            console.log('이미 설정된 값')


            break;
          }

        case 'makeroom':
          if (Data !== null && clients.get(msessionId).name !== null) {
            if (clients.get(msessionId).nowroomid == null) {
              roomid = makeroomid()
              room.set(roomid, { 'roomname': Data.name, 'roompd': sha256(Data.pd), 'maxuser': Data.maxuser, 'user': [{'name':clients.get(msessionId).name                      }] })


              let user = clients.get(msessionId)
              user.nowroomid = roomid



              clients.set(msessionId,user)
              ws.send(JSON.stringify({ 'type': 'roomid', 'data': roomid }));
              console.log(room)
              break;
            } else {
              ws.send(JSON.stringify({ 'type': 'error', 'data': '401' }));
              console.log('지금 가능하지 않은 행동입니다!')

              break;
            }
          } else {
            ws.send(JSON.stringify({ 'type': 'error', 'data': '500' }));
            console.log('데이터 형식이 잘못되었음')
            break;
          }
        case 'leftroom':
          if (Data !== null && clients.get(msessionId).name !== null&&room!==null) {
            
            if (clients.get(msessionId).nowroomid!== null) {
              roomid = clients.get(msessionId).nowroomid
              console.log(roomid)
              roomuser = room.get(roomid).user;
              userIndex = roomuser.findIndex(user => user.name === clients.get(msessionId).name);
              
              console.log(roomuser)
            
              if (userIndex !== -1) {
                roomuser.splice(userIndex, 1);
                
                if(roomuser==""){
                
                room.delete(roomid)
                clients.get(msessionId).nowroomid = null
                console.log(clients.get(msessionId))
                ws.send(JSON.stringify({ 'type': 'status', 'data': ' left room successed' }));
                console.log(room)
                console.log('방에 사람이 없어 방이 제거됩니다!')
                break;
                }else{
                  room.set(roomid, { 'roomname': room.get(roomid).roomname, 'roompd': room.get(roomid).roompd, 'maxuser': room.get(roomid).maxuser, 'user': [roomuser] })
                  clients.get(msessionId).nowroomid = null
                  ws.send(JSON.stringify({ 'type': 'status', 'data': ' left room successed' }));
                  console.log(`방에 남은 사람 ${roomuser}`)
                }
                break;
              } else {
                
                console.log(room)
                break;
              }
              




              
              
            } else {
              ws.send(JSON.stringify({ 'type': 'error', 'data': '401' }));
              console.log('지금 가능하지 않은 행동입니다!')

              break;
            }


          } else {
            ws.send(JSON.stringify({ 'type': 'error', 'data': '500' }));
            console.log('데이터 형식이 잘못되었음')
            break;
          }

        case 'ping':
          ws.send(JSON.stringify({ 'type': 'ping', 'data': null }));
          console.log('ping')
          break;


      }

      // 해당 세션 ID를 가진 클라이언트에게 메시지 전달
      // clients.get(sessionId).ws.send(message);//바꾸셈
    } else {

      ws.send(JSON.stringify({ 'type': 'error', 'data': '400' }));
      console.log('올바르지 않은 접근')
      console.log(JSON.parse(message))
      console.log(userData)
      console.log(msessionId)
      console.log(JSON.parse(message).sessionId)

    }


  });

  // 클라이언트 연결이 끊어졌을 때 호출되는 콜백
  ws.on('close', () => {
    try {
      //세션 아이디 찾기 
      LsessionId = clientId.get(ws);


      if (clients.get(LsessionId) !== null) {
        console.log(`Client disconnected: name:${clients.get(LsessionId).name} session:${LsessionId}`);
        clients.delete(LsessionId);
        clientId.delete(ws);
      } else {
        console.log('Client disconnected: Unknown')

      }
    } catch (error) {
      console.error(error);
    }
  });
});