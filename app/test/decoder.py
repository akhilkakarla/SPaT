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


payload = "00136E00382E4EEE997973CB8FA69DFB800020400008D90093282C00410D002240378004086801A802E8216043000D40040100304340138023C0020232003080628060114000F800A086801BC034C0060434007A00DE00D0218003D001C10D004A408F001008C800C2018A01C043001290"
decoded_pcap = decoder(payload)
print(decoded_pcap)



