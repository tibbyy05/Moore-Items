-- Phase 3 SEO: Add description and FAQ columns to mi_categories
ALTER TABLE mi_categories ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE mi_categories ADD COLUMN IF NOT EXISTS faq_json jsonb;

-- Category descriptions (150-250 words each)
UPDATE mi_categories SET description = 'Transform your living space with our curated collection of home and furniture essentials. From cozy throw pillows and elegant wall art to functional storage solutions and statement furniture pieces, we carry everything you need to make your house feel like home. Whether you are redecorating a single room or furnishing an entire apartment, our selection includes modern, farmhouse, minimalist, and contemporary styles to match any aesthetic. Shop home and furniture online at MooreItems to discover rugs, lighting, shelving, bedding, curtains, and decorative accents at prices that make upgrading your space easy and affordable. All orders over $50 ship free from our US warehouses with delivery in just 2-5 business days, so you will not be waiting long to enjoy your new look. Our buyers hand-pick each item for quality and value, ensuring you get pieces that look great and last. Perfect for homeowners, renters, college students, and anyone looking to refresh their surroundings without breaking the bank.'
WHERE slug = 'home-furniture';

UPDATE mi_categories SET description = 'Explore the latest trends in fashion for women, men, and kids at MooreItems. Our fashion collection features clothing, accessories, bags, scarves, sunglasses, and jewelry-adjacent pieces that help you express your personal style without the designer price tag. From everyday basics and casual weekend wear to statement pieces for special occasions, we curate a diverse range of styles including streetwear, bohemian, classic, and athleisure. Shop fashion online and discover new arrivals added weekly so your wardrobe never goes stale. Every order over $50 qualifies for free shipping from our US warehouses, arriving at your door in 2-5 business days. Whether you are building a capsule wardrobe, searching for the perfect gift, or simply treating yourself to something new, our fashion category makes it easy to look great for less. We focus on quality materials and trending designs so you can stay stylish season after season.'
WHERE slug = 'fashion';

UPDATE mi_categories SET description = 'Look and feel your best with our health and beauty collection at MooreItems. We carry skincare tools, beauty accessories, hair care essentials, wellness gadgets, personal care items, and grooming products for every routine. From facial rollers and LED therapy masks to makeup organizers and electric trimmers, our curated selection helps you build a self-care routine that actually works. Shop health and beauty online to find trending products at accessible prices, all backed by real customer reviews. Orders over $50 ship free from US warehouses with fast 2-5 business day delivery, so you can start your new routine sooner. Whether you are searching for the perfect skincare device, stocking up on grooming essentials, or looking for a thoughtful beauty gift, our collection offers something for everyone. We prioritize products that combine quality, innovation, and value to help you look your best every day.'
WHERE slug = 'health-beauty';

UPDATE mi_categories SET description = 'Discover stunning jewelry at prices that sparkle as bright as the pieces themselves. Our jewelry collection at MooreItems features necklaces, bracelets, earrings, rings, and watches crafted with attention to detail and on-trend designs. Whether you prefer dainty minimalist pieces, bold statement jewelry, or timeless classics, we have something to complement every outfit and occasion. Shop jewelry online to find the perfect accessory for date night, a gift for a loved one, or an everyday piece that elevates your look. From sterling silver and gold-plated options to fashion-forward costume jewelry, our curated selection balances style and affordability. All jewelry orders over $50 ship free from our US warehouses, arriving in 2-5 business days with careful packaging to ensure your pieces arrive in perfect condition. Browse our collection and find your next favorite accessory.'
WHERE slug = 'jewelry';

UPDATE mi_categories SET description = 'Make the most of your outdoor spaces with our garden and outdoor collection at MooreItems. From planters, garden tools, and solar lights to patio furniture, outdoor decor, and yard accessories, we have everything you need to create a beautiful and functional outdoor retreat. Whether you are a seasoned gardener tending to a vegetable plot or a homeowner looking to spruce up a patio, our curated selection covers all skill levels and budgets. Shop garden and outdoor products online and discover practical solutions for landscaping, entertaining, and relaxing outside. All orders over $50 enjoy free shipping from our US warehouses with delivery in 2-5 business days, so your outdoor projects never have to wait. Our buyers select products that combine durability with style, helping you build an outdoor space you will love spending time in throughout every season.'
WHERE slug = 'garden-outdoor';

