#!/bin/bash
# Script to apply requireAdmin to all admin endpoints
# This is a reference - actual fixes done via code edits

echo "Admin endpoints requiring authentication:"
find src/app/api/admin -name "route.ts" -type f | while read file; do
  echo "  - $file"
done

echo ""
echo "Total: $(find src/app/api/admin -name "route.ts" -type f | wc -l) endpoints"
