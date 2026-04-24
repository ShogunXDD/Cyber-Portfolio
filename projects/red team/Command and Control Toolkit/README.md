# Command & Control Toolkit (Python)

## Description

This project consists of a simple yet powerful Command & Control (C2) toolkit written in Python. It allows a user to remotely interact with a target machine over a network, providing functionalities such as file upload/download and command execution.

## Features

- **Remote Command Execution**: Execute system commands on the target machine.
- **File Upload and Download**: Transfer files between the controller and the target machine.
- **Persistent Connection**: Maintains a persistent connection with the target machine.
- **Change Working Directory**: Change the current working directory on the target machine.

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/ShogunXDD/c2-toolkit.git
   cd c2-toolkit
   ```

2. **Install dependencies:**
   
   Ensure you have Python installed. Install the required libraries using requirements.txt:
   ```sh
   pip install -r requirements.txt
   ```

3. **Run the Server:**

   On the controller machine:
   ```sh
   python server.py
   ```

4. **Run the Client:**

   On the target machine:
   ```sh
   python client.py
   ```

## Usage

1. **Start the Listener:** Run server.py on your machine. It will start listening for incoming connections.  
2. **Deploy the Client:** Execute client.py on the target machine to establish a connection with your listener.  
3. **Interact with the Target:** Use the provided commands to interact with the target machine.  

## Commands:

- **upload <path>**: Upload a file to the target machine.  
- **download <path>**: Download a file from the target machine.  
- **cd <directory>**: Change working directory.  
- **ls**: List files in current directory.  
- **exec <command>**: Execute system command.  
- **exit**: Terminate the connection.  

## Code Overview

### server.py
The server.py script sets up a listener that waits for incoming connections. Once a connection is established, it allows the user to send commands to the target machine and receive responses.

### client.py
The client.py script connects to the controller machine and waits for commands. It supports functionalities including file transfer and command execution.

## Future Enhancements

- **Encryption**: Implement encryption for data transmission to enhance security.  
- **Persistence**: Add mechanisms to ensure the client runs automatically on startup.  
- **Multi-client Support**  
- **Session Management**  
- **Logging System**  

## Disclaimer

This project is for educational purposes only. Use it responsibly and only on systems you own or have permission to test.
