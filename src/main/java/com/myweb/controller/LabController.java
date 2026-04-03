package com.myweb.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.myweb.service.OllamaLabMentorService;

@RestController
@RequestMapping("/api/lab")
public class LabController {

    private final OllamaLabMentorService ollamaLabMentorService;

    public LabController(OllamaLabMentorService ollamaLabMentorService) {
        this.ollamaLabMentorService = ollamaLabMentorService;
    }

    @GetMapping("/{labType}/suggestions")
    public ResponseEntity<List<String>> getAutoSuggest(
            @PathVariable("labType") String labType,
            @RequestParam(value = "q", required = false) String userInput) {
        List<String> suggestions = ollamaLabMentorService.generateAutoSuggestPayloads(labType, userInput);
        return ResponseEntity.ok(suggestions);
    }
}
