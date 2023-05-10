
import websocket
import json
import time

import threading
import queue
import tkinter as tk

# WebSocket 서버 URL
url = 'ws://localhost:8080'

# WebSocket 연결
ws = websocket.create_connection(url)



# 연결된 WebSocket 서버에 메시지 전송
# 이름 설정
message = { "type": "nameset","data":'ysj'}
ws.send(json.dumps(message))

# WebSocket 서버로부터 메시지 수신
response = ws.recv()


#받은 데이터 q 저장
def data_receive():
    while True:
        data = ws.recv()
        # 받은 데이터 처리
        q.put(data)
            
        print(q.get())
q = queue.Queue()
thread = threading.Thread(target=data_receive, args=())
thread.daemon = True
thread.start()

#{"sessionId": session_id, "type": "makeroom","name":"seojun's room","roompd":"111","maxuser":"3"}
#{"sessionId": "session_id", "type": "makeroom", "name": "seojun\'s room", "roompd": "111", "maxuser": "3"}

def send_message():
    # 메시지 전송 함수
    data = entry.get()  # 입력된 메시지
    # TODO: 메시지 전송 코드 작성
    print(data)
    if data =="makeroom":
        data = { "type": "makeroom", "name": "seojun\'s room", "roompd": "", "maxuser": "3"}
        ws.send(json.dumps(data))
    elif data =="leftroom":
         data = { "type": "leftroom"}
         ws.send(json.dumps(data))
    elif data =="searchroom":
        data = { "type": "searchroom",'count':'5'}
        ws.send(json.dumps(data))
    else:
        data = {"type":"joinroom",'key':data,'roompd':None}
        ws.send(json.dumps(data))
        # data = data.replace("'", "\"")
        # ws.send(json.dumps(json.loads(data)))
    # message = {'sessionId': session_id, 'type': 'ping','data':data}
    #{"type":"joinroom",'key':''}

# 윈도우 생성
window = tk.Tk()
window.title("메시지 입력")

# def updata_message():
#     msg = entry.get()
#     text.insert(END, msg+'\n')
#     entry.delete(0, END)

# text = tk.Text(window)
# text.pack()

# 메시지 창 생성
message = tk.Message(window, text="보여주기만 가능한 메시지입니다.", width=200)
message.pack()
# 전송 버튼 생성
button = tk.Button(window, text="전송", command=send_message)
button.pack(side=tk.BOTTOM)

# 입력 창 생성
entry = tk.Entry(window)
entry.pack(side=tk.BOTTOM)
# if(q.get().type is not None and q.get().type=='status'):
#     pass

# 윈도우 실행

window.geometry("500x500")
window.mainloop()




