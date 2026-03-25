package com.fogistanbul.crm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateStaffRequest {
    @NotBlank(message = "Ad soyad zorunludur")
    @Size(max = 100)
    private String fullName;

    @NotBlank(message = "Email zorunludur")
    @Email(message = "Geçerli bir email giriniz")
    private String email;

    @NotBlank(message = "Şifre zorunludur")
    @Size(min = 8, message = "Şifre en az 8 karakter olmalıdır")
    private String password;

    private String phone;
    private String position;
    private String department;

    private java.util.UUID initialCompanyId;
}
