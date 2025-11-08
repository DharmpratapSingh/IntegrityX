"""
IntegrityX Python Client Library

A complete Python client for the IntegrityX API with authentication,
error handling, and retry logic.

Usage:
    from integrityx_client import IntegrityXClient
    
    client = IntegrityXClient('http://localhost:8000', 'your_jwt_token')
    result = client.upload_document({'loan_id': 'LOAN-123', 'amount': 250000})
    print(f"Sealed with ETID: {result['etid']}")
"""

import requests
from typing import Dict, List, Optional, Any
import time
from datetime import datetime


class IntegrityXError(Exception):
    """Base exception for IntegrityX client errors."""
    pass


class AuthenticationError(IntegrityXError):
    """Raised when authentication fails."""
    pass


class ValidationError(IntegrityXError):
    """Raised when request validation fails."""
    pass


class IntegrityXClient:
    """
    Python client for IntegrityX API.
    
    Args:
        base_url: Base URL of the IntegrityX API (e.g., 'http://localhost:8000')
        token: Clerk JWT token for authentication
        timeout: Request timeout in seconds (default: 30)
        max_retries: Maximum number of retries for failed requests (default: 3)
    
    Example:
        >>> client = IntegrityXClient('http://localhost:8000', 'your_jwt_token')
        >>> result = client.upload_document({'loan_id': 'LOAN-123'})
        >>> print(result['etid'])
    """
    
    def __init__(
        self, 
        base_url: str, 
        token: str,
        timeout: int = 30,
        max_retries: int = 3
    ):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })
    
    def _request(
        self, 
        method: str, 
        endpoint: str, 
        json: Optional[Dict] = None,
        params: Optional[Dict] = None,
        requires_auth: bool = True
    ) -> Dict:
        """Make HTTP request with retry logic."""
        url = f"{self.base_url}{endpoint}"
        headers = self.session.headers if requires_auth else {'Content-Type': 'application/json'}
        
        for attempt in range(self.max_retries):
            try:
                response = requests.request(
                    method=method,
                    url=url,
                    json=json,
                    params=params,
                    headers=headers,
                    timeout=self.timeout
                )
                
                if response.status_code == 401:
                    raise AuthenticationError("Invalid or expired token")
                
                if response.status_code == 400:
                    error_data = response.json()
                    raise ValidationError(f"Validation error: {error_data.get('detail', 'Unknown error')}")
                
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.Timeout:
                if attempt == self.max_retries - 1:
                    raise IntegrityXError(f"Request timeout after {self.max_retries} attempts")
                time.sleep(2 ** attempt)  # Exponential backoff
                
            except requests.exceptions.RequestException as e:
                if attempt == self.max_retries - 1:
                    raise IntegrityXError(f"Request failed: {str(e)}")
                time.sleep(2 ** attempt)
    
    # ===========================
    # Document Operations
    # ===========================
    
    def upload_document(self, document: Dict, metadata: Optional[Dict] = None) -> Dict:
        """
        Upload a single JSON document.
        
        Args:
            document: Document data as dictionary
            metadata: Optional metadata
        
        Returns:
            Response with ETID, hash, and blockchain transaction ID
        
        Example:
            >>> result = client.upload_document({
            ...     'loan_id': 'LOAN-12345',
            ...     'amount': 250000,
            ...     'borrower_name': 'John Doe'
            ... })
            >>> print(f"ETID: {result['etid']}")
        """
        payload = {'document': document}
        if metadata:
            payload['metadata'] = metadata
        
        return self._request('POST', '/ingest-json', json=payload)
    
    def get_document(self, etid: str) -> Dict:
        """
        Retrieve a document by ETID.
        
        Args:
            etid: Document ETID
        
        Returns:
            Document data with metadata
        """
        return self._request('GET', f'/document/{etid}')
    
    def delete_document(self, etid: str) -> Dict:
        """
        Delete a document (admin only).
        
        Args:
            etid: Document ETID
        
        Returns:
            Deletion confirmation
        """
        return self._request('DELETE', f'/document/{etid}')
    
    # ===========================
    # Verification
    # ===========================
    
    def verify_document(self, etid: str) -> Dict:
        """
        Verify a document (no auth required).
        
        Args:
            etid: Document ETID
        
        Returns:
            Verification result with blockchain proof
        
        Example:
            >>> result = client.verify_document('ETID-20241028123456-ABC123')
            >>> print(f"Verified: {result['verified']}")
        """
        return self._request('GET', f'/public/verify/{etid}', requires_auth=False)
    
    def batch_verify(self, etids: List[str]) -> Dict:
        """
        Verify multiple documents at once.
        
        Args:
            etids: List of document ETIDs
        
        Returns:
            Verification results for all documents
        """
        return self._request('POST', '/verify/batch', json={'etids': etids})
    
    # ===========================
    # Attestations
    # ===========================
    
    def create_attestation(
        self, 
        etid: str, 
        role: str, 
        status: str,
        comments: Optional[str] = None,
        attested_by: Optional[str] = None
    ) -> Dict:
        """
        Create an attestation for a document.
        
        Args:
            etid: Document ETID
            role: Attestor role (e.g., 'underwriter', 'compliance_officer')
            status: Attestation status (e.g., 'approved', 'rejected')
            comments: Optional comments
            attested_by: Email of attestor
        
        Returns:
            Attestation confirmation
        """
        payload = {
            'etid': etid,
            'role': role,
            'status': status
        }
        if comments:
            payload['comments'] = comments
        if attested_by:
            payload['attested_by'] = attested_by
        
        return self._request('POST', '/attestations', json=payload)
    
    def get_attestations(self, etid: str) -> Dict:
        """
        Get all attestations for a document.
        
        Args:
            etid: Document ETID
        
        Returns:
            List of attestations
        """
        return self._request('GET', f'/attestations/{etid}')
    
    # ===========================
    # Provenance
    # ===========================
    
    def get_provenance(self, etid: str) -> Dict:
        """
        Get complete provenance chain for a document.
        
        Args:
            etid: Document ETID
        
        Returns:
            Complete chain of custody
        """
        return self._request('GET', f'/provenance/{etid}')
    
    # ===========================
    # Analytics
    # ===========================
    
    def get_stats(self) -> Dict:
        """
        Get document statistics.
        
        Returns:
            Statistics and insights
        """
        return self._request('GET', '/analytics/stats')
    
    def predict(self, metric: str, timeframe: str) -> Dict:
        """
        Get predictive analytics.
        
        Args:
            metric: Metric to predict (e.g., 'document_volume')
            timeframe: Timeframe (e.g., 'next_30_days')
        
        Returns:
            Prediction results
        """
        payload = {'metric': metric, 'timeframe': timeframe}
        return self._request('POST', '/analytics/predictive', json=payload)
    
    # ===========================
    # AI Features
    # ===========================
    
    def detect_anomalies(self, etid: str) -> Dict:
        """
        Detect anomalies in a document using AI.
        
        Args:
            etid: Document ETID
        
        Returns:
            Anomaly detection results
        """
        return self._request('POST', '/ai/detect-anomalies', json={'etid': etid})
    
    def analyze_document(self, etid: str) -> Dict:
        """
        Analyze document using NLP and entity extraction.
        
        Args:
            etid: Document ETID
        
        Returns:
            Document intelligence results
        """
        return self._request('POST', '/intelligence/analyze', json={'etid': etid})


