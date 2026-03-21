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
   
payload = "00136E00382E4EEE997973CB8FA69DFB800020400006F09023082C00410D0035C076C00408C8001E00C80160480000F001821A0014003E801010D001CC044C430086000E60080200A08C800160110006043400D301FF00D02180069801C10D000900284010086800DE026E01C0430006F0"
decoded_pcap = decoder(payload)
print(decoded_pcap)
