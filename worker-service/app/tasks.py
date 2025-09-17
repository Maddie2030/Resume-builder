#worker-service/app/tasks.py
import os
import uuid
import requests
import logging
from pydantic import ValidationError
from PIL import Image, ImageDraw, ImageFont
from weasyprint import HTML

from app.celery_app import celery_app
from app.schemas.render import ImageRenderRequest, TemplateServiceResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TEMPLATE_SERVICE_URL = os.getenv("TEMPLATE_SERVICE_URL", "http://template-service:8002")
STATIC_BACKGROUNDS_PATH = "/app/static/backgrounds"
STATIC_OUTPUTS_PATH = "/app/static/outputs"
DEFAULT_FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# Font mapping for system fonts
SYSTEM_FONTS = {
    'Arial (system)': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'Roboto': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'Open Sans': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'Lato': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'Montserrat': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'Verdana': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    'Georgia': '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
    'Courier New': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
    'Times New Roman': '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
    'Trebuchet MS': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
}

def _load_font(font_path: str | None, size: int) -> ImageFont.FreeTypeFont:
    """Enhanced font loading that handles system fonts and fallbacks."""

    # First, check if the font_path is a key in your system fonts dictionary
    if font_path in SYSTEM_FONTS:
        font_path = SYSTEM_FONTS[font_path]
    # If the path is still empty or None, use the default
    elif not font_path or font_path == "":
        font_path = DEFAULT_FONT_PATH

    try:
        # Now attempt to load the font from the resolved path
        return ImageFont.truetype(font_path, size)
    except Exception as e:
        logger.warning(f"Could not load font at '{font_path}': {e}, using default.")
        try:
            return ImageFont.truetype(DEFAULT_FONT_PATH, size)
        except Exception:
            return ImageFont.load_default()

def _draw_text(draw: ImageDraw.ImageDraw, x: int, y: int, text: str, font, fill: str, bold: bool = False, italic: bool = False):
    """Draw text with bold simulation if needed."""
    if bold:
        # Simulate bold by multiple passes
        for dx, dy in [(0,0), (1,0), (0,1), (1,1)]:
            draw.text((x+dx, y+dy), text, font=font, fill=fill)
    else:
        draw.text((x, y), text, font=font, fill=fill)

def _draw_wrapped_text(draw, x, y, text, font, fill, max_width: int, bold: bool, italic: bool):
    """Enhanced text wrapping that handles multi-line text and proper line breaks."""
    if not max_width or max_width <= 0:
        _draw_text(draw, x, y, text, font, fill, bold, italic)
        return

    # Check if the entire text fits within max_width first
    try:
        full_text_width = draw.textlength(text, font=font)
    except AttributeError:
        # Fallback for older Pillow versions
        full_text_width = draw.textsize(text, font=font)[0]
    
    # If the text fits within max_width, don't wrap it - render as single line
    if full_text_width <= max_width:
        _draw_text(draw, x, y, text, font, fill, bold, italic)
        return

    # For names and short text, be more lenient - allow some overflow for better aesthetics
    word_count = len(text.split())
    if word_count <= 2 and full_text_width <= max_width * 1.2:  # Allow 20% overflow for 2 words or less
        _draw_text(draw, x, y, text, font, fill, bold, italic)
        return

    # Handle multi-line text (split by \n first)
    lines = text.split('\n')
    all_wrapped_lines = []
    
    for line in lines:
        if not line.strip():
            all_wrapped_lines.append("")
            continue
            
        # Word wrapping for each line
        words = line.split()
        if not words:
            all_wrapped_lines.append("")
            continue

        wrapped_lines = []
        current = words[0]
        
        for word in words[1:]:
            test_line = f"{current} {word}"
            try:
                test_width = draw.textlength(test_line, font=font)
            except AttributeError:
                # Fallback for older Pillow versions
                test_width = draw.textsize(test_line, font=font)
            
            if test_width <= max_width:
                current = test_line
            else:
                wrapped_lines.append(current)
                current = word
        
        wrapped_lines.append(current)
        all_wrapped_lines.extend(wrapped_lines)

    # Calculate line height based on font size
    line_height = int(font.size * 1.2)  # 20% spacing
    
    # Draw each line
    for i, line in enumerate(all_wrapped_lines):
        if line:  # Only draw non-empty lines
            line_y = y + (i * line_height)
            _draw_text(draw, x, line_y, line, font, fill, bold, italic)

def _process_block(ui_block_data: dict):
    """Process a single text block from the frontend data."""
    logger.info(f"Processing block: {ui_block_data.get('title', 'unknown')} with text: '{ui_block_data.get('user_text', '')[:50]}...'")
    
    # Validate required fields
    if not ui_block_data.get('user_text') or not ui_block_data.get('user_text').strip():
        logger.warning(f"Block '{ui_block_data.get('title', 'unknown')}' has empty text, skipping.")
        return None
    
    processed = {
        "title": ui_block_data.get("title", ""),
        "text": ui_block_data.get("user_text", "").strip(),
        "x": ui_block_data.get("x", 0),
        "y": ui_block_data.get("y", 0),
        "width": ui_block_data.get("width", 100),
        "height": ui_block_data.get("height", 50),
        "font_size": max(6, ui_block_data.get("font_size", 16)),  # Ensure minimum font size
        "color": ui_block_data.get("color", "#000000"),
        "font_path": ui_block_data.get("font_path"),
        "bold": ui_block_data.get("bold", False),
        "italic": ui_block_data.get("italic", False),
        "max_width": ui_block_data.get("max_width", 400),
        "type": ui_block_data.get("type", "TEXT")
    }
    
    logger.info(f"Processed block '{processed['title']}' at ({processed['x']}, {processed['y']}) size {processed['font_size']}px")
    return processed

