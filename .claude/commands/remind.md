---
allowed-tools: Bash, Read, Glob
argument-hint: [count|docs]
description: Display recent commit history (default: 50 commits) or read all docs
---

If the argument is "docs", then I need to read and understand all documentation files in the docs/ folder completely:

1. First, find all documentation files in docs/ folder
2. For each file, read it entirely from beginning to end 
3. If a file is large (>1000 lines), read it in chunks of 1000 lines until complete
4. Analyze and summarize the key information from each document
5. Provide a comprehensive understanding of the project documentation

If the argument is a number (or empty for default 50), show recent commit history:

!git log --oneline --graph --decorate -n ${ARGUMENTS:-50} --color=always

Usage examples:
- /remind (shows last 50 commits)
- /remind 10 (shows last 10 commits) 
- /remind docs (reads and analyzes all docs/ markdown files completely)