UPDATE mi_categories SET description = 'Give your furry, feathered, or scaly friends the best with our pet supplies collection at MooreItems. We carry toys, beds, grooming tools, feeding accessories, travel carriers, training aids, and everyday essentials for dogs, cats, and small animals. Our curated selection focuses on products that keep your pets happy, healthy, and entertained while making your life as a pet parent easier. Shop pet supplies online to discover innovative products at great prices, from interactive puzzle toys and self-cleaning brushes to cozy orthopedic beds and stylish collars. All pet supply orders over $50 ship free from US warehouses with 2-5 business day delivery. Whether you are welcoming a new pet home or spoiling your longtime companion, our collection has the quality essentials and fun extras that every pet owner needs.'
WHERE slug = 'pet-supplies';

UPDATE mi_categories SET description = 'Upgrade your kitchen with our curated collection of kitchen and dining essentials at MooreItems. From cutting-edge gadgets and cookware to stylish dinnerware, drinkware, and storage containers, we stock everything you need to cook, bake, entertain, and organize like a pro. Whether you are a home chef experimenting with new recipes or simply looking for smarter ways to store and prep food, our selection includes tools for every skill level and kitchen size. Shop kitchen and dining products online to discover innovative gadgets, durable utensils, and beautiful tableware at prices that fit your budget. Free shipping on orders over $50 from our US warehouses means your new kitchen essentials arrive in just 2-5 business days. We hand-pick products that combine functionality, quality, and style so your kitchen works as good as it looks.'
WHERE slug = 'kitchen-dining';

UPDATE mi_categories SET description = 'Stay connected and power up your life with our electronics collection at MooreItems. We carry phone accessories, charging solutions, audio gear, smart home devices, computer peripherals, LED lighting, and tech gadgets that make everyday tasks easier and more enjoyable. From wireless earbuds and portable chargers to LED strip lights and desk organizers with built-in charging, our curated selection covers the tech essentials modern life demands. Shop electronics online at MooreItems to find trending gadgets and reliable accessories at prices well below retail. All electronics orders over $50 ship free from our US warehouses, arriving in 2-5 business days so you can start using your new gear right away. Whether you are upgrading your desk setup, enhancing your smart home, or finding the perfect tech gift, our collection delivers quality, innovation, and value.'
WHERE slug = 'electronics';

UPDATE mi_categories SET description = 'Get the job done right with our tools and hardware collection at MooreItems. From hand tools and power tool accessories to fasteners, measuring instruments, safety gear, and workshop organizers, we carry the essentials that DIY enthusiasts and home repair pros rely on. Whether you are tackling a weekend project, making household repairs, or building something from scratch, our curated selection of tools helps you work smarter and more efficiently. Shop tools and hardware online to find quality products at honest prices, backed by real customer reviews. All orders over $50 ship free from our US warehouses with fast 2-5 business day delivery, so your project timeline stays on track. We focus on durable, well-designed tools that deliver professional results without the professional price tag, making it easy to stock your toolbox or workshop.'
WHERE slug = 'tools-hardware';

UPDATE mi_categories SET description = 'Spark joy and imagination with our kids and toys collection at MooreItems. We carry educational toys, creative play sets, outdoor games, plush animals, building kits, arts and crafts supplies, and fun accessories that keep children entertained and learning. Our curated selection covers all age groups from toddlers to teens, with products chosen for safety, quality, and genuine fun factor. Shop kids and toys online to discover unique gifts and everyday play essentials at prices parents love. Whether you are shopping for a birthday, holiday, or just because, our collection makes it easy to find something that will light up a child''s face. All orders over $50 ship free from US warehouses with 2-5 business day delivery, so the fun arrives fast. We believe playtime matters, and every toy in our collection is selected to inspire creativity and bring families together.'
WHERE slug = 'kids-toys';

