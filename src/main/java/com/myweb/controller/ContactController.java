package com.myweb.controller;

import com.myweb.entity.Contact;
import com.myweb.repository.ContactRepository;
import com.myweb.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/contacts")
public class ContactController {

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping
    public ResponseEntity<Contact> submitContact(@Valid @RequestBody Contact contact) {
        contact.setIsRead(false);
        Contact savedContact = contactRepository.save(contact);

        // Gửi email thông báo cho Admin (Asynchronous)
        emailService.sendContactNotification(
                contact.getName(),
                contact.getEmail(),
                contact.getSubject(),
                contact.getMessage());

        return ResponseEntity.ok(savedContact);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Contact>> getAllContacts() {
        return ResponseEntity.ok(contactRepository.findAll());
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Contact> markAsRead(@PathVariable Long id) {
        return contactRepository.findById(id).map(c -> {
            c.setIsRead(true);
            return ResponseEntity.ok(contactRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        if (!contactRepository.existsById(id))
            return ResponseEntity.notFound().build();
        contactRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
