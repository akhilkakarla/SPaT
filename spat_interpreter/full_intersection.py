import time
import tkinter as tk

# --- Constants (for easy modification) ---
CANVAS_SIZE = 800
TRAFFIC_LIGHT_WIDTH = 125
TRAFFIC_LIGHT_HEIGHT = 50

def update_traffic_light(root, canvas, traffic_light_15_red, traffic_light_15_yellow, traffic_light_15_green, traffic_light_2_red, traffic_light_2_yellow, traffic_light_2_green):
	curr_phase = 0
	while(True):
		curr_phase = (curr_phase + 1) % 3

		if(curr_phase == 0):
			canvas.itemconfigure(traffic_light_15_red, fill="red")
			canvas.itemconfigure(traffic_light_15_yellow, fill="grey")
			canvas.itemconfigure(traffic_light_15_green, fill="grey")
		elif(curr_phase == 1):
			canvas.itemconfigure(traffic_light_15_red, fill="grey")
			canvas.itemconfigure(traffic_light_15_yellow, fill="yellow")
			canvas.itemconfigure(traffic_light_15_green, fill="grey")
		else:
			canvas.itemconfigure(traffic_light_15_red, fill="grey")
			canvas.itemconfigure(traffic_light_15_yellow, fill="grey")
			canvas.itemconfigure(traffic_light_15_green, fill="green")

		if(curr_phase == 0):
			canvas.itemconfigure(traffic_light_2_red, fill="grey")
			canvas.itemconfigure(traffic_light_2_yellow, fill="yellow")
			canvas.itemconfigure(traffic_light_2_green, fill="grey")
		elif(curr_phase == 1):
			canvas.itemconfigure(traffic_light_2_red, fill="grey")
			canvas.itemconfigure(traffic_light_2_yellow, fill="grey")
			canvas.itemconfigure(traffic_light_2_green, fill="green")
		else:
			canvas.itemconfigure(traffic_light_2_red, fill="red")
			canvas.itemconfigure(traffic_light_2_yellow, fill="grey")
			canvas.itemconfigure(traffic_light_2_green, fill="grey")

		root.update()
		time.sleep(1)


