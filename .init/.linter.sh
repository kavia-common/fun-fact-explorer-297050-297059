#!/bin/bash
cd /home/kavia/workspace/code-generation/fun-fact-explorer-297050-297059/fun_fact_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

