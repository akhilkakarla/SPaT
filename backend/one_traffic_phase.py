import time
import tkinter as tk
from tkinter import *
from tkinter import messagebox

# Creating Tk window
root = Tk()
root.geometry("215x400")
root.title("Traffic Light")

# Declaration of traffic light variables
offset = 55
canvas = tk.Canvas(root, bg="black", height=400, width=215)
canvas.pack()
canvas.create_oval(offset+3, 40, offset+100, 140, fill="gray")
canvas.create_oval(offset+3, 150, offset+100, 250, fill="gray")
canvas.create_oval(offset+3, 260, offset+100, 360, fill="gray")

# Define continous light updating loop
def update_traffic_light():

	# TODO: Declare the initial phase signal value
	curr_phase = 0

	while(True):

		# TODO: Add code that gets the phase signal via serial cable
		curr_phase = (curr_phase + 1) % 3

		# Set the corresponding traffic light
		if(curr_phase == 0):
			canvas.create_oval(offset+3, 40, offset+100, 140, fill="green")
			canvas.create_oval(offset+3, 150, offset+100, 250, fill="gray")
			canvas.create_oval(offset+3, 260, offset+100, 360, fill="gray")
		elif(curr_phase == 1):
			canvas.create_oval(offset+3, 40, offset+100, 140, fill="gray")
			canvas.create_oval(offset+3, 150, offset+100, 250, fill="yellow")
			canvas.create_oval(offset+3, 260, offset+100, 360, fill="gray")
		else:
			canvas.create_oval(offset+3, 40, offset+100, 140, fill="gray")
			canvas.create_oval(offset+3, 150, offset+100, 250, fill="gray")
			canvas.create_oval(offset+3, 260, offset+100, 360, fill="red")

		# Update the traffic light every second
		root.update()
		time.sleep(1)

# Continuously run the traffic light loop
update_traffic_light()

# Infinite loop which is required to
# run tkinter program infinitely
# until an interrupt occurs
root.mainloop()