UPDATE mi_categories SET description = 'Fuel your active lifestyle with our sports and outdoors collection at MooreItems. From fitness accessories and workout gear to camping essentials, hiking equipment, and outdoor recreation products, we carry everything you need to stay active and explore the world around you. Our curated selection includes resistance bands, yoga mats, water bottles, backpacks, headlamps, and sporting goods for athletes and weekend adventurers alike. Shop sports and outdoors online to find high-quality gear at accessible prices, all backed by real customer reviews. Orders over $50 ship free from our US warehouses with 2-5 business day delivery, so you are always ready for your next adventure. Whether you are training for a marathon, starting a new fitness routine, or planning a camping trip, our collection has the gear to keep you moving and motivated.'
WHERE slug = 'sports-outdoors';

UPDATE mi_categories SET description = 'Conquer clutter and maximize every inch of your space with our storage and organization collection at MooreItems. We carry bins, baskets, drawer organizers, closet systems, shelf dividers, label makers, and space-saving solutions for every room in your home. From pantry organization and bathroom storage to garage shelving and desk tidying, our curated selection helps you create order out of chaos. Shop storage and organization products online to discover smart solutions that look as good as they function, at prices that make organizing affordable. All orders over $50 ship free from our US warehouses with delivery in 2-5 business days. Whether you are decluttering your closet, organizing a craft room, or setting up a more productive workspace, our products make it easy to find a place for everything and keep everything in its place.'
WHERE slug = 'storage-organization';

UPDATE mi_categories SET description = 'Access premium digital content instantly with our digital downloads collection at MooreItems. We offer printable planners, digital art, templates, educational resources, and creative assets that you can download and use immediately after purchase. No shipping wait times, no physical clutter. Our curated selection of digital products is perfect for anyone looking for instant gratification and practical value. Shop digital downloads online to find professionally designed files at affordable prices. Since these are digital products, delivery is instant, available on your order confirmation page and via email the moment your purchase is complete. Whether you are looking for printable wall art to decorate your space, planner templates to organize your life, or creative resources for your next project, our digital collection delivers quality content straight to your device.'
WHERE slug = 'digital-downloads';

-- Category FAQs (3-4 per category)
UPDATE mi_categories SET faq_json = '[
  {"question": "What types of home and furniture products do you carry?", "answer": "We carry a wide range of home essentials including throw pillows, wall art, rugs, lighting, shelving, bedding, curtains, decorative accents, and small furniture pieces. Our collection covers modern, farmhouse, minimalist, and contemporary styles."},
  {"question": "How long does shipping take for home and furniture items?", "answer": "Most home and furniture items ship from our US warehouses and arrive within 2-5 business days. Orders over $50 qualify for free shipping."},
  {"question": "Can I return home decor items if they do not match my space?", "answer": "Yes, we offer a 30-day return policy on all unused items in their original packaging. If something does not look right in your space, you can return it hassle-free."},
  {"question": "Do you offer furniture assembly or installation?", "answer": "Our products are designed for easy setup and typically require minimal assembly. Detailed instructions are included with each item, and most pieces can be set up in minutes."}
]'::jsonb WHERE slug = 'home-furniture';

UPDATE mi_categories SET faq_json = '[
  {"question": "What fashion styles do you offer?", "answer": "Our fashion collection includes streetwear, bohemian, classic, athleisure, and casual styles for women, men, and kids. We add new arrivals weekly to keep our selection fresh and on-trend."},
  {"question": "How do I find the right size?", "answer": "Each product listing includes a detailed size chart. We recommend measuring yourself and comparing to the chart before ordering. If the fit is not right, our 30-day return policy has you covered."},
  {"question": "How fast will my fashion order arrive?", "answer": "Fashion orders ship from our US warehouses within 1-2 business days, with delivery in 2-5 business days. Orders over $50 ship free."},
  {"question": "Do you offer fashion items for kids?", "answer": "Yes, our fashion category includes clothing and accessories for kids of all ages. Use the Style filter on the category page to browse kids-specific items."}
]'::jsonb WHERE slug = 'fashion';

