package com.myweb.controller;

import com.myweb.entity.Contact;
import com.myweb.repository.ContactRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    @Autowired
    private ContactRepository contactRepository;

    @PostMapping
    public ResponseEntity<Contact> submitContact(@Valid @RequestBody Contact contact) {
        contact.setIsRead(false);
        Contact savedContact = contactRepository.save(contact);
        return ResponseEntity.ok(savedContact);
    }

    @GetMapping
    public ResponseEntity<List<Contact>> getAllContacts() {
        return ResponseEntity.ok(contactRepository.findAll());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Contact> markAsRead(@PathVariable Long id) {
        return contactRepository.findById(id).map(c -> {
            c.setIsRead(true);
            return ResponseEntity.ok(contactRepository.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        if (!contactRepository.existsById(id)) return ResponseEntity.notFound().build();
        contactRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
