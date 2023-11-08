# Open a file in write mode. If the file does not exist, it will be created.
with open('output.txt', 'w') as file:
    # Write the strings to the file instead of printing to the terminal
    file.write("Hello from NEAR!\n")
    file.write("This is your super awesome long running job run off-chain. B-)\n")