@celery_app.task(bind=True, name="render.tasks.generate_image_task")
def generate_image_task(self, request_data: dict) -> str:
    """Generates an image from a template and returns its absolute file path."""
    try:
        logger.info(f"Starting image generation task")
        
        # Validate request data
        request = ImageRenderRequest(**request_data)
        logger.info(f"Processing {len(request.text_data)} text blocks")
        
        # Fetch template metadata - NOW WITH CORRECT SCHEMA
        response = requests.get(f"{TEMPLATE_SERVICE_URL}/api/v1/templates/{request.template_id}")
        response.raise_for_status()
        template = TemplateServiceResponse(**response.json())  # This should work now!
        
        logger.info(f"Fetched template: {template.name} (ID: {template.id})")

        # Load background image
        background_path = os.path.join(STATIC_BACKGROUNDS_PATH, os.path.basename(template.image_path))
        if not os.path.exists(background_path):
            raise FileNotFoundError(f"Background image not found at path: {background_path}")

        image = Image.open(background_path).convert("RGBA")
        logger.info(f"Loaded background image: {image.size[0]}x{image.size[1]}")
        draw = ImageDraw.Draw(image)

        # Process each text block from frontend (ignore template text_blocks since frontend provides everything)
        for block_data in request.text_data:
            # Convert Pydantic model to dict for processing
            if hasattr(block_data, 'dict'):
                block_dict = block_data.dict()
            else:
                block_dict = block_data
                
            processed = _process_block(block_dict)
            if not processed:
                continue

            try:
                font = _load_font(processed["font_path"], processed["font_size"])
                
                # Ensure coordinates are within image bounds
                x = max(0, min(processed["x"], image.width - 10))
                y = max(0, min(processed["y"], image.height - 10))
                
                _draw_wrapped_text(
                    draw=draw,
                    x=x,
                    y=y,
                    text=processed["text"],
                    font=font,
                    fill=processed["color"],
                    max_width=processed["max_width"],
                    bold=processed["bold"],
                    italic=processed["italic"],
                )
                
                logger.info(f"Successfully rendered block '{processed['title']}'")
                
            except Exception as e:
                logger.error(f"Failed to render block '{processed['title']}': {e}")
                continue

        # Save the generated image
        os.makedirs(STATIC_OUTPUTS_PATH, exist_ok=True)
        filename = f"{uuid.uuid4()}.png"
        output_path = os.path.join(STATIC_OUTPUTS_PATH, filename)
        image.save(output_path, format="PNG", quality=95)
        
        logger.info(f"Image saved successfully at {output_path}")
        public_url_path = f"/static/outputs/{filename}"
        return public_url_path 

    except Exception as e:
        error_message = f"Task failed: {type(e).__name__} - {str(e)}"
        logger.error(f"Error in generate_image_task: {error_message}")
        raise e

@celery_app.task(bind=True, name="render.tasks.generate_pdf_from_image_task")
def generate_pdf_from_image_task(self, image_path: str = None, request_data: dict = None) -> str:
    """Generates a PDF from an image path or by generating image first from request data."""
    try:
        logger.info(f"Starting PDF generation task")
        
        # If no image_path provided, generate the image first
        if not image_path and request_data:
            logger.info("No image path provided, generating image first...")
            image_path = generate_image_task(self, request_data)
            logger.info(f"Generated image at: {image_path}")
        
        if not image_path:
            raise ValueError("Either image_path or request_data must be provided")
        
        # Convert relative path to absolute path for WeasyPrint
        if image_path.startswith("/static/outputs/"):
            absolute_image_path = os.path.join(STATIC_OUTPUTS_PATH, os.path.basename(image_path))
        else:
            absolute_image_path = image_path
            
        logger.info(f"Converting image to PDF: {absolute_image_path}")
        
        html = HTML(string=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ margin: 0; padding: 0; }}
                    img {{ max-width: 100%; height: auto; display: block; }}
                </style>
            </head>
            <body>
                <img src="file://{absolute_image_path}" style="width:100%;height:auto" />
            </body>
            </html>
        """, base_url=".")
        
        os.makedirs(STATIC_OUTPUTS_PATH, exist_ok=True)
        pdf_filename = f"{uuid.uuid4()}.pdf"
        pdf_path = os.path.join(STATIC_OUTPUTS_PATH, pdf_filename)
        
        html.write_pdf(pdf_path)
        logger.info(f"PDF saved successfully at {pdf_path}")
        
        # Don't delete the image file - keep it for user download
        # if os.path.exists(absolute_image_path):
        #     os.remove(absolute_image_path)
        #     logger.info(f"Cleaned up temporary image file: {absolute_image_path}")
        
        return f"/static/outputs/{pdf_filename}"
        
    except Exception as e:
        error_message = f"PDF generation failed: {type(e).__name__} - {str(e)}"
        logger.error(f"Error in generate_pdf_from_image_task: {error_message}")
        raise e
