from decoder import decoder
from CAVmessages import J2735_decode
import psycopg2

payloads = ["00134a4593d100801b3b5200001f207001046401310131001021a00e740fdc00c10d005320532008086803020343005043401ce812d803023200988098801c10d0053205320100868030203430",
            "00134a4593d100800e8562000022107001043402f48330801023201380138000c10d00a2e0a2e0080868058005ad0050434023b823b803023201100110001c10d00a2e0a2e01008680580058f0", 
            "00134a4593d100801b3b62000025507001046401310131001021a00e740fdc00c10d005320532008086803020343005043401ce812e003023200988098801c10d0053205320100868030203430", 
            "00134a4593d100800e8572000028507001043402f48330801023201380138000c10d00a2e0a2e0080868058005ad0050434023b823b803023201100110001c10d00a2e0a2e01008680580058f0",
            "00134a4593d100801b3b7200002b907001046401310131001021a00e740fdc00c10d005320532008086803020343005043401ce812e803023200988098801c10d0053205320100868030203430"]

xmls = []

for payload in payloads:
    decoded_pcap = decoder(payload)
    xmls.append(str(decoded_pcap))

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
    
    for xml in xmls:
        cur.execute("INSERT INTO spat_messages (message_xml) VALUES (%s);", (xml,))

    conn.commit()
    print("Inserted XML messages into database.")

    cur.close()
    conn.close()

except Exception as e:
    print("Error:", e)



