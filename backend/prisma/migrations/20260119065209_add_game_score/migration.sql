-- CreateTable
CREATE TABLE "category" (
    "cg_id" SERIAL NOT NULL,
    "mode_cg" TEXT NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("cg_id")
);

-- CreateTable
CREATE TABLE "user" (
    "uid" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "address" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "game_score" (
    "gs_id" SERIAL NOT NULL,
    "score" INTEGER NOT NULL,
    "game_type" TEXT NOT NULL,
    "difficulty" TEXT,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uid" INTEGER NOT NULL,

    CONSTRAINT "game_score_pkey" PRIMARY KEY ("gs_id")
);

-- CreateTable
CREATE TABLE "questions" (
    "qid" SERIAL NOT NULL,
    "level" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "explanation" TEXT,
    "cg_id" INTEGER,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("qid")
);

-- CreateTable
CREATE TABLE "choices" (
    "cid" SERIAL NOT NULL,
    "qid" INTEGER NOT NULL,
    "choice_text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,

    CONSTRAINT "choices_pkey" PRIMARY KEY ("cid")
);

-- CreateTable
CREATE TABLE "game" (
    "gid" SERIAL NOT NULL,
    "uid" INTEGER NOT NULL,
    "cg_id" INTEGER,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "time_taken" DOUBLE PRECISION,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "game_pkey" PRIMARY KEY ("gid")
);

-- CreateTable
CREATE TABLE "answer_logs" (
    "al_id" SERIAL NOT NULL,
    "gid" INTEGER NOT NULL,
    "uid" INTEGER NOT NULL,
    "qid" INTEGER NOT NULL,
    "cid" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_logs_pkey" PRIMARY KEY ("al_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");

-- AddForeignKey
ALTER TABLE "game_score" ADD CONSTRAINT "game_score_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_cg_id_fkey" FOREIGN KEY ("cg_id") REFERENCES "category"("cg_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_qid_fkey" FOREIGN KEY ("qid") REFERENCES "questions"("qid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_cg_id_fkey" FOREIGN KEY ("cg_id") REFERENCES "category"("cg_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_logs" ADD CONSTRAINT "answer_logs_gid_fkey" FOREIGN KEY ("gid") REFERENCES "game"("gid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_logs" ADD CONSTRAINT "answer_logs_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_logs" ADD CONSTRAINT "answer_logs_qid_fkey" FOREIGN KEY ("qid") REFERENCES "questions"("qid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_logs" ADD CONSTRAINT "answer_logs_cid_fkey" FOREIGN KEY ("cid") REFERENCES "choices"("cid") ON DELETE CASCADE ON UPDATE CASCADE;
