#!/bin/bash
# Generate TypeScript types from OpenAPI spec

set -e

echo "Generating TypeScript types from OpenAPI specification..."

# Install openapi-typescript if not already installed
if ! command -v openapi-typescript &> /dev/null; then
    echo "Installing openapi-typescript..."
    npm install -g openapi-typescript
fi

# Generate types
openapi-typescript api/openapi/ot-continuum.yaml -o api/openapi/types.ts

echo "✓ Types generated successfully at api/openapi/types.ts"
