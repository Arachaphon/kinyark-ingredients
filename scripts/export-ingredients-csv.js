const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../prisma/seed.ts');
const seedContent = fs.readFileSync(seedPath, 'utf8');

// Parse CATEGORIES
const catStartMarker = 'const CATEGORIES = [';
const catStartIndex = seedContent.indexOf(catStartMarker);
const catEndIndex = seedContent.indexOf(']', catStartIndex);
const catArrayStr = seedContent.substring(catStartIndex + 'const CATEGORIES = '.length, catEndIndex + 1);
const categories = new Function(`return ${catArrayStr}`)();

// Map category name to ID
const categoryMap = {};
let categoriesCsv = '\uFEFFid,name\n';
categories.forEach((catName, index) => {
  const catId = index + 1;
  categoryMap[catName] = catId;
  const escapedName = catName.includes(',') ? `"${catName.replace(/"/g, '""')}"` : catName;
  categoriesCsv += `${catId},${escapedName}\n`;
});

fs.writeFileSync(path.join(__dirname, '../categories.csv'), categoriesCsv, 'utf8');
console.log(`✅ Generated categories.csv with ${categories.length} categories.`);

// Parse INGREDIENT_SEEDS
const startMarker = 'const INGREDIENT_SEEDS: { category: string; names: string[] }[] = ';
const startIndex = seedContent.indexOf(startMarker);
const arrayStart = startIndex + startMarker.length;
const endMarker = '\nasync function seed()';
const endIndex = seedContent.indexOf(endMarker, arrayStart);
const arrayStr = seedContent.substring(arrayStart, endIndex).trim().replace(/;$/, '');

const seedData = new Function(`return ${arrayStr}`)();

let ingredientsCsv = '\uFEFFid,name,categoryId\n';
let id = 1;

for (const group of seedData) {
  const categoryId = categoryMap[group.category] || '';
  for (const name of group.names) {
    const escapedName = name.includes(',') ? `"${name.replace(/"/g, '""')}"` : name;
    ingredientsCsv += `${id},${escapedName},${categoryId}\n`;
    id++;
  }
}

fs.writeFileSync(path.join(__dirname, '../ingredients.csv'), ingredientsCsv, 'utf8');
console.log(`✅ Generated ingredients.csv with ${id - 1} items.`);
