"""
Main FastAPI application for the Walacor Financial Integrity Platform.

This module provides a RESTful API for document integrity verification,
manifest processing, and artifact management using the Walacor blockchain.

Key Features:
- Document ingestion and verification
- Multi-file packet processing
- Manifest validation and hashing
- Artifact management and tracking
- Comprehensive error handling
- CORS support for frontend integration

API Endpoints:
- Health check and system status
- JSON document ingestion
- Multi-file packet ingestion
- Manifest verification
- Artifact retrieval and management
- System statistics and monitoring
"""

# Load environment variables first
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import json
import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
import traceback
import time
import asyncio
import aiohttp
from contextvars import ContextVar
import zipfile
from io import BytesIO
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

# Import backend services
from src.database import Database
from src.document_handler import DocumentHandler
from src.walacor_service import WalacorIntegrityService
from src.json_handler import JSONHandler
from src.manifest_handler import ManifestHandler
from src.repositories import AttestationRepository, ProvenanceRepository
from src.verification_portal import VerificationPortal
from src.voice_service import VoiceCommandProcessor
from src.analytics_service import AnalyticsService
from src.ai_anomaly_detector import AIAnomalyDetector
from src.time_machine import TimeMachine
from src.smart_contracts import SmartContractsService
from src.predictive_analytics import PredictiveAnalyticsService
from src.document_intelligence import DocumentIntelligenceService
from src.structured_logger import (
    log_endpoint_request, log_endpoint_start, with_structured_logging,
    log_database_operation, log_external_service_call,
    extract_user_id_from_request, extract_etid_from_request, extract_hash_prefix
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan event handler
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services at startup and cleanup at shutdown."""
    global db, doc_handler, wal_service, json_handler, manifest_handler, attestation_repo, provenance_repo, verification_portal, voice_processor, analytics_service, ai_anomaly_detector, time_machine, smart_contracts, predictive_analytics, document_intelligence
    
    try:
        logger.info("Initializing Walacor Financial Integrity API services...")
        
        # Initialize database
        db = Database()
        logger.info("✅ Database service initialized")
        
        # Initialize document handler
        doc_handler = DocumentHandler()
        logger.info("✅ Document handler initialized")
        
        # Initialize Walacor service (optional - may fail in demo mode)
        try:
            wal_service = WalacorIntegrityService()
            logger.info("✅ Walacor service initialized")
        except Exception as e:
            logger.warning(f"⚠️ Walacor service initialization failed (demo mode): {e}")
            wal_service = None
        
        # Initialize JSON handler
        json_handler = JSONHandler()
        logger.info("✅ JSON handler initialized")
        
        # Initialize manifest handler
        manifest_handler = ManifestHandler()
        logger.info("✅ Manifest handler initialized")
        
        # Initialize repositories
        attestation_repo = AttestationRepository()
        provenance_repo = ProvenanceRepository()
        logger.info("✅ Repository services initialized")
        
        # Initialize verification portal
        verification_portal = VerificationPortal()
        logger.info("✅ Verification portal initialized")
        
        # Initialize voice command processor
        voice_processor = VoiceCommandProcessor()
        logger.info("✅ Voice command processor initialized")
        
        # Initialize analytics service
        analytics_service = AnalyticsService(db_service=db)
        logger.info("✅ Analytics service initialized")
        
        # Initialize AI anomaly detector
        ai_anomaly_detector = AIAnomalyDetector(db_service=db)
        logger.info("✅ AI anomaly detector initialized")
        
        # Initialize time machine service
        time_machine = TimeMachine(db_service=db)
        logger.info("✅ Time machine service initialized")
        
        # Initialize smart contracts service
        smart_contracts = SmartContractsService(db_service=db)
        logger.info("✅ Smart contracts service initialized")
        
        # Initialize predictive analytics service
        predictive_analytics = PredictiveAnalyticsService(db_service=db)
        logger.info("✅ Predictive analytics service initialized")
        
        # Initialize document intelligence service
        document_intelligence = DocumentIntelligenceService()
        logger.info("✅ Document intelligence service initialized")
        
        logger.info("🎉 All services initialized successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}")
        logger.error(traceback.format_exc())
        raise
    
    yield
    
    # Cleanup code here if needed
    logger.info("Shutting down services...")

# Initialize FastAPI app
app = FastAPI(
    title="Walacor Financial Integrity API",
    description="API for document integrity verification and artifact management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:8080", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global service variables
db = None
doc_handler = None
wal_service = None
json_handler = None
manifest_handler = None
attestation_repo = None
provenance_repo = None
verification_portal = None
voice_processor = None
analytics_service = None
ai_anomaly_detector = None
time_machine = None
smart_contracts = None
predictive_analytics = None
document_intelligence = None

# Add request tracking middleware
@app.middleware("http")
async def add_request_tracking(request, call_next):
    """Middleware to add request tracking and structured logging."""
    from src.structured_logger import generate_request_id, request_id_var, start_time_var
    
    # Generate request ID
    request_id = generate_request_id()
    request_id_var.set(request_id)
    
    # Record start time
    start_time = time.time()
    start_time_var.set(start_time)
    
    # Add request ID to response headers
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response

# Global service instances
db: Optional[Database] = None
doc_handler: Optional[DocumentHandler] = None
wal_service: Optional[WalacorIntegrityService] = None
json_handler: Optional[JSONHandler] = None
manifest_handler: Optional[ManifestHandler] = None
attestation_repo: Optional[AttestationRepository] = None
provenance_repo: Optional[ProvenanceRepository] = None
verification_portal: Optional[VerificationPortal] = None


# Standardized response models
class ErrorDetail(BaseModel):
    """Error detail model."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")


class StandardResponse(BaseModel):
    """Standardized response model."""
    ok: bool = Field(..., description="Success status")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    error: Optional[ErrorDetail] = Field(None, description="Error information")


# Pydantic models for request/response
class ServiceHealth(BaseModel):
    """Individual service health information."""
    status: str = Field(..., description="Service status: up/down")
    duration_ms: float = Field(..., description="Health check duration in milliseconds")
    details: Optional[str] = Field(None, description="Additional service details")
    error: Optional[str] = Field(None, description="Error message if service is down")


class HealthData(BaseModel):
    """Health check data model."""
    status: str = Field(..., description="Overall API status")
    message: str = Field(..., description="Status message")
    timestamp: str = Field(..., description="Response timestamp")
    total_duration_ms: float = Field(..., description="Total health check duration in milliseconds")
    services: Dict[str, ServiceHealth] = Field(..., description="Detailed service health information")


class IngestResponse(BaseModel):
    """Document ingestion response model."""
    message: str = Field(..., description="Response message")
    artifact_id: Optional[str] = Field(None, description="Created artifact ID")
    hash: Optional[str] = Field(None, description="Document hash")
    file_count: Optional[int] = Field(None, description="Number of files processed")
    timestamp: str = Field(..., description="Processing timestamp")


class VerifyResponse(BaseModel):
    """Manifest verification response model."""
    message: str = Field(..., description="Response message")
    is_valid: bool = Field(..., description="Validation result")
    hash: Optional[str] = Field(None, description="Manifest hash")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    timestamp: str = Field(..., description="Verification timestamp")


class ArtifactResponse(BaseModel):
    """Artifact details response model."""
    id: str = Field(..., description="Artifact ID")
    loan_id: str = Field(..., description="Loan ID")
    artifact_type: str = Field(..., description="Artifact type")
    payload_sha256: str = Field(..., description="Payload hash")
    manifest_sha256: Optional[str] = Field(None, description="Manifest hash")
    walacor_tx_id: str = Field(..., description="Walacor transaction ID")
    created_by: str = Field(..., description="Creator")
    created_at: str = Field(..., description="Creation timestamp")
    files: List[Dict[str, Any]] = Field(default_factory=list, description="Associated files")
    events: List[Dict[str, Any]] = Field(default_factory=list, description="Artifact events")


class EventResponse(BaseModel):
    """Event details response model."""
    id: str = Field(..., description="Event ID")
    artifact_id: str = Field(..., description="Artifact ID")
    event_type: str = Field(..., description="Event type")
    created_by: str = Field(..., description="Creator")
    created_at: str = Field(..., description="Creation timestamp")
    payload_json: Optional[str] = Field(None, description="Event payload")
    walacor_tx_id: Optional[str] = Field(None, description="Walacor transaction ID")


class StatsResponse(BaseModel):
    """System statistics response model."""
    total_artifacts: int = Field(..., description="Total number of artifacts")
    total_files: int = Field(..., description="Total number of files")
    total_events: int = Field(..., description="Total number of events")
    artifacts_by_type: Dict[str, int] = Field(..., description="Artifacts by type")
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list, description="Recent activity")
    timestamp: str = Field(..., description="Statistics timestamp")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Error details")
    timestamp: str = Field(..., description="Error timestamp")


class IngestJsonRequest(BaseModel):
    """JSON ingestion request model."""
    loan_id: str = Field(..., description="Loan ID")
    created_by: str = Field(..., description="Creator identifier")


class IngestPacketRequest(BaseModel):
    """Packet ingestion request model."""
    loan_id: str = Field(..., description="Loan ID")
    created_by: str = Field(..., description="Creator identifier")


# New request/response models for additional endpoints
class SealRequest(BaseModel):
    """Seal request model."""
    etid: int = Field(..., description="Entity Type ID")
    payloadHash: str = Field(..., description="Payload SHA-256 hash")
    externalUri: str = Field(..., description="External URI where artifact is stored")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class SealResponse(BaseModel):
    """Seal response model."""
    message: str = Field(..., description="Response message")
    artifact_id: str = Field(..., description="Artifact ID")
    walacor_tx_id: str = Field(..., description="Walacor transaction ID")
    sealed_at: str = Field(..., description="Sealing timestamp")
    proof_bundle: Dict[str, Any] = Field(..., description="Proof bundle from Walacor")


class VerifyRequest(BaseModel):
    """Verify request model."""
    etid: int = Field(..., description="Entity Type ID")
    payloadHash: str = Field(..., description="Payload SHA-256 hash")


class VerifyResponse(BaseModel):
    """Verify response model."""
    message: str = Field(..., description="Response message")
    is_valid: bool = Field(..., description="Verification result")
    status: str = Field(..., description="Status: ok or tamper")
    artifact_id: Optional[str] = Field(None, description="Artifact ID if found")
    verified_at: str = Field(..., description="Verification timestamp")
    details: Dict[str, Any] = Field(default_factory=dict, description="Verification details")


class ProofResponse(BaseModel):
    """Proof response model."""
    proof_bundle: Dict[str, Any] = Field(..., description="Proof bundle from Walacor")
    artifact_id: str = Field(..., description="Artifact ID")
    etid: int = Field(..., description="Entity Type ID")
    retrieved_at: str = Field(..., description="Retrieval timestamp")


class PresignRequest(BaseModel):
    """S3 presign request model."""
    key: str = Field(..., description="S3 object key")
    contentType: str = Field(..., description="Content type")
    size: int = Field(..., description="File size in bytes")
    expiresIn: int = Field(default=3600, description="Expiration time in seconds")


class PresignResponse(BaseModel):
    """S3 presign response model."""
    putUrl: str = Field(..., description="Presigned PUT URL")
    objectUrl: str = Field(..., description="Object URL")
    expiresAt: str = Field(..., description="Expiration timestamp")
    key: str = Field(..., description="S3 object key")


class EventsRequest(BaseModel):
    """Events query request model."""
    etid: Optional[int] = Field(None, description="Filter by Entity Type ID")
    startDate: Optional[str] = Field(None, description="Start date (ISO format)")
    endDate: Optional[str] = Field(None, description="End date (ISO format)")
    status: Optional[str] = Field(None, description="Filter by status")
    page: int = Field(default=1, description="Page number")
    limit: int = Field(default=50, description="Items per page")


class EventsResponse(BaseModel):
    """Events response model."""
    events: List[Dict[str, Any]] = Field(..., description="List of events")
    total: int = Field(..., description="Total number of events")
    page: int = Field(..., description="Current page")
    limit: int = Field(..., description="Items per page")
    has_next: bool = Field(..., description="Has next page")
    has_prev: bool = Field(..., description="Has previous page")


# Attestation models
class AttestationIn(BaseModel):
    """Attestation creation request model."""
    artifactId: str = Field(..., description="Artifact ID")
    etid: str = Field(..., description="Entity Type ID")
    kind: str = Field(..., description="Attestation kind (e.g., qc_check, kyc_passed)")
    issuedBy: str = Field(..., description="User or service that issued the attestation")
    details: dict = Field(default_factory=dict, description="Free-form metadata")


