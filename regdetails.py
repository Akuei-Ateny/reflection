#!/usr/bin/env python
"""Registrar application: show details about a class."""

import sys
import argparse
import socket
import json
import textwrap


MAX_LINE_LENGTH = 72

def parse_args():
    """Parse command line arguments.

    Returns:
        argparse.Namespace: Parsed command line arguments
    """
    parser = argparse.ArgumentParser(
        description='Registrar application: show details about a class',
        usage="regdetails.py [-h] host port classid"
        )
    
    parser.add_argument('host', 
                        help='the computer on which the server is running')
    parser.add_argument('port',
                        type= int,
                        help= 'the port at which the server is listening')
    parser.add_argument('classid', 
                        type= int,
                        help='the id of the class whose details should be shown')
    return parser.parse_args()


def format_details(details):
    """Format the class details for display.

    Args:
        details (tuple): Tuple containing class details, crosslistings, and professors

    Returns:
        str or None: The formatted details string, or None if details is empty.
    """
    if not details:
        return None

    # basic_info, crosslistings, professors = details
    # (classid, courseid, days, starttime, endtime, bldg, roomnum,
    #  area, title, descrip, prereqs) = basic_info

    lines = []
    # Build Class Details
    lines.append("-------------")
    lines.append("Class Details")
    lines.append("-------------")
    lines.append(f"Class Id: {details['classid']}")
    lines.append(f"Days: {details['days'] if details['days'] else ''}")
    lines.append(f"Start time: {details['starttime'] if details['starttime'] else ''}")
    lines.append(f"End time: {details['endtime'] if details['endtime'] else ''}")
    lines.append(f"Building: {details['bldg'] if details['bldg'] else ''}")
    lines.append(f"Room: {details['roomnum'] if details['roomnum'] else ''}")
    # Build Course Details
    lines.append("--------------")
    lines.append("Course Details")
    lines.append("--------------")
    lines.append(f"Course Id: {details['courseid']}")
    for item in details.get('deptcoursenums', []):
        dept = item.get('dept', '')
        coursenum = item.get('coursenum', '')
        lines.append(f"Dept and Number: {dept} {coursenum}")
    lines.append(f"Area:{' '+ details['area'] if details['area'] else ''}")
    wrapped_title = textwrap.fill(
        details["title"],
        width=MAX_LINE_LENGTH,
        initial_indent='Title: ',
        subsequent_indent='   '
    )
    lines.append(wrapped_title)

    # Build description
    if details['descrip']:
        wrapped_desc = textwrap.fill(
           details['descrip'],
            width=MAX_LINE_LENGTH,
            initial_indent='Description: ',
            subsequent_indent='   ')
        lines.append(wrapped_desc)

    # Build prerequisites
    if details['prereqs']:
        wrapped_prereqs = textwrap.fill(
            details['prereqs'],
            width=MAX_LINE_LENGTH,
            initial_indent='Prerequisites: ',
            subsequent_indent='   ')
        lines.append(wrapped_prereqs)
    else:
        lines.append("Prerequisites:")

    # Build professor list
    for prof in details.get('profnames', []):
        lines.append(f"Professor: {prof}")

    return "\n".join(lines)

#Main method
def main():
    """Main function to run the program."""

    args = parse_args()

    if len(sys.argv) != 4:
        print('Usage: python %s host port classid' % sys.argv[0])
        sys.exit(1)
    try:
        host = sys.argv[1]
        port = int(sys.argv[2])
        classid = sys.argv[3]

        with socket.socket() as sock:
            sock.connect((host, port))
            data = ["get_details", int(classid)]
            json_str = json.dumps(data)
            flo = sock.makefile(mode='w', encoding='utf-8')
            flo.write(json_str + '\n')
            flo.flush()
            
            flo_read = sock.makefile(mode='r', encoding='utf-8')
            json_line = flo_read.readline()
            course_details = json.loads(json_line)
            
            formatted_details = format_details(course_details[1])
            if not formatted_details:
                print(f"{sys.argv[0]}: no class with classid {args.classid} exists",
                    file=sys.stderr)
                sys.exit(1)
        # Now print the formatted details just once
        print(formatted_details)
        sys.exit(0)

    except Exception as ex:
        print(ex, file=sys.stderr)
        sys.exit(1)



if __name__ == '__main__':
    main()
