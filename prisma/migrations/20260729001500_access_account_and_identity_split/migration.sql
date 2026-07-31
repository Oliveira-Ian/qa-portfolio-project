-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('ADMIN', 'USER', 'SYSTEM');

-- CreateTable
CREATE TABLE "AccessAccount" (
    "id" SERIAL NOT NULL,
    "personId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "login" TEXT,
    "password" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "role" "AccountRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessAccount_personId_key" ON "AccessAccount"("personId");
CREATE UNIQUE INDEX "AccessAccount_email_key" ON "AccessAccount"("email");
CREATE UNIQUE INDEX "AccessAccount_login_key" ON "AccessAccount"("login");

-- AddForeignKey
ALTER TABLE "AccessAccount" ADD CONSTRAINT "AccessAccount_personId_fkey"
    FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data migration: every existing User becomes a Person (types=[USER]) plus
-- an AccessAccount linked to it. Person.email starts out equal to the login
-- e-mail — a reasonable starting point even though the two fields can
-- diverge going forward. The account keeps the User row's original integer
-- id so nothing referencing it by id needs remapping.
-- gen_random_uuid() is built into Postgres core since v13 (this project runs
-- postgres:16-alpine), no extension needed.
DO $$
DECLARE
  legacy_user RECORD;
  new_person_id TEXT;
BEGIN
  FOR legacy_user IN SELECT * FROM "User" LOOP
    new_person_id := gen_random_uuid()::text;

    INSERT INTO "Person" (id, name, email, birthdate, types, active, "createdAt", "updatedAt")
    VALUES (
      new_person_id,
      legacy_user.name,
      legacy_user.email,
      legacy_user."birthDate",
      ARRAY['USER']::"PersonTypeValue"[],
      true,
      legacy_user."createdAt",
      legacy_user."updatedAt"
    );

    INSERT INTO "AccessAccount" (id, "personId", email, password, active, role, "createdAt", "updatedAt")
    VALUES (
      legacy_user.id,
      new_person_id,
      legacy_user.email,
      legacy_user.password,
      true,
      CASE WHEN lower(legacy_user.role) = 'admin' THEN 'ADMIN'::"AccountRole" ELSE 'USER'::"AccountRole" END,
      legacy_user."createdAt",
      legacy_user."updatedAt"
    );
  END LOOP;

  -- AccessAccount.id was inserted explicitly (preserving the old User.id
  -- values) rather than through the SERIAL default, so the sequence needs to
  -- catch up or the next INSERT without an explicit id would collide.
  PERFORM setval(
    pg_get_serial_sequence('"AccessAccount"', 'id'),
    COALESCE((SELECT MAX(id) FROM "AccessAccount"), 1)
  );
END $$;

-- DropTable
DROP TABLE "User";
