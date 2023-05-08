
// server.js
const WebSocket = require('ws');
const crypto = require('crypto');

// 웹소켓 서버 생성
const wss = new WebSocket.Server({ port: 8080 });

const { v4: uuidv4 } = require('uuid');





/*

ERROR 401:지금 접근 가능하지 않은 상태
ERROR 400:올바르지 않은 접근
ERROR 300:이미 설정된 값




*/
// 연결된 클라이언트들을 저장할 맵
const clients = new Map();

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
// function makesessionid() {
//   const sessionId = uuidv4();
//   if (clients.has(sessionId) == false) {
//     console.log('성공')
//     console.log(sessionId)
//     return sessionId

//   } else {
//     console.log('겹치는 sessionid가 존재합니다.')
//     makesessionid()

//   }


// }


function makeroomid() {
  let roomId = uuidv4();
  if (room.has(roomId) == false) {
    console.log('성공')
    return roomId

  } else {
    console.log('겹치는 roomid가 존재합니다.')
    makeroomid()

  }


}

function leftroom(ws) {


  if ( clients.get(ws).name !== null ) {

    if (clients.get(ws).nowroomid !== null&& room !== null) {
      roomid = clients.get(ws).nowroomid
      console.log(roomid)
      roomuser = room.get(roomid).user;
      userIndex = roomuser.findIndex(user => user.name === clients.get(ws).name);

      console.log(roomuser)

      if (userIndex !== -1) {
        roomuser.splice(userIndex, 1);

        if (roomuser == "") {

          room.delete(roomid)
          clients.get(ws).nowroomid = null
          console.log(clients.get(ws))
          ws.send(JSON.stringify({ 'type': 'status', 'data': ' left room successed' }));
          console.log(room)
          console.log('방에 사람이 없어 방이 제거됩니다!')
          
        } else {
          room.set(roomid, { 'roomname': room.get(roomid).roomname, 'roompd': room.get(roomid).roompd, 'maxuser': room.get(roomid).maxuser, 'user': [roomuser] })
          clients.get(ws).nowroomid = null
          ws.send(JSON.stringify({ 'type': 'status', 'data': ' left room successed' }));
          console.log(`방에 남은 사람 ${roomuser}`)
        }
        
      } else {

        console.log(room)
        ws.send(JSON.stringify({ 'type': 'error', 'data': '401' }));
      console.log('지금 가능하지 않은 행동입니다!')

        
      }

    } else {
      ws.send(JSON.stringify({ 'type': 'error', 'data': '401' }));
      console.log('지금 가능하지 않은 행동입니다!')

      
    }


  } else {
    ws.send(JSON.stringify({ 'type': 'error', 'data': '500' }));
    console.log('데이터 형식이 잘못되었음')
    
  }
}

// function searchRoom(ws,count) {
//   const roomList = [];
//   room.forEach((value, key) => {
//     if (roomList.length >= count) return;
//     const roomData = {
//       'roomid': key,
//       'roomname': value.roomname,
//       'maxuser': value.maxuser,
//       'usercount': value.user.length
//     };
//     roomList.push(roomData);
//   });
 
//     if (client.name !== null && client.ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({ 'type': 'roomlist', 'data': roomList }));
//     }
  
// }

