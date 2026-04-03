package com.myweb.util;

import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Component
@Converter
public class AttributeEncryptor implements AttributeConverter<String, String> {

    private static final String AES = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 12 bytes (96 bits) for GCM is standard
    private static final int GCM_TAG_LENGTH = 128; // 128 bits authentication tag

    // Static field to hold the key
    private static String SECRET_KEY_STRING;

    @Value("${app.security.encryption.key}")
    private String secretKey;

    @PostConstruct
    public void init() {
        SECRET_KEY_STRING = this.secretKey;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null)
            return null;
        if (SECRET_KEY_STRING == null) {
            throw new IllegalStateException("Encryption key not initialized");
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Key key = new SecretKeySpec(SECRET_KEY_STRING.getBytes(StandardCharsets.UTF_8), AES);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, spec);

            byte[] cipherText = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));
            byte[] cipherTextWithIv = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, cipherTextWithIv, 0, iv.length);
            System.arraycopy(cipherText, 0, cipherTextWithIv, iv.length, cipherText.length);

            return Base64.getEncoder().encodeToString(cipherTextWithIv);
        } catch (InvalidKeyException | NoSuchAlgorithmException | NoSuchPaddingException | IllegalBlockSizeException
                | BadPaddingException | InvalidAlgorithmParameterException e) {
            throw new IllegalStateException("Error encrypting attribute", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null)
            return null;
        if (SECRET_KEY_STRING == null) {
            throw new IllegalStateException("Encryption key not initialized");
        }
        try {
            byte[] cipherTextWithIv = Base64.getDecoder().decode(dbData);
            if (cipherTextWithIv.length < GCM_IV_LENGTH) {
                throw new IllegalArgumentException("Invalid encrypted data");
            }

            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(cipherTextWithIv, 0, iv, 0, iv.length);

            byte[] cipherText = new byte[cipherTextWithIv.length - iv.length];
            System.arraycopy(cipherTextWithIv, iv.length, cipherText, 0, cipherText.length);

            Key key = new SecretKeySpec(SECRET_KEY_STRING.getBytes(StandardCharsets.UTF_8), AES);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, spec);

            return new String(cipher.doFinal(cipherText), StandardCharsets.UTF_8);
        } catch (InvalidKeyException | NoSuchAlgorithmException | NoSuchPaddingException | IllegalBlockSizeException
                | BadPaddingException | InvalidAlgorithmParameterException e) {
            throw new IllegalStateException("Error decrypting attribute", e);
        }
    }
}
