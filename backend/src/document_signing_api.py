"""
Document Signing API Endpoints

This module provides FastAPI endpoints for document signing functionality including
DocuSign, Adobe Sign, HelloSign, and internal signing integration.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .document_signing_service import (
    DocumentSigningService, 
    Signer, 
    SigningField, 
    SigningStatus, 
    SigningProvider
)
from .standardized_responses import create_success_response, create_error_response

logger = logging.getLogger(__name__)

# Create router for document signing endpoints
router = APIRouter(prefix="/api/signing", tags=["Document Signing"])

# Initialize the document signing service
signing_service = DocumentSigningService()


# Request/Response Models
class SignerRequest(BaseModel):
    """Request model for signer information."""
    email: str = Field(..., description="Signer email address")
    name: str = Field(..., description="Signer full name")
    role: str = Field(default="signer", description="Signer role")
    order: int = Field(default=1, description="Signing order")
    phone_number: Optional[str] = Field(None, description="Signer phone number")
    access_code: Optional[str] = Field(None, description="Access code for signing")


class SigningFieldRequest(BaseModel):
    """Request model for signing field configuration."""
    field_type: str = Field(..., description="Field type (signature, initial, date, text, checkbox)")
    page_number: int = Field(..., description="Page number for the field")
    x_position: float = Field(..., description="X position of the field")
    y_position: float = Field(..., description="Y position of the field")
    width: float = Field(..., description="Width of the field")
    height: float = Field(..., description="Height of the field")
    recipient_id: str = Field(..., description="Recipient ID for the field")
    required: bool = Field(default=True, description="Whether the field is required")
    tab_label: Optional[str] = Field(None, description="Tab label for the field")
    value: Optional[str] = Field(None, description="Default value for the field")


class CreateEnvelopeRequest(BaseModel):
    """Request model for creating a signing envelope."""
    document_id: str = Field(..., description="ID of the document to be signed")
    document_name: str = Field(..., description="Name of the document")
    signers: List[SignerRequest] = Field(..., description="List of signers")
    signing_fields: List[SigningFieldRequest] = Field(..., description="List of signing fields")
    template_type: str = Field(default="loan_application", description="Type of signing template")
    provider: str = Field(default="docusign", description="Signing provider to use")
    custom_config: Optional[Dict[str, Any]] = Field(None, description="Custom configuration")


class SigningResultResponse(BaseModel):
    """Response model for signing operations."""
    success: bool
    envelope_id: Optional[str] = None
    signing_url: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    processing_time: float
    provider_response: Optional[Dict[str, Any]] = None


class EnvelopeStatusResponse(BaseModel):
    """Response model for envelope status."""
    envelope_id: str
    status: str
    status_details: Dict[str, Any]
    signers: List[Dict[str, Any]]
    created_at: str
    updated_at: str
    expires_at: Optional[str] = None


class DocumentDownloadResponse(BaseModel):
    """Response model for document download."""
    success: bool
    document_data: Optional[str] = None  # Base64 encoded
    document_name: str
    content_type: str
    file_size: int
    signed_at: Optional[str] = None
    metadata: Dict[str, Any]


class SignatureVerificationResponse(BaseModel):
    """Response model for signature verification."""
    success: bool
    verified: bool
    verification_details: Dict[str, Any]
    verified_at: Optional[str] = None


# API Endpoints
@router.post("/create-envelope", response_model=StandardResponse)
async def create_signing_envelope(
    request: CreateEnvelopeRequest,
    services: dict = Depends(get_services)
):
    """
    Create a document signing envelope.
    
    This endpoint creates a signing envelope for a document with specified signers
    and signing fields using the selected signing provider.
    """
    try:
        # Convert request models to service models
        signers = [
            Signer(
                email=signer.email,
                name=signer.name,
                role=signer.role,
                order=signer.order,
                phone_number=signer.phone_number,
                access_code=signer.access_code
            )
            for signer in request.signers
        ]
        
        signing_fields = [
            SigningField(
                field_type=field.field_type,
                page_number=field.page_number,
                x_position=field.x_position,
                y_position=field.y_position,
                width=field.width,
                height=field.height,
                recipient_id=field.recipient_id,
                required=field.required,
                tab_label=field.tab_label,
                value=field.value
            )
            for field in request.signing_fields
        ]
        
        # Convert provider string to enum
        provider = SigningProvider(request.provider)
        
        # Create signing envelope
        result = await signing_service.create_signing_envelope(
            document_id=request.document_id,
            document_name=request.document_name,
            signers=signers,
            signing_fields=signing_fields,
            template_type=request.template_type,
            provider=provider,
            custom_config=request.custom_config
        )
        
        # Convert result to response model
        response_data = SigningResultResponse(
            success=result.success,
            envelope_id=result.envelope_id,
            signing_url=result.signing_url,
            status=result.status.value,
            error_message=result.error_message,
            processing_time=result.processing_time,
            provider_response=result.provider_response
        )
        
        logger.info(f"✅ Created signing envelope {result.envelope_id} with provider {provider.value}")
        
        return create_success_response({
            "signing_result": response_data.dict()
        })
        
    except Exception as e:
        logger.error(f"Failed to create signing envelope: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="ENVELOPE_CREATION_FAILED",
                message="Failed to create signing envelope",
                details={"error": str(e)}
            ).dict()
        )


@router.post("/send-envelope", response_model=StandardResponse)
async def send_signing_envelope(
    envelope_id: str = Query(..., description="ID of the envelope to send"),
    provider: str = Query(default="docusign", description="Signing provider"),
    services: dict = Depends(get_services)
):
    """
    Send a signing envelope to signers.
    
    This endpoint sends a previously created signing envelope to all specified signers.
    """
    try:
        # Convert provider string to enum
        provider_enum = SigningProvider(provider)
        
        # Send signing envelope
        result = await signing_service.send_signing_envelope(
            envelope_id=envelope_id,
            provider=provider_enum
        )
        
        # Convert result to response model
        response_data = SigningResultResponse(
            success=result.success,
            envelope_id=result.envelope_id,
            signing_url=result.signing_url,
            status=result.status.value,
            error_message=result.error_message,
            processing_time=result.processing_time,
            provider_response=result.provider_response
        )
        
        logger.info(f"✅ Sent signing envelope {envelope_id} with provider {provider}")
        
        return create_success_response({
            "signing_result": response_data.dict()
        })
        
    except Exception as e:
        logger.error(f"Failed to send signing envelope: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="ENVELOPE_SENDING_FAILED",
                message="Failed to send signing envelope",
                details={"error": str(e)}
            ).dict()
        )


@router.get("/envelope-status", response_model=StandardResponse)
async def get_envelope_status(
    envelope_id: str = Query(..., description="ID of the envelope to check"),
    provider: str = Query(default="docusign", description="Signing provider"),
    services: dict = Depends(get_services)
):
    """
    Get the current status of a signing envelope.
    
    This endpoint retrieves the current status and details of a signing envelope.
    """
    try:
        # Convert provider string to enum
        provider_enum = SigningProvider(provider)
        
        # Get envelope status
        result = await signing_service.get_signing_status(
            envelope_id=envelope_id,
            provider=provider_enum
        )
        
        if not result.success:
            raise HTTPException(
                status_code=404,
                detail=create_error_response(
                    code="ENVELOPE_NOT_FOUND",
                    message="Envelope not found or error retrieving status",
                    details={"error": result.error_message}
                ).dict()
            )
        
        # Extract status details from provider response
        status_details = result.provider_response or {}
        signers = status_details.get('recipients', {}).get('signers', []) if status_details else []
        
        # Convert result to response model
        response_data = EnvelopeStatusResponse(
            envelope_id=envelope_id,
            status=result.status.value,
            status_details=status_details,
            signers=signers,
            created_at=status_details.get('created', datetime.now(timezone.utc).isoformat()),
            updated_at=status_details.get('statusDateTime', datetime.now(timezone.utc).isoformat()),
            expires_at=status_details.get('expirationDate')
        )
        
        logger.info(f"✅ Retrieved status for envelope {envelope_id}")
        
        return create_success_response({
            "envelope_status": response_data.dict()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get envelope status: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="STATUS_RETRIEVAL_FAILED",
                message="Failed to get envelope status",
                details={"error": str(e)}
            ).dict()
        )


@router.post("/cancel-envelope", response_model=StandardResponse)
async def cancel_signing_envelope(
    envelope_id: str = Query(..., description="ID of the envelope to cancel"),
    reason: str = Query(default="Cancelled by user", description="Reason for cancellation"),
    provider: str = Query(default="docusign", description="Signing provider"),
    services: dict = Depends(get_services)
):
    """
    Cancel a signing envelope.
    
    This endpoint cancels a signing envelope and provides a reason for cancellation.
    """
    try:
        # Convert provider string to enum
        provider_enum = SigningProvider(provider)
        
        # Cancel signing envelope
        result = await signing_service.cancel_signing_envelope(
            envelope_id=envelope_id,
            reason=reason,
            provider=provider_enum
        )
        
        # Convert result to response model
        response_data = SigningResultResponse(
            success=result.success,
            envelope_id=result.envelope_id,
            signing_url=result.signing_url,
            status=result.status.value,
            error_message=result.error_message,
            processing_time=result.processing_time,
            provider_response=result.provider_response
        )
        
        logger.info(f"✅ Cancelled signing envelope {envelope_id}")
        
        return create_success_response({
            "signing_result": response_data.dict()
        })
        
    except Exception as e:
        logger.error(f"Failed to cancel signing envelope: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="ENVELOPE_CANCELLATION_FAILED",
                message="Failed to cancel signing envelope",
                details={"error": str(e)}
            ).dict()
        )


@router.get("/download-document", response_model=StandardResponse)
async def download_signed_document(
    envelope_id: str = Query(..., description="ID of the envelope"),
    provider: str = Query(default="docusign", description="Signing provider"),
    services: dict = Depends(get_services)
):
    """
    Download the signed document.
    
    This endpoint downloads the completed signed document from the signing provider.
    """
    try:
        # Convert provider string to enum
        provider_enum = SigningProvider(provider)
        
        # Download signed document
        result = await signing_service.download_signed_document(
            envelope_id=envelope_id,
            provider=provider_enum
        )
        
        if not result.get('success', False):
            raise HTTPException(
                status_code=404,
                detail=create_error_response(
                    code="DOCUMENT_NOT_FOUND",
                    message="Signed document not found or not available",
                    details={"error": result.get('error', 'Unknown error')}
                ).dict()
            )
        
        # Convert result to response model
        import base64
        document_data = result.get('document_data')
        metadata = result.get('metadata', {})
        
        response_data = DocumentDownloadResponse(
            success=True,
            document_data=base64.b64encode(document_data).decode('utf-8') if document_data else None,
            document_name=metadata.get('document_name', 'signed_document.pdf'),
            content_type=metadata.get('content_type', 'application/pdf'),
            file_size=metadata.get('file_size', 0),
            signed_at=metadata.get('signed_at'),
            metadata=metadata
        )
        
        logger.info(f"✅ Downloaded signed document for envelope {envelope_id}")
        
        return create_success_response({
            "document_download": response_data.dict()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download signed document: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="DOCUMENT_DOWNLOAD_FAILED",
                message="Failed to download signed document",
                details={"error": str(e)}
            ).dict()
        )


@router.post("/verify-signature", response_model=StandardResponse)
async def verify_signature(
    envelope_id: str = Query(..., description="ID of the envelope"),
    provider: str = Query(default="docusign", description="Signing provider"),
    services: dict = Depends(get_services)
):
    """
    Verify the authenticity of a signature.
    
    This endpoint verifies the authenticity and validity of a signature.
    """
    try:
        # Convert provider string to enum
        provider_enum = SigningProvider(provider)
        
        # Verify signature
        result = await signing_service.verify_signature(
            envelope_id=envelope_id,
            provider=provider_enum
        )
        
        if not result.get('success', False):
            raise HTTPException(
                status_code=400,
                detail=create_error_response(
                    code="SIGNATURE_VERIFICATION_FAILED",
                    message="Signature verification failed",
                    details={"error": result.get('error', 'Unknown error')}
                ).dict()
            )
        
        # Convert result to response model
        verification_details = result.get('verification_details', {})
        
        response_data = SignatureVerificationResponse(
            success=True,
            verified=result.get('verified', False),
            verification_details=verification_details,
            verified_at=verification_details.get('verified_at')
        )
        
        logger.info(f"✅ Verified signature for envelope {envelope_id}")
        
        return create_success_response({
            "signature_verification": response_data.dict()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify signature: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="SIGNATURE_VERIFICATION_ERROR",
                message="Failed to verify signature",
                details={"error": str(e)}
            ).dict()
        )


@router.get("/templates", response_model=StandardResponse)
async def get_signing_templates(
    services: dict = Depends(get_services)
):
    """
    Get available signing templates.
    
    This endpoint returns information about available signing templates
    and their configurations.
    """
    try:
        templates = signing_service.get_signing_templates()
        
        logger.info("✅ Retrieved signing templates")
        
        return create_success_response({
            "signing_templates": templates,
            "total_templates": len(templates)
        })
        
    except Exception as e:
        logger.error(f"Failed to get signing templates: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="TEMPLATES_RETRIEVAL_FAILED",
                message="Failed to get signing templates",
                details={"error": str(e)}
            ).dict()
        )


@router.get("/providers", response_model=StandardResponse)
async def get_signing_providers(
    services: dict = Depends(get_services)
):
    """
    Get available signing providers.
    
    This endpoint returns information about available signing providers
    and their capabilities.
    """
    try:
        providers = signing_service.get_signing_providers()
        
        provider_info = {
            "docusign": {
                "name": "DocuSign",
                "description": "Industry-leading electronic signature platform",
                "features": ["eSignatures", "Workflow automation", "Compliance", "Integration"],
                "supported_formats": ["PDF", "Word", "Excel", "Images"],
                "api_version": "v2.1"
            },
            "adobe_sign": {
                "name": "Adobe Sign",
                "description": "Adobe's electronic signature solution",
                "features": ["eSignatures", "Document management", "Mobile signing", "Analytics"],
                "supported_formats": ["PDF", "Word", "Excel", "Images"],
                "api_version": "v6"
            },
            "hello_sign": {
                "name": "HelloSign",
                "description": "Dropbox's electronic signature platform",
                "features": ["eSignatures", "Template management", "Team collaboration", "API"],
                "supported_formats": ["PDF", "Word", "Excel"],
                "api_version": "v3"
            },
            "internal": {
                "name": "Internal Signing",
                "description": "Internal document signing system",
                "features": ["Custom workflows", "Internal verification", "Audit trails", "Integration"],
                "supported_formats": ["PDF", "Word", "Excel", "Images"],
                "api_version": "v1"
            }
        }
        
        logger.info("✅ Retrieved signing providers")
        
        return create_success_response({
            "signing_providers": providers,
            "provider_info": provider_info,
            "total_providers": len(providers)
        })
        
    except Exception as e:
        logger.error(f"Failed to get signing providers: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="PROVIDERS_RETRIEVAL_FAILED",
                message="Failed to get signing providers",
                details={"error": str(e)}
            ).dict()
        )


@router.get("/verification-settings", response_model=StandardResponse)
async def get_verification_settings(
    services: dict = Depends(get_services)
):
    """
    Get signature verification settings.
    
    This endpoint returns the current signature verification settings
    and configuration options.
    """
    try:
        settings = signing_service.get_verification_settings()
        
        logger.info("✅ Retrieved verification settings")
        
        return create_success_response({
            "verification_settings": settings
        })
        
    except Exception as e:
        logger.error(f"Failed to get verification settings: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="VERIFICATION_SETTINGS_RETRIEVAL_FAILED",
                message="Failed to get verification settings",
                details={"error": str(e)}
            ).dict()
        )


@router.put("/verification-settings", response_model=StandardResponse)
async def update_verification_settings(
    settings: Dict[str, Any],
    services: dict = Depends(get_services)
):
    """
    Update signature verification settings.
    
    This endpoint updates the signature verification settings and configuration.
    """
    try:
        success = signing_service.update_verification_settings(settings)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail=create_error_response(
                    code="VERIFICATION_SETTINGS_UPDATE_FAILED",
                    message="Failed to update verification settings",
                    details={"error": "Invalid settings provided"}
                ).dict()
            )
        
        logger.info("✅ Updated verification settings")
        
        return create_success_response({
            "message": "Verification settings updated successfully",
            "updated_settings": settings
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update verification settings: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="VERIFICATION_SETTINGS_UPDATE_ERROR",
                message="Failed to update verification settings",
                details={"error": str(e)}
            ).dict()
        )


@router.post("/bulk-create-envelopes", response_model=StandardResponse)
async def bulk_create_envelopes(
    requests: List[CreateEnvelopeRequest],
    services: dict = Depends(get_services)
):
    """
    Create multiple signing envelopes in batch.
    
    This endpoint creates multiple signing envelopes efficiently in batch.
    """
    try:
        results = []
        successful_creations = 0
        failed_creations = 0
        
        for request in requests:
            try:
                # Convert request models to service models
                signers = [
                    Signer(
                        email=signer.email,
                        name=signer.name,
                        role=signer.role,
                        order=signer.order,
                        phone_number=signer.phone_number,
                        access_code=signer.access_code
                    )
                    for signer in request.signers
                ]
                
                signing_fields = [
                    SigningField(
                        field_type=field.field_type,
                        page_number=field.page_number,
                        x_position=field.x_position,
                        y_position=field.y_position,
                        width=field.width,
                        height=field.height,
                        recipient_id=field.recipient_id,
                        required=field.required,
                        tab_label=field.tab_label,
                        value=field.value
                    )
                    for field in request.signing_fields
                ]
                
                # Convert provider string to enum
                provider = SigningProvider(request.provider)
                
                # Create signing envelope
                result = await signing_service.create_signing_envelope(
                    document_id=request.document_id,
                    document_name=request.document_name,
                    signers=signers,
                    signing_fields=signing_fields,
                    template_type=request.template_type,
                    provider=provider,
                    custom_config=request.custom_config
                )
                
                # Convert result to response model
                response_data = SigningResultResponse(
                    success=result.success,
                    envelope_id=result.envelope_id,
                    signing_url=result.signing_url,
                    status=result.status.value,
                    error_message=result.error_message,
                    processing_time=result.processing_time,
                    provider_response=result.provider_response
                )
                
                results.append(response_data.dict())
                
                if result.success:
                    successful_creations += 1
                else:
                    failed_creations += 1
                    
            except Exception as e:
                error_result = SigningResultResponse(
                    success=False,
                    error_message=str(e),
                    processing_time=0.0
                )
                results.append(error_result.dict())
                failed_creations += 1
        
        logger.info(f"✅ Bulk created {successful_creations} envelopes, {failed_creations} failed")
        
        return create_success_response({
            "bulk_results": results,
            "summary": {
                "total_requests": len(requests),
                "successful_creations": successful_creations,
                "failed_creations": failed_creations,
                "success_rate": successful_creations / len(requests) * 100 if requests else 0
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to bulk create envelopes: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="BULK_ENVELOPE_CREATION_FAILED",
                message="Failed to bulk create envelopes",
                details={"error": str(e)}
            ).dict()
        )


# Webhook endpoints for signing provider callbacks
@router.post("/webhooks/docusign", response_model=StandardResponse)
async def docusign_webhook(
    payload: Dict[str, Any],
    services: dict = Depends(get_services)
):
    """
    DocuSign webhook endpoint for status updates.
    
    This endpoint receives webhook notifications from DocuSign about
    envelope status changes and signing events.
    """
    try:
        # Process DocuSign webhook payload
        envelope_id = payload.get('data', {}).get('envelopeId')
        status = payload.get('data', {}).get('status')
        event = payload.get('event')
        
        if envelope_id and status:
            # Update envelope status in database
            # This would typically involve updating the database with the new status
            logger.info(f"✅ Received DocuSign webhook for envelope {envelope_id}: {status}")
            
            return create_success_response({
                "message": "Webhook processed successfully",
                "envelope_id": envelope_id,
                "status": status,
                "event": event
            })
        else:
            logger.warning("Received invalid DocuSign webhook payload")
            return create_error_response(
                code="INVALID_WEBHOOK_PAYLOAD",
                message="Invalid webhook payload received"
            ).dict()
            
    except Exception as e:
        logger.error(f"Failed to process DocuSign webhook: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="WEBHOOK_PROCESSING_FAILED",
                message="Failed to process webhook",
                details={"error": str(e)}
            ).dict()
        )


@router.post("/webhooks/adobe-sign", response_model=StandardResponse)
async def adobe_sign_webhook(
    payload: Dict[str, Any],
    services: dict = Depends(get_services)
):
    """
    Adobe Sign webhook endpoint for status updates.
    
    This endpoint receives webhook notifications from Adobe Sign about
    agreement status changes and signing events.
    """
    try:
        # Process Adobe Sign webhook payload
        agreement_id = payload.get('id')
        status = payload.get('status')
        event = payload.get('event')
        
        if agreement_id and status:
            # Update agreement status in database
            logger.info(f"✅ Received Adobe Sign webhook for agreement {agreement_id}: {status}")
            
            return create_success_response({
                "message": "Webhook processed successfully",
                "agreement_id": agreement_id,
                "status": status,
                "event": event
            })
        else:
            logger.warning("Received invalid Adobe Sign webhook payload")
            return create_error_response(
                code="INVALID_WEBHOOK_PAYLOAD",
                message="Invalid webhook payload received"
            ).dict()
            
    except Exception as e:
        logger.error(f"Failed to process Adobe Sign webhook: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="WEBHOOK_PROCESSING_FAILED",
                message="Failed to process webhook",
                details={"error": str(e)}
            ).dict()
        )


@router.post("/webhooks/hello-sign", response_model=StandardResponse)
async def hello_sign_webhook(
    payload: Dict[str, Any],
    services: dict = Depends(get_services)
):
    """
    HelloSign webhook endpoint for status updates.
    
    This endpoint receives webhook notifications from HelloSign about
    signature request status changes and signing events.
    """
    try:
        # Process HelloSign webhook payload
        signature_request_id = payload.get('signature_request', {}).get('signature_request_id')
        status = payload.get('signature_request', {}).get('status')
        event = payload.get('event_type')
        
        if signature_request_id and status:
            # Update signature request status in database
            logger.info(f"✅ Received HelloSign webhook for request {signature_request_id}: {status}")
            
            return create_success_response({
                "message": "Webhook processed successfully",
                "signature_request_id": signature_request_id,
                "status": status,
                "event": event
            })
        else:
            logger.warning("Received invalid HelloSign webhook payload")
            return create_error_response(
                code="INVALID_WEBHOOK_PAYLOAD",
                message="Invalid webhook payload received"
            ).dict()
            
    except Exception as e:
        logger.error(f"Failed to process HelloSign webhook: {e}")
        raise HTTPException(
            status_code=500,
            detail=create_error_response(
                code="WEBHOOK_PROCESSING_FAILED",
                message="Failed to process webhook",
                details={"error": str(e)}
            ).dict()
        )