class AttestationOut(BaseModel):
    """Attestation response model."""
    id: int = Field(..., description="Attestation ID")
    artifactId: str = Field(..., description="Artifact ID")
    etid: str = Field(..., description="Entity Type ID")
    kind: str = Field(..., description="Attestation kind")
    issuedBy: str = Field(..., description="User or service that issued the attestation")
    details: dict = Field(..., description="Free-form metadata")
    createdAt: datetime = Field(..., description="Creation timestamp")


# Provenance models
class ProvenanceLinkIn(BaseModel):
    """Provenance link creation request model."""
    parentArtifactId: str = Field(..., description="Parent artifact ID")
    childArtifactId: str = Field(..., description="Child artifact ID")
    relation: str = Field(..., description="Relationship type (e.g., contains, derived_from)")


class ProvenanceLinkOut(BaseModel):
    """Provenance link response model."""
    id: int = Field(..., description="Provenance link ID")
    parentArtifactId: str = Field(..., description="Parent artifact ID")
    childArtifactId: str = Field(..., description="Child artifact ID")
    relation: str = Field(..., description="Relationship type")
    createdAt: datetime = Field(..., description="Creation timestamp")


class VerificationLinkRequest(BaseModel):
    """Verification link generation request model."""
    documentId: str = Field(..., description="Document ID to verify")
    documentHash: str = Field(..., description="Document hash for verification")
    allowedParty: str = Field(..., description="Email of the party allowed to verify")
    permissions: List[str] = Field(..., description="List of permissions (hash, timestamp, attestations)")
    expiresInHours: int = Field(24, description="Token expiration time in hours")


class VerificationLinkResponse(BaseModel):
    """Verification link response model."""
    token: str = Field(..., description="Secure verification token")
    verificationUrl: str = Field(..., description="URL for verification")
    expiresAt: datetime = Field(..., description="Token expiration time")
    permissions: List[str] = Field(..., description="Granted permissions")


class VerificationRequest(BaseModel):
    """Verification request model."""
    token: str = Field(..., description="Verification token")
    verifierEmail: str = Field(..., description="Email of the verifier")


class VerificationResponse(BaseModel):
    """Verification response model."""
    isValid: bool = Field(..., description="Whether the document is valid")
    documentHash: str = Field(..., description="Document hash")
    timestamp: datetime = Field(..., description="Document timestamp")
    attestations: List[Dict[str, Any]] = Field(..., description="Document attestations")
    permissions: List[str] = Field(..., description="Granted permissions")
    verifiedAt: datetime = Field(..., description="Verification timestamp")


# Dependency to check if services are initialized
def get_services():
    """Get initialized services."""
    if not all([db, doc_handler, json_handler, manifest_handler, attestation_repo, provenance_repo, verification_portal, voice_processor, analytics_service, ai_anomaly_detector, time_machine, smart_contracts, predictive_analytics, document_intelligence]):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Services not initialized"
        )
    return {
        "db": db,
        "doc_handler": doc_handler,
        "wal_service": wal_service,
        "json_handler": json_handler,
        "manifest_handler": manifest_handler,
        "attestation_repo": attestation_repo,
        "provenance_repo": provenance_repo,
        "verification_portal": verification_portal,
        "voice_processor": voice_processor,
        "analytics_service": analytics_service,
            "ai_anomaly_detector": ai_anomaly_detector,
            "time_machine": time_machine,
            "smart_contracts": smart_contracts,
            "predictive_analytics": predictive_analytics,
            "document_intelligence": document_intelligence
        }


# Helper functions for standardized responses
def create_success_response(data: Dict[str, Any]) -> StandardResponse:
    """Create a standardized success response."""
    return StandardResponse(ok=True, data=data)


def create_error_response(code: str, message: str, details: Optional[Dict[str, Any]] = None) -> StandardResponse:
    """Create a standardized error response."""
    return StandardResponse(
        ok=False,
        error=ErrorDetail(code=code, message=message, details=details)
    )


# Configuration endpoint
@app.get("/api/config", response_model=StandardResponse)
async def get_config():
    """
    Get non-sensitive environment configuration.
    
    Returns environment variables that are safe to expose to the frontend.
    """
    try:
        # Only expose non-sensitive configuration
        safe_config = {}
        
        # Database configuration
        if os.getenv("DATABASE_URL"):
            safe_config["DATABASE_URL"] = os.getenv("DATABASE_URL")
        
        # Walacor configuration (non-sensitive parts)
        if os.getenv("WALACOR_HOST"):
            safe_config["WALACOR_HOST"] = os.getenv("WALACOR_HOST")
        
        # AWS configuration (non-sensitive parts)
        if os.getenv("AWS_REGION"):
            safe_config["AWS_REGION"] = os.getenv("AWS_REGION")
        if os.getenv("AWS_S3_BUCKET"):
            safe_config["AWS_S3_BUCKET"] = os.getenv("AWS_S3_BUCKET")
        
        # Application configuration
        safe_config["NODE_ENV"] = os.getenv("NODE_ENV", "development")
        safe_config["API_VERSION"] = "1.0.0"
        
        return create_success_response(safe_config)
        
    except Exception as e:
        logger.error(f"Failed to get configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="CONFIG_ERROR",
                message="Failed to get configuration",
                details={"error": str(e)}
            ).dict()
        )


# Health check endpoint
@app.get("/api/health", response_model=StandardResponse)
async def health_check():
    """
    Enhanced health check endpoint.
    
    Returns detailed health status of the API and all services with timing information.
    Checks database, Walacor, and storage services.
    """
    start_time = time.time()
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Log request start
    log_endpoint_start(
        endpoint="/api/health",
        method="GET"
    )
    
    try:
        services_health = {}
        
        # Check database health
        db_health = await check_database_health()
        services_health["db"] = db_health
        
        # Check Walacor health
        walacor_health = await check_walacor_health()
        services_health["walacor"] = walacor_health
        
        # Check storage health
        storage_health = await check_storage_health()
        services_health["storage"] = storage_health
        
        # Check other services (basic availability)
        services_health["document_handler"] = ServiceHealth(
            status="up" if doc_handler else "down",
            duration_ms=0.0,
            details="Document handler service"
        )
        
        services_health["json_handler"] = ServiceHealth(
            status="up" if json_handler else "down",
            duration_ms=0.0,
            details="JSON handler service"
        )
        
        services_health["manifest_handler"] = ServiceHealth(
            status="up" if manifest_handler else "down",
            duration_ms=0.0,
            details="Manifest handler service"
        )
        
        # Determine overall status
        critical_services = ["db", "walacor", "storage"]
        critical_statuses = [services_health[svc].status for svc in critical_services if svc in services_health]
        
        if all(status == "up" for status in critical_statuses):
            overall_status = "healthy"
            message = "All services are operational"
        elif any(status == "up" for status in critical_statuses):
            overall_status = "degraded"
            message = "Some services are unavailable"
        else:
            overall_status = "unhealthy"
            message = "Critical services are down"
        
        total_duration = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        health_data = HealthData(
            status=overall_status,
            message=message,
            timestamp=timestamp,
            total_duration_ms=total_duration,
            services=services_health
        )
        
        # Log successful completion
        latency_ms = (time.time() - start_time) * 1000
        log_endpoint_request(
            endpoint="/api/health",
            method="GET",
            latency_ms=latency_ms,
            result="success",
            overall_status=overall_status
        )
        
        return create_success_response(health_data.dict())
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        logger.error(traceback.format_exc())
        
        total_duration = (time.time() - start_time) * 1000
        
        # Log error
        log_endpoint_request(
            endpoint="/api/health",
            method="GET",
            latency_ms=total_duration,
            result="error",
            error=str(e)
        )
        
        error_data = HealthData(
            status="unhealthy",
            message=f"Health check failed: {str(e)}",
            timestamp=timestamp,
            total_duration_ms=total_duration,
            services={
                "error": ServiceHealth(
                    status="down",
                    duration_ms=total_duration,
                    error=str(e)
                )
            }
        )
        
        return create_success_response(error_data.dict())


async def check_database_health() -> ServiceHealth:
    """Check database health with SELECT 1 query."""
    start_time = time.time()
    
    try:
        if not db:
            return ServiceHealth(
                status="down",
                duration_ms=0.0,
                error="Database service not initialized"
            )
        
        # Perform a simple SELECT 1 query
        with db:
            from sqlalchemy import text
            result = db.session.execute(text("SELECT 1")).fetchone()
            if result and result[0] == 1:
                duration_ms = (time.time() - start_time) * 1000
                return ServiceHealth(
                    status="up",
                    duration_ms=duration_ms,
                    details=f"Database connection successful (SQLite)"
                )
            else:
                duration_ms = (time.time() - start_time) * 1000
                return ServiceHealth(
                    status="down",
                    duration_ms=duration_ms,
                    error="SELECT 1 query failed"
                )
                
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        return ServiceHealth(
            status="down",
            duration_ms=duration_ms,
            error=f"Database health check failed: {str(e)}"
        )


async def check_walacor_health() -> ServiceHealth:
    """Check Walacor service health with HEAD request."""
    start_time = time.time()
    
    try:
        if not wal_service:
            return ServiceHealth(
                status="down",
                duration_ms=0.0,
                error="Walacor service not initialized"
            )
        
        # Get Walacor base URL
        walacor_host = os.getenv("WALACOR_HOST")
        if not walacor_host:
            return ServiceHealth(
                status="down",
                duration_ms=0.0,
                error="WALACOR_HOST not configured"
            )
        
        # Ensure URL has protocol
        if not walacor_host.startswith(("http://", "https://")):
            walacor_url = f"http://{walacor_host}"
        else:
            walacor_url = walacor_host
        
        # Perform HEAD request with timeout
        timeout = aiohttp.ClientTimeout(total=5.0)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.head(walacor_url) as response:
                duration_ms = (time.time() - start_time) * 1000
                
                if response.status < 500:  # Accept any non-server error
                    return ServiceHealth(
                        status="up",
                        duration_ms=duration_ms,
                        details=f"Walacor service responding (HTTP {response.status})"
                    )
                else:
                    return ServiceHealth(
                        status="down",
                        duration_ms=duration_ms,
                        error=f"Walacor service error (HTTP {response.status})"
                    )
                    
    except asyncio.TimeoutError:
        duration_ms = (time.time() - start_time) * 1000
        return ServiceHealth(
            status="down",
            duration_ms=duration_ms,
            error="Walacor service timeout"
        )
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        return ServiceHealth(
            status="down",
            duration_ms=duration_ms,
            error=f"Walacor health check failed: {str(e)}"
        )


async def check_storage_health() -> ServiceHealth:
    """Check S3 storage health with bucket HEAD request."""
    start_time = time.time()
    
    try:
        if not BOTO3_AVAILABLE:
            return ServiceHealth(
                status="down",
                duration_ms=0.0,
                error="boto3 not available - S3 service not configured"
            )
        
        # Check if S3 is configured
        bucket_name = os.getenv("AWS_S3_BUCKET")
        if not bucket_name:
            return ServiceHealth(
                status="down",
                duration_ms=0.0,
                error="AWS_S3_BUCKET not configured"
            )
        
        # Initialize S3 client
        s3_client = boto3.client(
            's3',
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )
        
        # Perform HEAD bucket request
        s3_client.head_bucket(Bucket=bucket_name)
        
        duration_ms = (time.time() - start_time) * 1000
        return ServiceHealth(
            status="up",
            duration_ms=duration_ms,
            details=f"S3 bucket '{bucket_name}' accessible"
        )
        
    except ClientError as e:
        duration_ms = (time.time() - start_time) * 1000
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        return ServiceHealth(
            status="down",
            duration_ms=duration_ms,
            error=f"S3 bucket error ({error_code}): {str(e)}"
        )
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        return ServiceHealth(
            status="down",
            duration_ms=duration_ms,
            error=f"S3 health check failed: {str(e)}"
        )


