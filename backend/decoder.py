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
            
sample_pcap  = "00137000382E4EEE997973CB8FA69DFB800020400006AC2039942C00410D0032A05E60040908002D002D216043000CA804010030434001B801B802021A00334058C86010C0019A010040141210005A005A00C0868019502F301A043000CA803821A000DC00DC02010D0019A02C6038086000CD"
decoded_pcap = decoder(sample_pcap)
print(decoded_pcap)

