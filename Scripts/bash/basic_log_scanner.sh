#!/bin/bash

# Simple log scanner for failed login attempts

LOG_FILE="/var/log/auth.log"

echo "Scanning for failed login attempts..."

grep "Failed password" $LOG_FILE > failed_logins.txt

COUNT=$(wc -l < failed_logins.txt)

echo "Total failed login attempts: $COUNT"
echo "Saved results in failed_logins.txt"
