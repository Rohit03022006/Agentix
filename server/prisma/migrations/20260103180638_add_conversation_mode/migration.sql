/*
  Warnings:

  - Added the required column `mode` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConversationMode" AS ENUM ('chat', 'agent');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "mode" TEXT NOT NULL;