# JSON document ingestion endpoint
@app.post("/api/ingest-json", response_model=StandardResponse)
async def ingest_json(
    file: UploadFile = File(..., description="JSON file to ingest"),
    request: IngestJsonRequest = Depends(),
    services: dict = Depends(get_services)
):
    """
    Ingest a JSON document.
    
    Accepts a JSON file and processes it for integrity verification.
    """
    try:
        logger.info(f"Ingesting JSON file: {file.filename} for loan: {request.loan_id}")
        
        # Read file content
        content = await file.read()
        
        # Parse JSON
        try:
            json_data = json.loads(content.decode('utf-8'))
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid JSON format: {str(e)}"
            )
        
        # Process JSON with JSONHandler
        result = services["json_handler"].process_json_artifact(json_data, 'loan')
        
        if not result['is_valid']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"JSON validation failed: {', '.join(result['errors'])}"
            )
        
        # HYBRID APPROACH: Store blockchain seal and local metadata
        if services["wal_service"] is None:
            # Fallback if Walacor service is not available
            walacor_result = {
                "tx_id": "WAL_TX_JSON_" + datetime.now().strftime("%Y%m%d%H%M%S"),
                "seal_info": {"integrity_seal": f"SEAL_{result['hash'][:16]}_{int(datetime.now().timestamp())}"},
                "local_metadata": {
                    "loan_id": request.loan_id,
                    "document_type": "json",
                    "file_size": len(content),
                    "file_path": f"data/documents/{file.filename}",
                    "uploaded_by": request.created_by,
                    "upload_timestamp": datetime.now().isoformat()
                }
            }
        else:
            walacor_result = services["wal_service"].store_document_hash(
                loan_id=request.loan_id,
                document_type="json",
                document_hash=result['hash'],
                file_size=len(content),
                file_path=f"data/documents/{file.filename}",
                uploaded_by=request.created_by
            )
        
        # Store in database with hybrid data
        artifact_id = services["db"].insert_artifact(
            loan_id=request.loan_id,
            artifact_type="json",
            etid=100002,  # ETID for JSON artifacts
            payload_sha256=result['hash'],
            walacor_tx_id=walacor_result.get("tx_id", "WAL_TX_JSON_" + datetime.now().strftime("%Y%m%d%H%M%S")),
            created_by=request.created_by,
            blockchain_seal=walacor_result.get("seal_info", {}).get("integrity_seal"),
            local_metadata=walacor_result.get("local_metadata", {})
        )
        
        # Log event
        services["db"].insert_event(
            artifact_id=artifact_id,
            event_type="uploaded",
            created_by=request.created_by,
            payload_json=json.dumps({"filename": file.filename, "file_size": len(content)})
        )
        
        logger.info(f"✅ JSON document ingested successfully: {artifact_id}")
        
        ingest_data = {
            "message": "JSON document ingested successfully",
            "artifact_id": artifact_id,
            "hash": result['hash'],
            "file_count": 1,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return create_success_response(ingest_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"JSON ingestion failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"JSON ingestion failed: {str(e)}"
        )


# Multi-file packet ingestion endpoint
@app.post("/api/ingest-packet", response_model=StandardResponse)
async def ingest_packet(
    files: List[UploadFile] = File(..., description="Files to ingest as a packet"),
    request: IngestPacketRequest = Depends(),
    services: dict = Depends(get_services)
):
    """
    Ingest a multi-file packet.
    
    Accepts multiple files and creates a manifest for the packet.
    """
    try:
        logger.info(f"Ingesting packet with {len(files)} files for loan: {request.loan_id}")
        
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files provided"
            )
        
        # Process each file
        file_infos = []
        for file in files:
            # Read file content
            content = await file.read()
            
            # Calculate hash
            file_hash = services["doc_handler"].calculate_hash_from_bytes(content)
            
            # Create file info
            file_info = {
                "name": file.filename,
                "uri": f"temp://{file.filename}",  # In production, this would be a real URI
                "sha256": file_hash,
                "size": len(content),
                "contentType": file.content_type or "application/octet-stream"
            }
            file_infos.append(file_info)
        
        # Create manifest
        manifest = services["manifest_handler"].create_manifest(
            loan_id=request.loan_id,
            files=file_infos,
            attestations=[],
            created_by=request.created_by,
            artifact_type="loan_packet"
        )
        
        # Process manifest
        manifest_result = services["manifest_handler"].process_manifest(manifest)
        
        if not manifest_result['is_valid']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Manifest validation failed: {', '.join(manifest_result['errors'])}"
            )
        
        # HYBRID APPROACH: Store blockchain seal and local metadata for packet
        total_size = sum(file_info["size"] for file_info in file_infos)
        if services["wal_service"] is None:
            # Fallback if Walacor service is not available
            walacor_result = {
                "tx_id": "WAL_TX_PACKET_" + datetime.now().strftime("%Y%m%d%H%M%S"),
                "seal_info": {"integrity_seal": f"SEAL_{manifest_result['hash'][:16]}_{int(datetime.now().timestamp())}"},
                "local_metadata": {
                    "loan_id": request.loan_id,
                    "document_type": "loan_packet",
                    "file_size": total_size,
                    "file_path": f"data/documents/packet_{request.loan_id}",
                    "uploaded_by": request.created_by,
                    "upload_timestamp": datetime.now().isoformat()
                }
            }
        else:
            walacor_result = services["wal_service"].store_document_hash(
                loan_id=request.loan_id,
                document_type="loan_packet",
                document_hash=manifest_result['hash'],
                file_size=total_size,
                file_path=f"data/documents/packet_{request.loan_id}",
                uploaded_by=request.created_by
            )
        
        # Store in database with hybrid data
        artifact_id = services["db"].insert_artifact(
            loan_id=request.loan_id,
            artifact_type="loan_packet",
            etid=100001,  # ETID for loan packets
            payload_sha256=manifest_result['hash'],
            walacor_tx_id=walacor_result.get("tx_id", "WAL_TX_PACKET_" + datetime.now().strftime("%Y%m%d%H%M%S")),
            created_by=request.created_by,
            manifest_sha256=manifest_result['hash'],
            blockchain_seal=walacor_result.get("seal_info", {}).get("integrity_seal"),
            local_metadata=walacor_result.get("local_metadata", {})
        )
        
        # Store file information
        for file_info in file_infos:
            services["db"].insert_artifact_file(
                artifact_id=artifact_id,
                name=file_info["name"],
                uri=file_info["uri"],
                sha256=file_info["sha256"],
                size_bytes=file_info["size"],
                content_type=file_info["contentType"]
            )
        
        # Log event
        services["db"].insert_event(
            artifact_id=artifact_id,
            event_type="uploaded",
            created_by=request.created_by,
            payload_json=json.dumps({
                "file_count": len(files),
                "total_size": sum(f["size"] for f in file_infos),
                "manifest_hash": manifest_result['hash']
            })
        )
        
        logger.info(f"✅ Packet ingested successfully: {artifact_id}")
        
        ingest_data = {
            "message": "Packet ingested successfully",
            "artifact_id": artifact_id,
            "hash": manifest_result['hash'],
            "file_count": len(files),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return create_success_response(ingest_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Packet ingestion failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Packet ingestion failed: {str(e)}"
        )


# Document intelligence endpoint
@app.post("/api/extract-document-data", response_model=StandardResponse)
async def extract_document_data(
    file: UploadFile = File(..., description="Document file to extract data from"),
    services: dict = Depends(get_services)
):
    """
    Extract structured data from uploaded documents using AI-powered document intelligence.
    
    This endpoint uses OCR, pattern recognition, and machine learning to automatically
    extract key information from various document types including PDFs, Word docs,
    Excel files, images, and JSON documents.
    """
    try:
        logger.info(f"Extracting data from document: {file.filename}")
        
        # Read file content
        content = await file.read()
        
        # Extract structured data using document intelligence service
        extracted_data = services["document_intelligence"].extract_structured_data(
            file_content=content,
            filename=file.filename or "unknown",
            content_type=file.content_type or "application/octet-stream"
        )
        
        # Auto-populate form data
        form_data = services["document_intelligence"].auto_populate_form(extracted_data)
        
        # Validate business rules
        is_valid, validation_errors = services["document_intelligence"].validate_business_rules(extracted_data)
        
        # Calculate confidence score based on extracted fields
        confidence = len(extracted_data.get('extracted_fields', {})) / len(services["document_intelligence"].data_extractors)
        
        result = {
            "document_type": extracted_data.get('document_type', 'unknown'),
            "document_classification": extracted_data.get('document_classification', 'unknown'),
            "extracted_fields": extracted_data.get('extracted_fields', {}),
            "form_data": form_data,
            "confidence": min(confidence, 1.0),
            "validation": {
                "is_valid": is_valid,
                "errors": validation_errors
            },
            "metadata": {
                "filename": file.filename,
                "content_type": file.content_type,
                "file_size": len(content),
                "extraction_timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
        logger.info(f"✅ Document data extracted successfully: {file.filename}")
        
        return create_success_response(result)
        
    except Exception as e:
        logger.error(f"Document extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document extraction failed: {str(e)}"
        )


# Manifest verification endpoint
@app.post("/api/verify-manifest", response_model=StandardResponse)
async def verify_manifest(
    manifest: Dict[str, Any],
    services: dict = Depends(get_services)
):
    """
    Verify a manifest.
    
    Validates and processes a manifest document.
    """
    try:
        logger.info("Verifying manifest")
        
        # Process manifest
        result = services["manifest_handler"].process_manifest(manifest)
        
        logger.info(f"Manifest verification completed: valid={result['is_valid']}")
        
        verify_data = {
            "message": "Manifest verification completed",
            "is_valid": result['is_valid'],
            "hash": result['hash'],
            "errors": result['errors'],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return create_success_response(verify_data)
        
    except Exception as e:
        logger.error(f"Manifest verification failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Manifest verification failed: {str(e)}"
        )


# Get artifact details endpoint
@app.get("/api/artifacts/{artifact_id}", response_model=StandardResponse)
async def get_artifact(
    artifact_id: str,
    services: dict = Depends(get_services)
):
    """
    Get artifact details.
    
    Retrieves detailed information about a specific artifact.
    """
    try:
        logger.info(f"Retrieving artifact: {artifact_id}")
        
        # Get artifact from database
        artifact = services["db"].get_artifact_by_id(artifact_id)
        
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Artifact not found: {artifact_id}"
            )
        
        # Convert to response format
        artifact_data = {
            "id": artifact.id,
            "loan_id": artifact.loan_id,
            "artifact_type": artifact.artifact_type,
            "payload_sha256": artifact.payload_sha256,
            "manifest_sha256": artifact.manifest_sha256,
            "walacor_tx_id": artifact.walacor_tx_id,
            "created_by": artifact.created_by,
            "created_at": artifact.created_at.isoformat(),
            "files": [{
                "id": f.id,
                "name": f.name,
                "uri": f.uri,
                "sha256": f.sha256,
                "size": f.size_bytes,
                "content_type": f.content_type
            } for f in artifact.files],
            "events": [{
                "id": e.id,
                "event_type": e.event_type,
                "created_by": e.created_by,
                "created_at": e.created_at.isoformat(),
                "payload_json": e.payload_json,
                "walacor_tx_id": e.walacor_tx_id
            } for e in artifact.events]
        }
        
        return create_success_response(artifact_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve artifact: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve artifact: {str(e)}"
        )


# Get artifact events endpoint
@app.get("/api/artifacts/{artifact_id}/events", response_model=StandardResponse)
async def get_artifact_events(
    artifact_id: str,
    services: dict = Depends(get_services)
):
    """
    Get artifact events.
    
    Retrieves all events associated with a specific artifact.
    """
    try:
        logger.info(f"Retrieving events for artifact: {artifact_id}")
        
        # Get events from database
        events = services["db"].get_artifact_events(artifact_id)
        
        # Convert to response format
        events_data = [
            {
                "id": event.id,
                "artifact_id": event.artifact_id,
                "event_type": event.event_type,
                "created_by": event.created_by,
                "created_at": event.created_at.isoformat(),
                "payload_json": event.payload_json,
                "walacor_tx_id": event.walacor_tx_id
            }
            for event in events
        ]
        
        return create_success_response({"events": events_data})
        
    except Exception as e:
        logger.error(f"Failed to retrieve artifact events: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve artifact events: {str(e)}"
        )


# Get system statistics endpoint
@app.get("/api/stats", response_model=StandardResponse)
async def get_stats(services: dict = Depends(get_services)):
    """
    Get system statistics.
    
    Returns comprehensive statistics about the system.
    """
    try:
        logger.info("Retrieving system statistics")
        
        # Get database info
        db_info = services["db"].get_database_info()
        table_counts = db_info.get('table_counts', {})
        
        # Calculate statistics
        total_artifacts = table_counts.get('artifacts', 0)
        total_files = table_counts.get('artifact_files', 0)
        total_events = table_counts.get('artifact_events', 0)
        
        # Get artifacts by type (simplified for demo)
        artifacts_by_type = {
            "json": total_artifacts // 2,
            "loan_packet": total_artifacts - (total_artifacts // 2)
        }
        
        # Recent activity (simplified for demo)
        recent_activity = [
            {
                "type": "artifact_created",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "details": "New artifact created"
            }
        ]
        
        stats_data = {
            "total_artifacts": total_artifacts,
            "total_files": total_files,
            "total_events": total_events,
            "artifacts_by_type": artifacts_by_type,
            "recent_activity": recent_activity,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return create_success_response(stats_data)
        
    except Exception as e:
        logger.error(f"Failed to retrieve statistics: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )


# Seal endpoint - POST /api/seal
@app.post("/api/seal", response_model=StandardResponse)
async def seal_artifact(
    request: SealRequest,
    services: dict = Depends(get_services)
):
    """
    Seal an artifact in Walacor blockchain.
    
    Creates or retrieves an artifact and seals it in the Walacor blockchain,
    recording the audit event.
    """
    start_time = time.time()
    
    # Extract logging data
    user_id = extract_user_id_from_request(request.dict())
    etid = request.etid
    hash_prefix = extract_hash_prefix(request.payloadHash)
    
    # Log request start
    log_endpoint_start(
        endpoint="/api/seal",
        method="POST",
        request_data=request.dict(),
        user_id=user_id,
        etid=etid,
        hash_prefix=hash_prefix
    )
    
    try:
        logger.info(f"Sealing artifact: etid={request.etid}, hash={request.payloadHash[:16]}...")
        
        # Validate payload hash
        if len(request.payloadHash) != 64:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="payloadHash must be a 64-character SHA-256 hash"
            )
        
        # Create or get artifact using UPSERT
        artifact_id = services["db"].create_or_get_artifact(
            etid=request.etid,
            payload_hash=request.payloadHash,
            external_uri=request.externalUri,
            metadata=request.metadata,
            created_by="api_seal"
        )
        
        # Get artifact details
        artifact = services["db"].get_artifact_by_id(artifact_id)
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artifact not found after creation"
            )
        
        # Seal in Walacor (if service is available)
        walacor_tx_id = artifact.walacor_tx_id
        proof_bundle = {}
        
        if services["wal_service"]:
            try:
                # Call Walacor seal service
                seal_result = services["wal_service"].seal_document(
                    etid=request.etid,
                    payload_hash=request.payloadHash,
                    metadata=request.metadata
                )
                walacor_tx_id = seal_result.get("transaction_id", walacor_tx_id)
                proof_bundle = seal_result.get("proof_bundle", {})
                logger.info(f"✅ Artifact sealed in Walacor: {walacor_tx_id}")
            except Exception as e:
                logger.warning(f"⚠️ Walacor sealing failed: {e}")
                proof_bundle = {"error": "Walacor service unavailable", "details": str(e)}
        else:
            logger.warning("⚠️ Walacor service not available")
            proof_bundle = {"error": "Walacor service not configured"}
        
        # Record audit event
        services["db"].insert_event(
            artifact_id=artifact_id,
            event_type="sealed",
            created_by="api_seal",
            payload_json=json.dumps({
                "etid": request.etid,
                "external_uri": request.externalUri,
                "walacor_tx_id": walacor_tx_id,
                "proof_bundle": proof_bundle
            }),
            walacor_tx_id=walacor_tx_id
        )
        
        logger.info(f"✅ Artifact sealed successfully: {artifact_id}")
        
        seal_data = {
            "message": "Artifact sealed successfully",
            "artifact_id": artifact_id,
            "walacor_tx_id": walacor_tx_id,
            "sealed_at": datetime.now(timezone.utc).isoformat(),
            "proof_bundle": proof_bundle
        }
        
        # Log successful completion
        latency_ms = (time.time() - start_time) * 1000
        log_endpoint_request(
            endpoint="/api/seal",
            method="POST",
            request_data=request.dict(),
            user_id=user_id,
            etid=etid,
            hash_prefix=hash_prefix,
            latency_ms=latency_ms,
            result="success",
            artifact_id=artifact_id,
            walacor_tx_id=walacor_tx_id
        )
        
        return create_success_response(seal_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to seal artifact: {e}")
        logger.error(traceback.format_exc())
        
        # Log error
        latency_ms = (time.time() - start_time) * 1000
        log_endpoint_request(
            endpoint="/api/seal",
            method="POST",
            request_data=request.dict(),
            user_id=user_id,
            etid=etid,
            hash_prefix=hash_prefix,
            latency_ms=latency_ms,
            result="error",
            error=str(e)
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="SEAL_ERROR",
                message="Failed to seal artifact",
                details={"error": str(e)}
            ).dict()
        )


# Verify endpoint - POST /api/verify
@app.post("/api/verify", response_model=StandardResponse)
async def verify_artifact(
    request: VerifyRequest,
    services: dict = Depends(get_services)
):
    """
    Verify an artifact's integrity.
    
    Verifies the artifact against the stored hash and records the audit event.
    """
    start_time = time.time()
    
    # Extract logging data
    user_id = extract_user_id_from_request(request.dict())
    etid = request.etid
    hash_prefix = extract_hash_prefix(request.payloadHash)
    
    # Log request start
    log_endpoint_start(
        endpoint="/api/verify",
        method="POST",
        request_data=request.dict(),
        user_id=user_id,
        etid=etid,
        hash_prefix=hash_prefix
    )
    
    try:
        logger.info(f"Verifying artifact: etid={request.etid}, hash={request.payloadHash[:16]}...")
        
        # Validate payload hash
        if len(request.payloadHash) != 64:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="payloadHash must be a 64-character SHA-256 hash"
            )
        
        # Find artifact by etid and payload hash
        from src.models import Artifact
        artifact = services["db"].session.query(Artifact).filter(
            Artifact.etid == request.etid,
            Artifact.payload_sha256 == request.payloadHash
        ).first()
        
        if not artifact:
            # Record failed verification
            services["db"].insert_event(
                artifact_id="unknown",
                event_type="verification_failed",
                created_by="api_verify",
                payload_json=json.dumps({
                    "etid": request.etid,
                    "payload_hash": request.payloadHash,
                    "reason": "artifact_not_found"
                })
            )
            
            verify_data = {
                "message": "Artifact not found",
                "is_valid": False,
                "status": "tamper",
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "details": {"reason": "artifact_not_found", "etid": request.etid}
            }
            return create_success_response(verify_data)
        
        # Verify against stored hash
        is_valid = artifact.payload_sha256 == request.payloadHash
        status_result = "ok" if is_valid else "tamper"
        
        # Record verification event
        services["db"].insert_event(
            artifact_id=artifact.id,
            event_type="verified",
            created_by="api_verify",
            payload_json=json.dumps({
                "etid": request.etid,
                "payload_hash": request.payloadHash,
                "stored_hash": artifact.payload_sha256,
                "is_valid": is_valid,
                "status": status_result
            })
        )
        
        logger.info(f"✅ Artifact verification completed: {artifact.id} - {status_result}")
        
        verify_data = {
            "message": f"Artifact verification {'passed' if is_valid else 'failed'}",
            "is_valid": is_valid,
            "status": status_result,
            "artifact_id": artifact.id,
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "details": {
                "stored_hash": artifact.payload_sha256,
                "provided_hash": request.payloadHash,
                "artifact_type": artifact.artifact_type,
                "created_at": artifact.created_at.isoformat()
            }
        }
        # Log successful completion
        latency_ms = (time.time() - start_time) * 1000
        log_endpoint_request(
            endpoint="/api/verify",
            method="POST",
            request_data=request.dict(),
            user_id=user_id,
            etid=etid,
            hash_prefix=hash_prefix,
            latency_ms=latency_ms,
            result="success",
            is_valid=is_valid,
            status=status_result,
            artifact_id=artifact.id
        )
        
        return create_success_response(verify_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify artifact: {e}")
        logger.error(traceback.format_exc())
        
        # Log error
        latency_ms = (time.time() - start_time) * 1000
        log_endpoint_request(
            endpoint="/api/verify",
            method="POST",
            request_data=request.dict(),
            user_id=user_id,
            etid=etid,
            hash_prefix=hash_prefix,
            latency_ms=latency_ms,
            result="error",
            error=str(e)
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify artifact: {str(e)}"
        )


# Proof endpoint - GET /api/proof
@app.get("/api/proof", response_model=StandardResponse)
async def get_proof(
    id: str = Query(..., description="Artifact ID"),
    services: dict = Depends(get_services)
):
    """
    Get proof bundle from Walacor for an artifact.
    
    Streams the proof bundle from Walacor blockchain.
    """
    try:
        logger.info(f"Retrieving proof bundle for artifact: {id}")
        
        # Get artifact
        artifact = services["db"].get_artifact_by_id(id)
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artifact not found"
            )
        
        # Get proof bundle from Walacor (if service is available)
        proof_bundle = {}
        
        if services["wal_service"]:
            try:
                # Call Walacor to get proof bundle
                proof_result = services["wal_service"].get_proof_bundle(
                    artifact_id=id,
                    etid=artifact.etid
                )
                proof_bundle = proof_result.get("proof_bundle", {})
                logger.info(f"✅ Proof bundle retrieved from Walacor for: {id}")
            except Exception as e:
                logger.warning(f"⚠️ Walacor proof retrieval failed: {e}")
                proof_bundle = {
                    "error": "Walacor service unavailable",
                    "details": str(e),
                    "artifact_id": id,
                    "etid": artifact.etid,
                    "walacor_tx_id": artifact.walacor_tx_id
                }
        else:
            logger.warning("⚠️ Walacor service not available")
            proof_bundle = {
                "error": "Walacor service not configured",
                "artifact_id": id,
                "etid": artifact.etid,
                "walacor_tx_id": artifact.walacor_tx_id
            }
        
        # Record proof retrieval event
        services["db"].insert_event(
            artifact_id=id,
            event_type="proof_retrieved",
            created_by="api_proof",
            payload_json=json.dumps({
                "etid": artifact.etid,
                "proof_bundle_size": len(str(proof_bundle))
            })
        )
        
        proof_data = {
            "proof_bundle": proof_bundle,
            "artifact_id": id,
            "etid": artifact.etid,
            "retrieved_at": datetime.now(timezone.utc).isoformat()
        }
        return create_success_response(proof_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve proof bundle: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve proof bundle: {str(e)}"
        )


# S3 Presign endpoint - POST /api/storage/s3/presign
@app.post("/api/storage/s3/presign", response_model=StandardResponse)
async def presign_s3_upload(
    request: PresignRequest,
    services: dict = Depends(get_services)
):
    """
    Generate presigned URL for S3 upload.
    
    Returns presigned PUT URL and object URL with validation.
    """
    try:
        logger.info(f"Generating S3 presigned URL for key: {request.key}")
        
        # Check if boto3 is available
        if not BOTO3_AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 service not available - boto3 not installed"
            )
        
        # Validate content type
        allowed_types = [
            "application/pdf",
            "application/json",
            "text/plain",
            "image/jpeg",
            "image/png",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]
        
        if request.contentType not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Content type '{request.contentType}' not allowed. Allowed types: {allowed_types}"
            )
        
        # Validate file size (max 50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        if request.size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size {request.size} exceeds maximum allowed size of {max_size} bytes"
            )
        
        # Get S3 configuration from environment
        bucket_name = os.getenv("AWS_S3_BUCKET", "integrityx-documents")
        region = os.getenv("AWS_REGION", "us-east-1")
        
        # Initialize S3 client
        try:
            s3_client = boto3.client(
                's3',
                region_name=region,
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
            )
        except Exception as e:
            logger.error(f"S3 client initialization failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 service not available"
            )
        
        # Generate presigned URL
        try:
            expires_in = min(request.expiresIn, 3600)  # Max 1 hour
            
            put_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': bucket_name,
                    'Key': request.key,
                    'ContentType': request.contentType,
                    'ContentLength': request.size
                },
                ExpiresIn=expires_in
            )
            
            object_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/{request.key}"
            expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()
            
            logger.info(f"✅ S3 presigned URL generated for: {request.key}")
            
            presign_data = {
                "putUrl": put_url,
                "objectUrl": object_url,
                "expiresAt": expires_at,
                "key": request.key
            }
            return create_success_response(presign_data)
            
        except ClientError as e:
            logger.error(f"S3 presigned URL generation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate presigned URL: {str(e)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate S3 presigned URL: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate S3 presigned URL: {str(e)}"
        )


