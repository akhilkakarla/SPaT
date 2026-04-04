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

payload = "00136E00382E4EEE997973CB8FA69DFB8000204000067A7028A82C00410D003BC07CC00408C8003000F801604800027001821A0020004A801010D0022C04AC430086001160080200A08C8003000C6006043400E001DA00D02180070001C10D000C401F0010086800F8022401C0430007C0"
decoded_pcap = decoder(payload)
print(decoded_pcap)