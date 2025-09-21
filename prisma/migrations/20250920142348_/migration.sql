-- Ensure citext extension exists (required for CITEXT column types)
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateTable
CREATE TABLE "managers" (
    "deviceuuid" UUID NOT NULL,
    "name" TEXT,
    "dateformat" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "timeformat" TEXT NOT NULL DEFAULT '24',
    "email" TEXT,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "managers_pkey" PRIMARY KEY ("deviceuuid")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" TEXT NOT NULL,
    "managerdeviceuuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "pronouns" TEXT,
    "jobrole" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "passwordhash" TEXT NOT NULL,
    "github_username" TEXT,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "managerdeviceuuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "repository" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "statusid" INTEGER NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedto" TEXT NOT NULL,
    "managerdeviceuuid" UUID NOT NULL,
    "projectid" TEXT NOT NULL,
    "duedate" TIMESTAMPTZ,
    "estimatedhours" INTEGER,
    "actualhours" INTEGER,
    "stepfunctionarn" TEXT,
    "tags" TEXT[],
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" SERIAL NOT NULL,
    "managerdeviceuuid" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "taskid" TEXT NOT NULL,
    "dependsonid" TEXT NOT NULL,

    CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("taskid","dependsonid")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "workerid" TEXT,
    "managerdeviceuuid" UUID,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdat" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workers_email_key" ON "workers"("email");

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_managerdeviceuuid_fkey" FOREIGN KEY ("managerdeviceuuid") REFERENCES "managers"("deviceuuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_managerdeviceuuid_fkey" FOREIGN KEY ("managerdeviceuuid") REFERENCES "managers"("deviceuuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedto_fkey" FOREIGN KEY ("assignedto") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_managerdeviceuuid_fkey" FOREIGN KEY ("managerdeviceuuid") REFERENCES "managers"("deviceuuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectid_fkey" FOREIGN KEY ("projectid") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_statusid_fkey" FOREIGN KEY ("statusid") REFERENCES "statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statuses" ADD CONSTRAINT "statuses_managerdeviceuuid_fkey" FOREIGN KEY ("managerdeviceuuid") REFERENCES "managers"("deviceuuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_taskid_fkey" FOREIGN KEY ("taskid") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_dependsonid_fkey" FOREIGN KEY ("dependsonid") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workerid_fkey" FOREIGN KEY ("workerid") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_managerdeviceuuid_fkey" FOREIGN KEY ("managerdeviceuuid") REFERENCES "managers"("deviceuuid") ON DELETE CASCADE ON UPDATE CASCADE;
