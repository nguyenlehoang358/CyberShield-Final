package com.myweb.controller;

import com.myweb.entity.Blog;
import com.myweb.repository.BlogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blogs")
public class BlogController {

    @Autowired
    private BlogRepository blogRepository;

    @GetMapping
    public ResponseEntity<Page<Blog>> getBlogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean all) {
            
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"));
        Page<Blog> blogs = all ? blogRepository.findAll(pageable) : blogRepository.findAllByPublishedTrue(pageable);
        
        return ResponseEntity.ok(blogs);
    }

    @PostMapping
    public ResponseEntity<Blog> createBlog(@RequestBody Blog blog) {
        if (blog.getPublishedAt() == null) blog.setPublishedAt(java.time.Instant.now());
        return ResponseEntity.ok(blogRepository.save(blog));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Blog> updateBlog(@PathVariable Long id, @RequestBody Blog updatedData) {
        return blogRepository.findById(id).map(b -> {
            boolean previousPublished = b.getPublished();
            b.setTitle(updatedData.getTitle());
            b.setSummary(updatedData.getSummary());
            b.setUrl(updatedData.getUrl());
            b.setImageUrl(updatedData.getImageUrl());
            if (updatedData.getPublished() != previousPublished) {
                b.setPublished(updatedData.getPublished());
            }
            return ResponseEntity.ok(blogRepository.save(b));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBlog(@PathVariable Long id) {
        if (!blogRepository.existsById(id)) return ResponseEntity.notFound().build();
        blogRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
