"""
Simple server startup script for IntegrityX
"""

import uvicorn
import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    try:
        import io
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'buffer'):
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except:
        pass  # If encoding fix fails, continue anyway

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    try:
        print("Starting IntegrityX Server...")
        print("=" * 50)
        print(f"Python: {sys.version}")
        print(f"Working directory: {os.getcwd()}")
        print("=" * 50)
        
        # Start the server
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8000,
            reload=False,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"Server startup failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)



