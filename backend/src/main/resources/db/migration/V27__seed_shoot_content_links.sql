-- V27: Seed content plans linked to shoots & diversify shoot statuses

-- Mark past-date shoots as COMPLETED or CANCELLED for variety
UPDATE shoots SET status = 'COMPLETED' WHERE id = '753e18bd-b454-4d4b-91a7-a6faf224dcbf'; -- koltuklar - 7 Nisan (geçmiş)
UPDATE shoots SET status = 'CANCELLED' WHERE id = '7a017c97-6c5a-4642-8068-c030b0836c61'; -- Mermersa - 14 Nisan (geçmiş)
UPDATE shoots SET status = 'COMPLETED' WHERE id = 'e58ecd2d-cce8-4f55-af18-36a512413125'; -- Aydınlife Showroom - 17 Nisan (geçmiş)
UPDATE shoots SET status = 'COMPLETED' WHERE id = 'df93b394-de26-4338-b4c2-d906e4c405cc'; -- Ecom Space - 21 Nisan (geçmiş)
-- 0a3f.. Aydınlife Drone stays PLANNED (24 Nisan - today/overdue)
-- 1d8f.. Salı Günü stays PLANNED (28 Nisan - future)
-- 5214.. Deneme 2 stays PLANNED (5 Mayıs - future)

-- Insert content plans linked to "koltuklar çekilicek" shoot (COMPLETED)
INSERT INTO content_plans (id, company_id, created_by, title, description, author_name, platform, content_size, direction, speaker_model, status, planned_date, shoot_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Koltuk Tanıtım Reels', 'Yeni koltuk koleksiyonu için 15 saniyelik reels içeriği', 'Ahmet Yılmaz',
     'INSTAGRAM', '1080x1920', 'Koltukların farklı açılardan gösterimi, yaşam alanında kullanım', 'Model yok',
     'PUBLISHED', '2026-04-10', '753e18bd-b454-4d4b-91a7-a6faf224dcbf', NOW(), NOW()),

    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Koltuk Carousel Post', 'Koltuk çeşitleri carousel formatında', 'Elif Demir',
     'INSTAGRAM', '1080x1080', '5 slide: tanıtım, renk seçenekleri, boyutlar, fiyat, iletişim', NULL,
     'APPROVED', '2026-04-12', '753e18bd-b454-4d4b-91a7-a6faf224dcbf', NOW(), NOW());

-- Insert content plans linked to "Aydınlife Showroom Çekimi" (COMPLETED)
INSERT INTO content_plans (id, company_id, created_by, title, description, author_name, platform, content_size, direction, speaker_model, status, planned_date, shoot_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Showroom Tanıtım Videosu', 'Masko showroom turunu gösteren YouTube videosu', 'Mehmet Kaya',
     'YOUTUBE', '1920x1080', 'Showroom girişinden başlayarak her bölümün detaylı gösterimi', NULL,
     'PUBLISHED', '2026-04-20', 'e58ecd2d-cce8-4f55-af18-36a512413125', NOW(), NOW()),

    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Showroom Stories Serisi', '5 adet story serisi - ürün vitrin gösterimi', 'Zeynep Arslan',
     'INSTAGRAM', '1080x1920', 'Her story bir ürün grubunu tanıtacak', NULL,
     'APPROVED', '2026-04-19', 'e58ecd2d-cce8-4f55-af18-36a512413125', NOW(), NOW()),

    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Showroom TikTok İçeriği', 'Before/After showroom düzenleme TikTok trendi', 'Ahmet Yılmaz',
     'TIKTOK', '1080x1920', 'Trend müzikle showroom düzenlemesi before/after geçişi', NULL,
     'PUBLISHED', '2026-04-22', 'e58ecd2d-cce8-4f55-af18-36a512413125', NOW(), NOW());

