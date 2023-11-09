import os

# Define the directory and file name
folder_name = 'results'
file_name = 'output.txt'

# Create the directory if it does not exist
if not os.path.exists(folder_name):
    os.makedirs(folder_name)

# Define the full path for the file
file_path = os.path.join(folder_name, file_name)

# Open the file in write mode and write the lines
with open(file_path, 'w') as file:
    file.write("Hello from NEAR!\n")
    file.write("This is your super awesome long running job run off-chain. B-)\n")
