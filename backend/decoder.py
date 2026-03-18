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
            
sample_pcap  = "00137000382E4EEE997973CB8FA69DFB800020400006C2A0455C2C0041210006E006E00408680041004121604300020804010030434008480E8802021A0067C0BF486010C0033E0100401410D000E6027600C08C80041010901A043000CF803821A00424099C02010D0033E07260380860019F"
decoded_pcap = decoder(sample_pcap)
print(decoded_pcap)

