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
            
sample_pcap  = "00134a4593d100801b3b5200001f207001046401310131001021a00e740fdc00c10d005320532008086803020343005043401ce812d803023200988098801c10d0053205320100868030203430"
decoded_pcap = decoder(sample_pcap)
print(decoded_pcap)
            
'''
sample_pcaps = ["00134a4593d100801b3b5200001f207001046401310131001021a00e740fdc00c10d005320532008086803020343005043401ce812d803023200988098801c10d0053205320100868030203430", 
              	 "00134a4593d100800e8562000022107001043402f48330801023201380138000c10d00a2e0a2e0080868058005ad0050434023b823b803023201100110001c10d00a2e0a2e01008680580058f0", 
                 "00134a4593d100801b3b62000025507001046401310131001021a00e740fdc00c10d005320532008086803020343005043401ce812e003023200988098801c10d0053205320100868030203430",
                 "00134a4593d100800e8572000028507001043402f48330801023201380138000c10d00a2e0a2e0080868058005ad0050434023b823b803023201100110001c10d00a2e0a2e01008680580058f0",
                 "00134a4593d100801b3b7200002b907001046401310131001021a00e740fdc00c10d005320532008086803020343005043401ce812e803023200988098801c10d0053205320100868030203430"
                ]




for pcap in sample_pcaps:
    try:
        decoded_pcap = decoder(pcap)
        print(decoded_pcap)
    except Exception as e:
        print("ERROR:", e)
    
'''
