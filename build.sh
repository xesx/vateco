#!/bin/bash

# Build the project
nest build

# Make CLI executable
chmod +x dist/apps/app-cli/src/cli.js

echo "Build completed successfully"