-- Insert content plans linked to "Ecom Space Ürün Çekimi" (COMPLETED)
INSERT INTO content_plans (id, company_id, created_by, title, description, author_name, platform, content_size, direction, speaker_model, status, planned_date, shoot_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), '9f93ad73-2278-4767-b49f-8574e1f58481', '00000000-0000-0000-0000-000000000003',
     'Ürün Katalog Fotoğrafları', 'E-ticaret siteye yüklenecek ürün fotoğrafları', 'Burak Özdemir',
     'WEB', '2000x2000', 'Beyaz arka planda ürün fotoğrafları, her ürün 4 açıdan', NULL,
     'APPROVED', '2026-04-23', 'df93b394-de26-4338-b4c2-d906e4c405cc', NOW(), NOW()),

    (gen_random_uuid(), '9f93ad73-2278-4767-b49f-8574e1f58481', '00000000-0000-0000-0000-000000000003',
     'Ürün Tanıtım Reels', 'Top 5 ürün tanıtım reelsi', 'Selin Yıldız',
     'INSTAGRAM', '1080x1920', 'En çok satan 5 ürünün hızlı tanıtımı, fiyat bilgileriyle', NULL,
     'WAITING_APPROVAL', '2026-04-25', 'df93b394-de26-4338-b4c2-d906e4c405cc', NOW(), NOW());

-- Insert content plans linked to "Salı Günü Çekimi" (future PLANNED - already has 1)
INSERT INTO content_plans (id, company_id, created_by, title, description, author_name, platform, content_size, direction, speaker_model, status, planned_date, shoot_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Salon Dekorasyon Rehberi', 'LinkedIn için profesyonel dekorasyon rehberi içeriği', 'Elif Demir',
     'LINKEDIN', '1200x627', 'Profesyonel ton, dekorasyon trendleri ve öneriler', NULL,
     'DRAFT', '2026-04-30', '1d8f81f5-24fd-43b7-9054-86be63f08da5', NOW(), NOW()),

    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Yeni Sezon Instagram Post', 'Yeni sezon ürünleri tek kare tanıtım postu', 'Zeynep Arslan',
     'INSTAGRAM', '1080x1080', 'Minimalist tasarım, ürün kolajı, fiyat aralığı', NULL,
     'WAITING_APPROVAL', '2026-04-29', '1d8f81f5-24fd-43b7-9054-86be63f08da5', NOW(), NOW());

-- Insert content plans linked to "Aydınlife Drone Çekimi" (today/overdue)
INSERT INTO content_plans (id, company_id, created_by, title, description, author_name, platform, content_size, direction, speaker_model, status, planned_date, shoot_id, created_at, updated_at)
VALUES
    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Fabrika Drone Videosu', 'Drone ile fabrika üstten çekim videosu', 'Mehmet Kaya',
     'YOUTUBE', '3840x2160', 'Fabrika çevresinden başlayıp üretim alanına iniş', NULL,
     'APPROVED', '2026-04-26', '0a3f9ed5-72a6-438b-8b78-24d4a68a5ee1', NOW(), NOW()),

    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Drone Reels - İnegöl', 'Kuş bakışı fabrika reels içeriği', 'Ahmet Yılmaz',
     'INSTAGRAM', '1080x1920', 'Hızlandırılmış drone çekimi, epic müzikle', NULL,
     'DRAFT', '2026-04-27', '0a3f9ed5-72a6-438b-8b78-24d4a68a5ee1', NOW(), NOW());

-- Insert unlinked content plans (no shoot) for variety
INSERT INTO content_plans (id, company_id, created_by, title, description, author_name, platform, content_size, direction, speaker_model, status, planned_date, created_at, updated_at)
VALUES
    (gen_random_uuid(), '2e05b337-a870-4a0e-8a79-be9c65f173fc', '00000000-0000-0000-0000-000000000003',
     'Marka Hikayesi Videosu', 'Aydınlife marka hikayesi anlatım videosu', 'Burak Özdemir',
     'YOUTUBE', '1920x1080', 'Kurucu röportajı, fabrika sahneleri, müşteri yorumları', 'Şirket Sahibi',
     'DRAFT', '2026-05-01', NOW(), NOW()),

    (gen_random_uuid(), '6ac08a8d-c583-42cf-878e-c885b5f38f65', '00000000-0000-0000-0000-000000000003',
     'Mermer Tanıtım Postu', 'Mermersa ürün yelpazesi tanıtım postu', 'Selin Yıldız',
     'INSTAGRAM', '1080x1350', 'Mermer çeşitleri grid formatında, doğal ışıkta', NULL,
     'WAITING_APPROVAL', '2026-04-28', NOW(), NOW());
