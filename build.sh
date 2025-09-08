#!/bin/bash

# Build the project
nest build

# Make CLI executable
chmod +x dist/apps/app-cli/src/cli.js

# Copy template files
if [ -d "libs/message/src/template" ]; then
    mkdir -p dist/libs/message/src/template
    cp -r libs/message/src/template/* dist/libs/message/src/template/
    echo "Templates copied successfully"
fi

echo "Build completed successfully"