async def get_dashboard_aggregate(period: str, services: dict):
    """
    Calculate dashboard aggregate metrics for the specified period.
    
    Args:
        period: Time period (e.g., '7d', '30d')
        services: Dictionary of initialized services
    
    Returns:
        Dashboard metrics including sealed, verify success, and tamper stats
    """
    try:
        # Parse period
        days = 7  # default
        if period.endswith('d'):
            try:
                days = int(period[:-1])
            except ValueError:
                days = 7
        
        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Get events for the period
        from src.models import ArtifactEvent
        events_query = services["db"].session.query(ArtifactEvent).filter(
            ArtifactEvent.created_at >= start_date,
            ArtifactEvent.created_at <= end_date
        )
        
        all_events = events_query.all()
        
        # Initialize metrics
        sealed_count = 0
        verify_success_count = 0
        verify_total_count = 0
        tamper_count = 0
        
        # Count events by type
        for event in all_events:
            if event.event_type in ['sealed', 'uploaded']:
                sealed_count += 1
            elif event.event_type in ['verified']:
                verify_success_count += 1
                verify_total_count += 1
            elif event.event_type in ['verification_failed', 'tamper_detected']:
                tamper_count += 1
                verify_total_count += 1
        
        # Calculate daily aggregates for sparkline
        daily_sealed = []
        daily_verify_success = []
        daily_tamper = []
        
        for i in range(days):
            day_start = start_date + timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            day_events = [e for e in all_events if day_start <= e.created_at < day_end]
            
            day_sealed = sum(1 for e in day_events if e.event_type in ['sealed', 'uploaded'])
            day_verify = sum(1 for e in day_events if e.event_type in ['verified'])
            day_verify_total = sum(1 for e in day_events if e.event_type in ['verified', 'verification_failed', 'tamper_detected'])
            day_tamper = sum(1 for e in day_events if e.event_type in ['verification_failed', 'tamper_detected'])
            
            daily_sealed.append(day_sealed)
            daily_verify_success.append((day_verify / day_verify_total * 100) if day_verify_total > 0 else 0)
            daily_tamper.append(day_tamper)
        
        # Calculate trends (compare last half with first half)
        mid_point = days // 2
        
        sealed_first_half = sum(daily_sealed[:mid_point]) / mid_point if mid_point > 0 else 0
        sealed_second_half = sum(daily_sealed[mid_point:]) / (days - mid_point) if (days - mid_point) > 0 else 0
        sealed_trend = ((sealed_second_half - sealed_first_half) / sealed_first_half * 100) if sealed_first_half > 0 else 0
        
        verify_first_half = sum(daily_verify_success[:mid_point]) / mid_point if mid_point > 0 else 0
        verify_second_half = sum(daily_verify_success[mid_point:]) / (days - mid_point) if (days - mid_point) > 0 else 0
        verify_trend = ((verify_second_half - verify_first_half) / verify_first_half * 100) if verify_first_half > 0 else 0
        
        tamper_first_half = sum(daily_tamper[:mid_point]) / mid_point if mid_point > 0 else 0
        tamper_second_half = sum(daily_tamper[mid_point:]) / (days - mid_point) if (days - mid_point) > 0 else 0
        tamper_trend = ((tamper_second_half - tamper_first_half) / tamper_first_half * 100) if tamper_first_half > 0 else 0
        
        # Calculate overall verify success percentage
        verify_success_percentage = (verify_success_count / verify_total_count * 100) if verify_total_count > 0 else 0
        
        dashboard_data = {
            "sealed": {
                "total": sealed_count,
                "trend": round(sealed_trend, 2),
                "series": daily_sealed
            },
            "verifySuccess": {
                "percentage": round(verify_success_percentage, 2),
                "trend": round(verify_trend, 2),
                "series": [round(v, 1) for v in daily_verify_success]
            },
            "tamper": {
                "total": tamper_count,
                "trend": round(tamper_trend, 2),
                "series": daily_tamper
            },
            "period": f"{days}d",
            "lastUpdated": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"✅ Dashboard aggregate calculated for {days} days")
        return create_success_response(dashboard_data)
        
    except Exception as e:
        logger.error(f"Failed to calculate dashboard aggregate: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="AGGREGATE_ERROR",
                message="Failed to calculate dashboard metrics",
                details={"error": str(e)}
            ).dict()
        )


