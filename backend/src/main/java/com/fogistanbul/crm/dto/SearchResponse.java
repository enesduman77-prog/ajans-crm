package com.fogistanbul.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SearchResponse {
    private List<SearchResult> companies;
    private List<SearchResult> tasks;
    private List<SearchResult> staff;
    private List<SearchResult> notes;

    @Data
    @Builder
    public static class SearchResult {
        private String id;
        private String title;
        private String subtitle;
        private String type;
        private String route;
    }
}
