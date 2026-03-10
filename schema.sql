-- ════════════════════════════════════════════════════════════════
--   JUNTO — Esquema de Base de Datos Supabase
--   San Martín, Mendoza, Argentina
-- ════════════════════════════════════════════════════════════════

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. STORES (Tiendas / Proveedores)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  emoji        text NOT NULL DEFAULT '🏪',
  address      text,
  category     text,
  description  text,
  rating       numeric(2,1) DEFAULT 0,
  approved     boolean DEFAULT false,
  revenue      integer DEFAULT 0,
  orders       integer DEFAULT 0,
  members      integer DEFAULT 0,
  since        text,
  created_at   timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 2. PRODUCTS (Productos)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id          uuid REFERENCES stores(id) ON DELETE SET NULL,
  name              text NOT NULL,
  emoji             text NOT NULL DEFAULT '📦',
  category          text,
  description       text,
  price_individual  integer NOT NULL DEFAULT 0,
  price_group       integer NOT NULL DEFAULT 0,
  min_buyers        integer NOT NULL DEFAULT 10,
  stock             integer DEFAULT 0,
  featured          boolean DEFAULT false,
  tag               text,
  shares            integer DEFAULT 0,
  rating            numeric(2,1) DEFAULT 0,
  review_count      integer DEFAULT 0,
  views             integer DEFAULT 0,
  active            boolean DEFAULT true,
  approved          boolean DEFAULT true,
  image_url         text,
  expires_seconds   integer DEFAULT 86400,
  created_at        timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 3. GROUPS (Grupos de compra)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       uuid REFERENCES products(id) ON DELETE CASCADE,
  current_buyers   integer DEFAULT 0,
  min_buyers       integer NOT NULL DEFAULT 10,
  status           text DEFAULT 'active' CHECK (status IN ('active','completed','expired')),
  expires_at       timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 4. USERS (Perfil extendido de auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text,
  email          text,
  phone          text,
  role           text DEFAULT 'client' CHECK (role IN ('client','provider','admin')),
  points         integer DEFAULT 0,
  level          integer DEFAULT 1,
  store_id       uuid REFERENCES stores(id) ON DELETE SET NULL,
  referral_code  text UNIQUE,
  referred_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 5. GROUP_MEMBERS (Miembros de cada grupo)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- ─────────────────────────────────────────────
-- 6. REVIEWS (Reseñas de productos)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  rating      integer CHECK (rating BETWEEN 1 AND 5),
  text        text,
  verified    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 7. CHAT_MESSAGES (Chat grupal)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  text        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 8. DEMANDS (Demanda inversa)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demands (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name text NOT NULL,
  description  text,
  category     text,
  votes        integer DEFAULT 0,
  status       text DEFAULT 'open' CHECK (status IN ('open','fulfilled')),
  created_at   timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 9. DEMAND_VOTES (Votos únicos por usuario)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demand_votes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  demand_id   uuid REFERENCES demands(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(demand_id, user_id)
);

-- ─────────────────────────────────────────────
-- 10. FAVORITES (Favoritos)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favorites (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ─────────────────────────────────────────────
-- 11. NOTIFICATIONS (Notificaciones)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  type        text CHECK (type IN ('group','complete','promo','refer')),
  icon        text,
  title       text,
  body        text,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
--   ÍNDICES
-- ════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active, approved, featured);
CREATE INDEX IF NOT EXISTS idx_groups_product ON groups(product_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_chat_group ON chat_messages(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- ════════════════════════════════════════════════════════════════
--   ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════════
ALTER TABLE stores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE demands       ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_votes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Stores: lectura pública, escritura solo admin
CREATE POLICY "stores_public_read"  ON stores FOR SELECT USING (true);
CREATE POLICY "stores_admin_write"  ON stores FOR ALL USING (auth.role() = 'authenticated');

-- Products: lectura pública
CREATE POLICY "products_public_read" ON products FOR SELECT USING (active = true AND approved = true);
CREATE POLICY "products_auth_write"  ON products FOR ALL USING (auth.role() = 'authenticated');

-- Groups: lectura pública
CREATE POLICY "groups_public_read" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_auth_write"  ON groups FOR ALL USING (auth.role() = 'authenticated');

-- Users: cada uno ve solo su perfil
CREATE POLICY "users_own_read"  ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_write" ON users FOR ALL   USING (auth.uid() = id);

-- Group members: autenticados
CREATE POLICY "gm_auth_read"  ON group_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "gm_own_write"  ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gm_own_delete" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- Reviews: lectura pública, escritura autenticada
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_auth_write"  ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat: autenticados
CREATE POLICY "chat_auth_read"  ON chat_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "chat_auth_write" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Demands: lectura pública
CREATE POLICY "demands_public_read" ON demands FOR SELECT USING (true);
CREATE POLICY "demands_auth_write"  ON demands FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Demand votes: autenticados
CREATE POLICY "dv_auth_read"  ON demand_votes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "dv_own_write"  ON demand_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites: propios
CREATE POLICY "fav_own_read"   ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fav_own_write"  ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fav_own_delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Notifications: propias
CREATE POLICY "notif_own_read"  ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_own_write" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
--   FUNCIONES RPC
-- ════════════════════════════════════════════════════════════════

-- Unirse a un grupo (atómico, evita race condition)
CREATE OR REPLACE FUNCTION join_group(p_group_id uuid, p_user_id uuid)
RETURNS json AS $$
DECLARE
  v_group groups%ROWTYPE;
  v_result json;
BEGIN
  SELECT * INTO v_group FROM groups WHERE id = p_group_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Grupo no encontrado');
  END IF;

  IF v_group.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'El grupo ya no está activo');
  END IF;

  IF EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Ya estás en este grupo');
  END IF;

  INSERT INTO group_members (group_id, user_id) VALUES (p_group_id, p_user_id);

  UPDATE groups SET current_buyers = current_buyers + 1 WHERE id = p_group_id;

  IF v_group.current_buyers + 1 >= v_group.min_buyers THEN
    UPDATE groups SET status = 'completed' WHERE id = p_group_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Incrementar votos de demanda
CREATE OR REPLACE FUNCTION increment_demand_votes(p_demand_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE demands SET votes = votes + 1 WHERE id = p_demand_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear perfil de usuario automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, name, email, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    upper(substring(md5(random()::text), 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ════════════════════════════════════════════════════════════════
--   DATOS DEMO (Tiendas, Productos, Grupos)
-- ════════════════════════════════════════════════════════════════

-- Tiendas
INSERT INTO stores (id, name, emoji, address, category, description, rating, approved, revenue, orders, members, since) VALUES
  ('11111111-0001-0001-0001-000000000001', 'Almacén Don Roberto',       '🏪', 'Av. San Martín 450', 'Almacén',      'El almacén más completo del barrio. 20 años de experiencia en San Martín.', 4.8, true, 340000, 42, 89, 'Nov 2024'),
  ('11111111-0002-0002-0002-000000000002', 'Distribuidora Pérez Hnos.', '📦', 'Belgrano 210',       'Distribuidora','Distribuidora mayorista con los mejores precios en productos de limpieza y almacén.', 4.5, true, 210000, 28, 54, 'Dic 2024'),
  ('11111111-0003-0003-0003-000000000003', 'Veterinaria Central',       '🐾', 'Rivadavia 780',      'Veterinaria',  'Especialistas en salud animal. Alimentos y accesorios para mascotas.', 4.9, true, 180000, 15, 41, 'Ene 2025'),
  ('11111111-0004-0004-0004-000000000004', 'Farmacia y Perfumería Sol', '💊', 'San Martín 120',     'Farmacia',     'Farmacia y perfumería con amplio stock. Cosméticos y cuidado personal.', 4.7, true, 290000, 22, 67, 'Nov 2024'),
  ('11111111-0005-0005-0005-000000000005', 'Carnicería El Gaucho',      '🥩', 'Las Heras 55',       'Carnicería',   'Carnes frescas de primera calidad. Cortes especiales para asado.', 4.6, true, 420000, 35, 78, 'Feb 2025'),
  ('11111111-0006-0006-0006-000000000006', 'Verdulería La Huerta',      '🌿', '9 de Julio 330',     'Verdulería',   'Frutas y verduras frescas de productores locales de San Martín.', 4.4, true, 45000, 8, 22, 'Mar 2025')
ON CONFLICT (id) DO NOTHING;

-- Productos
INSERT INTO products (id, store_id, name, emoji, category, description, price_individual, price_group, min_buyers, stock, featured, tag, shares, rating, review_count, views, expires_seconds) VALUES
  ('22222222-0001-0001-0001-000000000001', '11111111-0001-0001-0001-000000000001', 'Yerba Playadito 1kg',    '🧉', 'Almacén',   'Yerba mate molida gruesa 100% argentina. Bolsa de 1kg.',        8500,  5200, 20, 200, true,  'MÁS POPULAR', 89, 4.8, 34, 312, 72000),
  ('22222222-0002-0002-0002-000000000002', '11111111-0001-0001-0001-000000000001', 'Aceite Cocinero 1.5L',   '🛢️','Almacén',   'Aceite de girasol refinado, botella de 1.5L.',                 15000, 10500, 20, 100, true,  'DESTACADO',   47, 4.6, 22, 189, 57600),
  ('22222222-0003-0003-0003-000000000003', '11111111-0001-0001-0001-000000000001', 'Arroz Gallo Oro 5kg',    '🍚', 'Almacén',   'Arroz largo fino premium. Bolsa de 5kg. Sin TACC.',            12000,  8500, 15, 80,  false, null,          31, 4.7, 18, 156, 43200),
  ('22222222-0004-0004-0004-000000000004', '11111111-0002-0002-0002-000000000002', 'Azúcar Ledesma 2kg ×3',  '🍬', 'Almacén',   'Pack de 3 bolsas azúcar blanca 2kg cada una.',                  7200,  5400, 12, 60,  false, null,          22, 4.5, 12, 98,  86400),
  ('22222222-0005-0005-0005-000000000005', '11111111-0002-0002-0002-000000000002', 'Fideos Matarazzo ×6',    '🍝', 'Almacén',   'Pack 6 paquetes fideos spaghetti 400g. Sémola de trigo.',       9600,  7000, 10, 120, false, null,          19, 4.4,  9,  87, 36000),
  ('22222222-0006-0006-0006-000000000006', '11111111-0003-0003-0003-000000000003', 'Pedigree Adultos 15kg',  '🐾', 'Mascotas',  'Alimento balanceado perros adultos. Bolsa 15kg.',              42000, 28000,  5, 30,  true,  '⭐ TOP',      63, 4.9, 41, 278, 28800),
  ('22222222-0007-0007-0007-000000000007', '11111111-0004-0004-0004-000000000004', 'Shampoo Pantene ×3',     '🧴', 'Higiene',   'Pack 3 unidades shampoo + acondicionador 400ml.',             10500,  7200, 10, 50,  false, null,          14, 4.3,  8,  72, 64800),
  ('22222222-0008-0008-0008-000000000008', '11111111-0005-0005-0005-000000000005', 'Pollo Fresco ×3kg',      '🍗', 'Carnicería','Pollos frescos enteros. Peso aprox 3kg. Entrega el mismo día.',18000, 13500,  8, 40,  false, '⏰ URGENTE',  38, 4.5, 16, 134, 14400),
  ('22222222-0009-0009-0009-000000000009', '11111111-0002-0002-0002-000000000002', 'Lavandina Regular ×4',   '🧹', 'Limpieza',  'Pack 4 botellas lavandina 900ml. Concentración estándar.',      6400,  4800, 15, 90,  false, null,          11, 4.2,  6,  54, 50400),
  ('22222222-0010-0010-0010-000000000010', '11111111-0004-0004-0004-000000000004', 'Detergente Skip ×2',     '🫧', 'Limpieza',  'Pack 2 botellones detergente 3L. Todas las telas.',             8800,  6200, 10, 70,  false, null,           9, 4.1,  5,  41, 32400),
  ('22222222-0011-0011-0011-000000000011', '11111111-0006-0006-0006-000000000006', 'Lechuga + Tomate ×5kg',  '🥗', 'Verdulería','Verduras frescas de temporada. Lechuga criolla + tomate perita.', 5200, 3600, 8, 30,  false, 'NUEVO',        7, 4.6,  4,  38, 18000),
  ('22222222-0012-0012-0012-000000000012', '11111111-0002-0002-0002-000000000002', 'Pan Lactal Bimbo ×3',    '🍞', 'Panadería', 'Pack 3 panes lactal de molde 500g. Suave y esponjoso.',          4200,  3100,  6, 50,  false, 'NUEVO',        5, 4.3,  7,  62, 21600)
ON CONFLICT (id) DO NOTHING;

-- Grupos activos (uno por producto, con compradores actuales del demo)
INSERT INTO groups (product_id, current_buyers, min_buyers, status, expires_at) VALUES
  ('22222222-0001-0001-0001-000000000001', 17, 20, 'active', now() + interval '20 hours'),
  ('22222222-0002-0002-0002-000000000002',  8, 20, 'active', now() + interval '16 hours'),
  ('22222222-0003-0003-0003-000000000003', 12, 15, 'active', now() + interval '12 hours'),
  ('22222222-0004-0004-0004-000000000004', 10, 12, 'active', now() + interval '24 hours'),
  ('22222222-0005-0005-0005-000000000005',  9, 10, 'active', now() + interval '10 hours'),
  ('22222222-0006-0006-0006-000000000006',  4,  5, 'active', now() + interval '8 hours'),
  ('22222222-0007-0007-0007-000000000007',  6, 10, 'active', now() + interval '18 hours'),
  ('22222222-0008-0008-0008-000000000008',  7,  8, 'active', now() + interval '4 hours'),
  ('22222222-0009-0009-0009-000000000009',  5, 15, 'active', now() + interval '14 hours'),
  ('22222222-0010-0010-0010-000000000010',  3, 10, 'active', now() + interval '9 hours'),
  ('22222222-0011-0011-0011-000000000011',  2,  8, 'active', now() + interval '5 hours'),
  ('22222222-0012-0012-0012-000000000012',  5,  6, 'active', now() + interval '6 hours')
ON CONFLICT DO NOTHING;

-- Demandas de ejemplo
INSERT INTO demands (product_name, description, category, votes) VALUES
  ('Aceite de oliva 1L',         'Aceite de oliva extra virgen, preferentemente de San Juan.',     'Almacén',  34),
  ('Fertilizante para jardín',   'Para plantas ornamentales y huertas caseras.',                   'Jardín',   21),
  ('Croquetas para gato',        'Alimento para gatos adultos, bolsa grande.',                     'Mascotas', 18),
  ('Papel higiénico ×12',        'Pack económico, calidad triple hoja.',                           'Limpieza', 15)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════
--   REALTIME (habilitar para grupos y chat)
-- ════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