# Events endpoint - GET /api/events
@app.get("/api/events", response_model=StandardResponse)
async def get_events(
    etid: Optional[int] = Query(None, description="Filter by Entity Type ID"),
    startDate: Optional[str] = Query(None, description="Start date (ISO format)"),
    endDate: Optional[str] = Query(None, description="End date (ISO format)"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    aggregate: Optional[str] = Query(None, description="Aggregate period (e.g., 7d, 30d)"),
    services: dict = Depends(get_services)
):
    """
    Get paginated list of events with filters or aggregated dashboard data.
    
    Supports filtering by ETID, date range, and status.
    If aggregate parameter is provided (e.g., '7d'), returns dashboard metrics.
    """
    try:
        # Handle aggregate request for dashboard
        if aggregate:
            return await get_dashboard_aggregate(aggregate, services)
        
        logger.info(f"Retrieving events: page={page}, limit={limit}, etid={etid}")
        
        # Build query
        from src.models import ArtifactEvent, Artifact
        query = services["db"].session.query(ArtifactEvent)
        
        # Apply filters
        if etid is not None:
            # Join with artifacts table to filter by etid
            query = query.join(Artifact).filter(
                Artifact.etid == etid
            )
        
        if startDate:
            try:
                start_dt = datetime.fromisoformat(startDate.replace('Z', '+00:00'))
                query = query.filter(ArtifactEvent.created_at >= start_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid startDate format. Use ISO format (e.g., 2024-01-01T00:00:00Z)"
                )
        
        if endDate:
            try:
                end_dt = datetime.fromisoformat(endDate.replace('Z', '+00:00'))
                query = query.filter(ArtifactEvent.created_at <= end_dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid endDate format. Use ISO format (e.g., 2024-01-01T00:00:00Z)"
                )
        
        if status_filter:
            # Map status to event types
            status_mapping = {
                "ok": ["verified", "sealed", "uploaded"],
                "tamper": ["verification_failed", "tamper_detected"],
                "error": ["error", "failed"]
            }
            
            if status_filter in status_mapping:
                query = query.filter(ArtifactEvent.event_type.in_(status_mapping[status_filter]))
            else:
                query = query.filter(ArtifactEvent.event_type == status_filter)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        events = query.order_by(ArtifactEvent.created_at.desc()).offset(offset).limit(limit).all()
        
        # Convert to dict format
        events_data = []
        for event in events:
            event_dict = event.to_dict()
            # Add artifact etid if available
            if hasattr(event, 'artifact') and event.artifact:
                event_dict['artifact_etid'] = event.artifact.etid
            events_data.append(event_dict)
        
        # Calculate pagination info
        has_next = (offset + limit) < total
        has_prev = page > 1
        
        logger.info(f"✅ Retrieved {len(events_data)} events (total: {total})")
        
        events_data_response = {
            "events": events_data,
            "total": total,
            "page": page,
            "limit": limit,
            "has_next": has_next,
            "has_prev": has_prev
        }
        return create_success_response(events_data_response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve events: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve events: {str(e)}"
        )


# Attestation endpoints
@app.post("/api/attestations", response_model=StandardResponse)
@with_structured_logging
async def create_attestation(
    attestation_data: AttestationIn,
    services: dict = Depends(get_services)
):
    """
    Create a new attestation for an artifact.
    
    Creates an attestation record and logs an audit event.
    """
    try:
        # Validate that the artifact exists
        artifact = services["db"].get_artifact_by_id(attestation_data.artifactId)
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    code="ARTIFACT_NOT_FOUND",
                    message=f"Artifact {attestation_data.artifactId} not found"
                ).dict()
            )
        
        # Create the attestation
        attestation = services["attestation_repo"].create(
            session=services["db"].session,
            artifact_id=attestation_data.artifactId,
            etid=attestation_data.etid,
            kind=attestation_data.kind,
            issued_by=attestation_data.issuedBy,
            details=attestation_data.details
        )
        
        # Commit the transaction
        services["db"].session.commit()
        
        # Log audit event
        services["db"].insert_event(
            artifact_id=attestation_data.artifactId,
            event_type="attestation",
            payload_json=json.dumps({
                "attestation_id": attestation.id,
                "kind": attestation_data.kind,
                "issued_by": attestation_data.issuedBy
            }),
            created_by=attestation_data.issuedBy
        )
        
        # Convert to response format
        attestation_out = AttestationOut(
            id=attestation.id,
            artifactId=attestation.artifact_id,
            etid=attestation.etid,
            kind=attestation.kind,
            issuedBy=attestation.issued_by,
            details=attestation.details,
            createdAt=attestation.created_at
        )
        
        logger.info(f"✅ Created attestation {attestation.id} for artifact {attestation_data.artifactId}")
        return create_success_response(attestation_out.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        services["db"].session.rollback()
        logger.error(f"Failed to create attestation: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="ATTESTATION_CREATION_FAILED",
                message="Failed to create attestation",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/attestations", response_model=StandardResponse)
@with_structured_logging
async def list_attestations(
    artifactId: str = Query(..., description="Artifact ID"),
    limit: int = Query(default=50, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(default=0, ge=0, description="Number of results to skip"),
    services: dict = Depends(get_services)
):
    """
    List attestations for a specific artifact.
    
    Returns paginated list of attestations with optional filtering.
    """
    try:
        # Validate that the artifact exists
        artifact = services["db"].get_artifact_by_id(artifactId)
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    code="ARTIFACT_NOT_FOUND",
                    message=f"Artifact {artifactId} not found"
                ).dict()
            )
        
        # Get attestations
        attestations = services["attestation_repo"].list_for_artifact(
            session=services["db"].session,
            artifact_id=artifactId,
            limit=limit,
            offset=offset
        )
        
        # Convert to response format
        attestations_out = []
        for attestation in attestations:
            attestations_out.append(AttestationOut(
                id=attestation.id,
                artifactId=attestation.artifact_id,
                etid=attestation.etid,
                kind=attestation.kind,
                issuedBy=attestation.issued_by,
                details=attestation.details,
                createdAt=attestation.created_at
            ).dict())
        
        logger.info(f"✅ Retrieved {len(attestations_out)} attestations for artifact {artifactId}")
        return create_success_response({
            "attestations": attestations_out,
            "total": len(attestations_out),
            "limit": limit,
            "offset": offset
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list attestations: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="ATTESTATION_LIST_FAILED",
                message="Failed to list attestations",
                details={"error": str(e)}
            ).dict()
        )


# Provenance endpoints
@app.post("/api/provenance/link", response_model=StandardResponse)
@with_structured_logging
async def create_provenance_link(
    link_data: ProvenanceLinkIn,
    services: dict = Depends(get_services)
):
    """
    Create a provenance link between two artifacts.
    
    This operation is idempotent - if a link already exists, returns the existing link.
    """
    try:
        # Validate that both artifacts exist
        parent_artifact = services["db"].get_artifact_by_id(link_data.parentArtifactId)
        if not parent_artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    code="PARENT_ARTIFACT_NOT_FOUND",
                    message=f"Parent artifact {link_data.parentArtifactId} not found"
                ).dict()
            )
        
        child_artifact = services["db"].get_artifact_by_id(link_data.childArtifactId)
        if not child_artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    code="CHILD_ARTIFACT_NOT_FOUND",
                    message=f"Child artifact {link_data.childArtifactId} not found"
                ).dict()
            )
        
        # Create the provenance link (idempotent)
        provenance_link = services["provenance_repo"].link(
            session=services["db"].session,
            parent_id=link_data.parentArtifactId,
            child_id=link_data.childArtifactId,
            relation=link_data.relation
        )
        
        # Commit the transaction
        services["db"].session.commit()
        
        # Convert to response format
        link_out = ProvenanceLinkOut(
            id=provenance_link.id,
            parentArtifactId=provenance_link.parent_artifact_id,
            childArtifactId=provenance_link.child_artifact_id,
            relation=provenance_link.relation,
            createdAt=provenance_link.created_at
        )
        
        logger.info(f"✅ Created provenance link {provenance_link.id}: {link_data.parentArtifactId} -> {link_data.childArtifactId}")
        return create_success_response(link_out.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        services["db"].session.rollback()
        logger.error(f"Failed to create provenance link: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="PROVENANCE_LINK_CREATION_FAILED",
                message="Failed to create provenance link",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/provenance/children", response_model=StandardResponse)
@with_structured_logging
async def list_provenance_children(
    parentId: str = Query(..., description="Parent artifact ID"),
    relation: Optional[str] = Query(None, description="Filter by relation type"),
    services: dict = Depends(get_services)
):
    """
    List all child artifacts for a given parent artifact.
    
    Returns list of provenance links with optional relation filtering.
    """
    try:
        # Validate that the parent artifact exists
        parent_artifact = services["db"].get_artifact_by_id(parentId)
        if not parent_artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    code="PARENT_ARTIFACT_NOT_FOUND",
                    message=f"Parent artifact {parentId} not found"
                ).dict()
            )
        
        # Get child links
        child_links = services["provenance_repo"].list_children(
            session=services["db"].session,
            parent_id=parentId,
            relation=relation
        )
        
        # Convert to response format
        links_out = []
        for link in child_links:
            links_out.append(ProvenanceLinkOut(
                id=link.id,
                parentArtifactId=link.parent_artifact_id,
                childArtifactId=link.child_artifact_id,
                relation=link.relation,
                createdAt=link.created_at
            ).dict())
        
        logger.info(f"✅ Retrieved {len(links_out)} child links for parent {parentId}")
        return create_success_response({
            "children": links_out,
            "total": len(links_out)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list provenance children: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="PROVENANCE_CHILDREN_LIST_FAILED",
                message="Failed to list provenance children",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/provenance/parents", response_model=StandardResponse)
@with_structured_logging
async def list_provenance_parents(
    childId: str = Query(..., description="Child artifact ID"),
    relation: Optional[str] = Query(None, description="Filter by relation type"),
    services: dict = Depends(get_services)
):
    """
    List all parent artifacts for a given child artifact.
    
    Returns list of provenance links with optional relation filtering.
    """
    try:
        # Validate that the child artifact exists
        child_artifact = services["db"].get_artifact_by_id(childId)
        if not child_artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    code="CHILD_ARTIFACT_NOT_FOUND",
                    message=f"Child artifact {childId} not found"
                ).dict()
            )
        
        # Get parent links
        parent_links = services["provenance_repo"].list_parents(
            session=services["db"].session,
            child_id=childId,
            relation=relation
        )
        
        # Convert to response format
        links_out = []
        for link in parent_links:
            links_out.append(ProvenanceLinkOut(
                id=link.id,
                parentArtifactId=link.parent_artifact_id,
                childArtifactId=link.child_artifact_id,
                relation=link.relation,
                createdAt=link.created_at
            ).dict())
        
        logger.info(f"✅ Retrieved {len(links_out)} parent links for child {childId}")
        return create_success_response({
            "parents": links_out,
            "total": len(links_out)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list provenance parents: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="PROVENANCE_PARENTS_LIST_FAILED",
                message="Failed to list provenance parents",
                details={"error": str(e)}
            ).dict()
        )


