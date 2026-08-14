import os
from PIL import Image, ImageDraw, ImageFont

output_dirs = [
    "/home/ongki/Projects/dotads/apps/admin/public/images/products",
    "/home/ongki/Projects/dotads/apps/storefront/public/images/products",
]

for d in output_dirs:
    os.makedirs(d, exist_ok=True)

products = [
    {
        "filename": "gadget-headphone-pro.webp",
        "bg_start": (30, 41, 59),   # Dark slate
        "bg_end": (79, 70, 229),    # Indigo accent
        "title": "Headphone Pro Max",
        "subtitle": "ANC Wireless Headphones",
        "price": "Rp 1.499.000",
        "tag": "PHYSICAL PRODUCT",
        "tag_color": (34, 197, 94)  # Green
    },
    {
        "filename": "smartwatch-ultra-v2.webp",
        "bg_start": (15, 23, 42),   # Very dark navy
        "bg_end": (14, 165, 233),   # Sky blue accent
        "title": "SmartWatch Ultra V2",
        "subtitle": "Amoled Display & GPS",
        "price": "Rp 899.000",
        "tag": "PHYSICAL PRODUCT",
        "tag_color": (34, 197, 94)
    },
    {
        "filename": "glowing-serum-skin.webp",
        "bg_start": (74, 4, 78),    # Deep magenta
        "bg_end": (236, 72, 153),   # Pink accent
        "title": "GlowSkin Luxury Serum",
        "subtitle": "Niacinamide 10% + Hyaluronic",
        "price": "Rp 249.000",
        "tag": "BEAUTY & HEALTH",
        "tag_color": (244, 63, 94)  # Rose
    },
    {
        "filename": "digital-ebook-mastery.webp",
        "bg_start": (67, 56, 202),  # Deep Indigo
        "bg_end": (124, 58, 237),   # Purple accent
        "title": "Meta Ads Mastery E-Book",
        "subtitle": "Panduan CAPI 9.5+ EMQ 2026",
        "price": "Rp 199.000",
        "tag": "DIGITAL E-BOOK",
        "tag_color": (168, 85, 247) # Purple
    },
    {
        "filename": "course-meta-ads-pro.webp",
        "bg_start": (20, 83, 45),   # Emerald dark
        "bg_end": (16, 185, 129),   # Emerald accent
        "title": "Scale Meta Ads Masterclass",
        "subtitle": "Full Course Video + Template",
        "price": "Rp 499.000",
        "tag": "DIGITAL COURSE",
        "tag_color": (16, 185, 129)
    },
    {
        "filename": "ergonomic-office-chair.webp",
        "bg_start": (45, 55, 72),   # Slate gray
        "bg_end": (100, 116, 139),  # Slate medium
        "title": "ErgoChair Executive",
        "subtitle": "Lumbar Support & Mesh",
        "price": "Rp 2.199.000",
        "tag": "PHYSICAL FURNITURE",
        "tag_color": (234, 179, 8)  # Amber
    }
]

def draw_gradient_and_content(prod):
    width, height = 600, 600
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)

    # Interpolate vertical gradient
    r1, g1, b1 = prod["bg_start"]
    r2, g2, b2 = prod["bg_end"]
    for y in range(height):
        ratio = y / height
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Add geometric decorative circle
    draw.ellipse([300, -100, 700, 300], outline=(255, 255, 255, 40), width=3)
    draw.ellipse([100, 200, 500, 600], outline=(255, 255, 255, 25), width=2)

    # Draw Tag Badge
    badge_x, badge_y = 50, 60
    draw.rectangle([badge_x, badge_y, badge_x + 200, badge_y + 36], fill=prod["tag_color"])
    draw.text((badge_x + 16, badge_y + 10), prod["tag"], fill=(255, 255, 255))

    # Draw Title
    draw.text((50, 140), prod["title"], fill=(255, 255, 255))

    # Draw Subtitle
    draw.text((50, 185), prod["subtitle"], fill=(203, 213, 225))

    # Draw Central Product Card Placeholder Graphic
    card_margin = 80
    draw.rounded_rectangle([card_margin, 240, width - card_margin, height - 120], radius=16, fill=(255, 255, 255, 20), outline=(255, 255, 255, 60), width=2)
    draw.ellipse([220, 280, 380, 440], fill=(255, 255, 255, 40))

    # Price Tag at Bottom
    draw.text((50, height - 80), prod["price"], fill=(255, 255, 255))
    draw.text((width - 220, height - 80), "DotAds Engine v2", fill=(148, 163, 184))

    return img

print("Generating WebP product images...")
for prod in products:
    img = draw_gradient_and_content(prod)
    for d in output_dirs:
        target_path = os.path.join(d, prod["filename"])
        img.save(target_path, "WEBP", quality=90)
        print(f"  [+] Saved: {target_path}")

print("All WebP images generated successfully!")