UPDATE mi_categories SET faq_json = '[
  {"question": "Are your health and beauty products safe to use?", "answer": "Yes, all products in our health and beauty collection are sourced from reputable manufacturers and meet standard safety requirements. We include detailed product descriptions and usage instructions for every item."},
  {"question": "What skincare tools do you carry?", "answer": "We offer facial rollers, gua sha tools, LED therapy devices, cleansing brushes, microcurrent devices, and other popular skincare gadgets to enhance your daily routine."},
  {"question": "How quickly will my beauty order ship?", "answer": "Beauty orders ship from US warehouses with delivery in 2-5 business days. Free shipping on all orders over $50."},
  {"question": "Can I return beauty products?", "answer": "Unused beauty products in their original packaging can be returned within 30 days. For hygiene reasons, opened personal care items cannot be returned unless defective."}
]'::jsonb WHERE slug = 'health-beauty';

UPDATE mi_categories SET faq_json = '[
  {"question": "Is your jewelry real gold or silver?", "answer": "Our collection includes a variety of materials including gold-plated, sterling silver, stainless steel, and fashion jewelry. Each product listing clearly states the material so you know exactly what you are getting."},
  {"question": "How should I care for my jewelry?", "answer": "We recommend storing jewelry in a cool, dry place and avoiding exposure to water, perfume, and harsh chemicals. Most pieces can be gently cleaned with a soft cloth."},
  {"question": "How is jewelry packaged for shipping?", "answer": "All jewelry is carefully packaged in protective pouches or boxes to prevent damage during transit. Orders ship from US warehouses in 2-5 business days, free on orders over $50."}
]'::jsonb WHERE slug = 'jewelry';

UPDATE mi_categories SET faq_json = '[
  {"question": "What garden tools do you carry?", "answer": "We offer hand trowels, pruning shears, garden gloves, kneeling pads, watering accessories, planters, and more. Our selection covers everything from basic gardening to more advanced landscaping needs."},
  {"question": "Are your outdoor products weather-resistant?", "answer": "Many of our outdoor products are designed for weather resistance, but we recommend checking individual product descriptions for specific durability details and care instructions."},
  {"question": "How fast do garden and outdoor items ship?", "answer": "Garden and outdoor products ship from US warehouses with 2-5 business day delivery. Orders over $50 qualify for free shipping."},
  {"question": "Do you carry solar-powered outdoor products?", "answer": "Yes, we offer a variety of solar-powered garden lights, pathway markers, and decorative outdoor lighting that requires no wiring or electricity."}
]'::jsonb WHERE slug = 'garden-outdoor';

UPDATE mi_categories SET faq_json = '[
  {"question": "What types of pet supplies do you offer?", "answer": "We carry toys, beds, grooming tools, feeding accessories, travel carriers, collars, leashes, and training aids for dogs, cats, and small animals."},
  {"question": "Are your pet toys safe for dogs and cats?", "answer": "Yes, our pet toys are selected for safety and durability. We recommend choosing toys appropriate for your pet''s size and always supervising playtime with new toys."},
  {"question": "How long does shipping take for pet supplies?", "answer": "Pet supplies ship from our US warehouses and arrive in 2-5 business days. Free shipping on orders over $50."},
  {"question": "Can I return pet products?", "answer": "Unused pet products in original packaging can be returned within 30 days. Items that have been used by pets cannot be returned for hygiene reasons."}
]'::jsonb WHERE slug = 'pet-supplies';

UPDATE mi_categories SET faq_json = '[
  {"question": "What is the best kitchen gadget under $20?", "answer": "Our most popular kitchen gadgets under $20 include vegetable choppers, silicone utensil sets, spice organizers, and handheld milk frothers. Browse our kitchen category sorted by price to find great deals."},
  {"question": "Do you carry cookware and bakeware?", "answer": "Yes, we offer a variety of cookware, bakeware, and kitchen tools including pots, pans, baking sheets, mixing bowls, and specialty cooking accessories."},
  {"question": "How quickly do kitchen items ship?", "answer": "Kitchen and dining products ship from US warehouses in 2-5 business days. Orders over $50 get free shipping."},
  {"question": "Are your kitchen products dishwasher safe?", "answer": "Many of our kitchen products are dishwasher safe, but we recommend checking the individual product description for specific care instructions."}
]'::jsonb WHERE slug = 'kitchen-dining';

