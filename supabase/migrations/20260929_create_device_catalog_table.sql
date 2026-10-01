-- Create device_catalog table for dynamic Types, Brands, and Models
CREATE TABLE IF NOT EXISTS public.device_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(device_type, brand, model)
);

-- Index for fast lookup by brand and device_type
CREATE INDEX IF NOT EXISTS idx_device_catalog_brand ON public.device_catalog(brand);
CREATE INDEX IF NOT EXISTS idx_device_catalog_type ON public.device_catalog(device_type);

-- Seed initial popular catalog items
INSERT INTO public.device_catalog (device_type, brand, model) VALUES
-- Apple iPhone
('iPhone', 'Apple', 'iPhone 11'),
('iPhone', 'Apple', 'iPhone 12'),
('iPhone', 'Apple', 'iPhone 12 Pro'),
('iPhone', 'Apple', 'iPhone 13'),
('iPhone', 'Apple', 'iPhone 13 Pro Max'),
('iPhone', 'Apple', 'iPhone 14'),
('iPhone', 'Apple', 'iPhone 14 Pro'),
('iPhone', 'Apple', 'iPhone 15'),
('iPhone', 'Apple', 'iPhone 15 Pro Max'),
('iPhone', 'Apple', 'iPhone 16'),
('iPhone', 'Apple', 'iPhone 16 Pro Max'),
-- Apple MacBook
('MacBook', 'Apple', 'MacBook Air M1 (2020)'),
('MacBook', 'Apple', 'MacBook Air M2 (2022)'),
('MacBook', 'Apple', 'MacBook Air M3 (2024)'),
('MacBook', 'Apple', 'MacBook Pro 13" M1'),
('MacBook', 'Apple', 'MacBook Pro 14" M2 Pro'),
('MacBook', 'Apple', 'MacBook Pro 16" M3 Max'),
-- Apple iPad / Tablet
('Tablet', 'Apple', 'iPad Air 5th Gen'),
('Tablet', 'Apple', 'iPad Pro 11" M2'),
('Tablet', 'Apple', 'iPad Pro 12.9" M2'),
('Tablet', 'Apple', 'iPad Mini 6th Gen'),
-- Samsung Phones & Tablets
('Android Phone', 'Samsung', 'Galaxy S21'),
('Android Phone', 'Samsung', 'Galaxy S22 Ultra'),
('Android Phone', 'Samsung', 'Galaxy S23'),
('Android Phone', 'Samsung', 'Galaxy S24 Ultra'),
('Android Phone', 'Samsung', 'Galaxy A54 5G'),
('Android Phone', 'Samsung', 'Galaxy Z Fold 5'),
('Android Phone', 'Samsung', 'Galaxy Z Flip 5'),
('Tablet', 'Samsung', 'Galaxy Tab S8'),
('Tablet', 'Samsung', 'Galaxy Tab S9 Ultra'),
-- Dell Laptops & Desktops
('Laptop', 'Dell', 'Inspiron 15 3511'),
('Laptop', 'Dell', 'Inspiron 14 5420'),
('Laptop', 'Dell', 'Vostro 3510'),
('Laptop', 'Dell', 'XPS 13 9315'),
('Laptop', 'Dell', 'XPS 15 9530'),
('Laptop', 'Dell', 'Latitude 5420'),
('Desktop', 'Dell', 'OptiPlex 7090 Tower'),
-- HP Laptops & Desktops
('Laptop', 'HP', 'Pavilion 15-eg2000'),
('Laptop', 'HP', 'HP 14s-dq3000'),
('Laptop', 'HP', 'Spectre x360 14'),
('Laptop', 'HP', 'Envy 13-ba1000'),
('Laptop', 'HP', 'Victus 16-d1000'),
('Laptop', 'HP', 'Omen 16-k0000'),
('Desktop', 'HP', 'ProDesk 400 G7'),
-- Lenovo Laptops & Tablets
('Laptop', 'Lenovo', 'ThinkPad E14 Gen 4'),
('Laptop', 'Lenovo', 'IdeaPad Slim 3'),
('Laptop', 'Lenovo', 'Yoga 7i 14"'),
('Laptop', 'Lenovo', 'Legion 5 Pro'),
('Tablet', 'Lenovo', 'Tab M10 Plus Gen 3'),
-- Asus
('Laptop', 'Asus', 'ROG Strix G15'),
('Laptop', 'Asus', 'TUF Gaming F15'),
('Laptop', 'Asus', 'ZenBook 14 OLED'),
('Laptop', 'Asus', 'VivoBook 15'),
-- Xiaomi / OnePlus / Realme
('Android Phone', 'OnePlus', 'OnePlus 11 5G'),
('Android Phone', 'OnePlus', 'OnePlus 12'),
('Android Phone', 'OnePlus', 'OnePlus Nord CE 3'),
('Android Phone', 'Xiaomi', 'Redmi Note 12 Pro'),
('Android Phone', 'Xiaomi', 'Xiaomi 13 Pro'),
('Android Phone', 'Realme', 'Realme 11 Pro+')
ON CONFLICT (device_type, brand, model) DO NOTHING;
