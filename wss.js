
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

const rooms = new Map();


// async function sha256(message) {
//   const encoder = new TextEncoder();
//   const data = encoder.encode(message);
//   const hashBuffer = await crypto.subtle.digest('SHA-256', data);
//   const hashArray = Array.from(new Uint8Array(hashBuffer));
//   const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
//   console.log(hashHex)
//   return hashHex;
// }

function makeroomid() {
  let roomId = uuidv4();
  if (rooms.has(roomId) == false) {
    console.log('성공')
    return roomId

  } else {
    console.log('겹치는 roomid가 존재합니다.')
    makeroomid()

  }


}


wss.on('connection', (ws, req) => {





  let ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress)

  // 클라이언트 정보를 저장
  clients.set(ws, {
    'name': null,
    'ws': ws,
    'ip': ip,
    'nowroomid': null
  });

  console.log(`Client connected: ${ip}`);






 ws.on('message', (message) => {


if (clients.has(ws)) {
handleMessage(message,ws)//메세지 처리
}



 });




  ws.on('close', () => {
    try {
      //세션 아이디 찾기 
      let UserData = clients.get(ws)
      if(UserData.nowroomid!==null){
      leftroom(ws)
      }
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


const handleMessage = async (message, ws) => {
  let Data 
  try {
    console.log(message)
    console.log(JSON.parse(message))


     Data = JSON.parse(message)


  } catch(error){
    console.error(error)
  }
    if (clients.has(ws)) {


        switch (Data.type) {
            case 'nameset':
                //이름 설정




                if (clients.get(ws).name == null) {
                    clients.get(ws).name = JSON.parse(message).data;
                    console.log('이름이 설정되었습니다!')
                    Msend(ws,{ 'type': 'status', 'data': 'name set successed' });
                    break;
                } else {
                    Msend(ws,{ 'type': 'error', 'data': '300' });
                    console.log('이미 설정된 값')


                    break;
                }

            // case 'makeroom':
            //     if (Data?.name !== null && Data?.pd !== null && Data?.maxuser !== null && clients.get(ws).name !== null) {
            //         if (clients.get(ws).nowroomid == null) {
            //             roomid = makeroomid()
            //             rooms.set(roomid, {
            //                 'roomname': Data.name,
            //                 'roompd': await sha256(Data.pd),
            //                 'maxuser': Data.maxuser,
            //                 'user': [{
            //                     'name': clients.get(ws).name,
            //                     'ws': ws
            //                 }]
            //             });


            //             let user = clients.get(ws);
            //             user.nowroomid = roomid;
            //             clients.set(ws, user);

                       
            //             Msend(ws,{ 'type': 'roomid', 'data': roomid });
            //             console.log(rooms)
            //             break;
            //         } else {
            //             Msend(ws,{ 'type': 'error', 'data': '401' });
            //             console.log('지금 가능하지 않은 행동입니다!')

            //             break;
            //         }
            //     } else {
            //         Msend(ws,{ 'type': 'error', 'data': '500' });
            //         console.log('데이터 형식이 잘못되었음')
            //         break;
            //     }

            case 'makeroom':
              if (Data?.name !== null && Data?.roompd !== null && Data?.maxuser !== null && clients.get(ws).name !== null) {
                  if (clients.get(ws).nowroomid == null) {
                      roomid = makeroomid()
                      rooms.set(roomid, {
                          'roomname': Data.name,
                          'roompd': crypto.createHash('sha256').update(Data.roompd).digest('hex'),
                          'maxuser': Data.maxuser,
                          'user': [{
                              'name': clients.get(ws).name,
                              'ws': ws
                          }]
                      });
          
          
                      let user = clients.get(ws);
                      user.nowroomid = roomid;
                      clients.set(ws, user);
          
                     
                      Msend(ws,{ 'type': 'roomid', 'data': roomid });
                      console.log(rooms)
                      break;
                  } else {
                      Msend(ws,{ 'type': 'error', 'data': '401' });
                      console.log('지금 가능하지 않은 행동입니다!')
          
                      break;
                  }
              } else {
                  Msend(ws,{ 'type': 'error', 'data': '500' });
                  console.log('데이터 형식이 잘못되었음')
                  break;
              }

            case 'leftroom':
                leftroom(ws)
                break;


            case 'searchroom':
                let count
                if (Data.count && typeof Data.count === "number" && Data.count !== undefined) {
                    count = Data.data.count
                } else {
                    count = 5
                }

                const roomList = [];
                rooms.forEach((value, key) => {
                    if (roomList.length >= count) return;
                    const roomData = {
                        'roomid': key,
                        'roomname': value.roomname,
                        'maxuser': value.maxuser,
                        'usercount': value.user.length
                    };
                    roomList.push(roomData);
                });

                
                    Msend(ws,{ 'type': 'roomlist', 'data': roomList });
                
                break;

                // case 'joinroom':
                //   if (Data?.key !== undefined && rooms.has(Data?.key)) {
                //       let finduser = rooms.get(Data.key).user.find(user => user.ws === ws); //찾은 요소 반환
                //       let nowroomuser = rooms.get(Data.key).user.length
                //       console.log(nowroomuser)
                //       if (clients.get(ws).nowroomid == null && clients.get(ws).name !== null && finduser == undefined && nowroomuser<rooms.get(Data.key).maxuser) {
                //         if( rooms.get(Data.key).roompd== null ){
                //           console.log('room!')
  
                //           clients.get(ws).nowroomid = Data.key;//들어온 유저의 nowroomid에 room key추가
                          
                //           roomuser = rooms.get(Data.key).user
                //           roomuser.push({ 'name': clients.get(ws).name, 'ws': ws })
  
                //           rooms.get(Data.key).user = roomuser
                //           console.log(`${rooms.get(Data.key).roomname}에 입장하였습니다!`)
                //           Msend(ws,{ 'type': 'successed', 'data': 'joinroom' });
                //       } else if(rooms.get(Data.key).roompd===await sha256(Data.roomdpd)){
                        
                //         console.log(`${rooms.get(Data.key).roomname}에 입장하였습니다!`)
  
                //         clients.get(ws).nowroomid = Data.key;//들어온 유저의 nowroomid에 room key추가
                        
                //         roomuser = rooms.get(Data.key).user
                //         roomuser.push({ 'name': clients.get(ws).name, 'ws': ws })
  
                //         rooms.get(Data.key).user = roomuser
  
                //       } else {
                //         Msend(ws,{ 'type': 'error', 'data': '500' })
                //         console.log('비밀번호가 틀렸습니다!')
                //         break;

                //       }
                //           break;
  
                //       } else {
                //           Msend(ws,{ 'type': 'error', 'data': '401' })
                //           console.log('지금 가능하지 않은 행동입니다!')
                //           console.log(Data.key)
                //           console.log(rooms.has(Data.key))
                //           break;
                //       }
  
  
                //   } else {
                //       Msend(ws,{ 'type': 'error', 'data': '500' })
                //       console.log('데이터 형식이 잘못되었음')
                //       break;
                //   }

          case 'joinroom':
            const wsClient = clients.get(ws);
            const roomKey = Data?.key;
            const room = rooms.get(roomKey);
            const roomUser = room?.user;
            const roomMaxUser = room?.maxuser;
            const roomPd = room?.roompd;
            const userPd = Data?.roompd;
            console.log(userPd)

            if (room && wsClient.nowroomid === null && wsClient.name !== null && roomUser.every(user => user.ws !== ws) && roomUser.length < roomMaxUser) {
              if (roomPd === null ||(userPd!==undefined &&roomPd === crypto.createHash('sha256').update(userPd).digest('hex'))) {
                console.log(`${room.roomname}에 입장하였습니다!`);
                wsClient.nowroomid = roomKey;
                roomUser.push({ name: wsClient.name, ws });
                Msend(ws, { type: 'successed', data: 'joinroom' });
              } else {
                Msend(ws, { type: 'error', data: '500' });
                console.log('비밀번호가 틀렸습니다!');
              }
            } else {
              Msend(ws, { type: 'error', data: '401' });
              console.log('지금 가능하지 않은 행동입니다!');
            }
            break;

            case 'ping':
                Msend(ws,{ 'type': 'ping'});
                console.log('ping')
                break;

            default:
                console.log('as');
                break;
        }

        // 해당 세션 ID를 가진 클라이언트에게 메시지 전달
        // clients.get(ws).ws.send(message);//바꾸셈
    } else {
        Msend(ws,{ 'type': 'error', 'data': '400' });
        console.log('올바르지 않은 접근')
        console.log(JSON.parse(message))
        console.log(userData)


    }



};


function Msend(ws,message) {
    if (ws.readyState === WebSocket.OPEN) {


        ws.send(JSON.stringify(message));


    }else{
        console.log('소켓이 열려있지 않습니다!')
    }


}

// function leftroom(ws) {


//   if (clients.get(ws)?.name !== null) {

//     if (clients.get(ws)?.nowroomid !== null && rooms !== null) {
//       roomid = clients.get(ws).nowroomid
      
//       let roomuser = rooms.get(roomid).user;
//       userIndex = roomuser.findIndex(user => user.ws === ws);

      

//       if (userIndex !== -1) {
//         roomuser.splice(userIndex,1)
//         rooms.get(roomid).user = roomuser;
//         clients.get(ws).nowroomid = null
//         if (roomuser == "") {

//           rooms.delete(roomid)
          
          
//           Msend(ws,{ 'type': 'status', 'data': ' left room successed' });
//           console.log(rooms)
//           console.log('방에 사람이 없어 방이 제거됩니다!')

//         } else {
         
          
//           Msend(ws,{ 'type': 'status', 'data': ' left room successed' });
//           for(i=0;i<roomuser.length;){
//           console.log(`방에 남은 사람 ${rooms.get(roomid).user[i].name }`);
//           i+=1
//         }
          
//         }

//       } else {

//         console.log(rooms)
//         Msend(ws,{ 'type': 'error', 'data': '401' });
//         console.log('지금 가능하지 않은 행동입니다1!')
//         console.log(rooms.get(roomid))
// console.log(clients.get(ws).name)

//       }

//     } else {
//         Msend(ws,{ 'type': 'error', 'data': '401' });
//       console.log('지금 가능하지 않은 행동입니다!')
      
//       console.log(clients.get(ws).name)
      

//     }


//   } else {
    
//     Msend(ws,{ 'type': 'error', 'data': '500' });
//     console.log('데이터 형식이 잘못되었음')

//   }
// }
function leftroom(ws) {
  const client = clients.get(ws);
  if (client?.name && client?.nowroomid && rooms.has(client.nowroomid)) {
    const room = rooms.get(client.nowroomid);
    const userIndex = room.user.findIndex(user => user.ws === ws);
    if (userIndex !== -1) {
      room.user.splice(userIndex, 1);
      client.nowroomid = null;
      if (room.user.length === 0) {
        rooms.delete(client.nowroomid);
        Msend(ws, { 'type': 'status', 'data': ' left room successed' });
        console.log('방에 사람이 없어 방이 제거됩니다!');
      } else {
        Msend(ws, { 'type': 'status', 'data': ' left room successed' });
        console.log(`방에 남은 사람 ${room.user.map(user => user.name).join(', ')}`);
      }
    } else {
      Msend(ws, { 'type': 'error', 'data': '401' });
      console.log('지금 가능하지 않은 행동입니다1!');
      console.log(room);
      console.log(client.name);
    }
  } else {
    Msend(ws, { 'type': 'error', 'data': '401' });
    console.log('지금 가능하지 않은 행동입니다!');
    console.log(client?.name);
  }
}
// function Datacheck(Data, check) { //ex {"name":"True","key":"False","nowroomid":"True"},[ 'nowroomid', 'key', 'name' ]
//   let DKEY = Object.keys(Data).sort()
//   let KEY = check.sort()
//   let keylen = KEY.length
//   let Dkeylen = DKEY.length
//   if (keylen !== Dkeylen) {
    
//     console.log(DKEY)
//     console.log(KEY)
//       return false;
//   } 
//       for (i = 0; i <= keylen; i++) {
//           if (DKEY[i] == KEY[i]) {
//               if (i >= keylen) {
//                   return true;
//               }
//           } else {

//             console.log(DKEY)
//             console.log(KEY)
//               return false;
//           }
//       }

// }