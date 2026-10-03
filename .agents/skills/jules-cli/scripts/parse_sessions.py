#!/usr/bin/env python3
"""
parse_sessions.py - Safe Jules Remote Session Parser for Google Antigravity

Executes `jules remote list --session` in an expanded pseudo-terminal (cols >= 300)
to prevent numeric Session ID truncation, splits tabular output into structured JSON,
and supports status-based filtering.

Usage:
    ./scripts/parse_sessions.py
    ./scripts/parse_sessions.py --status "Ready for review"
    ./scripts/parse_sessions.py --status "In progress"
    cat raw_output.txt | ./scripts/parse_sessions.py --stdin
"""

import argparse
import fcntl
import json
import os
import pty
import re
import struct
import subprocess
import sys

def get_raw_table_pty() -> str:
    """Invokes `jules remote list --session` through an expanded pseudo-terminal."""
    master, slave = pty.openpty()
    try:
        # Set terminal dimensions: 50 rows, 350 columns to prevent column truncation
        fcntl.ioctl(slave, termios_TIOCSWINSZ := 0x5414, struct.pack("HHHH", 50, 350, 0, 0))
        
        proc = subprocess.Popen(
            ["jules", "remote", "list", "--session"],
            stdin=slave,
            stdout=slave,
            stderr=slave,
            close_fds=True
        )
        os.close(slave)
        
        output = b""
        while True:
            try:
                chunk = os.read(master, 4096)
                if not chunk:
                    break
                output += chunk
            except OSError:
                break
        proc.wait()
        return output.decode("utf-8", errors="ignore")
    finally:
        os.close(master)

def parse_session_lines(text: str) -> list[dict]:
    """Parses multi-column tabular terminal output into structured session dictionaries."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    sessions = []
    
    # Strip ANSI escape sequences
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    clean_lines = [ansi_escape.sub('', l) for l in lines]
    
    header_found = False
    for line in clean_lines:
        # Detect table header
        if re.search(r'\bID\b', line, re.I) and re.search(r'\bStatus\b', line, re.I):
            header_found = True
            continue
        
        if not header_found:
            continue
            
        # Match session rows: starts with numeric ID or session identifier
        parts = re.split(r'\s{2,}', line)
        if len(parts) >= 4 and re.match(r'^\d+$', parts[0].strip()):
            session_id = parts[0].strip()
            status = parts[-1].strip()
            last_active = parts[-2].strip() if len(parts) >= 5 else ""
            repo = parts[-3].strip() if len(parts) >= 5 else parts[1].strip()
            description = " ".join(parts[1:-3]) if len(parts) >= 5 else parts[1].strip()
            
            sessions.append({
                "id": session_id,
                "description": description,
                "repo": repo,
                "last_active": last_active,
                "status": status,
                "url": f"https://jules.google.com/session/{session_id}"
            })
            
    return sessions

def main():
    parser = argparse.ArgumentParser(description="Parse Jules CLI session output to JSON")
    parser.add_argument("--status", help="Filter sessions by status (e.g. 'Ready for review', 'In progress')")
    parser.add_argument("--stdin", action="store_true", help="Read raw table text from stdin instead of running jules")
    args = parser.parse_args()
    
    if args.stdin:
        raw_text = sys.stdin.read()
    else:
        try:
            raw_text = get_raw_table_pty()
        except Exception as e:
            sys.stderr.write(f"Error running Jules CLI in PTY: {e}\n")
            sys.exit(1)
            
    sessions = parse_session_lines(raw_text)
    
    if args.status:
        target_status = args.status.lower()
        sessions = [s for s in sessions if target_status in s["status"].lower()]
        
    print(json.dumps(sessions, indent=2))

if __name__ == "__main__":
    main()
