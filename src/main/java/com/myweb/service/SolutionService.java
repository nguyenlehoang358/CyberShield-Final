package com.myweb.service;

import com.myweb.entity.Solution;
import com.myweb.repository.SolutionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SolutionService {

    @Autowired
    private SolutionRepository solutionRepository;

    public List<Solution> getAllSolutions(boolean activeOnly) {
        if (activeOnly) {
            return solutionRepository.findAllByActiveTrueOrderByDisplayOrderAsc();
        }
        return solutionRepository.findAllByOrderByDisplayOrderAsc();
    }

    public Optional<Solution> getSolutionById(Long id) {
        return solutionRepository.findById(id);
    }

    public Solution createSolution(Solution solution) {
        return solutionRepository.save(solution);
    }

    public Solution updateSolution(Long id, Solution solutionDetails) {
        Solution solution = solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solution not found with id: " + id));

        solution.setTitleVi(solutionDetails.getTitleVi());
        solution.setTitleEn(solutionDetails.getTitleEn());
        solution.setDescriptionVi(solutionDetails.getDescriptionVi());
        solution.setDescriptionEn(solutionDetails.getDescriptionEn());
        solution.setIcon(solutionDetails.getIcon());
        solution.setColor(solutionDetails.getColor());
        solution.setDisplayOrder(solutionDetails.getDisplayOrder());
        solution.setActive(solutionDetails.getActive());
        solution.setDetailJson(solutionDetails.getDetailJson());
        solution.setRelatedLabsJson(solutionDetails.getRelatedLabsJson());

        return solutionRepository.save(solution);
    }

    public void deleteSolution(Long id) {
        Solution solution = solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solution not found with id: " + id));
        solutionRepository.delete(solution);
    }
}
