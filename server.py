import socket
import select

HEADER_LENGTH=10
IP="127.0.0.1"
PORT=1234

# create a server socket with IPV4(AF_INET) and TCP (Socket stream)
server_socket=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
# allow the server to reconnect when disconnected
server_socket.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)

server_socket.bind((IP,PORT))
server_socket.listen()

socket_list=[server_socket]

clients={}

def receive_message(client_socket):
    try:
        message_header=client_socket.recv(HEADER_LENGTH)
        if not len(message_header):
            return False
        # convert message to number format
        message_length=int(message_header.decode('utf-8').strip())
        return {"header":message_header,"data":client_socket.recv(message_length)}
    except:
        return False

while True:
    # _ mean write sockets
    read_sockets, _, exception_sockets=select.select(socket_list,[],socket_list)

    for notified_socket in read_sockets:
        # if that's the server socket, which means someone just connected to the server socket
        if notified_socket ==server_socket:
            # initialize this new connection, and receive messages
            client_socket, client_address=server_socket.accept()
            user=receive_message(client_socket)

            if user is False:
                continue
            # append connection to the chatroom
            socket_list.append(client_socket)
            # user now get a client socket
            clients[client_socket]=user
            print(f"Accepted new connections: {client_address[0]}:{client_address[1]} username: {user['data'].decode('utf-8')}")
        # if that's not a new connection but old one
        else:
            message=receive_message(notified_socket)
            # if error, remove connection, user and its data
            if message is False:
                print(f"Closed connection from {clients[notified_socket]['data'].decode('utf-8')} ")
                socket_list.remove(notified_socket)
                del clients[notified_socket]
                continue

            user=clients[notified_socket]
            print(f"Received messages from {user['data'].decode('utf-8')}:{message['data'].decode('utf-8')}")

            for client_socket in clients:
                if client_socket!=notified_socket:
                    # client send the user header, its data, messages and its data
                    # send the connection first, then the message later, both with header
                    client_socket.send(user['header']+user['data']+message['header']+message['data'])
    # if some errors occured, delete the socket and its connection.
    for notified_socket in exception_sockets:
        socket_list.remove(notified_socket)
        del clients[notified_socket]



