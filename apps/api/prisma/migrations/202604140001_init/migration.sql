-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "ServiceType" AS ENUM ('CUSTOM_DESIGN', 'ALTERATION', 'RENTAL_FITTING');
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'RELEASED');
CREATE TYPE "PolicyType" AS ENUM ('TERMS', 'PRIVACY');
CREATE TYPE "CalendarSyncStatus" AS ENUM ('NOT_SYNCED', 'SYNCED', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "RentalItem" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "size" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "imageUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PolicyDocument" (
  "id" TEXT PRIMARY KEY,
  "type" "PolicyType" NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PolicyVersion" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "contentMarkdown" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PolicyVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "PolicyDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PolicyVersion_document_version_unique" UNIQUE ("documentId", "versionNumber")
);

CREATE TABLE "Booking" (
  "id" TEXT PRIMARY KEY,
  "referenceCode" TEXT NOT NULL UNIQUE,
  "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
  "serviceType" "ServiceType" NOT NULL,
  "clientName" TEXT NOT NULL,
  "clientEmail" TEXT NOT NULL,
  "clientPhone" TEXT NOT NULL,
  "startAtUtc" TIMESTAMP(3) NOT NULL,
  "endAtUtc" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL,
  "notes" TEXT,
  "specialRequests" TEXT,
  "calendarSyncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'NOT_SYNCED',
  "termsVersionId" TEXT NOT NULL,
  "privacyVersionId" TEXT NOT NULL,
  "managementTokenHash" TEXT,
  "managementTokenUsed" BOOLEAN NOT NULL DEFAULT false,
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_termsVersionId_fkey" FOREIGN KEY ("termsVersionId") REFERENCES "PolicyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Booking_privacyVersionId_fkey" FOREIGN KEY ("privacyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "BookingItem" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "rentalItemId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BookingItem_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BookingItem_booking_item_unique" UNIQUE ("bookingId", "rentalItemId")
);

CREATE TABLE "RentalItemReservation" (
  "id" TEXT PRIMARY KEY,
  "rentalItemId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "startAtUtc" TIMESTAMP(3) NOT NULL,
  "endAtUtc" TIMESTAMP(3) NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
  CONSTRAINT "RentalItemReservation_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RentalItemReservation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CalendarConnection" (
  "id" TEXT PRIMARY KEY,
  "googleCalendarId" TEXT NOT NULL,
  "encryptedRefreshToken" TEXT NOT NULL,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "CalendarEvent" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL UNIQUE,
  "googleEventId" TEXT NOT NULL UNIQUE,
  "etag" TEXT,
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalendarEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "EmailLog" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "providerId" TEXT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AvailabilityRule" (
  "id" TEXT PRIMARY KEY,
  "weekday" INTEGER NOT NULL,
  "startMinutes" INTEGER NOT NULL,
  "endMinutes" INTEGER NOT NULL,
  "slotIntervalMin" INTEGER NOT NULL DEFAULT 30,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "BlackoutPeriod" (
  "id" TEXT PRIMARY KEY,
  "startAtUtc" TIMESTAMP(3) NOT NULL,
  "endAtUtc" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "Booking_start_status_idx" ON "Booking" ("startAtUtc", "status");
CREATE INDEX "RentalItemReservation_item_time_idx" ON "RentalItemReservation" ("rentalItemId", "startAtUtc", "endAtUtc");
CREATE INDEX "AvailabilityRule_weekday_idx" ON "AvailabilityRule" ("weekday");
CREATE INDEX "BlackoutPeriod_time_idx" ON "BlackoutPeriod" ("startAtUtc", "endAtUtc");
