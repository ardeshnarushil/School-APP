import psycopg2
try:
    conn = psycopg2.connect(dbname='postgres', user='postgres', password='Rushil@291105', host='localhost')
    conn.autocommit = True
    cur = conn.cursor()
    # Force close connections
    cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'school_db' AND pid != pg_backend_pid();")
    # Drop and recreate
    cur.execute('DROP DATABASE IF EXISTS school_db;')
    cur.execute('CREATE DATABASE school_db;')
    cur.close()
    conn.close()
    print('DB Reset Success')
except Exception as e:
    print(f'Error: {e}')
