import psycopg2

try:
    conn = psycopg2.connect(
        dbname="spat_db",
        user="postgres",
        password="1804",
        host="localhost",
        port="5432"
    )

    print("Connected to database successfully!")

    cur = conn.cursor()

    # Example query
    cur.execute("SELECT NOW();")
    print(cur.fetchone())

    cur.close()
    conn.close()

except Exception as e:
    print("Error:", e)


