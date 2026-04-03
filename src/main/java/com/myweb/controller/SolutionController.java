package com.myweb.controller;

import com.myweb.entity.Solution;
import com.myweb.service.SolutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SolutionController {

    @Autowired
    private SolutionService solutionService;

    // Public endpoint to get all active solutions
    @GetMapping("/public/solutions")
    public List<Solution> getPublicSolutions() {
        return solutionService.getAllSolutions(true);
    }

    // Admin endpoints
    @GetMapping("/admin/solutions")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Solution> getAllSolutions() {
        return solutionService.getAllSolutions(false);
    }

    @PostMapping("/admin/solutions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Solution> createSolution(@RequestBody Solution solution) {
        return ResponseEntity.ok(solutionService.createSolution(solution));
    }

    @PutMapping("/admin/solutions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Solution> updateSolution(@PathVariable Long id, @RequestBody Solution solutionDetails) {
        return ResponseEntity.ok(solutionService.updateSolution(id, solutionDetails));
    }

    @DeleteMapping("/admin/solutions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteSolution(@PathVariable Long id) {
        solutionService.deleteSolution(id);
        return ResponseEntity.ok().build();
    }
}
