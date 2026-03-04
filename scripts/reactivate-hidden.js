require("dotenv").config({ path: ".env.local" });
const Anthropic = require("@anthropic-ai/sdk").default;
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";
const BATCH_SIZE = 40;

const report = require("./output/hidden-audit.json");
const legitimate = report.legitimate;

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function main() {
  console.log("=== CLEAN NAMES & REACTIVATE ===\n");
  console.log("Legitimate products to process:", legitimate.length);

  // Step 1: Identify which names need cleaning
  var junkPatterns = [
    /prohibit(ed)?[\s-]*(from[\s-]*)?(being[\s-]*)?(sold[\s-]*)?(on[\s-]*)?(platform[\s-]*)?[\w\s,&]*/gi,
    /not[\s-]*(available|shipped|provide|for sale)[\s-]*(on[\s-]*)?(weekends?|[\w\s,]*)/gi,
    /amazon[\s-]*shipping/gi,
    /walmart[\s-]*banned/gi,
    /swiship[\s-]*-?[\s-]*ship/gi,
    /only[\s-]*self[\s-]*-?[\s-]*pick[\s-]*-?[\s-]*up[\s-]*-?[\s-]*/gi,
    /no[\s-]*provide[\s-]*self[\s-]*pick[\s-]*-?[\s-]*up[\s-]*-?[\s-]*/gi,
    /no[\s-]*shipments?[\s-]*on[\s-]*weekends?/gi,
    /self[\s-]*-?[\s-]*pick[\s-]*-?[\s-]*up[\s-]*only[\s-]*/gi,
    /--+/g,
  ];

  var needsAiClean = [];
  var autoClean = [];
  var alreadyClean = [];

  legitimate.forEach(function (item) {
    var name = item.name;
    var cleaned = name;
    junkPatterns.forEach(function (pat) {
      cleaned = cleaned.replace(pat, "");
    });
    cleaned = cleaned.replace(/,\s*,/g, ",").replace(/,\s*$/g, "").replace(/^\s*,\s*/g, "").trim();

    if (cleaned !== name) {
      // Name had junk removed
      if (cleaned.length < 10 || cleaned.split(/\s+/).length < 2) {
        // Too short after cleaning, needs AI to generate a better name
        needsAiClean.push(item);
      } else {
        autoClean.push({ item: item, cleaned: cleaned });
      }
    } else if (name.length < 15 && name.split(/\s+/).length <= 2) {
      // Very short/vague names like "Bar Cart", "Bracelet", "Dress"
      needsAiClean.push(item);
    } else {
      alreadyClean.push(item);
    }
  });

  console.log("Already clean:", alreadyClean.length);
  console.log("Auto-cleaned (regex):", autoClean.length);
  console.log("Needs AI rename:", needsAiClean.length);
  console.log("");

  // Step 2: Auto-clean names via regex
  console.log("--- Auto-cleaned names ---");
  autoClean.forEach(function (entry) {
    console.log("  \"" + entry.item.name.slice(0, 60) + "\"");
    console.log("  -> \"" + entry.cleaned.slice(0, 60) + "\"");
  });
  console.log("");

  // Step 3: Send vague/short names to AI for better names
  console.log("--- AI renames ---");

  // We need product descriptions from DB for context
  var aiIds = needsAiClean.map(function (item) { return item.id; });
  var aiProducts = {};

  for (var i = 0; i < aiIds.length; i += 50) {
    var batch = aiIds.slice(i, i + 50);
    var { data } = await sb.from("mi_products").select("id, name, description, retail_price, images").in("id", batch);
    data.forEach(function (p) { aiProducts[p.id] = p; });
  }

  var aiRenames = [];
  var batches = [];
  for (var i = 0; i < needsAiClean.length; i += BATCH_SIZE) {
    batches.push(needsAiClean.slice(i, i + BATCH_SIZE));
  }

  var inputTokens = 0, outputTokens = 0;

  for (var b = 0; b < batches.length; b++) {
    var batch = batches[b];
    var batchList = batch.map(function (item) {
      var dbProd = aiProducts[item.id] || {};
      var desc = (dbProd.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
      return {
        id: item.id,
        current_name: item.name,
        description_snippet: desc || "(no description)",
        price: dbProd.retail_price || item.price || 0,
        suggested_category: item.suggested_category || "unknown",
      };
    });

    var prompt = "These e-commerce products have bad names (too vague, contain shipping instructions, or gibberish). " +
      "Generate a clean, descriptive product name for each one. Use the description snippet and category for context.\n\n" +
      "RULES:\n" +
      "- Name should be 5-12 words, descriptive, title case\n" +
      "- Remove all shipping instructions, platform restrictions, seller notes\n" +
      "- Include key product features (material, color, size if relevant)\n" +
      "- Do NOT include brand names unless clearly part of the product identity\n" +
      "- Make it sound like a real e-commerce product listing\n\n" +
      "Products:\n" + JSON.stringify(batchList, null, 2) + "\n\n" +
      "Respond with ONLY a JSON array:\n" +
      '[{"id":"...","new_name":"Clean Product Name Here"}]';

    process.stdout.write("  AI batch " + (b + 1) + "/" + batches.length + "... ");

    try {
      var response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      inputTokens += response.usage.input_tokens;
      outputTokens += response.usage.output_tokens;

      var text = response.content[0].text.trim();
      var jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        var recs = JSON.parse(jsonMatch[0]);
        aiRenames = aiRenames.concat(recs);
        console.log(recs.length + " renamed");
      } else {
        console.log("PARSE ERROR");
      }
    } catch (err) {
      console.log("ERROR: " + err.message);
    }
  }

  console.log("");
  aiRenames.forEach(function (r) {
    var orig = needsAiClean.find(function (item) { return item.id === r.id; });
    console.log("  \"" + (orig ? orig.name : "?").slice(0, 50) + "\"");
    console.log("  -> \"" + r.new_name + "\"");
  });

  var cost = (inputTokens * 0.80 / 1000000) + (outputTokens * 4.0 / 1000000);
  console.log("\nAI rename cost: $" + cost.toFixed(4));

  // Step 4: Build final update list
  var updates = [];

  // Already clean - just reactivate + move
  alreadyClean.forEach(function (item) {
    updates.push({ id: item.id, name: null, category: item.suggested_category });
  });

  // Auto-cleaned - update name + reactivate + move
  autoClean.forEach(function (entry) {
    updates.push({ id: entry.item.id, name: entry.cleaned, category: entry.item.suggested_category });
  });

  // AI-renamed - update name + reactivate + move
  aiRenames.forEach(function (r) {
    var orig = needsAiClean.find(function (item) { return item.id === r.id; });
    updates.push({ id: r.id, name: r.new_name, category: orig ? orig.suggested_category : null });
  });

  console.log("\n=== APPLYING UPDATES ===");
  console.log("Total products to reactivate:", updates.length);

  // Get category map
  var { data: cats } = await sb.from("mi_categories").select("id, slug");
  var catMap = {};
  cats.forEach(function (c) { catMap[c.slug] = c.id; });

  var ok = 0, fail = 0;
  for (var i = 0; i < updates.length; i++) {
    var u = updates[i];
    var updateObj = { status: "active" };

    if (u.name) {
      updateObj.name = u.name;
      updateObj.slug = slugify(u.name);
    }
    if (u.category && catMap[u.category]) {
      updateObj.category_id = catMap[u.category];
    }

    var { error } = await sb.from("mi_products").update(updateObj).eq("id", u.id);
    if (error) {
      console.log("  FAIL: " + u.id + " - " + error.message);
      fail++;
    } else {
      ok++;
    }
  }

  console.log("Reactivated: " + ok + (fail > 0 ? " (" + fail + " failed)" : ""));

  // Update category counts
  console.log("Updating category counts...");
  for (var i = 0; i < cats.length; i++) {
    var { count } = await sb.from("mi_products").select("id", { count: "exact", head: true }).eq("category_id", cats[i].id).eq("status", "active");
    await sb.from("mi_categories").update({ product_count: count }).eq("id", cats[i].id);
  }

  console.log("\n=== DONE ===");
  console.log("Reactivated:", ok);
  console.log("Failed:", fail);
  console.log("AI cost: $" + cost.toFixed(4));
}

main().catch(function (err) { console.error("Fatal:", err); process.exit(1); });
