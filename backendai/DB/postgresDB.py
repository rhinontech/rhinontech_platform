import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Construct the PostgresDB - Use POSTGRES_* variables first, fallback to DB_*
DB_USERNAME = os.getenv("POSTGRES_USER") or os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD") or os.getenv("DB_PASSWORD")
DB_SCHEMA = os.getenv("DB_SCHEMA", "public")
DB_NAME = os.getenv("POSTGRES_DB") or os.getenv("DB_NAME")
DB_HOST = os.getenv("POSTGRES_HOST") or os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT") or os.getenv("DB_PORT", "5432")

# CRM DB Config (may be same or different)
CRM_DB_SCHEMA = os.getenv("CRM_DB_SCHEMA", "public")
CRM_DB_NAME = os.getenv("CRM_DB_NAME") or DB_NAME
CRM_DB_USER = os.getenv("CRM_DB_USER") or DB_USERNAME
CRM_DB_PASS = os.getenv("CRM_DB_PASSWORD") or DB_PASSWORD
CRM_DB_HOST = os.getenv("CRM_DB_HOST") or DB_HOST
CRM_DB_PORT = os.getenv("CRM_DB_PORT") or DB_PORT

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

# Debug logging
print(f"PostgreSQL Config: host={DB_HOST}, port={DB_PORT}, dbname={DB_NAME}, user={DB_USERNAME}")

from psycopg2 import pool

# Global Connection Pool
pg_pool = None

def init_db_pool():
    global pg_pool
    try:
        # Use primary config, but if CRM schema is different, we might need to handle it.
        # Assuming for now everything is in same DB but possibly different schema or just publicly available if configured.
        # But based on user feedback "same database", likely just same DB.
        # If 'pipelines' table is missing, maybe it's in a specific schema that needs to be in search path.
        
        # Let's add options to set search_path if CRM_DB_SCHEMA is set and not public
        db_args = DB_CONFIG.copy()
        if CRM_DB_SCHEMA and CRM_DB_SCHEMA != "public":
             db_args["options"] = f"-c search_path={CRM_DB_SCHEMA},public"

        pg_pool = pool.SimpleConnectionPool(1, 20, **db_args)
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
    
    # Check again after init attempt
    if not pg_pool:
        print("WARNING: PostgreSQL pool not initialized. Skipping connection.")
        return None
    
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

def get_pre_chat_form(chatbot_id, conn=None):
    """
    Fetches the pre_chat_form JSON for a given chatbot.
    Returns a list of form fields or empty list.
    """
    if conn:
        query = "SELECT pre_chat_form FROM forms WHERE chatbot_id = %s;"
        result = run_query(conn, query, (chatbot_id,))
        if result and result[0][0]:
            return result[0][0] # Returns JSON list
        return []

    with get_db_connection() as new_conn:
        return get_pre_chat_form(chatbot_id, new_conn)

def get_customer_by_email(chatbot_id: str, email: str, conn=None):
    """
    Looks up a customer by email for a given chatbot's organization.
    Returns: dict with {name, phone, email} or None if not found
    """
    # 1. Get Org ID from Chatbot DB
    org_id = None
    
    # helper to run query on specific connection
    def query_db(connection, q, p):
        with connection.cursor() as cur:
            cur.execute(q, p)
            return cur.fetchall()

    if conn:
        try:
            org_query = "SELECT organization_id FROM chatbots WHERE chatbot_id = %s"
            org_result = query_db(conn, org_query, (chatbot_id,))
            if org_result and org_result[0]:
                org_id = org_result[0][0]
        except Exception as e:
            print(f"Error finding org in chatbot db: {e}")
            return None
    else:
        with get_db_connection() as cb_conn:
            return get_customer_by_email(chatbot_id, email, cb_conn)
            
    if not org_id:
        return None

    # 2. Lookup customer in Chatbot DB (Default)
    # The 'customers' table is in the same DB as chatbots
    try:
        customer_query = """
            SELECT email, custom_data 
            FROM customers 
            WHERE organization_id = %s AND email = %s
        """
        if conn:
             # Reuse existing connection if provided (and safe) or use pool
             customer_result = query_db(conn, customer_query, (org_id, email))
        else:
             with get_db_connection() as cb_conn:
                 customer_result = run_query(cb_conn, customer_query, (org_id, email))
        
        if customer_result and customer_result[0]:
            email_val, custom_data = customer_result[0]
            if not custom_data:
                custom_data = {}
            return {
                "email": email_val,
                "name": custom_data.get("name", ""),
                "phone": custom_data.get("phone", "")
            }
        
        return None
    except Exception as e:
        print(f"Error reading from Customers DB: {e}")
        return None


