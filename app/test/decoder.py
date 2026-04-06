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

'''
payload = "00134a4593d100800e8562000022107001043402f48330801023201380138000c10d00a2e0a2e0080868058005ad0050434023b823b803023201100110001c10d00a2e0a2e01008680580058f0"
decoded_pcap = decoder(payload)
print(decoded_pcap)
'''
