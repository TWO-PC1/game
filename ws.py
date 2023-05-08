
import websocket
import json
import time
import pygame
import threading
import queue


# WebSocket 서버 URL
url = 'ws://localhost:8080'

# WebSocket 연결
ws = websocket.create_connection(url)

# 세션 ID 생성
session_id = ws.recv()

# 연결된 WebSocket 서버에 메시지 전송
message = {'sessionId': session_id, 'type': 'ping'}
ws.send(json.dumps(message))

# WebSocket 서버로부터 메시지 수신
response = ws.recv()
print(response)

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



# 초기화
pygame.init()

# 글꼴 설정
font = pygame.font.SysFont('malgungothic', 36)  # 폰트, 크기

# 화면 크기 설정
screen_width = 640
screen_height = 480
# 창 생성
win = pygame.display.set_mode((screen_width, screen_height))

# 창 타이틀 설정
pygame.display.set_caption("Pygame Example")
message = {'sessionId': session_id, 'type': 'ping'}
ws.send(json.dumps(message))
# 게임 루프
while True:
    
    # 이벤트 처리
    # 연결된 WebSocket 서버에 메시지 전송
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            ws.close() # WebSocket 연결 종료
            pygame.quit()
            quit()


        

    if q.empty():
        continue
    # 배경 색 설정
    win.fill((0, 0, 0))

    #글자 설정
    text = font.render(q.get(), True, (255, 255, 255))
    
    text_rect = text.get_rect(center=(screen_width//2, screen_height//2))
    win.blit(text, text_rect)
    
    
    
   

    # 화면 업데이트
    pygame.display.update()