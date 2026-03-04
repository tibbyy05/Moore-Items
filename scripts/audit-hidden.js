require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk").default;
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-haiku-4-5-20251001";
const BATCH_SIZE = 50;

const CATEGORIES = [
  "home-furniture", "fashion", "health-beauty", "jewelry", "garden-outdoor",
  "pet-supplies", "kitchen-dining", "electronics", "tools-hardware",
  "kids-toys", "sports-outdoors", "storage-organization",
];

const CATEGORY_DESCRIPTIONS = {
  "home-furniture": "Sofas, beds, tables, chairs, desks, shelves, rugs, lamps, home decor, wall art, curtains, mirrors, flooring",
  "fashion": "Clothing, shoes, bags, wallets, scarves, hats, sunglasses, belts, accessories, wigs",
  "health-beauty": "Skincare, makeup, hair care, personal care, wellness, supplements, grooming, dental, massage",
  "jewelry": "Necklaces, rings, bracelets, earrings, watches, anklets, brooches, fine and costume jewelry",
  "garden-outdoor": "Plants, pots, garden tools, outdoor furniture, grills, patio decor, fencing, outdoor lighting, sheds",
  "pet-supplies": "Dog, cat, fish, bird supplies, pet beds, collars, leashes, pet toys, food bowls, aquariums",
  "kitchen-dining": "Cookware, bakeware, utensils, dinnerware, kitchen gadgets, food storage, small appliances, faucets",
  "electronics": "TVs, speakers, headphones, cameras, smart home, chargers, cables, phone accessories, gaming",
  "tools-hardware": "Power tools, hand tools, tool storage, welding, measuring, fasteners, workshop equipment",
  "kids-toys": "Toys, games, puzzles, dolls, building sets, kids furniture, baby gear, educational toys",
  "sports-outdoors": "Exercise equipment, camping, hiking, cycling, fishing, yoga, sports gear, outdoor recreation",
  "storage-organization": "Shelving, bins, closet organizers, drawer dividers, garage storage, racks, hooks, filing",
};

