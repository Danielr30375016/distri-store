-- Referencia aleatoria para cada pedido (pedidos existentes reciben una generada)
ALTER TABLE "Order" ADD COLUMN "reference" TEXT;
UPDATE "Order" SET "reference" = 'DS-LEGACY-' || "id" || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)
WHERE "reference" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "reference" SET NOT NULL;
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- Método de pago y control de liberación de stock
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN "stockReleased" BOOLEAN NOT NULL DEFAULT false;

-- Índice para listar/expirar pedidos por estado y fecha
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- Repara la secuencia de Product (el seed insertaba ids explícitos y rompía el autoincrement)
SELECT setval(pg_get_serial_sequence('"Product"', 'id'), COALESCE((SELECT MAX("id") FROM "Product"), 0) + 1, false);
