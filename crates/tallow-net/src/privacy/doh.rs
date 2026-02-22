//! DNS-over-HTTPS resolver using hickory-resolver
//!
//! Prevents plaintext DNS queries from leaking hostnames to local network observers.

use crate::error::NetworkError;
use crate::Result;
use std::net::IpAddr;

/// DNS-over-HTTPS resolver
#[derive(Debug)]
pub struct DohResolver {
    /// DoH endpoint URL
    endpoint: String,
}

/// Well-known DoH providers
pub const DOH_CLOUDFLARE: &str = "https://cloudflare-dns.com/dns-query";
pub const DOH_GOOGLE: &str = "https://dns.google/dns-query";
pub const DOH_QUAD9: &str = "https://dns.quad9.net/dns-query";

impl DohResolver {
    /// Create a new DoH resolver with a custom endpoint
    pub fn new(endpoint: String) -> Self {
        Self { endpoint }
    }

    /// Create a DoH resolver using Cloudflare (default)
    pub fn cloudflare() -> Self {
        Self::new(DOH_CLOUDFLARE.to_string())
    }

    /// Resolve a hostname via DNS-over-HTTPS
    ///
    /// All DNS queries go over HTTPS, preventing plaintext DNS leaks.
    pub async fn resolve(&self, hostname: &str) -> Result<Vec<IpAddr>> {
        use hickory_resolver::config::{ResolverConfig, ResolverOpts};
        use hickory_resolver::name_server::TokioConnectionProvider;
        use hickory_resolver::TokioResolver;

        let mut opts = ResolverOpts::default();
        opts.use_hosts_file = hickory_resolver::config::ResolveHosts::Never;
        opts.cache_size = 64;

        let config = if self.endpoint.contains("cloudflare") {
            ResolverConfig::cloudflare_https()
        } else if self.endpoint.contains("google") {
            ResolverConfig::google_https()
        } else if self.endpoint.contains("quad9") {
            ResolverConfig::quad9_https()
        } else {
            // Fall back to cloudflare for unknown endpoints
            ResolverConfig::cloudflare_https()
        };

        let resolver = TokioResolver::builder_with_config(config, TokioConnectionProvider::default())
            .with_options(opts)
            .build();

        let response = resolver.lookup_ip(hostname).await.map_err(|e| {
            NetworkError::DnsResolution(format!("DoH resolution failed for '{}': {}", hostname, e))
        })?;

        let addrs: Vec<IpAddr> = response.iter().collect();

        if addrs.is_empty() {
            return Err(NetworkError::DnsResolution(format!(
                "DoH returned no addresses for '{}'",
                hostname
            )));
        }

        Ok(addrs)
    }

    /// Get the endpoint URL
    pub fn endpoint(&self) -> &str {
        &self.endpoint
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_resolver() {
        let resolver = DohResolver::new("https://custom.dns/query".to_string());
        assert_eq!(resolver.endpoint(), "https://custom.dns/query");
    }

    #[test]
    fn test_cloudflare_default() {
        let resolver = DohResolver::cloudflare();
        assert!(resolver.endpoint().contains("cloudflare"));
    }
}
