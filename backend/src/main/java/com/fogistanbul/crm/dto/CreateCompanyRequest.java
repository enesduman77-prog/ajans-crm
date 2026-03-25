package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCompanyRequest {
    @NotBlank(message = "Şirket adı zorunludur")
    private String name;

    private String industry;
    private String taxId;
    private Integer foundedYear;
    private String vision;
    private String mission;
    private Integer employeeCount;

    @Email(message = "Geçerli bir email giriniz")
    private String email;
    private String phone;
    private String address;
    private String website;

    private String socialInstagram;
    private String socialFacebook;
    private String socialTwitter;
    private String socialLinkedin;
    private String socialYoutube;
    private String socialTiktok;

    private String notes;

    // Sahip bilgileri
    @NotBlank(message = "Sahip adı zorunludur")
    private String ownerFullName;

    @NotBlank(message = "Sahip email zorunludur")
    @Email(message = "Geçerli bir email giriniz")
    private String ownerEmail;

    @NotBlank(message = "Sahip şifresi zorunludur")
    @Size(min = 8, message = "Şifre en az 8 karakter olmalıdır")
    private String ownerPassword;

    private String ownerPhone;
    private String ownerPosition;
}