def main():

	''' --- Main Window Setup --- '''
	# Create the main application window
	root = tk.Tk()
	root.title("Centered Side Rectangles")

	# Set a minimum size for the window for better layout
	root.minsize(CANVAS_SIZE, CANVAS_SIZE)


	''' --- Canvas Creation --- '''
	# Create a Canvas widget, which is used for drawing shapes.
	canvas = tk.Canvas(root, width=CANVAS_SIZE, height=CANVAS_SIZE, bg='#000000', highlightthickness=1, highlightbackground="black")
	
	# The pack() method makes the widget fill the available space.
	canvas.pack()


	''' --- Drawing the Rectangles --- '''
	# The logic for each square is to center it along one axis and
	# place it near the edge on the other axis using the MARGIN.

	''' TOP: '''

	# It is centered horizontally and placed near the top edge.
	# create_traffic_light_horizontal(canvas, CANVAS_SIZE, TRAFFIC_LIGHT_WIDTH, 0, TRAFFIC_LIGHT_HEIGHT)
	canvas.create_rectangle(1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), 0, 1*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), TRAFFIC_LIGHT_HEIGHT, fill="#202020", outline="black")
	canvas.create_rectangle(2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), 0, 2*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), TRAFFIC_LIGHT_HEIGHT, fill="#202020", outline="black")
	canvas.create_rectangle(3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), 0, 3*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), TRAFFIC_LIGHT_HEIGHT, fill="#202020", outline="black")
	canvas.create_rectangle(4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), 0, 4*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), TRAFFIC_LIGHT_HEIGHT, fill="#202020", outline="black")

	bulb_radius = min(TRAFFIC_LIGHT_WIDTH, TRAFFIC_LIGHT_HEIGHT) / 3
	bulb_y = TRAFFIC_LIGHT_HEIGHT - TRAFFIC_LIGHT_HEIGHT / 2

	# light bulbs for traffic light 15
	bulb_x_delta = TRAFFIC_LIGHT_WIDTH / 6
	bulb_x = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_x_delta
	traffic_light_15_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_x = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_x_delta
	traffic_light_15_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_x = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_x_delta
	traffic_light_15_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 6
	bulb_x_delta = TRAFFIC_LIGHT_WIDTH / 6
	bulb_x = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_x_delta
	traffic_light_6_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_x = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_x_delta
	traffic_light_6_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_x = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_x_delta
	traffic_light_6_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 9
	bulb_x_delta = TRAFFIC_LIGHT_WIDTH / 6
	bulb_x = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_x_delta
	traffic_light_9_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_x = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_x_delta
	traffic_light_9_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_x = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_x_delta
	traffic_light_9_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)
	
	# light bulbs for traffic light 1
	bulb_x_delta = TRAFFIC_LIGHT_WIDTH / 6
	bulb_x = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_x_delta
	traffic_light_1_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_x = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_x_delta
	traffic_light_1_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_x = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_x_delta
	traffic_light_1_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	''' BOTTOM '''

	# It is centered horizontally and placed near the bottom edge.
	# create_traffic_light_horizontal(canvas, CANVAS_SIZE, TRAFFIC_LIGHT_WIDTH, CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, CANVAS_SIZE)
	canvas.create_rectangle(1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, 1*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE, fill="#202020", outline="black")
	canvas.create_rectangle(2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, 2*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE, fill="#202020", outline="black")
	canvas.create_rectangle(3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, 3*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE, fill="#202020", outline="black")
	canvas.create_rectangle(4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, 4*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE, fill="#202020", outline="black")

	bulb_y = CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT / 2

	# light bulbs for traffic light 5
	bulb_x_delta = TRAFFIC_LIGHT_WIDTH / 6
	bulb_x = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_x_delta
	traffic_light_5_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_x = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_x_delta
	traffic_light_5_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_x = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_x_delta
	traffic_light_5_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 11
	bulb_x_delta = TRAFFIC_LIGHT_WIDTH / 6
	bulb_x = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_x_delta
	traffic_light_11_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_x = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_x_delta
	traffic_light_11_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_x = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_x_delta
	traffic_light_11_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 2
	bulb_x_delta = TRAFFIC_LIGHT_WIDTH / 6
	bulb_x = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_x_delta
	traffic_light_2_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_x = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_x_delta
	traffic_light_2_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_x = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_x_delta
	traffic_light_2_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)
	
	# light bulbs for traffic light 13
	bulb_x_delta = TRAFFIC_LIGHT_WIDTH / 6
	bulb_x = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_x_delta
	traffic_light_13_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_x = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_x_delta
	traffic_light_13_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_x = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_x_delta
	traffic_light_13_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	''' LEFT: '''

	# # It is centered vertically and placed near the left edge.
	# create_traffic_light_vertical(canvas, CANVAS_SIZE, TRAFFIC_LIGHT_WIDTH, 0, TRAFFIC_LIGHT_HEIGHT)
	canvas.create_rectangle(0, 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), TRAFFIC_LIGHT_HEIGHT, 1*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), fill="#202020", outline="black")
	canvas.create_rectangle(0, 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), TRAFFIC_LIGHT_HEIGHT, 2*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), fill="#202020", outline="black")
	canvas.create_rectangle(0, 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), TRAFFIC_LIGHT_HEIGHT, 3*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), fill="#202020", outline="black")
	canvas.create_rectangle(0, 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), TRAFFIC_LIGHT_HEIGHT, 4*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), fill="#202020", outline="black")

	bulb_x = TRAFFIC_LIGHT_HEIGHT - abs(0 - TRAFFIC_LIGHT_HEIGHT) / 2
	bulb_y_delta = TRAFFIC_LIGHT_WIDTH / 6

	# light bulbs for traffic light 7
	bulb_y = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_y_delta
	traffic_light_7_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_y = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_y_delta
	traffic_light_7_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_y = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_y_delta
	traffic_light_7_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 12
	bulb_y = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_y_delta
	traffic_light_12_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_y = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_y_delta
	traffic_light_12_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_y = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_y_delta
	traffic_light_12_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 4
	bulb_y = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_y_delta
	traffic_light_4_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_y = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_y_delta
	traffic_light_4_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_y = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_y_delta
	traffic_light_4_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 14
	bulb_y = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_y_delta
	traffic_light_14_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_y = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_y_delta
	traffic_light_14_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_y = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_y_delta
	traffic_light_14_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	''' RIGHT: '''

	# # It is centered vertically and placed near the right edge.
	# create_traffic_light_vertical(canvas, CANVAS_SIZE, TRAFFIC_LIGHT_WIDTH, CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, CANVAS_SIZE)
	canvas.create_rectangle(CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE, 1*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), fill="#202020", outline="black")
	canvas.create_rectangle(CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE, 2*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), fill="#202020", outline="black")
	canvas.create_rectangle(CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE, 3*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), fill="#202020", outline="black")
	canvas.create_rectangle(CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT, 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2), CANVAS_SIZE, 4*(CANVAS_SIZE/5) + (TRAFFIC_LIGHT_WIDTH/2), fill="#202020", outline="black")

	bulb_x = CANVAS_SIZE - TRAFFIC_LIGHT_HEIGHT / 2
	bulb_y_delta = TRAFFIC_LIGHT_WIDTH / 6

	# light bulbs for traffic light 16
	bulb_y = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_y_delta
	traffic_light_16_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_y = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_y_delta
	traffic_light_16_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_y = 1*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_y_delta
	traffic_light_16_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 8
	bulb_y = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_y_delta
	traffic_light_8_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_y = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_y_delta
	traffic_light_8_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_y = 2*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_y_delta
	traffic_light_8_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 10
	bulb_y = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_y_delta
	traffic_light_10_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_y = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_y_delta
	traffic_light_10_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_y = 3*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_y_delta
	traffic_light_10_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	# light bulbs for traffic light 3
	bulb_y = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 1*bulb_y_delta
	traffic_light_3_red = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FF4136"
	)
	bulb_y = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 3*bulb_y_delta
	traffic_light_3_yellow = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#FFDC00"
	)
	bulb_y = 4*(CANVAS_SIZE/5) - (TRAFFIC_LIGHT_WIDTH/2) + 5*bulb_y_delta
	traffic_light_3_green = canvas.create_oval(
		bulb_x - bulb_radius, bulb_y - bulb_radius,
		bulb_x + bulb_radius, bulb_y + bulb_radius,
		fill="#2ECC40"
	)

	update_traffic_light(root, canvas, traffic_light_15_red, traffic_light_15_yellow, traffic_light_15_green,
	traffic_light_2_red, traffic_light_2_yellow, traffic_light_2_green)

	''' --- Start the GUI Event Loop --- '''
	# The mainloop() method keeps the window open until you close it.
	root.mainloop()

if __name__ == "__main__":
	main()