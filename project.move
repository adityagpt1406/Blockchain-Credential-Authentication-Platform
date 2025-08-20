module CertificateVerification::Certificate {
    use aptos_framework::signer;
    use aptos_framework::string::String;

    struct CertificateData has key, store {
        issuer: address,
        certificate_id: String,
        recipient: String,
        issue_date: String,
        details: String,
    }

    public fun issue_certificate(issuer: &signer, certificate_id: String, recipient: String, issue_date: String, details: String) {
        let issuer_address = signer::address_of(issuer);
        let certificate = CertificateData {
            issuer: issuer_address,
            certificate_id,
            recipient,
            issue_date,
            details,
        };
        move_to(issuer, certificate);
    }

    public fun verify_certificate(certificate_owner: address, certificate_id: String): CertificateData acquires CertificateData {
        let certificate = borrow_global<CertificateData>(certificate_owner);
        assert!(certificate.certificate_id == certificate_id, 0);
        return *certificate;
    }
}
