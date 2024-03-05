import os
import psycopg2
from datetime import datetime

conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="admin123",
        host="localhost",
        port="5432"
)

cursor = conn.cursor()
create_table_sql = """
CREATE TABLE edf_files (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR,
    file_data BYTEA,
    upload_time TIMESTAMP
);
"""


cursor.execute(create_table_sql)

conn.commit()

cursor.close()
conn.close()
def insert_edf_to_database(edf_file_path, conn):
    try:
        with open(edf_file_path, 'rb') as f:
            edf_data = f.read()
            cursor = conn.cursor()
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute("INSERT INTO edf_files (file_name, file_data, upload_time) VALUES (%s, %s, %s)",
                           (os.path.basename(edf_file_path), edf_data, timestamp))
            conn.commit()
            cursor.close()
            print(f"Inserted {edf_file_path} into the database.")
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)

def main():
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="admin123",
        host="localhost",
        port="5432"
    )


    edf_directory = "edf"

    for filename in os.listdir(edf_directory):
        if filename.endswith(".edf"):
            edf_file_path = os.path.join(edf_directory, filename)
            insert_edf_to_database(edf_file_path, conn)

    conn.close()

if __name__ == "__main__":
    main()
