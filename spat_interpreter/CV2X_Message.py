#!/home/programmedbean/files/nmc_projects/rsu_reserach/tools/pcap_sniff/sniff/bin/python3

import json
from binascii import unhexlify
from CAVmessages import J2735_decode
import J2735_201603_combined_mobility
import time

class CV2X_Message:

	def __init__(self, pcap_data:str):
		self.pcap_data = pcap_data
		self.type, self.uper_data = self._parse(pcap_data)

	def __str__(self):
		if(self.uper_data):
			return self.uper_data
		return ""

	def _parse(self, data):
		"""Parses received data for a J2735 V2X Message and prints the decoded message.
		Args:
			data (str): Received data to parse.
			seq (SEQ): J2735 MessageFrame sequence for decoding.
		"""

		msgIds = ['0012', '0013', '0014', '0020', '001f'] # this can be updated to include other J2735 Message IDs
		msgNames = {'0012':'MAP', '0013':'SPAT', '0014':'BSM', '0020':'PSM', '001f':'TIM'}

		for id in msgIds:

			# look for id matches
			idx = data.find(id)

			# Skip if no ID or not enough data remaining
			if(idx != -1 or idx > (len(data) - 6)):
				buf = data[idx:].strip('\n')
				if(self._isValidMsgSize(buf)):
					return msgNames[id], buf

		# no message was found
		return None, None

	def _isValidMsgSize(self, line):
		"""Checks actual message size against size specified in MessageFrame.
		Args:
			line (str): Full message under test.
		Returns:
			bool: Validity of message size.
		"""
		try:

			tempFrame = line[6:]

			if(len(tempFrame) > 510):
				frameSize = 8
				encodedSize = int(line[5:8], 16) * 2
			else:
				frameSize = 6
				encodedSize = int(line[4:6], 16) * 2

			newFrame = line[frameSize:]

			if(len(newFrame) >= encodedSize):
				return True
			return False
		except:
			return False

	def decode(self) -> str:
		if(self.uper_data is None):
			return None
		try:
			decode = J2735_decode(self.uper_data, False)
			return decode.xml
		except:
			return None
		
	def writePhase(self, phase):
		# fout.writelines(["Phase ", str(phase), ': '])
		print("Phase ", str(phase), ': ')

	def writeState(self, state):
		# fout.writelines([str(state),  "\n"])
		print(str(state),  "\n")

	def writeTime(self, endTime, currentSec, currentDecSec):
		global countdown
		currentTime = currentSec + currentDecSec / 10.0
		countdown = round(endTime - currentTime, 2)
		# fout.writelines(["Time to next state: {:.1f}.format(countdown)])
		print("Time to next state: {:.1f}".format(countdown))

	def interpret_spat(self):
		data = self.uper_data
		if(data is None):
			return None
		elif('0013' in data):
			idx = data.find('0013')
			# extract spat embedded in packet
			if (int('0x'+data[idx+4],16)==8):
				lenstr=int('0x'+data[idx+5:idx+8],16)*2+6 
			else:
				lenstr=int('0x'+data[idx+4:idx+6],16)*2+6
			if(lenstr <= len(data)-idx+1):
				# decode spat messages
				msg = data[idx:idx+lenstr].encode('utf-8')
				decode = J2735_201603_combined_mobility.DSRC.MessageFrame
				decode.from_uper(unhexlify(msg))
				return decode
		else:
			return None

