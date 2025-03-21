"""Database module for the registrar application."""

import sqlite3
from contextlib import contextmanager


class DatabaseError(Exception):
    """Custom exception for database errors."""


@contextmanager
def get_connection():
    """Create and return a database connection.

    Returns:
        sqlite3.Connection: Database connection object

    Raises:
        DatabaseError: If database cannot be opened or is corrupted
    """
    connection = None
    try:
        connection = sqlite3.connect('file:reg.sqlite?mode=ro', uri=True)
        yield connection
    except sqlite3.Error as error:
        raise DatabaseError(str(error)) from error
    finally:
        if connection:
            connection.close()


def get_class_overviews(dept=None, num=None, area=None, title=None):
    """Get class overviews based on search criteria.

    Args:
        dept (str, optional): Department filter
        num (str, optional): Course number filter
        area (str, optional): Distribution area filter
        title (str, optional): Course title filter

    Returns:
        list: List of tuples containing class overview data

    Raises:
        DatabaseError: If there's an error querying the database
    """
    query = """
        SELECT DISTINCT cl.classid, cr.dept, cr.coursenum, co.area, co.title
        FROM classes cl
        JOIN courses co ON cl.courseid = co.courseid
        JOIN crosslistings cr ON co.courseid = cr.courseid
        WHERE 1=1
    """
    params = []

    if dept:
        query += " AND LOWER(cr.dept) LIKE ?"
        params.append(f"%{dept.lower()}%")

    if num:
        query += " AND LOWER(cr.coursenum) LIKE ?"
        params.append(f"%{num.lower()}%")

    if area:
        query += " AND LOWER(co.area) LIKE ?"
        params.append(f"%{area.lower()}%")

    if title:
        # Escape underscores and percent signs so they are treated literally in SQL
        escaped_title = title.lower().replace("_", "/_").replace("%", "/%")
        # Use '/' as the escape character in the LIKE clause
        query += " AND LOWER(co.title) LIKE ? ESCAPE '/'"
        params.append(f"%{escaped_title}%")

    query += " ORDER BY cr.dept ASC, cr.coursenum ASC, cl.classid ASC"

    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(query, params)
        return cursor.fetchall()

#Getting class details
def get_class_details(classid):
    """Get detailed information about a specific class.

    Args:
        classid (str): The ID of the class

    Returns:
        tuple: Class details including all related information

    Raises:
        DatabaseError: If there's an error querying the database
    """
    with get_connection() as connection:
        cursor = connection.cursor()
        # Get basic class and course info (First query)
        query1 = """
        SELECT cl.classid, cl.courseid, cl.days, cl.starttime, cl.endtime,
               cl.bldg, cl.roomnum, co.area, co.title, co.descrip, co.prereqs
        FROM classes cl
        JOIN courses co ON cl.courseid = co.courseid
        WHERE cl.classid = ?
        """
        cursor.execute(query1, (classid,))
        basic_info = cursor.fetchone()  # Fetch the first (and should be only) result

        # If no class found with this ID, return None
        if not basic_info:
            return None

        # Get cross-listings (Second query)
        query2 = """
        SELECT dept, coursenum
        FROM crosslistings cr
        WHERE courseid = ?
        ORDER BY dept, coursenum ASC
        """
        cursor.execute(query2, (basic_info[1],))
        crosslistings = cursor.fetchall()  # Fetch all cross-listings (could be multiple)

        # Get professors (Third query)
        query3 = """
        SELECT DISTINCT p.profname
        FROM coursesprofs cp
        JOIN profs p ON cp.profid = p.profid
        WHERE cp.courseid = ?
        ORDER BY p.profname ASC
        """
        cursor.execute(query3, (basic_info[1],))
        professors = cursor.fetchall()  # Fetch all professors (could be multiple)

        # Return tuple containing all three result sets
        return (basic_info, crosslistings, professors)

