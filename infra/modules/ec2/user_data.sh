#!/bin/bash

# Update and install dependencies
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release git make

# Install Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Clone Repo (Placeholder - User needs to add specific git clone command or use scp)
# git clone https://github.com/rhinontech/platform.git /app

# Setup .env (Placeholder)
# cp /app/.env.example /app/.env

# Start Application
# cd /app
# make prod
