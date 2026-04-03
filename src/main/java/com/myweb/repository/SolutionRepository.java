package com.myweb.repository;

import com.myweb.entity.Solution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolutionRepository extends JpaRepository<Solution, Long> {
    List<Solution> findAllByActiveTrueOrderByDisplayOrderAsc();

    List<Solution> findAllByOrderByDisplayOrderAsc();
}
