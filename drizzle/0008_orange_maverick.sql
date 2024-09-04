ALTER TABLE "orders" ALTER COLUMN "qty" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_id" text NOT NULL;