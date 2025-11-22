import dpkt
import binascii

""" Parse .pcap file and store all packets (SPaT or not) into .txt file. """
def extract_pcap_payload(pcap_file, txt_file):

	# Open text file to write packets TO
	with open(txt_file, 'a') as txt_file_ptr:

		# Open pcap file to read packets FROM
		with open(pcap_file, 'rb') as pcap_file_ptr:
			
			# Parse .pcap file
			pcap = dpkt.pcap.Reader(pcap_file_ptr)

			# Iterate through each packet in the .pcap file
			for ts, buf in pcap:
				
				# Convert ethernet packet to ASCII UPER-encoded data
				raw_data = dpkt.ethernet.Ethernet(buf)
				hex_data = binascii.hexlify(raw_data.__bytes__())
				hex_string = hex_data.decode('ascii')

				# Store UPER-encoded data
				txt_file_ptr.write(hex_string+"\n")

# Example usage
PCAP_DATA_FILE = "burnet_2025_09_11_14_01_01_cv2x0_rx.pcap"
TXT_DATA_FILE = "burnet_2025_09_11_14_01_01_cv2x0_rx.txt"
extracted_payloads = extract_pcap_payload(PCAP_DATA_FILE, TXT_DATA_FILE)