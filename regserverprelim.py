import os
import sys
import socket
import json
import argparse
from database import get_class_details, get_class_overviews, DatabaseError

def parse_args():
    """Parse command line arguments.

    Returns:
        argparse.Namespace: Parsed command line arguments
    """
    parser = argparse.ArgumentParser(
        description='Server for the registrar application',
        usage="regdetails.py [-h] port"
        )
    
    parser.add_argument('port', 
                        help='the port at which the server should listen')
    return parser.parse_args()

def handle_get_details(classid):
    details_tuple = get_class_details(classid)
    try:
        if details_tuple is None:
            return [False, "Class not found"]
        else:
            basic_info, crosslistings, professors = details_tuple
            response = {
                "classid": basic_info[0],
                "courseid": basic_info[1],
                "days": basic_info[2],
                "starttime": basic_info[3],
                "endtime": basic_info[4],
                "bldg": basic_info[5],
                "roomnum": basic_info[6],
                "area": basic_info[7],
                "title": basic_info[8],
                "descrip": basic_info[9],
                "prereqs": basic_info[10],
                "deptcoursenums": [{"dept": d, "coursenum": n} for d, n in crosslistings],
                "profnames": [p[0] for p in professors]
            }
            return [True, response]
    except DatabaseError as db_err:
        sys.stderr.write("regserverprelim.py: " + str(db_err) + "\n")
        return [False, "A server error occured. Please contact the system administrator"]
   
    
def handle_client(sock):
    flo_read = sock.makefile(mode='r', encoding='utf-8')
    json_line = flo_read.readline()
    request = json.loads(json_line)
    res = None

    if request[0] == "get_details":
        if len(request) < 2:
            response = {"error": "Missing classid in get_details request"}
        else:
            classid = request[1]
            res = handle_get_details(request[1])
            
    json_str = json.dumps(res)
    flo = sock.makefile(mode='w', encoding='utf-8')
    flo.write(json_str + '\n')
    flo.flush()
    print('Wrote to client')


def main():
    args = parse_args()

    if len(sys.argv) != 2:
        print('Usage: python %s port' % sys.argv[0])
        sys.exit(1)
    try:
        port = int(sys.argv[1])
        server_sock = socket.socket()
        print('Opened server socket')
        if os.name != 'nt':
            server_sock.setsockopt(
                socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_sock.bind(('', port))
        server_sock.listen()
        while True:
            try:
                sock, _ = server_sock.accept()
                with sock:
                    print('Accepted connection')
                    handle_client(sock)
            except Exception as ex:
                print(ex, file=sys.stderr)
    except Exception as ex:
        print(ex, file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