# ===========================
# Usage Examples
# ===========================

def example_upload_and_verify():
    """Example: Upload and verify a document."""
    client = IntegrityXClient('http://localhost:8000', 'your_jwt_token')
    
    # Upload document
    document = {
        'loan_id': 'LOAN-12345',
        'borrower_name': 'John Doe',
        'amount': 250000,
        'interest_rate': 4.5,
        'term_months': 360
    }
    
    result = client.upload_document(document)
    print(f"✅ Document sealed with ETID: {result['etid']}")
    print(f"   Blockchain TX: {result['walacor_txid']}")
    
    # Verify document (no auth needed)
    verification = client.verify_document(result['etid'])
    print(f"✅ Document verified: {verification['verified']}")
    print(f"   Blockchain verified: {verification['blockchain_verified']}")


def example_attestations():
    """Example: Create and retrieve attestations."""
    client = IntegrityXClient('http://localhost:8000', 'your_jwt_token')
    
    etid = 'ETID-20241028123456-ABC123'
    
    # Create attestation
    attestation = client.create_attestation(
        etid=etid,
        role='underwriter',
        status='approved',
        comments='Loan application approved after thorough review',
        attested_by='john.doe@company.com'
    )
    print(f"✅ Attestation created: {attestation['attestation_id']}")
    
    # Get all attestations
    attestations = client.get_attestations(etid)
    print(f"✅ Found {len(attestations['attestations'])} attestations")


def example_analytics():
    """Example: Get analytics and predictions."""
    client = IntegrityXClient('http://localhost:8000', 'your_jwt_token')
    
    # Get statistics
    stats = client.get_stats()
    print(f"📊 Total documents: {stats['total_documents']}")
    print(f"   Sealed today: {stats['sealed_today']}")
    print(f"   Average health score: {stats['average_health_score']}")
    
    # Get predictions
    prediction = client.predict('document_volume', 'next_30_days')
    print(f"📈 Predicted volume trend: {prediction['forecast'][0]['predicted_value']}")


def example_error_handling():
    """Example: Proper error handling."""
    client = IntegrityXClient('http://localhost:8000', 'your_jwt_token')
    
    try:
        result = client.upload_document({'loan_id': 'LOAN-123'})
        print(f"✅ Success: {result['etid']}")
    
    except AuthenticationError as e:
        print(f"❌ Authentication error: {e}")
        # Handle token refresh
    
    except ValidationError as e:
        print(f"❌ Validation error: {e}")
        # Handle invalid data
    
    except IntegrityXError as e:
        print(f"❌ API error: {e}")
        # Handle other errors


if __name__ == '__main__':
    # Run examples (update token first!)
    example_upload_and_verify()
    example_attestations()
    example_analytics()
    example_error_handling()














