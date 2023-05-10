
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


async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log(hashHex)
  return hashHex;
}

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
    console.log(message)
    console.log(JSON.parse(message))


    let Data = JSON.parse(message)


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

            case 'makeroom':
                if (Data?.name !== null  && Data?.maxuser >= 2 && clients.get(ws).name !== null) {
                    if (clients.get(ws).nowroomid == null) {
                      if(Data?.pd!==null){
                        roomid = makeroomid()
                        rooms.set(roomid, {
                            'roomname': Data.name,
                            'roompd': null,
                            'maxuser': Data.maxuser,
                            'user': [{
                                'name': clients.get(ws).name,
                                'ws': ws
                            }]
                        });
                      } else {
                         roomid = makeroomid()
                        rooms.set(roomid, {
                            'roomname': Data.name,
                            'roompd': await sha256(Data.pd),
                            'maxuser': Data.maxuser,
                            'user': [{
                                'name': clients.get(ws).name,
                                'ws': ws
                            }]
                        });
                      }

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

                if (clients.has(ws) && clients.get(ws).name !== null && ws.readyState === WebSocket.OPEN) {
                    
                    Msend(ws,{ 'type': 'roomlist', 'data': roomList });
                    
                }
                break;




            case 'joinroom':
                if (Data?.key !== undefined && rooms.has(Data?.key)) {
                    let finduser = rooms.get(Data.key).user.find(user => user.ws === ws); //찾은 요소 반환
                    let nowroomuser = rooms.get(Data.key).user.length
                    console.log(nowroomuser)
                    if (clients.get(ws).nowroomid == null && clients.get(ws).name !== null && finduser == undefined && nowroomuser<rooms.get(Data.key).maxuser) {
                      if( rooms.get(Data.key).roompd== null ){
                        console.log('room!')

                        clients.get(ws).nowroomid = Data.key;//들어온 유저의 nowroomid에 room key추가
                        
                        roomuser = rooms.get(Data.key).user
                        roomuser.push({ 'name': clients.get(ws).name, 'ws': ws })

                        rooms.get(Data.key).user = roomuser

                        Msend(ws,{ 'type': 'successed', 'data': 'joinroom' });
                    } else if(rooms.get(Data.key).roompd===await sha256(Data.roomdpd)){
                      console.log(`${rooms.get(Data.key)}에 입장하였습니다!`)

                      clients.get(ws).nowroomid = Data.key;//들어온 유저의 nowroomid에 room key추가
                      
                      roomuser = rooms.get(Data.key).user
                      roomuser.push({ 'name': clients.get(ws).name, 'ws': ws })

                      rooms.get(Data.key).user = roomuser

                    }
                        break;

                    } else {
                        Msend(ws,{ 'type': 'error', 'data': '401' })
                        console.log('지금 가능하지 않은 행동입니다!')
                        console.log(Data.key)
                        console.log(rooms.has(Data.key))
                        break;
                    }


                } else {
                    Msend(ws,{ 'type': 'error', 'data': '500' })
                    console.log('데이터 형식이 잘못되었음')
                    break;
                }
            case 'ping':
                Msend(ws,{ 'type': 'ping','data':'a'});
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

function leftroom(ws) {


  if (clients.get(ws)?.name !== null) {

    if (clients.get(ws).nowroomid !== null && rooms !== null) {
      roomid = clients.get(ws).nowroomid
      
      let roomuser = rooms.get(roomid).user;
      userIndex = roomuser.findIndex(user => user.ws === ws);

      

      if (userIndex !== -1) {
        roomuser.splice(userIndex,1)
        rooms.get(roomid).user = roomuser;
        clients.get(ws).nowroomid = null
        if (roomuser == "") {

          rooms.delete(roomid)
          
          
          Msend(ws,{ 'type': 'status', 'data': ' left room successed' });
          console.log(rooms)
          console.log('방에 사람이 없어 방이 제거됩니다!')

        } else {
         
          
          Msend(ws,{ 'type': 'status', 'data': ' left room successed' });
          for(i=0;i<roomuser.length;){
          console.log(`방에 남은 사람 ${rooms.get(roomid).user[i].name }`);
          i+=1
        }
          
        }

      } else {

        console.log(rooms)
        Msend(ws,{ 'type': 'error', 'data': '401' });
        console.log('지금 가능하지 않은 행동입니다1!')
        console.log(rooms.get(roomid))
console.log(clients.get(ws).name)

      }

    } else {
        Msend(ws,{ 'type': 'error', 'data': '401' });
      console.log('지금 가능하지 않은 행동입니다!')
      
      console.log(clients.get(ws).name)
      

    }


  } else {
    
    Msend(ws,{ 'type': 'error', 'data': '500' });
    console.log('데이터 형식이 잘못되었음')

  }
}