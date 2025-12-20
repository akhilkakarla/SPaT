from decoder import decoder
from CAVmessages import J2735_decode
import psycopg2

text = open('/Users/akhilkakarla/Desktop/SPaT_App_Backend/SPaT_copy/data/burnet_2025_09_11_14_01_01_cv2x0_rx.txt', 'r')

text_string = text.read()

payloads = []

for line in text_string.splitlines():
    # find the first occurrence of the SPaT payload marker and cut everything before it
    index = line.find('0013')
    if index != -1:
        payloads.append(line[index:].strip())

xmls = []

for payload in payloads:
    try:
        decoded_pcap = decoder(payload)
        xmls.append(str(decoded_pcap))
    except Exception as e:
        print(f"Decoding payload failed: {e}")

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

    cur.close()
    conn.close()

except Exception as e:
    print("Error:", e)

text.close()
