from PIL import Image
import os

input_path = r"C:\Users\ss\OneDrive\SISTec hackathon\CuraTeraApp\assets\CuraTera_Logo.png"
output_dir = r"C:\Users\ss\OneDrive\SISTec hackathon\CuraTeraApp\android\app\src\main\res\mipmap-xxxhdpi"

# Open the original logo
img = Image.open(input_path).convert("RGBA")

# Target size for xxxhdpi is 432x432 for adaptive icons
target_size = 432
# Safe zone is 288x288, so we scale the logo to fit within that
safe_zone_size = int(target_size * 0.66) # around 285

# Scale the logo maintaining aspect ratio to fit inside safe zone
img.thumbnail((safe_zone_size, safe_zone_size), Image.Resampling.LANCZOS)

# Create a transparent background for the foreground
foreground = Image.new("RGBA", (target_size, target_size), (255, 255, 255, 0))

# Paste the logo in the center
offset = ((target_size - img.width) // 2, (target_size - img.height) // 2)
foreground.paste(img, offset, img)

# Save the foreground
os.makedirs(output_dir, exist_ok=True)
foreground.save(os.path.join(output_dir, "ic_launcher_foreground.png"))
print("Generated ic_launcher_foreground.png")