UPDATE mi_categories SET faq_json = '[
  {"question": "What types of electronics do you carry?", "answer": "We offer phone accessories, wireless earbuds, chargers, smart home devices, LED lighting, computer peripherals, and tech gadgets. Our selection focuses on everyday electronics at affordable prices."},
  {"question": "Do your electronics come with warranties?", "answer": "Our electronics are covered by our standard 30-day return policy. Many items also include manufacturer warranties. Check individual product listings for warranty details."},
  {"question": "How fast do electronics orders ship?", "answer": "Electronics ship from our US warehouses with delivery in 2-5 business days. Free shipping on all orders over $50."},
  {"question": "Are your phone accessories compatible with my device?", "answer": "Product descriptions include compatibility information for each accessory. We carry accessories for most popular phone models. If you are unsure, contact our support team."}
]'::jsonb WHERE slug = 'electronics';

UPDATE mi_categories SET faq_json = '[
  {"question": "What types of tools do you carry?", "answer": "We carry hand tools, power tool accessories, measuring instruments, fasteners, safety gear, and workshop organizers. Our selection covers home repair, DIY projects, and general maintenance needs."},
  {"question": "Are your tools suitable for professional use?", "answer": "Our tools are designed primarily for home DIY and general repair work. Many are professional-grade quality at consumer-friendly prices. Check individual product reviews for real-world performance feedback."},
  {"question": "How quickly do tools and hardware ship?", "answer": "Tools and hardware ship from US warehouses in 2-5 business days. Free shipping on orders over $50."}
]'::jsonb WHERE slug = 'tools-hardware';

UPDATE mi_categories SET faq_json = '[
  {"question": "What age range are your toys designed for?", "answer": "Our kids and toys collection covers all ages from toddlers to teens. Each product listing includes a recommended age range to help you find the perfect fit."},
  {"question": "Are your toys safe for young children?", "answer": "Safety is a top priority. We select toys that meet safety standards and include choking hazard warnings where appropriate. Always check the recommended age on each product."},
  {"question": "How fast do toy orders ship?", "answer": "Kids and toy orders ship from US warehouses with 2-5 business day delivery. Orders over $50 ship free."},
  {"question": "Do you gift wrap orders?", "answer": "We do not currently offer gift wrapping, but all items arrive in clean, discreet packaging. Many customers use our fast shipping to order gifts in time for birthdays and holidays."}
]'::jsonb WHERE slug = 'kids-toys';

UPDATE mi_categories SET faq_json = '[
  {"question": "What fitness equipment do you carry?", "answer": "We offer resistance bands, yoga mats, dumbbells, jump ropes, workout gloves, foam rollers, and other fitness accessories to support home workouts and gym sessions."},
  {"question": "Do you carry camping and hiking gear?", "answer": "Yes, we offer headlamps, backpacks, water bottles, camping tools, and outdoor recreation accessories for hikers, campers, and outdoor enthusiasts."},
  {"question": "How fast do sports and outdoor items ship?", "answer": "Sports and outdoor products ship from US warehouses in 2-5 business days. Free shipping on orders over $50."}
]'::jsonb WHERE slug = 'sports-outdoors';

UPDATE mi_categories SET faq_json = '[
  {"question": "What storage solutions do you offer?", "answer": "We carry bins, baskets, drawer organizers, closet systems, shelf dividers, under-bed storage, pantry organizers, and desk tidying solutions for every room in your home."},
  {"question": "Are your storage products stackable?", "answer": "Many of our storage bins and containers are designed to be stackable for maximum space efficiency. Check individual product descriptions for stacking compatibility."},
  {"question": "How quickly do storage products ship?", "answer": "Storage and organization products ship from US warehouses in 2-5 business days. Orders over $50 get free shipping."}
]'::jsonb WHERE slug = 'storage-organization';

UPDATE mi_categories SET faq_json = '[
  {"question": "How do I access my digital downloads after purchase?", "answer": "Download links are available instantly on your order confirmation page and in your confirmation email. You can also access them anytime from your order history in your account."},
  {"question": "What file formats are digital downloads available in?", "answer": "File formats vary by product and are listed on each product page. Common formats include PDF, PNG, JPG, and SVG."},
  {"question": "Can I get a refund on digital downloads?", "answer": "Due to the nature of digital products, all sales are final once the download link has been accessed. If you experience technical issues, please contact our support team for assistance."}
]'::jsonb WHERE slug = 'digital-downloads';
