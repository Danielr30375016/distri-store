-- Nuevos campos en Product
ALTER TABLE "Product" ADD COLUMN "subcategory" TEXT;
ALTER TABLE "Product" ADD COLUMN "reference" TEXT;
ALTER TABLE "Product" ADD COLUMN "brand" TEXT;

-- Tabla Brand
CREATE TABLE "Brand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- Tabla Category
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- Tabla Subcategory
CREATE TABLE "Subcategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subcategory_categoryId_name_key" ON "Subcategory"("categoryId", "name");
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Sembrar las categorías ya usadas por productos existentes
INSERT INTO "Category" ("name")
SELECT DISTINCT "category" FROM "Product"
WHERE "category" IS NOT NULL AND "category" <> ''
ON CONFLICT ("name") DO NOTHING;
