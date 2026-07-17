-- Reemplaza la columna única `image` por un arreglo `images`
ALTER TABLE "Product" DROP COLUMN "image";
ALTER TABLE "Product" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
