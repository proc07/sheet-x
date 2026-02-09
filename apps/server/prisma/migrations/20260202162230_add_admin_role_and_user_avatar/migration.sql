-- AlterEnum
ALTER TYPE "WorkspaceRole" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;