# Disclosure Pack endpoint
@app.get("/api/disclosure-pack")
@with_structured_logging
async def get_disclosure_pack(
    id: str = Query(..., description="Artifact ID"),
    services: dict = Depends(get_services)
):
    """
    Generate a disclosure pack for an artifact.
    
    Returns a ZIP file containing:
    - proof.json: Walacor proof bundle
    - artifact.json: Artifact details
    - attestations.json: List of attestations
    - audit_events.json: Recent audit events
    - manifest.json: Metadata about the disclosure pack
    """
    try:
        # Validate that the artifact exists
        artifact = services["db"].get_artifact_by_id(id)
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    code="ARTIFACT_NOT_FOUND",
                    message=f"Artifact {id} not found"
                ).dict()
            )
        
        # Create in-memory ZIP file
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # 1. Get Walacor proof bundle
            try:
                if services["wal_service"]:
                    proof_bundle = services["wal_service"].get_proof(artifact.walacor_tx_id)
                    zip_file.writestr("proof.json", json.dumps(proof_bundle, indent=2))
                else:
                    zip_file.writestr("proof.json", json.dumps({
                        "error": "Walacor service not available",
                        "walacor_tx_id": artifact.walacor_tx_id
                    }, indent=2))
            except Exception as e:
                logger.warning(f"Failed to get proof bundle: {e}")
                zip_file.writestr("proof.json", json.dumps({
                    "error": f"Failed to retrieve proof bundle: {str(e)}",
                    "walacor_tx_id": artifact.walacor_tx_id
                }, indent=2))
            
            # 2. Artifact details
            artifact_data = artifact.to_dict()
            zip_file.writestr("artifact.json", json.dumps(artifact_data, indent=2))
            
            # 3. Attestations
            attestations = services["attestation_repo"].list_for_artifact(
                session=services["db"].session,
                artifact_id=id,
                limit=100,  # Get up to 100 attestations
                offset=0
            )
            attestations_data = [att.to_dict() for att in attestations]
            zip_file.writestr("attestations.json", json.dumps(attestations_data, indent=2))
            
            # 4. Recent audit events (last 50)
            events = services["db"].get_artifact_events(id, limit=50)
            events_data = [event.to_dict() for event in events]
            zip_file.writestr("audit_events.json", json.dumps(events_data, indent=2))
            
            # 5. Manifest
            manifest_data = {
                "disclosure_pack_version": "1.0",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "artifact_id": id,
                "artifact_hash": artifact.payload_sha256,
                "artifact_etid": artifact.etid,
                "created_at": artifact.created_at.isoformat() if artifact.created_at else None,
                "algorithm": "SHA-256",
                "app_version": "1.0.0",
                "total_attestations": len(attestations_data),
                "total_events": len(events_data),
                "walacor_tx_id": artifact.walacor_tx_id
            }
            zip_file.writestr("manifest.json", json.dumps(manifest_data, indent=2))
        
        # Prepare response
        zip_buffer.seek(0)
        
        def generate():
            yield from zip_buffer
        
        logger.info(f"✅ Generated disclosure pack for artifact {id}")
        
        return StreamingResponse(
            generate(),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="disclosure_{id}.zip"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate disclosure pack: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="DISCLOSURE_PACK_GENERATION_FAILED",
                message="Failed to generate disclosure pack",
                details={"error": str(e)}
            ).dict()
        )


# Verification Portal endpoints
@app.get("/api/verification/test")
async def test_verification_portal():
    """Test endpoint for verification portal."""
    return {"message": "Verification portal is working!"}

@app.post("/api/verification/generate-link", response_model=StandardResponse)
@with_structured_logging
async def generate_verification_link(
    request: VerificationLinkRequest,
    services: dict = Depends(get_services)
):
    """
    Generate a privacy-preserving verification link for third-party document authentication.
    
    Creates a secure, time-limited token that allows third parties to verify document
    authenticity without exposing sensitive borrower information.
    """
    try:
        # Validate that the artifact exists
        artifact = services["db"].get_artifact_by_id(request.documentId)
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    code="ARTIFACT_NOT_FOUND",
                    message=f"Artifact {request.documentId} not found"
                ).dict()
            )
        
        # Generate verification link using the portal
        link_data = services["verification_portal"].generate_verification_link(
            document_id=request.documentId,
            document_hash=request.documentHash,
            allowed_party=request.allowedParty,
            permissions=request.permissions,
            expires_in_hours=request.expiresInHours
        )
        
        # Log audit event
        services["db"].insert_event(
            artifact_id=request.documentId,
            event_type="verification_link_generated",
            payload_json=json.dumps({
                "allowed_party": request.allowedParty,
                "permissions": request.permissions,
                "expires_in_hours": request.expiresInHours
            }),
            created_by="system"
        )
        
        logger.info(f"✅ Generated verification link for artifact {request.documentId}")
        
        return create_success_response({
            "verification_link": VerificationLinkResponse(
                token=link_data["token"],
                verificationUrl=link_data["verification_url"],
                expiresAt=link_data["expires_at"],
                permissions=link_data["permissions"]
            ).dict()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate verification link: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="VERIFICATION_LINK_GENERATION_FAILED",
                message="Failed to generate verification link",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/verification/verify/{token}", response_model=StandardResponse)
@with_structured_logging
async def verify_with_token(
    token: str,
    verifierEmail: str = Query(..., description="Email of the verifier"),
    services: dict = Depends(get_services)
):
    """
    Verify document authenticity using a secure token.
    
    Allows third parties to verify document integrity without exposing sensitive data.
    Only returns information that was explicitly permitted in the verification link.
    """
    try:
        # Verify using the portal
        verification_result = services["verification_portal"].verify_with_token(
            token=token,
            verifier_email=verifierEmail
        )
        
        if not verification_result["is_valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    code="INVALID_VERIFICATION_TOKEN",
                    message="Invalid or expired verification token"
                ).dict()
            )
        
        # Get artifact details for verification response
        artifact = services["db"].get_artifact_by_id(verification_result["document_id"])
        if not artifact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    code="ARTIFACT_NOT_FOUND",
                    message="Artifact not found"
                ).dict()
            )
        
        # Get attestations if permission granted
        attestations_data = []
        if "attestations" in verification_result["permissions"]:
            attestations = services["attestation_repo"].get_by_artifact_id(
                session=services["db"].session,
                artifact_id=artifact.id
            )
            attestations_data = [att.to_dict() for att in attestations]
        
        # Log audit event
        services["db"].insert_event(
            artifact_id=artifact.id,
            event_type="verification_completed",
            payload_json=json.dumps({
                "verifier_email": verifierEmail,
                "permissions_used": verification_result["permissions"],
                "verification_successful": True
            }),
            created_by="system"
        )
        
        logger.info(f"✅ Document verification completed for artifact {artifact.id}")
        
        return create_success_response({
            "verification": VerificationResponse(
                isValid=True,
                documentHash=artifact.payload_sha256,
                timestamp=artifact.created_at,
                attestations=attestations_data,
                permissions=verification_result["permissions"],
                verifiedAt=datetime.now(timezone.utc)
            ).dict()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify document: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="VERIFICATION_FAILED",
                message="Failed to verify document",
                details={"error": str(e)}
            ).dict()
        )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error",
            message="An unexpected error occurred",
            details=str(exc),
            timestamp=datetime.now(timezone.utc).isoformat()
        ).dict()
    )


