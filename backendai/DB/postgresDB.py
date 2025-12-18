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

from psycopg2 import pool

# Global Connection Pool
pg_pool = None

def init_db_pool():
    global pg_pool
    try:
        pg_pool = pool.SimpleConnectionPool(1, 20, **DB_CONFIG)
        if pg_pool:
            print("PostgreSQL Connection Pool created successfully")
    except (Exception, psycopg2.DatabaseError) as error:
        print("Error while connecting to PostgreSQL", error)

def postgres_connection():
    """
    Get a connection from the pool.
    """
    global pg_pool
    if not pg_pool:
        init_db_pool()
    return pg_pool.getconn()

from contextlib import contextmanager

# ... existing pool code ...

def release_connection(conn):
    """
    Release connection back to the pool.
    """
    global pg_pool
    if pg_pool and conn:
        try:
            pg_pool.putconn(conn)
        except Exception as e:
            # If connection is already closed/broken, just ignore
            print(f"Error releasing connection: {e}")

def get_pre_chat_form(chatbot_id):
    """
    Fetches the pre_chat_form JSON for a given chatbot.
    Returns a list of form fields or empty list.
    """
    with get_db_connection() as conn:
        query = "SELECT pre_chat_form FROM forms WHERE chatbot_id = %s;"
        result = run_query(conn, query, (chatbot_id,))
        if result and result[0][0]:
            return result[0][0] # Returns JSON list
        return []

@contextmanager
def get_db_connection():
    """
    Context manager to safely get and return a connection to the pool.
    Usage:
        with get_db_connection() as conn:
            cur = conn.cursor()
            ...
    """
    conn = postgres_connection()
    try:
        yield conn
    finally:
        release_connection(conn)

def close_db_connection(conn):
    """
    Alias for release_connection to replace conn.close() calls safely.
    """
    release_connection(conn)

def run_query(connection, query, params):
    """
    Executes a synchronous database query.
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

def init_vector_db():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                # # Add columns to bot_assistants
                # cur.execute("""
                #     ALTER TABLE bot_assistants 
                #     ADD COLUMN IF NOT EXISTS content TEXT,
                #     ADD COLUMN IF NOT EXISTS embedding VECTOR(1536),
                #     ADD COLUMN IF NOT EXISTS source VARCHAR(255);
                # """)
                # # Index on bot_assistants
                # cur.execute("""
                #     CREATE INDEX IF NOT EXISTS bot_assistants_embedding_idx 
                #     ON bot_assistants 
                #     USING ivfflat (embedding vector_cosine_ops)
                #     WITH (lists = 100);
                # """)
                
                # Create training_chunks table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS training_chunks (
                        id SERIAL PRIMARY KEY,
                        chatbot_id VARCHAR(255) NOT NULL,
                        chunk_index INTEGER NOT NULL,
                        content TEXT NOT NULL,
                        embedding VECTOR(1536),
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    );
                """)
                
                # Index on training_chunks
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS training_chunks_embedding_idx 
                    ON training_chunks 
                    USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 100);
                """)
                
                cur.execute("CREATE INDEX IF NOT EXISTS idx_training_chunks_chatbot_id ON training_chunks(chatbot_id);")

                conn.commit()
                print("Vector DB Initialized (training_chunks updated)")
    except Exception as e:
        print(f"Vector DB Init Error: {e}")

def delete_chunks(chatbot_id: str):
    """
    Deletes all chunks for a specific chatbot.
    """
    try:
        with get_db_connection() as conn:
            # First check if table exists to be safe during migration
            # (Though init_vector_db should run on module load)
            run_write_query(conn, "DELETE FROM training_chunks WHERE chatbot_id = %s;", (chatbot_id,))
    except Exception as e:
        print(f"Delete Chunks Error: {e}")

def insert_chunk_batch(chatbot_id: str, chunks: list):
    """
    Batch inserts chunks.
    chunks: list of dicts [{'index': int, 'content': str, 'embedding': list}]
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                args_list = []
                query = """
                    INSERT INTO training_chunks (chatbot_id, chunk_index, content, embedding)
                    VALUES %s
                """
                # Prepare data for execute_values or manual batch construction
                # psycopg2.extras.execute_values is better but we use raw psycopg2 pool here often.
                # Let's use simple list comprehension and execute_values if we can, or manual.
                from psycopg2.extras import execute_values
                
                tuples = [
                    (chatbot_id, c['index'], c['content'], c['embedding']) 
                    for c in chunks
                ]
                
                execute_values(cur, """
                    INSERT INTO training_chunks (chatbot_id, chunk_index, content, embedding)
                    VALUES %s
                """, tuples)
                
            conn.commit()
    except Exception as e:
        print(f"Batch Insert Error: {e}")

def search_vectors(chatbot_id: str, query_vector: list, limit: int = 3):
    """
    Search using training_chunks table.
    Returns: [{'content': str, 'similarity': float}]
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT content, 1 - (embedding <=> %s::vector) as similarity
                    FROM training_chunks
                    WHERE chatbot_id = %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                    """,
                    (query_vector, chatbot_id, query_vector, limit)
                )
                results = cur.fetchall()
                if not results:
                     # Fallback to bot_assistants for legacy/transition support ??
                     # No, we want a clean cut. But maybe helpful? 
                     # Let's keep it strict as requested.
                     return []
                     
                return [{"content": r[0], "similarity": r[1]} for r in results]
    except Exception as e:
        print(f"Search Error: {e}")
        return []

# Run init on module load
try:
    init_vector_db()
except:
    pass
