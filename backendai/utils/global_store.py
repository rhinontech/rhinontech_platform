# global_store.py

content = None
user_id = None

def set_assistant_content(new_content):
    """Sets the content globally."""
    global content
    content = new_content

def get_assistant_content():
    """Returns the current content."""
    return content

def set_user_id(new_user_id):
    """Sets the user_id globally."""
    global user_id
    user_id = new_user_id

def get_user_id():
    """Returns the current user_id."""
    return user_id