# Walacor ping endpoint
@app.get("/api/walacor/ping", response_model=StandardResponse)
async def walacor_ping(services: dict = Depends(get_services)):
    """
    Ping Walacor service to test connectivity and measure latency.
    
    Returns connection status and response time.
    """
    start_time = time.time()
    
    try:
        if not services["wal_service"]:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=create_error_response(
                    code="WALACOR_NOT_CONFIGURED",
                    message="Walacor service is not configured"
                ).dict()
            )
        
        # Attempt to ping Walacor service
        ping_result = services["wal_service"].ping()
        
        latency_ms = (time.time() - start_time) * 1000
        
        ping_data = {
            "status": "connected",
            "latency_ms": round(latency_ms, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": ping_result.get("details", "Walacor service is responding")
        }
        
        logger.info(f"✅ Walacor ping successful: {latency_ms:.2f}ms")
        return create_success_response(ping_data)
        
    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        logger.error(f"❌ Walacor ping failed: {e}")
        
        error_data = {
            "status": "failed",
            "latency_ms": round(latency_ms, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": str(e)
        }
        
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=create_error_response(
                code="WALACOR_PING_FAILED",
                message="Failed to ping Walacor service",
                details=error_data
            ).dict()
        )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Walacor Financial Integrity API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


# =============================================================================
# VOICE COMMAND ENDPOINTS
# =============================================================================

class VoiceCommandRequest(BaseModel):
    """Voice command request model."""
    command: str = Field(..., description="The voice command text")
    user_id: str = Field(default="voice_user", description="User ID issuing the command")
    language: str = Field(default="en", description="Language of the command")


class VoiceCommandResponse(BaseModel):
    """Voice command response model."""
    success: bool = Field(..., description="Whether the command was processed successfully")
    operation: str = Field(..., description="The operation that was identified")
    message: str = Field(..., description="Human-readable response message")
    action: Optional[str] = Field(None, description="The action to be performed")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Parameters for the action")
    api_endpoint: Optional[str] = Field(None, description="API endpoint to call")
    method: Optional[str] = Field(None, description="HTTP method to use")
    suggestions: Optional[List[str]] = Field(None, description="Suggested commands if help was requested")


@app.post("/api/voice/process-command", response_model=StandardResponse)
async def process_voice_command(
    request: VoiceCommandRequest,
    services: dict = Depends(get_services)
):
    """
    Process a voice command and return the corresponding API operation.
    
    This endpoint takes a voice command text and converts it into a structured
    API operation that can be executed by the frontend.
    """
    try:
        # Process the voice command
        result = services["voice_processor"].process_voice_command(
            command_text=request.command,
            user_id=request.user_id
        )
        
        # Log the voice command processing (skip if db doesn't support None artifact_id)
        try:
            services["db"].insert_event(
                artifact_id="voice_command",
                event_type="voice_command_processed",
                payload_json=json.dumps({
                    "command": request.command,
                    "user_id": request.user_id,
                    "operation": result.get("operation"),
                    "success": result.get("success")
                }),
                created_by=request.user_id
            )
        except Exception as log_error:
            logger.warning(f"Could not log voice command event: {log_error}")
        
        logger.info(f"✅ Voice command processed: '{request.command}' -> {result.get('operation')}")
        
        return create_success_response({
            "voice_response": VoiceCommandResponse(**result).dict()
        })
        
    except Exception as e:
        logger.error(f"Failed to process voice command: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="VOICE_COMMAND_PROCESSING_FAILED",
                message="Failed to process voice command",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/voice/available-commands", response_model=StandardResponse)
async def get_available_voice_commands(
    services: dict = Depends(get_services)
):
    """
    Get a list of available voice commands and their examples.
    
    Returns all supported voice commands with examples and descriptions.
    """
    try:
        commands = services["voice_processor"].get_available_commands()
        
        logger.info("✅ Retrieved available voice commands")
        
        return create_success_response({
            "commands": commands,
            "total_commands": len(commands)
        })
        
    except Exception as e:
        logger.error(f"Failed to get available voice commands: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="VOICE_COMMANDS_RETRIEVAL_FAILED",
                message="Failed to retrieve available voice commands",
                details={"error": str(e)}
            ).dict()
        )


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@app.get("/api/analytics/system-metrics", response_model=StandardResponse)
async def get_system_metrics(
    services: dict = Depends(get_services)
):
    """
    Get comprehensive system metrics and analytics.
    
    Returns detailed metrics about system performance, document processing,
    attestations, and compliance status.
    """
    try:
        metrics = await services["analytics_service"].get_system_metrics()
        
        logger.info("✅ Retrieved system metrics")
        
        return create_success_response({
            "metrics": metrics
        })
        
    except Exception as e:
        logger.error(f"Failed to get system metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="SYSTEM_METRICS_RETRIEVAL_FAILED",
                message="Failed to retrieve system metrics",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/analytics/documents", response_model=StandardResponse)
async def get_document_analytics(
    artifact_id: Optional[str] = Query(None, description="Specific document ID for analytics"),
    services: dict = Depends(get_services)
):
    """
    Get analytics for documents.
    
    If artifact_id is provided, returns analytics for that specific document.
    Otherwise, returns analytics for all documents.
    """
    try:
        analytics = await services["analytics_service"].get_document_analytics(artifact_id)
        
        logger.info(f"✅ Retrieved document analytics for {'specific document' if artifact_id else 'all documents'}")
        
        return create_success_response({
            "analytics": analytics
        })
        
    except Exception as e:
        logger.error(f"Failed to get document analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="DOCUMENT_ANALYTICS_RETRIEVAL_FAILED",
                message="Failed to retrieve document analytics",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/analytics/attestations", response_model=StandardResponse)
async def get_attestation_analytics(
    services: dict = Depends(get_services)
):
    """
    Get analytics for attestations.
    
    Returns detailed analytics about attestation types, success rates,
    and time series data.
    """
    try:
        analytics = await services["analytics_service"].get_attestation_analytics()
        
        logger.info("✅ Retrieved attestation analytics")
        
        return create_success_response({
            "analytics": analytics
        })
        
    except Exception as e:
        logger.error(f"Failed to get attestation analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="ATTESTATION_ANALYTICS_RETRIEVAL_FAILED",
                message="Failed to retrieve attestation analytics",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/analytics/compliance", response_model=StandardResponse)
async def get_compliance_dashboard(
    services: dict = Depends(get_services)
):
    """
    Get compliance dashboard data.
    
    Returns comprehensive compliance metrics, regulatory status,
    and audit trail information.
    """
    try:
        dashboard = await services["analytics_service"].get_compliance_dashboard()
        
        logger.info("✅ Retrieved compliance dashboard")
        
        return create_success_response({
            "dashboard": dashboard
        })
        
    except Exception as e:
        logger.error(f"Failed to get compliance dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="COMPLIANCE_DASHBOARD_RETRIEVAL_FAILED",
                message="Failed to retrieve compliance dashboard",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/analytics/performance", response_model=StandardResponse)
async def get_performance_analytics(
    services: dict = Depends(get_services)
):
    """
    Get system performance analytics.
    
    Returns detailed performance metrics including API response times,
    database performance, and system resource usage.
    """
    try:
        analytics = await services["analytics_service"].get_performance_analytics()
        
        logger.info("✅ Retrieved performance analytics")
        
        return create_success_response({
            "analytics": analytics
        })
        
    except Exception as e:
        logger.error(f"Failed to get performance analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="PERFORMANCE_ANALYTICS_RETRIEVAL_FAILED",
                message="Failed to retrieve performance analytics",
                details={"error": str(e)}
            ).dict()
        )


# =============================================================================
# PREDICTIVE ANALYTICS ENDPOINTS
# =============================================================================

class RiskPredictionRequest(BaseModel):
    """Risk prediction request model."""
    document_id: str = Field(..., description="Document ID to analyze")
    document_data: Dict[str, Any] = Field(..., description="Document metadata and features")


class ComplianceForecastRequest(BaseModel):
    """Compliance forecast request model."""
    document_id: str = Field(..., description="Document ID to analyze")
    document_data: Dict[str, Any] = Field(..., description="Document metadata and features")


class PerformancePredictionRequest(BaseModel):
    """Performance prediction request model."""
    metric_name: str = Field(..., description="Name of the performance metric")
    historical_data: List[float] = Field(..., description="Historical values of the metric")


class AnomalyDetectionRequest(BaseModel):
    """Anomaly detection request model."""
    data_points: List[Dict[str, Any]] = Field(..., description="Data points to analyze for anomalies")


class TrendAnalysisRequest(BaseModel):
    """Trend analysis request model."""
    metric_name: str = Field(..., description="Name of the metric")
    time_series_data: List[Dict[str, Any]] = Field(..., description="Time series data points")


class ModelTrainingRequest(BaseModel):
    """Model training request model."""
    training_data: List[Dict[str, Any]] = Field(..., description="Training dataset")


@app.post("/api/predictive-analytics/risk-prediction", response_model=StandardResponse)
async def predict_document_risk(
    request: RiskPredictionRequest,
    services: dict = Depends(get_services)
):
    """
    Predict the risk level of a document using ML models.
    
    Uses machine learning to analyze document features and predict potential risks
    such as fraud, tampering, or compliance issues.
    """
    try:
        # Predict document risk
        risk_prediction = services["predictive_analytics"].predict_document_risk(
            document_id=request.document_id,
            document_data=request.document_data
        )
        
        # Log audit event
        services["db"].insert_event(
            artifact_id=request.document_id,
            event_type="risk_prediction_completed",
            payload_json=json.dumps({
                "risk_level": risk_prediction.risk_level,
                "risk_score": risk_prediction.risk_score,
                "confidence": risk_prediction.confidence,
                "factors_count": len(risk_prediction.factors)
            }),
            created_by="system"
        )
        
        logger.info(f"✅ Risk prediction completed for document {request.document_id}: {risk_prediction.risk_level}")
        
        return create_success_response({
            "risk_prediction": {
                "document_id": risk_prediction.document_id,
                "risk_score": risk_prediction.risk_score,
                "risk_level": risk_prediction.risk_level,
                "confidence": risk_prediction.confidence,
                "factors": risk_prediction.factors,
                "recommendations": risk_prediction.recommendations,
                "predicted_at": risk_prediction.predicted_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to predict document risk: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="RISK_PREDICTION_FAILED",
                message="Failed to predict document risk",
                details={"error": str(e)}
            ).dict()
        )


@app.post("/api/predictive-analytics/compliance-forecast", response_model=StandardResponse)
async def forecast_compliance(
    request: ComplianceForecastRequest,
    services: dict = Depends(get_services)
):
    """
    Forecast compliance status for a document.
    
    Uses machine learning to predict whether a document will pass compliance
    checks and provides recommendations for improvement.
    """
    try:
        # Forecast compliance
        compliance_forecast = services["predictive_analytics"].forecast_compliance(
            document_id=request.document_id,
            document_data=request.document_data
        )
        
        # Log audit event
        services["db"].insert_event(
            artifact_id=request.document_id,
            event_type="compliance_forecast_completed",
            payload_json=json.dumps({
                "forecast_status": compliance_forecast.forecast_status,
                "compliance_probability": compliance_forecast.compliance_probability,
                "confidence": compliance_forecast.confidence,
                "risk_factors_count": len(compliance_forecast.risk_factors)
            }),
            created_by="system"
        )
        
        logger.info(f"✅ Compliance forecast completed for document {request.document_id}: {compliance_forecast.forecast_status}")
        
        return create_success_response({
            "compliance_forecast": {
                "document_id": compliance_forecast.document_id,
                "compliance_probability": compliance_forecast.compliance_probability,
                "forecast_status": compliance_forecast.forecast_status,
                "confidence": compliance_forecast.confidence,
                "risk_factors": compliance_forecast.risk_factors,
                "recommendations": compliance_forecast.recommendations,
                "forecasted_at": compliance_forecast.forecasted_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to forecast compliance: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="COMPLIANCE_FORECAST_FAILED",
                message="Failed to forecast compliance",
                details={"error": str(e)}
            ).dict()
        )


@app.post("/api/predictive-analytics/performance-prediction", response_model=StandardResponse)
async def predict_performance(
    request: PerformancePredictionRequest,
    services: dict = Depends(get_services)
):
    """
    Predict future performance for a given metric.
    
    Analyzes historical performance data and predicts future trends
    with recommendations for optimization.
    """
    try:
        # Predict performance
        performance_prediction = services["predictive_analytics"].predict_performance(
            metric_name=request.metric_name,
            historical_data=request.historical_data
        )
        
        logger.info(f"✅ Performance prediction completed for {request.metric_name}: {performance_prediction.trend}")
        
        return create_success_response({
            "performance_prediction": {
                "metric_name": performance_prediction.metric_name,
                "current_value": performance_prediction.current_value,
                "predicted_value": performance_prediction.predicted_value,
                "trend": performance_prediction.trend,
                "confidence": performance_prediction.confidence,
                "recommendations": performance_prediction.recommendations,
                "predicted_at": performance_prediction.predicted_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to predict performance: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="PERFORMANCE_PREDICTION_FAILED",
                message="Failed to predict performance",
                details={"error": str(e)}
            ).dict()
        )


@app.post("/api/predictive-analytics/anomaly-detection", response_model=StandardResponse)
async def detect_anomalies(
    request: AnomalyDetectionRequest,
    services: dict = Depends(get_services)
):
    """
    Detect anomalies in a dataset using ML models.
    
    Uses isolation forest algorithm to identify unusual patterns
    in document processing data.
    """
    try:
        # Detect anomalies
        anomalies = services["predictive_analytics"].detect_anomalies(
            data_points=request.data_points
        )
        
        logger.info(f"✅ Anomaly detection completed: {len(anomalies)} anomalies found")
        
        return create_success_response({
            "anomalies": anomalies,
            "total_anomalies": len(anomalies),
            "data_points_analyzed": len(request.data_points)
        })
        
    except Exception as e:
        logger.error(f"Failed to detect anomalies: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="ANOMALY_DETECTION_FAILED",
                message="Failed to detect anomalies",
                details={"error": str(e)}
            ).dict()
        )


@app.post("/api/predictive-analytics/trend-analysis", response_model=StandardResponse)
async def analyze_trends(
    request: TrendAnalysisRequest,
    services: dict = Depends(get_services)
):
    """
    Perform trend analysis on time series data.
    
    Analyzes time series data to identify trends and patterns
    with recommendations for action.
    """
    try:
        # Analyze trends
        trend_analysis = services["predictive_analytics"].get_trend_analysis(
            metric_name=request.metric_name,
            time_series_data=request.time_series_data
        )
        
        logger.info(f"✅ Trend analysis completed for {request.metric_name}: {trend_analysis.get('trend', 'UNKNOWN')}")
        
        return create_success_response({
            "trend_analysis": trend_analysis
        })
        
    except Exception as e:
        logger.error(f"Failed to analyze trends: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="TREND_ANALYSIS_FAILED",
                message="Failed to analyze trends",
                details={"error": str(e)}
            ).dict()
        )


@app.post("/api/predictive-analytics/train-models", response_model=StandardResponse)
async def train_models(
    request: ModelTrainingRequest,
    services: dict = Depends(get_services)
):
    """
    Train ML models with new data.
    
    Retrains the machine learning models with new training data
    to improve prediction accuracy.
    """
    try:
        # Train models
        training_result = services["predictive_analytics"].train_models(
            training_data=request.training_data
        )
        
        logger.info(f"✅ Model training completed: {training_result.get('status', 'UNKNOWN')}")
        
        return create_success_response({
            "training_result": training_result
        })
        
    except Exception as e:
        logger.error(f"Failed to train models: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="MODEL_TRAINING_FAILED",
                message="Failed to train models",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/predictive-analytics/model-statistics", response_model=StandardResponse)
async def get_model_statistics(
    services: dict = Depends(get_services)
):
    """
    Get statistics about the ML models.
    
    Returns information about available models, their status,
    and performance metrics.
    """
    try:
        # Get model statistics
        statistics = services["predictive_analytics"].get_model_statistics()
        
        logger.info("✅ Model statistics retrieved")
        
        return create_success_response({
            "model_statistics": statistics
        })
        
    except Exception as e:
        logger.error(f"Failed to get model statistics: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="MODEL_STATISTICS_FAILED",
                message="Failed to get model statistics",
                details={"error": str(e)}
            ).dict()
        )


# =============================================================================
# PHASE 2: ADVANCED FEATURES ENDPOINTS
# =============================================================================

# AI Anomaly Detection Endpoints

class AnomalyDetectionRequest(BaseModel):
    """Request model for anomaly detection."""
    document_data: Dict[str, Any] = Field(..., description="Document data to analyze")
    analysis_type: str = Field(default="document_integrity", description="Type of analysis to perform")


@app.post("/api/ai/anomaly-detect", response_model=StandardResponse)
async def detect_anomalies(
    request: AnomalyDetectionRequest,
    services: dict = Depends(get_services)
):
    """
    Detect anomalies in document data using AI-powered analysis.
    
    Performs comprehensive anomaly detection including document tampering,
    compliance violations, and data inconsistencies.
    """
    try:
        # Perform anomaly detection
        anomalies = services["ai_anomaly_detector"].analyze_document_integrity(request.document_data)
        
        logger.info(f"✅ Anomaly detection completed: {len(anomalies)} anomalies found")
        
        return create_success_response({
            "anomalies": [
                {
                    "anomaly_id": anomaly.anomaly_id,
                    "type": anomaly.anomaly_type.value,
                    "severity": anomaly.severity.value,
                    "confidence_score": anomaly.confidence_score,
                    "description": anomaly.description,
                    "detected_at": anomaly.detected_at.isoformat(),
                    "affected_entities": anomaly.affected_entities,
                    "recommendations": anomaly.recommendations
                }
                for anomaly in anomalies
            ],
            "total_anomalies": len(anomalies),
            "analysis_type": request.analysis_type
        })
        
    except Exception as e:
        logger.error(f"Failed to detect anomalies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="ANOMALY_DETECTION_FAILED",
                message="Failed to detect anomalies",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/ai/anomaly-summary", response_model=StandardResponse)
async def get_anomaly_summary(
    time_range_hours: int = Query(24, description="Time range in hours"),
    services: dict = Depends(get_services)
):
    """
    Get summary of anomalies detected in the specified time range.
    
    Returns comprehensive statistics about detected anomalies including
    trends, affected entities, and recommendations.
    """
    try:
        summary = services["ai_anomaly_detector"].get_anomaly_summary(time_range_hours)
        
        logger.info(f"✅ Anomaly summary generated for last {time_range_hours} hours")
        
        return create_success_response({
            "summary": summary,
            "time_range_hours": time_range_hours
        })
        
    except Exception as e:
        logger.error(f"Failed to get anomaly summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="ANOMALY_SUMMARY_FAILED",
                message="Failed to get anomaly summary",
                details={"error": str(e)}
            ).dict()
        )


# Time Machine Endpoints

class StateSnapshotRequest(BaseModel):
    """Request model for creating state snapshots."""
    document_id: str = Field(..., description="ID of the document")
    state_data: Dict[str, Any] = Field(..., description="Current state data")
    description: str = Field(default="", description="Description of the snapshot")
    tags: List[str] = Field(default=[], description="Tags for categorization")


@app.post("/api/time-machine/snapshot", response_model=StandardResponse)
async def create_state_snapshot(
    request: StateSnapshotRequest,
    created_by: str = Query("system", description="User creating the snapshot"),
    services: dict = Depends(get_services)
):
    """
    Create a snapshot of the current document state.
    
    Creates a point-in-time snapshot that can be used for time travel
    and state restoration.
    """
    try:
        snapshot = services["time_machine"].create_state_snapshot(
            document_id=request.document_id,
            state_data=request.state_data,
            created_by=created_by,
            description=request.description,
            tags=request.tags
        )
        
        logger.info(f"✅ State snapshot created: {snapshot.snapshot_id}")
        
        return create_success_response({
            "snapshot": {
                "snapshot_id": snapshot.snapshot_id,
                "document_id": snapshot.document_id,
                "version": snapshot.version,
                "timestamp": snapshot.timestamp.isoformat(),
                "description": snapshot.description,
                "tags": snapshot.tags,
                "created_by": snapshot.created_by
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to create state snapshot: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="SNAPSHOT_CREATION_FAILED",
                message="Failed to create state snapshot",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/time-machine/timeline/{document_id}", response_model=StandardResponse)
async def get_document_timeline(
    document_id: str,
    start_time: Optional[str] = Query(None, description="Start time (ISO format)"),
    end_time: Optional[str] = Query(None, description="End time (ISO format)"),
    services: dict = Depends(get_services)
):
    """
    Get the timeline of document states within a time range.
    
    Returns the complete history of document state changes,
    allowing users to see how the document evolved over time.
    """
    try:
        # Parse time parameters
        start_dt = None
        end_dt = None
        
        if start_time:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if end_time:
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        timeline = services["time_machine"].get_document_timeline(
            document_id=document_id,
            start_time=start_dt,
            end_time=end_dt
        )
        
        logger.info(f"✅ Document timeline retrieved: {len(timeline)} states")
        
        return create_success_response({
            "document_id": document_id,
            "timeline": [
                {
                    "state_id": state.state_id,
                    "version": state.version,
                    "timestamp": state.timestamp.isoformat(),
                    "change_type": state.change_type.value,
                    "changed_by": state.changed_by,
                    "change_description": state.change_description,
                    "parent_state_id": state.parent_state_id
                }
                for state in timeline
            ],
            "total_states": len(timeline)
        })
        
    except Exception as e:
        logger.error(f"Failed to get document timeline: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="TIMELINE_RETRIEVAL_FAILED",
                message="Failed to get document timeline",
                details={"error": str(e)}
            ).dict()
        )


@app.post("/api/time-machine/restore/{document_id}", response_model=StandardResponse)
async def restore_document_state(
    document_id: str,
    target_state_id: str = Query(..., description="ID of the state to restore to"),
    restored_by: str = Query("system", description="User performing the restore"),
    restore_reason: str = Query("", description="Reason for restoration"),
    services: dict = Depends(get_services)
):
    """
    Restore a document to a previous state.
    
    Allows users to travel back in time and restore a document
    to any previous state in its history.
    """
    try:
        restored_state = services["time_machine"].restore_document_state(
            document_id=document_id,
            target_state_id=target_state_id,
            restored_by=restored_by,
            restore_reason=restore_reason
        )
        
        logger.info(f"✅ Document {document_id} restored to state {target_state_id}")
        
        return create_success_response({
            "restored_state": {
                "state_id": restored_state.state_id,
                "document_id": restored_state.document_id,
                "version": restored_state.version,
                "timestamp": restored_state.timestamp.isoformat(),
                "change_type": restored_state.change_type.value,
                "changed_by": restored_state.changed_by,
                "change_description": restored_state.change_description,
                "parent_state_id": restored_state.parent_state_id
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to restore document state: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="STATE_RESTORATION_FAILED",
                message="Failed to restore document state",
                details={"error": str(e)}
            ).dict()
        )


# Smart Contracts Endpoints

class SmartContractRequest(BaseModel):
    """Request model for smart contract operations."""
    name: str = Field(..., description="Name of the contract")
    description: str = Field(..., description="Description of the contract")
    contract_type: str = Field(..., description="Type of contract")
    rules: List[Dict[str, Any]] = Field(..., description="List of contract rules")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")


@app.post("/api/smart-contracts/create", response_model=StandardResponse)
async def create_smart_contract(
    request: SmartContractRequest,
    created_by: str = Query("system", description="User creating the contract"),
    services: dict = Depends(get_services)
):
    """
    Create a new smart contract for automated compliance and workflow management.
    
    Smart contracts provide rule-based automation for document processing,
    compliance checking, and workflow management.
    """
    try:
        from src.smart_contracts import ContractType, ContractRule
        
        # Convert contract type
        contract_type = ContractType(request.contract_type)
        
        # Convert rules
        rules = []
        for rule_data in request.rules:
            rule = ContractRule(
                rule_id=str(uuid.uuid4()),
                name=rule_data["name"],
                description=rule_data["description"],
                condition=rule_data["condition"],
                action=rule_data["action"],
                severity=rule_data.get("severity", "medium"),
                enabled=rule_data.get("enabled", True),
                metadata=rule_data.get("metadata", {})
            )
            rules.append(rule)
        
        contract = services["smart_contracts"].create_contract(
            name=request.name,
            description=request.description,
            contract_type=contract_type,
            rules=rules,
            created_by=created_by,
            metadata=request.metadata
        )
        
        logger.info(f"✅ Smart contract created: {contract.contract_id}")
        
        return create_success_response({
            "contract": {
                "contract_id": contract.contract_id,
                "name": contract.name,
                "description": contract.description,
                "contract_type": contract.contract_type.value,
                "status": contract.status.value,
                "rules_count": len(contract.rules),
                "created_at": contract.created_at.isoformat(),
                "created_by": contract.created_by
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to create smart contract: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="SMART_CONTRACT_CREATION_FAILED",
                message="Failed to create smart contract",
                details={"error": str(e)}
            ).dict()
        )


@app.post("/api/smart-contracts/execute/{contract_id}", response_model=StandardResponse)
async def execute_smart_contract(
    contract_id: str,
    data: Dict[str, Any],
    executed_by: str = Query("system", description="User executing the contract"),
    services: dict = Depends(get_services)
):
    """
    Execute a smart contract against provided data.
    
    Evaluates all contract rules against the provided data and returns
    the execution results with any violations or warnings.
    """
    try:
        execution = services["smart_contracts"].execute_contract(
            contract_id=contract_id,
            data=data,
            executed_by=executed_by
        )
        
        logger.info(f"✅ Smart contract executed: {contract_id} - {execution.result.value}")
        
        return create_success_response({
            "execution": {
                "execution_id": execution.execution_id,
                "contract_id": execution.contract_id,
                "executed_at": execution.executed_at.isoformat(),
                "result": execution.result.value,
                "message": execution.message,
                "affected_entities": execution.affected_entities,
                "rule_results": execution.rule_results,
                "metadata": execution.metadata
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to execute smart contract: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="SMART_CONTRACT_EXECUTION_FAILED",
                message="Failed to execute smart contract",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/smart-contracts/list", response_model=StandardResponse)
async def list_smart_contracts(
    contract_type: Optional[str] = Query(None, description="Filter by contract type"),
    status: Optional[str] = Query(None, description="Filter by contract status"),
    services: dict = Depends(get_services)
):
    """
    List smart contracts with optional filtering.
    
    Returns a list of all smart contracts, optionally filtered by
    type and status.
    """
    try:
        from src.smart_contracts import ContractType, ContractStatus
        
        # Convert filters
        contract_type_filter = ContractType(contract_type) if contract_type else None
        status_filter = ContractStatus(status) if status else None
        
        contracts = services["smart_contracts"].list_contracts(
            contract_type=contract_type_filter,
            status=status_filter
        )
        
        logger.info(f"✅ Smart contracts listed: {len(contracts)} contracts")
        
        return create_success_response({
            "contracts": [
                {
                    "contract_id": contract.contract_id,
                    "name": contract.name,
                    "description": contract.description,
                    "contract_type": contract.contract_type.value,
                    "status": contract.status.value,
                    "rules_count": len(contract.rules),
                    "execution_count": contract.execution_count,
                    "success_count": contract.success_count,
                    "failure_count": contract.failure_count,
                    "created_at": contract.created_at.isoformat(),
                    "updated_at": contract.updated_at.isoformat(),
                    "created_by": contract.created_by
                }
                for contract in contracts
            ],
            "total_contracts": len(contracts)
        })
        
    except Exception as e:
        logger.error(f"Failed to list smart contracts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="SMART_CONTRACTS_LIST_FAILED",
                message="Failed to list smart contracts",
                details={"error": str(e)}
            ).dict()
        )


@app.get("/api/smart-contracts/statistics", response_model=StandardResponse)
async def get_smart_contract_statistics(
    services: dict = Depends(get_services)
):
    """
    Get statistics about smart contracts and their execution.
    
    Returns comprehensive statistics including contract counts,
    execution results, and performance metrics.
    """
    try:
        statistics = services["smart_contracts"].get_contract_statistics()
        
        logger.info("✅ Smart contract statistics retrieved")
        
        return create_success_response({
            "statistics": statistics
        })
        
    except Exception as e:
        logger.error(f"Failed to get smart contract statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                code="SMART_CONTRACT_STATISTICS_FAILED",
                message="Failed to get smart contract statistics",
                details={"error": str(e)}
            ).dict()
        )


# Main block
if __name__ == "__main__":
    import uvicorn
    
    # Run the application
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
