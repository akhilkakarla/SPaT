from decoder import decoder
from CAVmessages import J2735_decode
import psycopg2
import J2735_201603_combined_mobility
import binascii
from CV2X_Message import CV2X_Message

import tkinter as tk
from tkinter import *
from tkinter import font

import time
import sys

payloads = []

xmls = []

is_valid_pcap = False

def extract_payloads(input_file):
    
	with open(input_file, 'r') as text:
		text_string = text.read()

		for line in text_string.splitlines():
			index = line.find('0013')
			if index != -1:
				payloads.append(line[index:].strip())
				is_valid_pcap = True
			else:
				is_valid_pcap = False
				payloads.append(None)

def decode_payloads(payloads):
	for payload in payloads:
		try:
			decoded_pcap = decoder(payload)
			xmls.append(str(decoded_pcap))
		except Exception as e:
			print(f"Decoding payload failed: {e}")
			break

extract_payloads("/Users/akhilkakarla/Desktop/SPaT_App_Backend/SPaT_copy/data/burnet_2025_09_11_14_01_01_cv2x0_rx.txt")

decode_payloads(payloads)

root = Tk()
root.geometry("800x400")
root.title("On Board Unit (OBU) Received C-V2X Messages")

# Declaration of traffic light variables
offset = 55
countdown_font = font.Font(family="Helvetica", size=20, weight="normal")
intersection_id_font = font.Font(family="Arial", size=20, weight="normal")
canvas = tk.Canvas(root, bg="white", height=400, width=800)
canvas.pack()
back_light = canvas.create_rectangle(0, 0, 215, 400, fill="black")
first_light = canvas.create_oval(offset+3, 40, offset+100, 140, fill="gray")
second_light = canvas.create_oval(offset+3, 150, offset+100, 250, fill="gray")
third_light = canvas.create_oval(offset+3, 260, offset+100, 360, fill="gray")
text_light = canvas.create_text(offset+50, 315, font=countdown_font, text="")
ped_detected_sign = canvas.create_rectangle(offset+161, 100, offset+746, 300, fill="white", outline="")
ped_detected_text = canvas.create_text(offset+161+292, 200, font=(countdown_font, 72), text="")
intersection_id_text = canvas.create_text(offset+161+292, 40, font=(intersection_id_font, 20), text="")

# Calculate the phase's state time remaining
def writeTime(endTime, currentSec, currentDecSec):
	currentTime = currentSec + currentDecSec / 10.0
	countdown = round(endTime - currentTime, 2)
	# print("Time to next state: {:.1f}".format(countdown))
	return countdown

# Define continous light updating loop
def update_traffic_light():

	# Initial SPaT values
	intersectionId = 0
	currentPhase = 0
	currentState = None
	countdown = None
	minEndTime = 0
	cv2x_idx = 0

	# Sample packets of SPaT data
	sample_pcaps = payloads

	while True:
		# Gracefully exit if "x" button is pressed
		root.protocol("WM_DELETE_WINDOW", on_closing)

		# Get the current time (for calculating remaining time)
		utcTime = time.gmtime()
		utcMin = utcTime.tm_min
		utcSec = utcTime.tm_sec
		utcDeci = int((time.time()%1) * 10)
		currentSec = utcMin*60 + utcSec

		# Get the next C-V2X pcap message from sample array
		pcap_data = sample_pcaps[cv2x_idx]
		cv2x_idx = (cv2x_idx + 1) % (len(sample_pcaps))

		if not pcap_data or len(pcap_data) == 0:
			print("ERROR: No C-V2X PCAP received.")
		else:
			# Parse C-V2X pcap message
			cv2x_msg = CV2X_Message(pcap_data)

			# Verify message parsed correctly
			if cv2x_msg is None:
				print("ERROR: C-V2X Message did not parse correctly.")

			# Verify messages is SPaT
			elif cv2x_msg.uper_data[0:4] == '0013':
				try:
					spat_msg_decoded = cv2x_msg.interpret_spat()
				except Exception as e:
					print("ERROR:", e)

				if spat_msg_decoded:
					# Get the intersection ID decoded SPaT message (and display it in traffic light GUI)
					intersectionId = spat_msg_decoded()['value'][1]['intersections'][0]['id']['id']
					canvas.itemconfig(intersection_id_text, text=intersectionId)

					# Optional: Filter by intersection ID (to prevent crossed SPaT streams)
					if intersectionId == 871:
						# Get all states from decoded SPaT message
						instersectionPhaseArray = spat_msg_decoded()['value'][1]['intersections'][0]['states']

						# Iterate through each phase of the decoded SPaT message
						for phase in instersectionPhaseArray:
							# Get the current phase, state, and end time of the phase
							currentPhase = int(phase.get('signalGroup'))
							currentState = str(phase['state-time-speed'][0]['eventState'])
							minEndTime = phase['state-time-speed'][0]['timing']['maxEndTime']

							# print("phase:", currentPhase)
							# print("state:", currentState)
							# print("end time:", type(minEndTime))

							if currentPhase == 7: # additional phases may be included as the same if-statements
								# Calculate the current time until next state
								timeEndSec = minEndTime / 10
								countdown = writeTime(timeEndSec, currentSec, utcDeci)

								# Set the corresponding traffic light
								if currentState == "stop-And-Remain":
									canvas.itemconfig(first_light, fill="red")
									canvas.itemconfig(second_light, fill="gray")
									canvas.itemconfig(third_light, fill="gray")
									canvas.itemconfig(text_light, text=countdown)
									canvas.coords(text_light, offset+50, 95)
								elif currentState == "protected-clearance":
									canvas.itemconfig(first_light, fill="gray")
									canvas.itemconfig(second_light, fill="yellow")
									canvas.itemconfig(third_light, fill="gray")
									canvas.itemconfig(text_light, text=countdown)
									canvas.coords(text_light, offset+50, 205)
								elif currentState == "protected-Movement-Allowed":
									canvas.itemconfig(first_light, fill="gray")
									canvas.itemconfig(second_light, fill="gray")
									canvas.itemconfig(third_light, fill="green")
									canvas.itemconfig(text_light, text=countdown)
									canvas.coords(text_light, offset+50, 315)

				# Reflect changes in traffic light visualization
			root.update()

		# Wait a second before reading next SPaT
		time.sleep(1) # rate for testing, can be eliminated for real-time rate

# Close program when exit button is pressed
def on_closing():
	print("Closing...")
	root.destroy()
	sys.exit(0)

# Continuously run the traffic light loop
update_traffic_light()

# Infinite loop which is required to
# run tkinter program infinitely
# until an interrupt occurs
root.mainloop()



