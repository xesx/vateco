-- CreateTable
CREATE TABLE "public"."tg_bot_session" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "tg_bot_session_pkey" PRIMARY KEY ("key")
);
