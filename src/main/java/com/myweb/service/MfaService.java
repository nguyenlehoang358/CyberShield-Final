package com.myweb.service;

import org.springframework.stereotype.Service;

import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;

@Service
public class MfaService {

    private final GoogleAuthenticator gAuth;

    public MfaService() {
        this.gAuth = new GoogleAuthenticator();
    }

    public String generateSecret() {
        final GoogleAuthenticatorKey key = gAuth.createCredentials();
        return key.getKey();
    }

    public String getQrCodeUrl(String secret, String email) {
        // Format: otpauth://totp/Issuer:Account?secret=...&issuer=Issuer
        return String.format("otpauth://totp/MyWeb:%s?secret=%s&issuer=MyWeb", email, secret);
    }

    public boolean verify(String secret, int code) {
        return gAuth.authorize(secret, code);
    }
}