def get_crm_db_connection():
    """
    Establishes a connection to the CRM database.
    This is separate from the Chatbot DB pool.
    """
    try:
        conn = psycopg2.connect(
            dbname=CRM_DB_NAME,
            user=CRM_DB_USER,
            password=CRM_DB_PASS,
            host=CRM_DB_HOST,
            port=CRM_DB_PORT
        )
        return conn
    except Exception as e:
        print(f"Error connecting to CRM DB: {e}")
        return None

def move_customer_to_pipeline(chatbot_id: str, email: str, conn=None):
    """
    Moves a customer to the 'default_customers' pipeline for the organization.
    Adds them to the first stage.
    """
    # 1. Get Org ID from Chatbot DB (conn provided or new)
    org_id = None
    
    # helper to run query on specific connection
    def query_db(connection, q, p):
        with connection.cursor() as cur:
            cur.execute(q, p)
            return cur.fetchall()

    if conn:
        try:
            org_query = "SELECT organization_id FROM chatbots WHERE chatbot_id = %s"
            org_result = query_db(conn, org_query, (chatbot_id,))
            if org_result and org_result[0]:
                org_id = org_result[0][0]
        except Exception as e:
            print(f"Error finding org in chatbot db: {e}")
            return False
    else:
        # Create temp connection for chatbot DB
        with get_db_connection() as cb_conn:
            return move_customer_to_pipeline(chatbot_id, email, cb_conn)
            
    if not org_id:
        print(f"Organization not found for chatbot {chatbot_id}")
        return False

    
    # 2. Get Customer ID from Chatbot DB (Same as Org)
    # Reusing the 'conn' logic from step 1
    try:
        cust_query = "SELECT id FROM customers WHERE organization_id = %s AND email = %s"
        if conn:
            cust_result = query_db(conn, cust_query, (org_id, email))
        else:
             with get_db_connection() as cb_conn:
                 cust_result = run_query(cb_conn, cust_query, (org_id, email))

        if not cust_result or not cust_result[0]:
            print(f"Customer {email} not found in Chatbot DB for org {org_id}")
            return False 
        customer_id = cust_result[0][0]
    except Exception as e:
        print(f"Error finding customer: {e}")
        return False
        
    # 3. Connect to CRM DB for Pipeline operations ONLY
    crm_conn = get_crm_db_connection()
    if not crm_conn:
        print("Failed to connect to CRM DB")
        return False

    try:
        # 3a. Get Pipeline form CRM DB
        pipe_query = """
            SELECT id, stages 
            FROM pipelines 
            WHERE organization_id = %s AND pipeline_manage_type = 'default_customers'
            ORDER BY created_at ASC 
            LIMIT 1
        """
        pipe_result = query_db(crm_conn, pipe_query, (org_id,))
        
        if not pipe_result or not pipe_result[0]:
            print("Default pipeline not found in CRM DB")
            return False 
        
        pipeline_id = pipe_result[0][0]
        stages = pipe_result[0][1] # JSON list
        
        if not stages:
            return False

        # 4. Add to First Stage
        first_stage = stages[0]
        if "entities" not in first_stage:
            first_stage["entities"] = []
            
        # Check if already there
        exists = False
        for entity in first_stage["entities"]:
            if entity.get("entity_type") == "default_customers" and entity.get("entity_id") == customer_id:
                exists = True
                break
        
        if not exists:
            first_stage["entities"].append({
                "entity_type": "default_customers",
                "entity_id": customer_id,
                "sort": len(first_stage["entities"])
            })
            
            # Update DB
            import json
            update_q = "UPDATE pipelines SET stages = %s::jsonb WHERE id = %s"
            
            # Write to CRM DB
            with crm_conn.cursor() as cur:
                cur.execute(update_q, (json.dumps(stages), pipeline_id))
                crm_conn.commit()
            return True
            
        return True # Already there

    except Exception as e:
        print(f"Error in CRM DB operations: {e}")
        if crm_conn: crm_conn.rollback()
        return False
    finally:
        if crm_conn: crm_conn.close()

