#!/usr/bin/env python3
"""
Quick script to view data sealed in Walacor blockchain
"""
import sys
sys.path.insert(0, 'src')

from walacor_service import WalacorIntegrityService
import json

def main():
    print("=" * 60)
    print("🔍 WALACOR DATA VIEWER")
    print("=" * 60)

    try:
        # Initialize Walacor service
        wal = WalacorIntegrityService()
        print(f"\n✅ Connected to Walacor: http://13.220.225.175")
        print(f"   Using ETIDs: 100001 (Loans), 100002 (Provenance), 100003 (Attestations), 100004 (Audits)")

        # Try to query recent loan documents
        print(f"\n🔎 Querying ETID 100001 (Loan Documents)...")

        try:
            # Query for all loan documents (limited to 10)
            result = wal.wal.data_requests.post_query_api(
                ETId=100001,
                payload={"limit": 10},
                schemaVersion=2
            )

            documents = result.get('data', []) if result else []

            if documents:
                print(f"\n✅ Found {len(documents)} sealed documents:\n")
                for i, doc in enumerate(documents, 1):
                    print(f"Document #{i}:")
                    print(f"  Hash: {doc.get('document_hash', 'N/A')[:32]}...")
                    print(f"  Sealed: {doc.get('seal_timestamp', 'N/A')}")
                    print(f"  Integrity Seal: {doc.get('integrity_seal', 'N/A')}")
                    print()
            else:
                print("\n⚠️  No documents found in Walacor ETID 100001")
                print("   This could mean:")
                print("   1. No documents have been uploaded yet")
                print("   2. Documents are in local simulation mode")
                print("   3. Schema version mismatch")

        except Exception as query_err:
            print(f"\n⚠️  Query failed: {query_err}")
            print("\n💡 Try these alternatives:")
            print(f"   1. Access Walacor Dashboard: http://13.220.225.175")
            print(f"   2. Username: Admin, Password: Th!51s1T@gMu")
            print(f"   3. Navigate to 'Data Requests' → Query Schema 100001")

        # Show local blockchain info
        print("\n" + "=" * 60)
        print("📦 LOCAL BLOCKCHAIN SIMULATION (Fallback)")
        print("=" * 60)
        local_txs = len(wal.local_blockchain['transactions'])
        local_blocks = len(wal.local_blockchain['blocks'])
        print(f"  Transactions: {local_txs}")
        print(f"  Blocks: {local_blocks}")

        if local_txs > 0:
            print(f"\n  Last 3 transactions:")
            for tx_id in list(wal.local_blockchain['transactions'].keys())[-3:]:
                tx = wal.local_blockchain['transactions'][tx_id]
                print(f"    - {tx_id}: {tx.get('operation', 'N/A')}")

        print("\n" + "=" * 60)
        print("📖 HOW TO VIEW ALL YOUR DATA:")
        print("=" * 60)
        print("1. Walacor Dashboard: http://13.220.225.175")
        print("2. Login: Admin / Th!51s1T@gMu")
        print("3. Go to 'Schemas' → Select ETID 100001")
        print("4. Click 'Query' to see all sealed documents")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
