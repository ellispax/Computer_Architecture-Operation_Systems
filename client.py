import socket
import select
import errno
import sys

HEADERSIZE=10
IP="127.0.0.1"
PORT=1234

my_username=input("Username: ")
client_socket=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
client_socket.connect((IP,PORT))
# to disallow the block to receiving path
client_socket.setblocking(False)

username=my_username.encode("utf-8")
username_header=f"{len(username):<{HEADERSIZE}}".encode("utf-8")
# send username and its header to the server
client_socket.send(username_header+username)

while True:
    message=input(f"{my_username}>")

    if message:
        message=message.encode("utf-8")
        message_header=f"{len(message):<{HEADERSIZE}}".encode("utf-8")
        client_socket.send(message_header+message)
    try:
        while True:
            username_header=client_socket.recv(HEADERSIZE)

            if not len(username_header):
                print("Connection closed by the server")
                sys.exit()

            username_lengh=int(username_header.decode("utf-8").strip())

            username=client_socket.recv(username_lengh).decode("utf-8")

            message_header=client_socket.recv(HEADERSIZE)
            message_length=int(message_header.decode("utf-8").strip())
            message=client_socket.recv(message_length).decode("utf-8")

            print(f"{username}>{message}")
    except IOError as e:
        if e.errno != errno.EAGAIN and e.errno != errno.EWOULDBLOCK:
            print('Reading error: {}'.format(str(e)))
            sys.exit()

            # We just did not receive anything
        continue
    except Exception as e:
        # Any other exception - something happened, exit
        print('Reading error: '.format(str(e)))
        sys.exit()


