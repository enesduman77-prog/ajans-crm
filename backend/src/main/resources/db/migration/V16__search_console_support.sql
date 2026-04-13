-- V16: Google Search Console desteği
ALTER TABLE google_oauth_tokens ADD COLUMN sc_site_url VARCHAR(255);