def save_customer(chatbot_id: str, email: str, custom_data: dict, conn=None):
    """
    Saves or updates a customer in the Chatbot DB.
    """
    # 1. Get Org ID from Chatbot DB
    org_id = None
    
    # helper to run query on specific connection
    def query_db(connection, q, p):
        with connection.cursor() as cur:
            cur.execute(q, p)
            return cur.fetchall()

    target_conn = conn
    should_close = False
    
    if not target_conn:
        target_conn = postgres_connection() # Get raw connection from pool
        should_close = True
        
    try:
        if not target_conn:
             return False

        org_query = "SELECT organization_id FROM chatbots WHERE chatbot_id = %s"
        org_result = query_db(target_conn, org_query, (chatbot_id,))
        if org_result and org_result[0]:
            org_id = org_result[0][0]
            
        if not org_id:
            print(f"Organization not found for chatbot {chatbot_id}")
            return False

        # Check if customer already exists
        check_query = "SELECT id, custom_data FROM customers WHERE organization_id = %s AND email = %s"
        existing = query_db(target_conn, check_query, (org_id, email))
        
        # Write to Chatbot DB
        import json
        with target_conn.cursor() as cur:
            if existing and existing[0]:
                # Merge existing custom_data
                existing_data = existing[0][1]
                if not existing_data:
                    existing_data = {}
                elif isinstance(existing_data, str):
                    try:
                        existing_data = json.loads(existing_data)
                    except:
                        existing_data = {}
                
                # Update with new data
                existing_data.update(custom_data)
                
                # Update existing customer
                update_query = """
                    UPDATE customers 
                    SET custom_data = %s, updated_at = NOW()
                    WHERE organization_id = %s AND email = %s
                """
                cur.execute(update_query, (json.dumps(existing_data), org_id, email))
                print(f"✅ Customer updated: {email}")
            else:
                # Insert new customer
                insert_query = """
                    INSERT INTO customers (organization_id, email, custom_data, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                """
                cur.execute(insert_query, (org_id, email, json.dumps(custom_data)))
                print(f"✅ Customer created: {email}")
            
            target_conn.commit()
        return True
    
    except Exception as db_error:
        print(f"❌ Customer save error: {db_error}")
        if target_conn: target_conn.rollback()
        return False
    finally:
        if should_close and target_conn:
             release_connection(target_conn)

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

def get_conversation_metadata(conversation_id: str, conn=None):
    """
    Fetches metadata (user_email, user_id) for a conversation.
    """
    query = "SELECT user_email, user_id, chatbot_id FROM bot_conversations WHERE conversation_id = %s"
    
    if conn:
        with conn.cursor() as cur:
            cur.execute(query, (conversation_id,))
            res = cur.fetchone()
    else:
        with get_db_connection() as c_conn:
            with c_conn.cursor() as cur:
                cur.execute(query, (conversation_id,))
                res = cur.fetchone()
                
    if res:
        return {"user_email": res[0], "user_id": res[1], "chatbot_id": res[2]}
    return None

def update_conversation_email(conversation_id: str, email: str, conn=None):
    """
    Updates the email associated with a conversation.
    """
    query = "UPDATE bot_conversations SET user_email = %s, updated_at = NOW() WHERE conversation_id = %s"
    
    if conn:
        with conn.cursor() as cur:
            cur.execute(query, (email, conversation_id))
        conn.commit()
    else:
        with get_db_connection() as c_conn:
            with c_conn.cursor() as cur:
                cur.execute(query, (email, conversation_id))
            c_conn.commit()
    return True

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

def save_bot_message(conversation_id: str, chatbot_id: str, role: str, content: str, user_id: str = None, user_email: str = None):
    """
    Saves a chat message to bot_conversations table.
    Args:
        conversation_id: Unique conversation identifier
        chatbot_id: Chatbot identifier
        role: 'user' or 'assistant'
        content: Message content
        user_id: Optional user identifier
        user_email: Optional user email
    """
    try:
        with get_db_connection() as conn:
            query = """
                INSERT INTO bot_conversations (conversation_id, chatbot_id, user_id, user_email, role, content)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            run_write_query(conn, query, (conversation_id, chatbot_id, user_id, user_email, role, content))
            return True
    except Exception as e:
        print(f"Save Message Error: {e}")
        return False

def get_conversation_history(conversation_id: str, limit: int = 50):
    """
    Retrieves conversation history for a given conversation_id.
    Returns: [{'role': str, 'content': str, 'created_at': str}]
    Args:
        conversation_id: Unique conversation identifier
        limit: Maximum number of messages to retrieve (default 50)
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT role, content, created_at
                    FROM bot_conversations
                    WHERE conversation_id = %s
                    ORDER BY created_at ASC
                    LIMIT %s;
                    """,
                    (conversation_id, limit)
                )
                results = cur.fetchall()
                return [
                    {
                        "role": r[0],
                        "content": r[1],
                        "created_at": r[2].isoformat() if r[2] else None
                    }
                    for r in results
                ]
    except Exception as e:
        print(f"Get History Error: {e}")
        return []

def check_db_health():
    """
    Checks if PostgreSQL connection is healthy.
    Returns: dict with status and details
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                result = cur.fetchone()
                if result and result[0] == 1:
                    return {
                        "status": "healthy",
                        "database": DB_NAME,
                        "host": DB_HOST
                    }
        return {"status": "unhealthy", "error": "No response from database"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Run init on module load
try:
    init_vector_db()
except:
    pass
