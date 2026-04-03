package com.myweb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "solutions")
public class Solution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titleVi;

    @Column(nullable = false)
    private String titleEn;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descriptionVi;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(nullable = false)
    private String icon;

    @Column(nullable = false)
    private String color;

    @Column(nullable = false)
    private Integer displayOrder;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "detail_json", columnDefinition = "TEXT")
    private String detailJson;

    @Column(name = "related_labs_json", columnDefinition = "TEXT")
    private String relatedLabsJson;

    public Solution() {
    }

    public Solution(Long id, String titleVi, String titleEn, String descriptionVi, String descriptionEn,
            String icon, String color, Integer displayOrder, Boolean active, String detailJson, String relatedLabsJson) {
        this.id = id;
        this.titleVi = titleVi;
        this.titleEn = titleEn;
        this.descriptionVi = descriptionVi;
        this.descriptionEn = descriptionEn;
        this.icon = icon;
        this.color = color;
        this.displayOrder = displayOrder;
        this.active = active;
        this.detailJson = detailJson;
        this.relatedLabsJson = relatedLabsJson;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitleVi() {
        return titleVi;
    }

    public void setTitleVi(String titleVi) {
        this.titleVi = titleVi;
    }

    public String getTitleEn() {
        return titleEn;
    }

    public void setTitleEn(String titleEn) {
        this.titleEn = titleEn;
    }

    public String getDescriptionVi() {
        return descriptionVi;
    }

    public void setDescriptionVi(String descriptionVi) {
        this.descriptionVi = descriptionVi;
    }

    public String getDescriptionEn() {
        return descriptionEn;
    }

    public void setDescriptionEn(String descriptionEn) {
        this.descriptionEn = descriptionEn;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getDetailJson() {
        return detailJson;
    }

    public void setDetailJson(String detailJson) {
        this.detailJson = detailJson;
    }

    public String getRelatedLabsJson() {
        return relatedLabsJson;
    }

    public void setRelatedLabsJson(String relatedLabsJson) {
        this.relatedLabsJson = relatedLabsJson;
    }
}
