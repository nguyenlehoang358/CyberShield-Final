package com.myweb.service;

import com.myweb.entity.Blog;
import com.myweb.repository.BlogRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Instant;

import jakarta.annotation.PostConstruct;

@Service
public class BlogCrawlerService {

    private static final Logger logger = LoggerFactory.getLogger(BlogCrawlerService.class);

    @Autowired
    private BlogRepository blogRepository;

    @Scheduled(fixedDelay = 3600000, initialDelay = 30000) // Chờ server lên 30s rồi mới bắt đầu cào data
    public void fetchSecurityNews() {
        logger.info("Bắt đầu cào dữ liệu từ The Hacker News...");
        try {
            String url = "https://thehackernews.com/";
            Document doc = Jsoup.connect(url).userAgent("Mozilla/5.0").get();

            Elements posts = doc.select(".body-post");

            for (Element post : posts) {
                Element linkElement = post.selectFirst("a.story-link");
                if (linkElement == null) continue;
                String articleUrl = linkElement.attr("href");

                if (blogRepository.existsByUrl(articleUrl)) {
                    continue;
                }

                Element titleElement = post.selectFirst("h2.home-title");
                String title = titleElement != null ? titleElement.text() : "No Title";

                Element summaryElement = post.selectFirst("div.home-desc");
                String summary = summaryElement != null ? summaryElement.text() : "";

                Element imgElement = post.selectFirst("div.home-img img");
                String imageUrl = "";
                if (imgElement != null) {
                    imageUrl = imgElement.hasAttr("data-src") ? imgElement.attr("data-src") : imgElement.attr("src");
                } else {
                    Element imgContainer = post.selectFirst("div.home-img");
                    if (imgContainer != null && imgContainer.hasAttr("data-bgr")) {
                        imageUrl = imgContainer.attr("data-bgr");
                    }
                }

                Blog blog = new Blog();
                blog.setUrl(articleUrl);
                blog.setTitle(title);
                blog.setSummary(summary);
                blog.setImageUrl(imageUrl);
                blog.setPublishedAt(Instant.now());

                blogRepository.save(blog);
                logger.info("Đã lưu bài viết mới: " + title);
            }
            logger.info("Crawler đã hoàn tất việc cào dữ liệu!");

        } catch (Exception e) {
            logger.error("Đã xảy ra lỗi khi cào dữ liệu Blogs: " + e.getMessage());
        }
    }
}
