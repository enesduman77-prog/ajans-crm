package com.fogistanbul.crm.controller;

import com.fogistanbul.crm.dto.AddEmployeeRequest;
import com.fogistanbul.crm.dto.CompanyResponse;
import com.fogistanbul.crm.dto.CreateCompanyRequest;
import com.fogistanbul.crm.dto.UpdateCompanyRequest;
import com.fogistanbul.crm.dto.SurveyResponse;
import com.fogistanbul.crm.service.CompanyService;
import com.fogistanbul.crm.service.SurveyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/companies")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final SurveyService surveyService;

    @PostMapping
    public ResponseEntity<CompanyResponse> create(@Valid @RequestBody CreateCompanyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.createCompanyWithOwner(request));
    }

    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getAll() {
        return ResponseEntity.ok(companyService.getAllClients());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(companyService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponse> update(@PathVariable UUID id,
            @Valid @RequestBody UpdateCompanyRequest request) {
        return ResponseEntity.ok(companyService.update(id, request));
    }

    @PostMapping("/{companyId}/employees")
    public ResponseEntity<Map<String, String>> addEmployee(
            @PathVariable UUID companyId,
            @Valid @RequestBody AddEmployeeRequest request) {
        companyService.addEmployeeToCompany(companyId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Çalışan başarıyla eklendi"));
    }

    @DeleteMapping("/{companyId}/employees/{userId}")
    public ResponseEntity<Void> removeEmployee(
            @PathVariable UUID companyId,
            @PathVariable UUID userId) {
        companyService.removeEmployeeFromCompany(companyId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{companyId}")
    public ResponseEntity<Void> delete(@PathVariable UUID companyId) {
        companyService.deleteCompany(companyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{companyId}/surveys")
    public ResponseEntity<List<SurveyResponse>> getCompanySurveys(@PathVariable UUID companyId) {
        return ResponseEntity.ok(surveyService.getCompanySurveys(companyId));
    }

    @GetMapping("/surveys/all")
    public ResponseEntity<List<SurveyResponse>> getAllSurveys() {
        return ResponseEntity.ok(surveyService.getAllSurveys());
    }
}
