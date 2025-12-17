import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Construct the PostgresDB
DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_SCHEMA = os.getenv("DB_SCHEMA")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# DB_USERNAME=postgres
# DB_PASSWORD=Rhinonserver
# DB_SCHEMA=public
# DB_NAME=postgres
# DB_HOST=rhinonserver.cxy04gkg4y23.ap-south-1.rds.amazonaws.com
# DB_PORT=5432

# Database connection parameters
DB_CONFIG = {
    "dbname": DB_NAME,
    "user": DB_USERNAME,
    "password": DB_PASSWORD,
    "host": DB_HOST,
    "port": DB_PORT,
}

def postgres_connection():
    """
    Provides a reusable connection to the PostgreSQL database.

    :return: A connection object to the PostgreSQL database.
    """
    try:
        # Establish the connection
        connection = psycopg2.connect(**DB_CONFIG)
        return connection
    except psycopg2.OperationalError as e:
        print("Operational error: Unable to connect to the database.")
        print(e)
    except psycopg2.Error as e:
        print("Database error occurred:")
        print(e)
    except Exception as e:
        print("An unexpected error occurred:")
        print(e)

def run_query(connection, query, params):
    """
    Executes a synchronous database query.
    
    :param connection: The psycopg2 connection object.
    :param query: SQL query to execute.
    :param params: Parameters to pass to the query.
    :return: Query result.
    """
    with connection.cursor() as cursor:
        cursor.execute(query, params)
        return cursor.fetchall()

def run_write_query(connection, query, params=None):
    """
    Executes a write query (INSERT/UPDATE/DELETE).
    Automatically commits the transaction.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            connection.commit()
            return True
    except Exception as e:
        connection.rollback()
        print(f"Database write error: {e}")
        return False

# # Example usage in the same file (if needed)
# if __name__ == "__main__":
#     try:
#         connection = postgres_connection()
#         if connection:
#             with connection.cursor() as cursor:
#                 cursor.execute("SELECT version();")
#                 db_version = cursor.fetchone()
#                 print("Connection successful. PostgreSQL version:", db_version)
#             connection.close()
#         else:
#             print("Failed to create a database connection.")
#     except Exception as e:
#         print("Error in example usage:", e)
