-- Seed permission definitions
INSERT INTO permission_definitions (key, label, description, category) VALUES
('messages.general.write', 'Genel kanalda mesaj yazma', 'Şirket genel kanalında mesaj yazabilme yetkisi', 'messages'),
('messages.dm.start', 'Özel mesaj başlatma', 'Yeni bir özel mesaj konuşması başlatabilme yetkisi', 'messages'),
('messages.dm.write', 'Özel mesajda yazma', 'Mevcut özel mesaj konuşmasında yazabilme yetkisi', 'messages'),
('tasks.view', 'Görevleri görme', 'Görevleri görüntüleyebilme yetkisi', 'tasks'),
('tasks.create', 'Görev oluşturma', 'Yeni görev oluşturabilme yetkisi', 'tasks'),
('tasks.update', 'Görev güncelleme', 'Mevcut görevleri güncelleyebilme yetkisi', 'tasks'),
('calendar.view', 'Takvimi görme', 'Takvimi görüntüleyebilme yetkisi', 'calendar'),
('calendar.create', 'Etkinlik oluşturma', 'Takvime etkinlik ekleyebilme yetkisi', 'calendar'),
('meetings.request', 'Toplantı talebi', 'Toplantı talebinde bulunabilme yetkisi', 'meetings'),
('reports.view', 'Raporları görme', 'Raporları görüntüleyebilme yetkisi', 'reports'),
('pr.view', 'PR projelerini görme', 'PR projelerini görüntüleyebilme yetkisi', 'pr'),
('pr.create', 'PR projesi oluşturma', 'Yeni PR projesi oluşturabilme yetkisi', 'pr'),
('shoots.view', 'Çekimleri görme', 'Çekimleri görüntüleyebilme yetkisi', 'shoots'),
('shoots.create', 'Çekim planlama', 'Yeni çekim planlayabilme yetkisi', 'shoots'),
('panel.dashboard', 'Dashboard erişimi', 'Dashboard sayfasına erişim yetkisi', 'panel'),
('panel.companies', 'Şirketler erişimi', 'Şirketler sayfasına erişim yetkisi', 'panel'),
('panel.completed_tasks', 'Tamamlanan işler erişimi', 'Tamamlanan işler sayfasına erişim yetkisi', 'panel');

-- Seed FOG Istanbul (Agency company)
INSERT INTO companies (id, kind, name, industry, email, contract_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'AGENCY', 'FOG İstanbul', 'Dijital Ajans', 'info@fogistanbul.com', 'ACTIVE');

-- Seed admin user (password: Admin123!)
-- BCrypt hash of 'Admin123!' 
INSERT INTO persons (id, company_id, full_name, email, position_title)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Admin', 'admin@fogistanbul.com', 'Ajans Sahibi');

INSERT INTO user_profiles (id, person_id, global_role, email, password_hash)
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'ADMIN', 'admin@fogistanbul.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

INSERT INTO company_memberships (user_id, company_id, membership_role)
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'OWNER');
