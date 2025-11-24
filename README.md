# SPaT: Interpretation and Visualization
This repository serves as a sandbox for attempting to implement a SPaT visualization mobile app.

## data
Sample C-V2X message data collected from the intersections. Both a .pcap and .txt file are included for convenience. Also, a tool for parsing through .pcap files. **Note**: It contains data from both intersections (you may want to filter out only data from intersection 871 or 464)

## j2735_decoder
A tool for decoding UPER-encoded C-V2X messages (including SPaT).

## spat_interpreter
A workflow for interpreting and visualizing SPaT data into a simple traffic light.