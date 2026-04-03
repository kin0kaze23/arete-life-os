#!/bin/bash
set -e
npm install
npm run typecheck
npm run lint
npm run build
vercel --prod