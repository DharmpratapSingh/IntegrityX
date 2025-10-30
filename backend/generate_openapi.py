"""
Generate OpenAPI specification from FastAPI app.

This script exports the OpenAPI spec to docs/api/openapi.json
"""

import json
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from main import app

def generate_openapi_spec():
    """Generate and save OpenAPI specification."""
    openapi_spec = app.openapi()
    
    # Ensure output directory exists
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'docs', 'api')
    os.makedirs(output_dir, exist_ok=True)
    
    # Save to file
    output_file = os.path.join(output_dir, 'openapi.json')
    with open(output_file, 'w') as f:
        json.dump(openapi_spec, f, indent=2)
    
    print(f"✅ OpenAPI spec generated: {output_file}")
    print(f"   - Title: {openapi_spec['info']['title']}")
    print(f"   - Version: {openapi_spec['info']['version']}")
    print(f"   - Endpoints: {len(openapi_spec['paths'])} paths")
    
    return output_file

if __name__ == "__main__":
    try:
        generate_openapi_spec()
    except Exception as e:
        print(f"❌ Error generating OpenAPI spec: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)



