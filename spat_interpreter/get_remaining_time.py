from datetime import datetime

def get_rem_time():

    # Get current time obj
    curr_time = datetime.now()

    # Get the current minute (0-59)
    current_minute = curr_time.minute

    # Get the current seconds (0-59)
    current_second = curr_time.second

    return (current_minute * 600) + (current_second * 10)

print(get_rem_time())