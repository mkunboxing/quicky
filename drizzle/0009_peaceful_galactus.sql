ALTER TABLE "orders" ADD COLUMN "order_id" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_id_unique" UNIQUE("order_id");