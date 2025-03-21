from flask import Flask, render_template, request, redirect, url_for
import database
import argparse

app = Flask(__name__) # Initializing the Flask application


@app.route('/')
def index():
    """
    Handles the index route ('/') for the application. This route is used to
    display the class search page, where users can filter courses by department,
    number, area, and title.

    Retrieves search paramaters from the query string and queries the database for
    class overviews matching the criteria. If an error occurs while fetching data,
    an error page is displayed.

    Returns:
         The rendered HTML page showing seach filters and class results.
    """

    # Retrieving search parameters from query string
    dept = request.args.get('dept', '')
    num = request.args.get('num', '')
    area = request.args.get('area', '')
    title = request.args.get('title', '')

    try:
        # Query the database for class overviews based on the filters
        classes = database.get_class_overviews(dept, num, area, title)
    except database.DatabaseError:
        return render_template('error.html',
                               message="A server error occurred. Please contact the system administrator.")

    # Rendering and returning the main search page with the results
    return render_template('index.html', dept=dept, num=num, area=area, title=title, classes=classes)


@app.route('/class/<int:classid>')
def class_details(classid):
    """
    Handles the route for displaying detailed information about a specific class.
    The route uses a class ID from the URL to fetch detailed data for that class.

    Queries the database for the class details (basic information, crosslistings, and professors).
    If the class does not exist or an error occurs, an error page is displayed.

    Args:
        classid (int): The unique identifier for the class.

    Returns:
         The rendered HTML page displaying detailed class information, or an error page if the class doesn't exist or
         a database error occurs.
    """
    try:
        # Retrieving class details from the database
        details = database.get_class_details(classid)
        if not details:
            return render_template('error.html', message=f"No class with classid {classid} exists.")
    except database.DatabaseError:
        return render_template('error.html',
                               message="A server error occurred. Please contact the system administrator.")

    # Unpacking the details into separate variables
    basic_info, crosslistings, professors = details

    # Rendering and returning the details page for the specific class
    return render_template('details.html', basic_info=basic_info, crosslistings=crosslistings, professors=professors)


if __name__ == '__main__':
    """
    Main entry point for the Flask application. Parses command-line arguments
    to determine the port to run the server on, then starts the Flask application on
    the specified port.
    """

    parser = argparse.ArgumentParser(description='The registrar application')
    parser.add_argument('port', type=int, help='the port at which the server should listen')
    args = parser.parse_args()

    app.run(host='0.0.0.0', port=args.port, debug=True)
