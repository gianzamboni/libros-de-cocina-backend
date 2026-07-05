import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient, type BookType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * One-off importer that loads the cookbook collection from the spreadsheet
 * export (`_import_data.json`, produced from "Libros de cocina.xlsx") into the
 * database. Wipes existing books/recipes first so it is safe to re-run.
 *
 * Run:  npx tsx prisma/import-excel.ts
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, "..", "_import_data.json");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type ResumenRow = {
  autor: string | null;
  libro: string;
  tipo: string | null;
  pagina: number | null;
  totales: number | null;
};
type RawRecipe = {
  name: string;
  page: number | null;
  score: number | null;
  col4: string | number | null;
  col5: string | number | null;
};
type Sheet = { headers: (string | null)[]; count: number; recipes: RawRecipe[] };
type ImportData = { resumen: ResumenRow[]; sheets: Record<string, Sheet> };

/** Maps a recipe sheet tab name to the canonical Resumen title it belongs to. */
const SHEET_TO_TITLE: Record<string, string> = {
  "Peculiar Baking": "Peculiar Baking",
  "Nuevo Manual de Gastronomia Mol": "Nuevo Manual de Gastronomia Molecular",
  "La Ciencia de la pasteleria": "La Ciencia de la pasteleria",
  "Bachour The Baker": "Bachour The Baker",
  "Galletas Deliciosas Recetas": "Galletas: Deliciosas Recetas",
  "Bachour Simply Beautiful": "Bachour Simply Beautiful",
  "Betular 1": "Betular 1",
  "El arte del ramen": "El arte del ramen",
  "Betular 2": "Betular 2",
  "Bouchor Professional Chef": "Bouchor Professional Chef",
  Kinochef: "Kinochef",
  "Texture Design With Chocolate": "Texture Design With Chocolate",
  "Tokyo Stories": "Tokyo Stories",
  Unapologetic: "Unapologetic",
  "Book of student food": "Book of student food",
  "Bachour in color": "Bachour in color",
  "Bachour chocolate": "Bachour chocolate",
  "Bachour Gastro": "Bachour Gastro",
};

/** Sheets with recipes but no Resumen row: supply sensible book-level defaults. */
const ORPHAN_SHEET_META: Record<string, { author: string; type: BookType }> = {
  "The Art Of Simple Food": { author: "Alice Waters", type: "Mixto" },
  "Gastronomia Regional Argentina": { author: "Anónimo", type: "Mixto" },
};

/** Resumen "Tipo" → schema BookType. Defaults to Mixto when unknown. */
function mapType(tipo: string | null): BookType {
  if (!tipo) return "Mixto";
  const t = tipo.trim().toLowerCase();
  if (t === "dulce") return "Dulce";
  if (t === "salado") return "Salado";
  return "Mixto"; // "Salado/Dulce" and anything else
}

function toIntOrNull(v: number | null): number | null {
  return v == null ? null : Math.round(v);
}

function cleanText(v: string | number | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as ImportData;

  // Wipe prior import (recipes cascade with their book).
  await prisma.recipe.deleteMany();
  await prisma.book.deleteMany();

  const titleToResumen = new Map<string, ResumenRow>();
  for (const row of data.resumen) titleToResumen.set(row.libro, row);

  const consumedTitles = new Set<string>();
  let bookCount = 0;
  let recipeCount = 0;

  // 1) Books that have a recipe sheet.
  for (const [sheetName, sheet] of Object.entries(data.sheets)) {
    if (sheet.recipes.length === 0) continue; // e.g. empty "Gout" tab

    const mappedTitle = SHEET_TO_TITLE[sheetName];
    const resumen = mappedTitle ? titleToResumen.get(mappedTitle) : undefined;
    const orphan = ORPHAN_SHEET_META[sheetName];

    const title = mappedTitle ?? sheetName;
    const author = resumen?.autor ?? orphan?.author ?? "Desconocido";
    const type = resumen ? mapType(resumen.tipo) : (orphan?.type ?? "Mixto");

    const hasTipoColumn = sheet.headers[3] === "Tipo";

    const recipes = sheet.recipes.map((r) => ({
      name: String(r.name).trim(),
      page: toIntOrNull(r.page) ?? 0,
      score: toIntOrNull(r.score),
      comment: hasTipoColumn ? cleanText(r.col5) : cleanText(r.col4),
      type: hasTipoColumn ? cleanText(r.col4) : null,
    }));

    const maxPage = recipes.reduce((m, r) => Math.max(m, r.page), 0);
    const totalPages = resumen?.totales != null ? Math.round(resumen.totales) : maxPage;
    let currentPage = resumen?.pagina != null ? Math.round(resumen.pagina) : 0;
    if (totalPages > 0 && currentPage > totalPages) currentPage = totalPages;

    await prisma.book.create({
      data: { title, author, type, currentPage, totalPages, recipes: { create: recipes } },
    });

    if (mappedTitle) consumedTitles.add(mappedTitle);
    bookCount += 1;
    recipeCount += recipes.length;
    console.log(`📘 ${title} — ${recipes.length} recetas (${author}, ${type})`);
  }

  // 2) Collection books from Resumen with no recipe sheet yet.
  for (const row of data.resumen) {
    if (consumedTitles.has(row.libro)) continue;

    const totalPages = row.totales != null ? Math.round(row.totales) : 0;
    let currentPage = row.pagina != null ? Math.round(row.pagina) : 0;
    if (totalPages > 0 && currentPage > totalPages) currentPage = totalPages;

    await prisma.book.create({
      data: {
        title: row.libro,
        author: row.autor ?? "Desconocido",
        type: mapType(row.tipo),
        currentPage,
        totalPages,
      },
    });
    bookCount += 1;
    console.log(`📗 ${row.libro} — sin recetas (${row.autor ?? "Desconocido"})`);
  }

  console.log(`\n✅ Importados ${bookCount} libros y ${recipeCount} recetas.`);
}

main()
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
