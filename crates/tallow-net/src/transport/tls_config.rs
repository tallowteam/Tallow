//! TLS configuration helpers for QUIC and TCP+TLS transports
//!
//! Generates self-signed certificates via rcgen for relay connections.
//! Tallow's relay is untrusted — the TLS layer is for transport encryption,
//! not identity verification (that's handled by the E2E crypto layer).

use crate::{NetworkError, Result};
use std::sync::Arc;

/// Generated TLS certificate and key pair
pub struct TlsIdentity {
    /// DER-encoded certificate
    pub cert_der: rustls::pki_types::CertificateDer<'static>,
    /// DER-encoded private key
    pub key_der: rustls::pki_types::PrivatePkcs8KeyDer<'static>,
}

/// Generate a self-signed TLS certificate for localhost
///
/// Used for QUIC and TCP+TLS connections. The relay is untrusted,
/// so we don't need CA-signed certs — transport-layer encryption
/// is complemented by E2E encryption at the crypto layer.
pub fn generate_self_signed() -> Result<TlsIdentity> {
    let cert = rcgen::generate_simple_self_signed(vec!["localhost".to_string()])
        .map_err(|e| NetworkError::TlsError(format!("cert generation failed: {}", e)))?;

    let cert_der = rustls::pki_types::CertificateDer::from(cert.cert);
    let key_der = rustls::pki_types::PrivatePkcs8KeyDer::from(cert.key_pair.serialize_der());

    Ok(TlsIdentity { cert_der, key_der })
}

/// Build a quinn ServerConfig from a TLS identity
#[cfg(feature = "quic")]
pub fn quinn_server_config(identity: &TlsIdentity) -> Result<quinn::ServerConfig> {
    let server_config = quinn::ServerConfig::with_single_cert(
        vec![identity.cert_der.clone()],
        identity.key_der.clone_key().into(),
    )
    .map_err(|e| NetworkError::TlsError(format!("quinn server config failed: {}", e)))?;

    Ok(server_config)
}

/// Build a quinn ClientConfig that accepts any server certificate
///
/// Safe for Tallow because the relay is untrusted anyway — we rely on
/// E2E encryption, not TLS, for confidentiality. TLS provides transport
/// encryption against passive observers only.
#[cfg(feature = "quic")]
pub fn quinn_client_config() -> Result<quinn::ClientConfig> {
    let crypto = rustls::ClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(Arc::new(SkipServerVerification))
        .with_no_client_auth();

    let client_config = quinn::ClientConfig::new(Arc::new(
        quinn::crypto::rustls::QuicClientConfig::try_from(crypto)
            .map_err(|e| NetworkError::TlsError(format!("quinn client config failed: {}", e)))?,
    ));

    Ok(client_config)
}

/// Build a rustls ServerConfig from a TLS identity (for TCP+TLS)
pub fn rustls_server_config(identity: &TlsIdentity) -> Result<Arc<rustls::ServerConfig>> {
    let config = rustls::ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(
            vec![identity.cert_der.clone()],
            identity.key_der.clone_key().into(),
        )
        .map_err(|e| NetworkError::TlsError(format!("rustls server config failed: {}", e)))?;

    Ok(Arc::new(config))
}

/// Build a rustls ClientConfig that accepts any server certificate (for TCP+TLS)
pub fn rustls_client_config() -> Arc<rustls::ClientConfig> {
    let config = rustls::ClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(Arc::new(SkipServerVerification))
        .with_no_client_auth();

    Arc::new(config)
}

/// Certificate verifier that accepts any certificate
///
/// This is safe for Tallow because relay is untrusted — E2E crypto
/// handles confidentiality. TLS is defense-in-depth for transport.
#[derive(Debug)]
struct SkipServerVerification;

impl rustls::client::danger::ServerCertVerifier for SkipServerVerification {
    fn verify_server_cert(
        &self,
        _end_entity: &rustls::pki_types::CertificateDer<'_>,
        _intermediates: &[rustls::pki_types::CertificateDer<'_>],
        _server_name: &rustls::pki_types::ServerName<'_>,
        _ocsp_response: &[u8],
        _now: rustls::pki_types::UnixTime,
    ) -> std::result::Result<rustls::client::danger::ServerCertVerified, rustls::Error> {
        Ok(rustls::client::danger::ServerCertVerified::assertion())
    }

    fn verify_tls12_signature(
        &self,
        _message: &[u8],
        _cert: &rustls::pki_types::CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> std::result::Result<rustls::client::danger::HandshakeSignatureValid, rustls::Error> {
        Ok(rustls::client::danger::HandshakeSignatureValid::assertion())
    }

    fn verify_tls13_signature(
        &self,
        _message: &[u8],
        _cert: &rustls::pki_types::CertificateDer<'_>,
        _dss: &rustls::DigitallySignedStruct,
    ) -> std::result::Result<rustls::client::danger::HandshakeSignatureValid, rustls::Error> {
        Ok(rustls::client::danger::HandshakeSignatureValid::assertion())
    }

    fn supported_verify_schemes(&self) -> Vec<rustls::SignatureScheme> {
        rustls::crypto::ring::default_provider()
            .signature_verification_algorithms
            .supported_schemes()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_self_signed() {
        let identity = generate_self_signed().unwrap();
        assert!(!identity.cert_der.is_empty());
    }

    #[cfg(feature = "quic")]
    #[test]
    fn test_quinn_server_config() {
        let identity = generate_self_signed().unwrap();
        let config = quinn_server_config(&identity);
        assert!(config.is_ok());
    }

    #[cfg(feature = "quic")]
    #[test]
    fn test_quinn_client_config() {
        let config = quinn_client_config();
        assert!(config.is_ok());
    }
}
