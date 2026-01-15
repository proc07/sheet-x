-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FieldType" ADD VALUE 'GROUP';
ALTER TYPE "FieldType" ADD VALUE 'CHECKBOX';
ALTER TYPE "FieldType" ADD VALUE 'URL';
ALTER TYPE "FieldType" ADD VALUE 'FORMULA';
ALTER TYPE "FieldType" ADD VALUE 'LOOKUP';
ALTER TYPE "FieldType" ADD VALUE 'WORKFLOW';
ALTER TYPE "FieldType" ADD VALUE 'BUTTON';
ALTER TYPE "FieldType" ADD VALUE 'AUTO_NUMBER';
ALTER TYPE "FieldType" ADD VALUE 'PHONE';
ALTER TYPE "FieldType" ADD VALUE 'EMAIL';
ALTER TYPE "FieldType" ADD VALUE 'LOCATION';
ALTER TYPE "FieldType" ADD VALUE 'BARCODE';
ALTER TYPE "FieldType" ADD VALUE 'PROGRESS';
ALTER TYPE "FieldType" ADD VALUE 'CURRENCY';
ALTER TYPE "FieldType" ADD VALUE 'RATING';
ALTER TYPE "FieldType" ADD VALUE 'LINK_BIDIRECTIONAL';
ALTER TYPE "FieldType" ADD VALUE 'LINK_UNIDIRECTIONAL';
ALTER TYPE "FieldType" ADD VALUE 'CREATED_BY';
ALTER TYPE "FieldType" ADD VALUE 'UPDATED_BY';
ALTER TYPE "FieldType" ADD VALUE 'CREATED_TIME';
ALTER TYPE "FieldType" ADD VALUE 'UPDATED_TIME';
