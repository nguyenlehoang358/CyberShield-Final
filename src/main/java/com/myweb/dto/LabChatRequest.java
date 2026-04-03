package com.myweb.dto;

public record LabChatRequest(
    String message,
    String labContext,
    String labId
) {}