// 클라이언트가 연결되었을 때 호출되는 콜백
wss.on('connection', (ws, req) => {

  



  let ip =(req.headers['x-forwarded-for'] || req.socket.remoteAddress)

  // 클라이언트 정보를 저장
  clients.set(ws, { 'name': null, 
   'ws': ws, 
   'ip': ip,
    'nowroomid': null 
  });

  console.log(`Client connected: ${ip}`);

  // 메시지 수신 이벤트 리스너 등록
  ws.on('message', (message) => {
    // 세션 ID 추출


    // console.log()
    console.log(message)
    console.log(JSON.parse(message))
    

    Data = JSON.parse(message)
    if (clients.has(ws)) {


      switch (Data.type) {
        case 'nameset':
          //이름 설정




          if (clients.get(ws).name == null) {
            clients.get(ws).name = JSON.parse(message).data;
            console.log('이름이 설정되었습니다!')
            ws.send(JSON.stringify({ 'type': 'status', 'data': 'name set successed' }));
            break;
          } else {
            clients.get(ws).ws.send(JSON.stringify({ 'type': 'error', 'data': '300' }));
            console.log('이미 설정된 값')


            break;
          }

        case 'makeroom':
          if (Data !== null && clients.get(ws).name !== null) {
            if (clients.get(ws).nowroomid == null) {
              roomid = makeroomid()
              room.set(roomid, {
                'roomname': Data.name,
                'roompd': sha256(Data.pd),
                'maxuser': Data.maxuser,
                'user': [{
                  'name': clients.get(ws).name
                }]
              });


              let user = clients.get(ws);
              user.nowroomid = roomid;
              clients.set(ws, user);

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
          leftroom(ws)
          break;
          // if (Data !== null && clients.get(ws).name !== null && room !== null) {

          //   if (clients.get(ws).nowroomid !== null) {
          //     roomid = clients.get(ws).nowroomid
          //     console.log(roomid)
          //     roomuser = room.get(roomid).user;
          //     userIndex = roomuser.findIndex(user => user.name === clients.get(ws).name);

          //     console.log(roomuser)

          //     if (userIndex !== -1) {
          //       roomuser.splice(userIndex, 1);

          //       if (roomuser == "") {

          //         room.delete(roomid)
          //         clients.get(ws).nowroomid = null
          //         console.log(clients.get(ws))
          //         ws.send(JSON.stringify({ 'type': 'status', 'data': ' left room successed' }));
          //         console.log(room)
          //         console.log('방에 사람이 없어 방이 제거됩니다!')
          //         break;
          //       } else {
          //         room.set(roomid, { 'roomname': room.get(roomid).roomname, 'roompd': room.get(roomid).roompd, 'maxuser': room.get(roomid).maxuser, 'user': [roomuser] })
          //         clients.get(ws).nowroomid = null
          //         ws.send(JSON.stringify({ 'type': 'status', 'data': ' left room successed' }));
          //         console.log(`방에 남은 사람 ${roomuser}`)
          //       }
          //       break;
          //     } else {

          //       console.log(room)
          //       break;
          //     }

          //   } else {
          //     ws.send(JSON.stringify({ 'type': 'error', 'data': '401' }));
          //     console.log('지금 가능하지 않은 행동입니다!')

          //     break;
          //   }


          // } else {
          //   ws.send(JSON.stringify({ 'type': 'error', 'data': '500' }));
          //   console.log('데이터 형식이 잘못되었음')
          //   break;
          // }
          case 'searchroom':
            let count
            if (Data.data && Data.data.count !== undefined){
              count = Data.data.count 
            } else {
              count = 5
            }
             
            const roomList = [];
            room.forEach((value, key) => {
              if (roomList.length >= count) return;
              const roomData = {
                'roomid': key,
                'roomname': value.roomname,
                'maxuser': value.maxuser,
                'usercount': value.user.length
              };
              roomList.push(roomData);
            });
          
            if (clients.has(ws) && clients.get(ws).name !== null && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ 'type': 'roomlist', 'data': roomList }));
            }
            break;




            
        case 'ping':
          ws.send(JSON.stringify({ 'type': 'ping'}));
          console.log('ping')
          break;


      }

      // 해당 세션 ID를 가진 클라이언트에게 메시지 전달
      // clients.get(ws).ws.send(message);//바꾸셈
    } else {

      ws.send(JSON.stringify({ 'type': 'error', 'data': '400' }));
      console.log('올바르지 않은 접근')
      console.log(JSON.parse(message))
      console.log(userData)
   

    }


  });

  // 클라이언트 연결이 끊어졌을 때 호출되는 콜백
  ws.on('close', () => {
    try {
      //세션 아이디 찾기 
      let UserData = clients.get(ws)
      leftroom(ws)
      
      if (UserData !== null) {
        console.log(`Client disconnected: name:${UserData.name} ip:${UserData.ip}`);
        clients.delete(ws);

      } else {
        console.log('Client disconnected: Unknown')

      }
    } catch (error) {
      console.error(error);
    }
  });
});