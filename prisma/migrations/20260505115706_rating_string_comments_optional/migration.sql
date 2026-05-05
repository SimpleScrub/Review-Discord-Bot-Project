-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "imageUrl" TEXT,
    "comments" TEXT,
    "authorId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Review" ("authorId", "category", "comments", "createdAt", "guildId", "id", "imageUrl", "rating", "subject") SELECT "authorId", "category", "comments", "createdAt", "guildId", "id", "imageUrl", "rating", "subject" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
