import sys
from CAVmessages import J2735_decode  

def decoder(payload:str) -> str:
    decode = J2735_decode(payload, False)
    return decode.xml

if __name__ == "__main__":
    if(len(sys.argv) == 2):
        try:
            res = decoder(sys.argv[1])
            print(res)
        except Exception as e:
            print("ERROR:", e)
            pass
    else:
        if(len(sys.argv) == 1):
            print("ERROR: No payload provided.")
        else:
            print("ERROR: More than one payload provided.")

payload = "00134a4593d100801b3b5200001f207001046401310131001021a00e740fdc00c10d005320532008086803020343005043401ce812d803023200988098801c10d0053205320100868030203430"
print(decoder(payload))