async function main() {
  console.log("=== HIDDEN PRODUCTS AUDIT ===\n");

  // Fetch all hidden products
  console.log("Fetching hidden products...");
  var allHidden = [];
  var page = 0;
  while (true) {
    var { data, error } = await sb
      .from("mi_products")
      .select("id, name, category_id, retail_price, review_count, images, mi_categories(name, slug)")
      .eq("status", "hidden")
      .order("name")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) { console.error("Fetch error:", error.message); process.exit(1); }
    allHidden = allHidden.concat(data);
    if (data.length < 1000) break;
    page++;
  }
  console.log("Total hidden products:", allHidden.length);

  // Fetch all active product names for duplicate detection
  console.log("Fetching active product names for duplicate check...");
  var activeNames = new Set();
  page = 0;
  while (true) {
    var { data, error } = await sb
      .from("mi_products")
      .select("name")
      .eq("status", "active")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) { console.error("Fetch error:", error.message); process.exit(1); }
    data.forEach(function (p) { activeNames.add(p.name.trim().toLowerCase()); });
    if (data.length < 1000) break;
    page++;
  }
  console.log("Active product names loaded:", activeNames.size);

  // Pre-check: mark exact name duplicates
  var knownDupes = [];
  var nonDupes = [];
  allHidden.forEach(function (p) {
    if (activeNames.has(p.name.trim().toLowerCase())) {
      knownDupes.push(p);
    } else {
      nonDupes.push(p);
    }
  });
  console.log("Exact name matches with active products (duplicates):", knownDupes.length);
  console.log("Remaining to send to AI:", nonDupes.length);

  // Batch the non-dupes to AI
  var batches = [];
  for (var i = 0; i < nonDupes.length; i += BATCH_SIZE) {
    batches.push(nonDupes.slice(i, i + BATCH_SIZE));
  }
  console.log("AI batches:", batches.length);
  console.log("");

  var junkItems = [];
  var legitimateItems = [];
  var aiDupes = [];
  var inputTokens = 0, outputTokens = 0;

  for (var b = 0; b < batches.length; b++) {
    var batch = batches[b];
    var batchList = batch.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        current_category: p.mi_categories ? p.mi_categories.slug : "unknown",
        price: p.retail_price,
        images: Array.isArray(p.images) ? p.images.length : 0,
        reviews: p.review_count || 0,
      };
    });

    var prompt = "You are auditing hidden products from an e-commerce store to decide if they were correctly hidden or should be restored.\n\n" +
      "For each product, classify as:\n" +
      "A) JUNK - Should stay hidden. Includes: auto/car/vehicle parts, adult/sexual products, industrial/commercial equipment, gibberish/meaningless names, wholesale/bulk packaging, raw construction materials, agricultural/farm equipment, marine/boat parts.\n" +
      "B) LEGITIMATE - A real consumer product that should be reactivated. Suggest the correct category from: " + CATEGORIES.join(", ") + "\n" +
      "   Categories: " + CATEGORIES.map(function (c) { return c + " (" + CATEGORY_DESCRIPTIONS[c] + ")"; }).join("; ") + "\n" +
      "C) UNCLEAR - Could go either way, needs human review.\n\n" +
      "RULES:\n" +
      "- Normal household items, clothing, decor, tools, toys, pet items = LEGITIMATE\n" +
      "- Items with price > $0, multiple images, and reviews are more likely legitimate\n" +
      "- Be generous: if it could reasonably be sold in a consumer store, mark B\n" +
      "- Only mark A for things clearly not consumer products\n\n" +
      "Products:\n" + JSON.stringify(batchList, null, 2) + "\n\n" +
      "Respond ONLY with a JSON array:\n" +
      '[{"id":"...","name":"...","verdict":"A","reason":"brief"}, {"id":"...","name":"...","verdict":"B","suggested_category":"slug","reason":"brief"}, ...]\n' +
      "Include ALL products in the response.";

    process.stdout.write("  Batch " + (b + 1) + "/" + batches.length + "... ");

    try {
      var response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });
      inputTokens += response.usage.input_tokens;
      outputTokens += response.usage.output_tokens;

      var text = response.content[0].text.trim();
      var jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        var recs = JSON.parse(jsonMatch[0]);
        var aCount = 0, bCount = 0, cCount = 0;
        recs.forEach(function (r) {
          if (r.verdict === "A") { junkItems.push(r); aCount++; }
          else if (r.verdict === "B") { legitimateItems.push(r); bCount++; }
          else { aiDupes.push(r); cCount++; }
        });
        console.log("A:" + aCount + " B:" + bCount + " C:" + cCount);
      } else {
        console.log("PARSE ERROR");
      }
    } catch (err) {
      console.log("ERROR: " + err.message);
    }
  }

  var cost = (inputTokens * 0.80 / 1000000) + (outputTokens * 4.0 / 1000000);

  // Build report
  var report = {
    timestamp: new Date().toISOString(),
    total_hidden: allHidden.length,
    api_cost: "$" + cost.toFixed(4),
    summary: {
      A_junk_stay_hidden: junkItems.length,
      B_legitimate_reactivate: legitimateItems.length,
      C_unclear: aiDupes.length,
      duplicates_of_active: knownDupes.length,
    },
    duplicates: knownDupes.map(function (p) {
      return { id: p.id, name: p.name, category: p.mi_categories ? p.mi_categories.slug : "unknown" };
    }),
    legitimate: legitimateItems,
    unclear: aiDupes,
    junk: junkItems,
  };

  var outDir = path.join(__dirname, "output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  var jsonPath = path.join(outDir, "hidden-audit.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n=== RESULTS ===");
  console.log("Total hidden:", allHidden.length);
  console.log("API cost:", report.api_cost);
  console.log("");
  console.log("A) Junk (stay hidden):      " + junkItems.length);
  console.log("B) Legitimate (reactivate): " + legitimateItems.length);
  console.log("C) Unclear (needs review):  " + aiDupes.length);
  console.log("D) Duplicates of active:    " + knownDupes.length);

  if (legitimateItems.length > 0) {
    console.log("\n--- B) LEGITIMATE - Should be reactivated ---");
    // Group by suggested category
    var byCat = {};
    legitimateItems.forEach(function (item) {
      var cat = item.suggested_category || "unknown";
      if (byCat[cat] == null) byCat[cat] = [];
      byCat[cat].push(item);
    });
    var catKeys = Object.keys(byCat).sort(function (a, b) { return byCat[b].length - byCat[a].length; });
    catKeys.forEach(function (cat) {
      console.log("\n  " + cat + " (" + byCat[cat].length + "):");
      byCat[cat].forEach(function (item) {
        console.log("    " + item.name + " | " + (item.reason || ""));
      });
    });
  }

  if (aiDupes.length > 0) {
    console.log("\n--- C) UNCLEAR ---");
    aiDupes.forEach(function (item) {
      console.log("  " + item.name + " | " + (item.reason || ""));
    });
  }

  console.log("\nReport saved to:", jsonPath);
}

main().catch(function (err) { console.error("Fatal:", err); process.exit(1); });
