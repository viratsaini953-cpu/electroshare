import os
import math
from PIL import Image, ImageDraw, ImageFont

from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# =========================================================================
# SECTION 1: GENERATING THE LPU LOGO VIA PIL
# =========================================================================

def draw_lpu_logo(filename):
    """
    Generates a high-quality LPU logo with transparent background.
    Left: Circular emblem with radiating black stripes and curved text.
    Right: Stacked orange 'L', 'P', 'U' boxes with letters and full words.
    """
    # Create an image with transparent background, size 1200 x 360 (high-res)
    width = 1200
    height = 360
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 1. Circular emblem coordinates and dimensions
    cx, cy = 180, 180
    r_outer = 140
    r_inner = 110
    orange_color = (243, 112, 33, 255)  # LPU Ochre Orange
    
    # Draw outer circle (white fill, black outline)
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=4)
    
    # Mask for inner circle stripes
    mask = Image.new("L", (width, height), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], fill=255)
    
    # Create stripes layer (black radiating wedges)
    stripes_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    stripes_draw = ImageDraw.Draw(stripes_layer)
    
    # Radiating pivot point (bottom-left of inner area)
    px, py = cx - 90, cy + 90
    
    # Define wedge angles (degrees) radiating out
    ray_angles = [-72, -52, -32, -12, 8, 28]
    for angle in ray_angles:
        r_far = 400
        a1 = math.radians(angle - 6)
        a2 = math.radians(angle + 6)
        x1 = px + r_far * math.cos(a1)
        y1 = py + r_far * math.sin(a1)
        x2 = px + r_far * math.cos(a2)
        y2 = py + r_far * math.sin(a2)
        stripes_draw.polygon([(px, py), (x1, y1), (x2, y2)], fill=(0, 0, 0, 255))
        
    # Draw inner circle background layer
    inner_circle = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    inner_circle_draw = ImageDraw.Draw(inner_circle)
    inner_circle_draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], fill=orange_color)
    
    # Composite stripes onto inner circle with mask
    inner_circle.alpha_composite(stripes_layer)
    img.paste(inner_circle, (0, 0), mask=mask)
    
    # Redraw inner circle border
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], fill=None, outline=(0, 0, 0, 255), width=3)
    
    # Load fonts
    try:
        font_text = ImageFont.truetype("arialbd.ttf", 15)
        font_box = ImageFont.truetype("arialbd.ttf", 52)
        font_full = ImageFont.truetype("arialbd.ttf", 64)
    except IOError:
        font_text = ImageFont.load_default()
        font_box = ImageFont.load_default()
        font_full = ImageFont.load_default()
        
    # Draw curved text: "LOVELY PROFESSIONAL UNIVERSITY" (top curve)
    text_top = "LOVELY PROFESSIONAL UNIVERSITY"
    r_text = 125
    start_angle = -160
    end_angle = -20
    span = end_angle - start_angle
    step = span / (len(text_top) - 1)
    
    for i, char in enumerate(text_top):
        angle = start_angle + i * step
        rad = math.radians(angle)
        tx = cx + r_text * math.cos(rad)
        ty = cy + r_text * math.sin(rad)
        
        char_img = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        char_draw = ImageDraw.Draw(char_img)
        w = char_draw.textlength(char, font=font_text)
        char_draw.text((20 - w/2, 20 - 10), char, font=font_text, fill=(0, 0, 0, 255))
        
        rotated_char = char_img.rotate(-(angle + 90), resample=Image.Resampling.BICUBIC)
        img.paste(rotated_char, (int(tx - 20), int(ty - 20)), mask=rotated_char)
        
    # Draw curved text: "PUNJAB (INDIA)" (bottom curve)
    text_bottom = "•   PUNJAB (INDIA)   •"
    start_angle = 145
    end_angle = 35
    span = end_angle - start_angle
    step = span / (len(text_bottom) - 1)
    
    for i, char in enumerate(text_bottom):
        angle = start_angle + i * step
        rad = math.radians(angle)
        tx = cx + r_text * math.cos(rad)
        ty = cy + r_text * math.sin(rad)
        
        char_img = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        char_draw = ImageDraw.Draw(char_img)
        w = char_draw.textlength(char, font=font_text)
        char_draw.text((20 - w/2, 20 - 10), char, font=font_text, fill=(0, 0, 0, 255))
        
        rotated_char = char_img.rotate(-(angle - 90), resample=Image.Resampling.BICUBIC)
        img.paste(rotated_char, (int(tx - 20), int(ty - 20)), mask=rotated_char)
        
    # 2. Draw vertical L-P-U boxes and letters
    box_x = 360
    box_w = 64
    y_positions = [60, 148, 236]
    letters = ["L", "P", "U"]
    full_words = ["OVELY", "ROFESSIONAL", "NIVERSITY"]
    
    for i, (letter, word) in enumerate(zip(letters, full_words)):
        by = y_positions[i]
        # Draw box
        draw.rectangle([box_x, by, box_x + box_w, by + box_w], fill=orange_color, outline=(0, 0, 0, 255), width=3)
        # Letter
        lw = draw.textlength(letter, font=font_box)
        draw.text((box_x + (box_w - lw)/2, by + 4), letter, font=font_box, fill=(0, 0, 0, 255))
        # Word expansion
        draw.text((box_x + box_w + 15, by - 4), word, font=font_full, fill=(0, 0, 0, 255))
        
    # Save logo
    img.save(filename, "PNG")
    print(f"LPU logo successfully saved to: {filename}")


# =========================================================================
# SECTION 2: PDF PRESENTATION GENERATOR (REPORTLAB)
# =========================================================================

def draw_cover_background(canvas_obj, doc):
    """Draws background for the cover slide."""
    canvas_obj.saveState()
    # Deep Slate Background
    canvas_obj.setFillColor(colors.HexColor("#0F172A"))
    canvas_obj.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=True, stroke=False)
    
    # Elegant orange accent circles
    canvas_obj.setFillColor(colors.HexColor("#F37021"))
    canvas_obj.setFillAlpha(0.08)
    canvas_obj.circle(doc.pagesize[0] - 50, 50, 250, fill=True, stroke=False)
    
    canvas_obj.setFillColor(colors.HexColor("#38BDF8"))
    canvas_obj.setFillAlpha(0.06)
    canvas_obj.circle(100, doc.pagesize[1] - 100, 200, fill=True, stroke=False)
    
    # Accent border lines
    canvas_obj.setStrokeColor(colors.HexColor("#F37021"))
    canvas_obj.setLineWidth(4)
    canvas_obj.line(30, 30, doc.pagesize[0] - 30, 30)
    canvas_obj.restoreState()


def draw_slide_background(canvas_obj, doc):
    """Draws consistent background for other slides."""
    canvas_obj.saveState()
    # Slate Background
    canvas_obj.setFillColor(colors.HexColor("#0F172A"))
    canvas_obj.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=True, stroke=False)
    
    # Soft accent circles
    canvas_obj.setFillColor(colors.HexColor("#F37021"))
    canvas_obj.setFillAlpha(0.04)
    canvas_obj.circle(doc.pagesize[0] - 50, 50, 180, fill=True, stroke=False)
    
    canvas_obj.setFillColor(colors.HexColor("#38BDF8"))
    canvas_obj.setFillAlpha(0.04)
    canvas_obj.circle(80, doc.pagesize[1] - 80, 150, fill=True, stroke=False)
    
    # Top header boundary line
    canvas_obj.setStrokeColor(colors.HexColor("#334155"))
    canvas_obj.setLineWidth(1)
    canvas_obj.line(30, doc.pagesize[1] - 70, doc.pagesize[0] - 30, doc.pagesize[1] - 70)
    
    # Header Accent line (orange, under logo)
    canvas_obj.setStrokeColor(colors.HexColor("#F37021"))
    canvas_obj.setLineWidth(2)
    canvas_obj.line(doc.pagesize[0] - 170, doc.pagesize[1] - 70, doc.pagesize[0] - 30, doc.pagesize[1] - 70)
    
    # Draw LPU Logo in the header (top right)
    logo_w = 120
    logo_h = 36
    canvas_obj.drawImage("lpu_logo.png", doc.pagesize[0] - 150, doc.pagesize[1] - 58, width=logo_w, height=logo_h, mask='auto')
    
    # Bottom footer line
    canvas_obj.setStrokeColor(colors.HexColor("#334155"))
    canvas_obj.setLineWidth(1)
    canvas_obj.line(30, 45, doc.pagesize[0] - 30, 45)
    
    # Footer metadata
    canvas_obj.setFillColor(colors.HexColor("#94A3B8"))
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.drawString(40, 28, "PYTHON PROGRAMMING SERIES")
    canvas_obj.setFont("Helvetica", 9)
    canvas_obj.drawString(195, 28, "|   Tutorial #1: Introduction & Installation (Hindi)")
    
    # Page numbers
    canvas_obj.drawRightString(doc.pagesize[0] - 40, 28, f"Slide {canvas_obj._pageNumber}")
    canvas_obj.restoreState()


def create_presentation_pdf(output_filename):
    # Set page dimensions (A4 Landscape)
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=landscape(A4),
        leftMargin=40,
        rightMargin=40,
        topMargin=85,      # Padding below header line
        bottomMargin=65    # Padding above footer line
    )
    
    styles = getSampleStyleSheet()
    
    # Define custom typography matching our Slate & Orange theme
    title_style = ParagraphStyle(
        'SlideTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor("#F8FAFC"),
        spaceAfter=15,
        leading=28
    )
    
    orange_title_style = ParagraphStyle(
        'OrangeTitle',
        parent=title_style,
        textColor=colors.HexColor("#F37021")
    )
    
    body_style = ParagraphStyle(
        'SlideBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        textColor=colors.HexColor("#CBD5E1"),
        leading=19,
        spaceAfter=8
    )
    
    bullet_style = ParagraphStyle(
        'SlideBullet',
        parent=body_style,
        leftIndent=15,
        bulletIndent=5,
        spaceAfter=6
    )
    
    card_title_style = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor("#F37021"),
        spaceAfter=6,
        leading=18
    )
    
    card_body_style = ParagraphStyle(
        'CardBody',
        parent=body_style,
        fontSize=11,
        textColor=colors.HexColor("#94A3B8"),
        leading=16,
        spaceAfter=4
    )
    
    code_style = ParagraphStyle(
        'SlideCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=12,
        textColor=colors.HexColor("#4ADE80"),  # Green terminal text
        backColor=colors.HexColor("#090D16"),
        borderPadding=12,
        spaceAfter=10,
        leading=16
    )
    
    story = []
    
    # -------------------------------------------------------------------------
    # SLIDE 1: COVER SLIDE
    # -------------------------------------------------------------------------
    story.append(Spacer(1, 40))
    # Centered Large Logo
    logo_cover = RLImage("lpu_logo.png", width=360, height=108)
    logo_cover.hAlign = 'CENTER'
    story.append(logo_cover)
    story.append(Spacer(1, 40))
    
    # Presentation Title
    title_text = "<font color='#F37021' face='Helvetica-Bold'>Python Programming</font><br/><font color='#FFFFFF' face='Helvetica-Bold' size='22'>Introduction & Installation Guide</font>"
    title_p = Paragraph(f"<para align='CENTER'>{title_text}</para>", title_style)
    story.append(title_p)
    story.append(Spacer(1, 15))
    
    # Subtitle
    sub_text = "<font color='#64748B' size='13'>CBSE Class 11/12 & University Foundation Course</font><br/><font color='#94A3B8' size='11'>Based on Video Tutorial #1 by CodeItUp (Anand Sir)</font>"
    sub_p = Paragraph(f"<para align='CENTER'>{sub_text}</para>", body_style)
    story.append(sub_p)
    
    story.append(PageBreak())
    
    # -------------------------------------------------------------------------
    # SLIDE 2: WHAT IS PYTHON?
    # -------------------------------------------------------------------------
    story.append(Paragraph("What is Python? <font color='#F37021'>(पायथन क्या है?)</font>", title_style))
    story.append(Spacer(1, 10))
    
    # Two-Column Layout using a Table
    # Col 1: Overview, Col 2: The Fun Fact Card
    col1_content = [
        Paragraph("• <b>High-Level Language:</b> Python uses English-like syntax, making it highly readable and easy to write compared to low-level languages.", bullet_style),
        Paragraph("• <b>Interpreted Language:</b> Code is executed line-by-line by the Python Interpreter. It compiles internally and highlights errors immediately.", bullet_style),
        Paragraph("• <b>Multi-Purpose / General-Purpose:</b> Used globally for web development, automation scripts, artificial intelligence, and scientific applications.", bullet_style),
        Paragraph("• <b>Created By:</b> Designed by Dutch programmer <b>Guido van Rossum</b> in the late 1980s. First officially released in <b>1991</b> at CWI in the Netherlands.", bullet_style),
    ]
    
    card_text = """
    <b>Why the name 'Python'?</b><br/><br/>
    Most people think Python is named after the snake. However, Guido van Rossum was a big fan of the BBC comedy series <b>"Monty Python's Flying Circus"</b>.<br/><br/>
    When starting, he wanted a name that was short, unique, and slightly mysterious, so he chose <i>Python</i>!
    """
    col2_content = [
        Table(
            [[Paragraph(card_text, ParagraphStyle('CardContent', parent=body_style, fontSize=12, textColor=colors.HexColor("#E2E8F0"), leading=17))]],
            colWidths=[310],
            style=TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1E293B")),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#334155")),
                ('TOPPADDING', (0,0), (-1,-1), 18),
                ('BOTTOMPADDING', (0,0), (-1,-1), 18),
                ('LEFTPADDING', (0,0), (-1,-1), 18),
                ('RIGHTPADDING', (0,0), (-1,-1), 18),
            ])
        )
    ]
    
    # Table layout: Left col = 420, Spacer = 20, Right col = 320
    t2 = Table([[col1_content, "", col2_content]], colWidths=[420, 20, 320])
    t2.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t2)
    story.append(PageBreak())
    
    # -------------------------------------------------------------------------
    # SLIDE 3: KEY FEATURES OF PYTHON
    # -------------------------------------------------------------------------
    story.append(Paragraph("Key Features of Python <font color='#F37021'>(पायथन की विशेषताएं)</font>", title_style))
    story.append(Spacer(1, 10))
    
    # Grid of Features (3 columns x 2 rows)
    # Each cell is a styled card
    f1 = [
        Paragraph("1. Easy to Learn & Use", card_title_style),
        Paragraph("Simple syntax that closely resembles English. Very easy for beginners to read, write, and understand.", card_body_style)
    ]
    f2 = [
        Paragraph("2. Interpreted Language", card_title_style),
        Paragraph("Executes code line-by-line. Easier debugging, as it stops execution immediately when an error is hit.", card_body_style)
    ]
    f3 = [
        Paragraph("3. Free & Open-Source", card_title_style),
        Paragraph("Completely free to download and use from python.org. Source code can be modified and distributed.", card_body_style)
    ]
    f4 = [
        Paragraph("4. Platform Independent", card_title_style),
        Paragraph("Highly portable. Write code on Windows, and run it on macOS or Linux without making any changes.", card_body_style)
    ]
    f5 = [
        Paragraph("5. Rich Library Support", card_title_style),
        Paragraph("Comes with a massive standard library ('batteries included') for tasks like math, file handling, and network requests.", card_body_style)
    ]
    f6 = [
        Paragraph("6. Dynamically Typed", card_title_style),
        Paragraph("No need to specify variable data types (e.g. int, float). Python automatically detects type at runtime.", card_body_style)
    ]
    
    grid_data = [
        [f1, "", f2, "", f3],
        ["", "", "", "", ""], # vertical spacer row
        [f4, "", f5, "", f6]
    ]
    
    grid_table = Table(grid_data, colWidths=[240, 15, 240, 15, 240], rowHeights=[140, 15, 140])
    grid_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#1E293B")),
        ('BACKGROUND', (2,0), (2,0), colors.HexColor("#1E293B")),
        ('BACKGROUND', (4,0), (4,0), colors.HexColor("#1E293B")),
        ('BACKGROUND', (0,2), (0,2), colors.HexColor("#1E293B")),
        ('BACKGROUND', (2,2), (2,2), colors.HexColor("#1E293B")),
        ('BACKGROUND', (4,2), (4,2), colors.HexColor("#1E293B")),
        
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#334155")),
        ('BOX', (2,0), (2,0), 1, colors.HexColor("#334155")),
        ('BOX', (4,0), (4,0), 1, colors.HexColor("#334155")),
        ('BOX', (0,2), (0,2), 1, colors.HexColor("#334155")),
        ('BOX', (2,2), (2,2), 1, colors.HexColor("#334155")),
        ('BOX', (4,2), (4,2), 1, colors.HexColor("#334155")),
        
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    
    story.append(grid_table)
    story.append(PageBreak())
    
    # -------------------------------------------------------------------------
    # SLIDE 4: APPLICATIONS OF PYTHON
    # -------------------------------------------------------------------------
    story.append(Paragraph("Where is Python Used? <font color='#F37021'>(पायथन के अनुप्रयोग)</font>", title_style))
    story.append(Spacer(1, 10))
    
    # 5 Major application areas shown in a list of horizontal items
    app1 = [
        Paragraph("<font color='#38BDF8'><b>Artificial Intelligence & Machine Learning (AI / ML)</b></font>", card_title_style),
        Paragraph("Python is the leading language for AI. Standard libraries like TensorFlow, PyTorch, and Scikit-Learn make it easy to develop deep learning models.", body_style)
    ]
    app2 = [
        Paragraph("<font color='#38BDF8'><b>Data Science & Analytics</b></font>", card_title_style),
        Paragraph("Used by data scientists to clean, analyze, and visualize complex datasets. Key libraries include Pandas, NumPy, Matplotlib, and Seaborn.", body_style)
    ]
    app3 = [
        Paragraph("<font color='#38BDF8'><b>Web Development</b></font>", card_title_style),
        Paragraph("Powers server-side backends. Robust frameworks like Django, Flask, and FastAPI are used by giants like Instagram, YouTube, and Spotify.", body_style)
    ]
    app4 = [
        Paragraph("<font color='#38BDF8'><b>Scripting & Task Automation</b></font>", card_title_style),
        Paragraph("Enables writing simple scripts to automate repetitive system tasks, renaming thousands of files, spreadsheet handling, and web scraping.", body_style)
    ]
    
    app_table = Table(
        [[app1, app2], [app3, app4]],
        colWidths=[370, 370],
        rowHeights=[145, 145]
    )
    app_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#1E293B")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#1E293B")),
        ('BACKGROUND', (0,1), (0,1), colors.HexColor("#1E293B")),
        ('BACKGROUND', (1,1), (1,1), colors.HexColor("#1E293B")),
        ('BOX', (0,0), (0,0), 1, colors.HexColor("#334155")),
        ('BOX', (1,0), (1,0), 1, colors.HexColor("#334155")),
        ('BOX', (0,1), (0,1), 1, colors.HexColor("#334155")),
        ('BOX', (1,1), (1,1), 1, colors.HexColor("#334155")),
        ('TOPPADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('LEFTPADDING', (0,0), (-1,-1), 16),
        ('RIGHTPADDING', (0,0), (-1,-1), 16),
    ]))
    
    story.append(app_table)
    story.append(PageBreak())
    
    # -------------------------------------------------------------------------
    # SLIDE 5: INSTALLATION GUIDE
    # -------------------------------------------------------------------------
    story.append(Paragraph("Python Installation on Windows <font color='#F37021'>(इंस्टॉलेशन गाइड)</font>", title_style))
    story.append(Spacer(1, 10))
    
    # Step-by-step table layout
    steps = [
        [
            Paragraph("<font color='#F37021'><b>Step 01</b></font>", card_title_style),
            Paragraph("<b>Visit the Website:</b> Open your web browser and go to the official Python portal: <font color='#38BDF8'><b>www.python.org</b></font>", body_style)
        ],
        [
            Paragraph("<font color='#F37021'><b>Step 02</b></font>", card_title_style),
            Paragraph("<b>Download Installer:</b> Hover over 'Downloads', click on 'Windows', and download the latest stable release (e.g., Python 3.12.x/3.13.x).", body_style)
        ],
        [
            Paragraph("<font color='#F37021'><b>Step 03</b></font>", card_title_style),
            Paragraph("<b>Run the Installer:</b> Double-click the downloaded <code>.exe</code> file to launch the Python Setup wizard.", body_style)
        ],
        [
            Paragraph("<font color='#FF4444'><b>CRITICAL</b></font>", card_title_style),
            Paragraph("<b>Check 'Add python.exe to PATH':</b> Before clicking Install, ensure you check the box at the bottom. <u>Failing to do this will cause command prompt errors.</u>", body_style)
        ],
        [
            Paragraph("<font color='#4ADE80'><b>Step 04</b></font>", card_title_style),
            Paragraph("<b>Install Now:</b> Click the large 'Install Now' button. Wait for the loading bar to finish and close the setup wizard.", body_style)
        ]
    ]
    
    step_table = Table(steps, colWidths=[90, 670], rowHeights=[55, 55, 55, 65, 55])
    step_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1E293B")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#334155")),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor("#334155")),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    
    story.append(step_table)
    story.append(PageBreak())
    
    # -------------------------------------------------------------------------
    # SLIDE 6: VERIFICATION & FIRST CODE
    # -------------------------------------------------------------------------
    story.append(Paragraph("Verification & Running First Code <font color='#F37021'>(सत्यापन और पहला कोड)</font>", title_style))
    story.append(Spacer(1, 10))
    
    # Col 1: Verification, Col 2: Code block / Terminal simulation
    col1_verification = [
        Paragraph("<b>1. Verify Installation via Command Prompt:</b>", card_title_style),
        Paragraph("• Open the Windows start menu, search for <b>'cmd'</b>, and press Enter.", bullet_style),
        Paragraph("• In the Command Prompt window, type:<br/><code><b>python --version</b></code> and press Enter.", bullet_style),
        Paragraph("• It should print the installed version, e.g., <code>Python 3.12.2</code>.", bullet_style),
        Spacer(1, 10),
        Paragraph("<b>2. Open IDLE (Python Editor):</b>", card_title_style),
        Paragraph("• Search for <b>'IDLE'</b> in the Windows start menu. IDLE stands for <i>Integrated Development and Learning Environment</i>.", bullet_style),
        Paragraph("• It opens an interactive shell where you can type code directly after the <code>&gt;&gt;&gt;</code> prompt.", bullet_style),
    ]
    
    terminal_code = """
<b># 1. Interactive Command Prompt (CMD) Shell:</b>
Microsoft Windows [Version 10.0.19045]
C:\\Users\\LPU_Student> <b>python</b>
Python 3.12.2 (tags/v3.12.2:6abddd9, Feb  6 2024, 21:26:36)
Type "help", "copyright", "credits" or "license" for more info.
>>> <b>print("Hello, World!")</b>
Hello, World!

<b># 2. Writing Code in IDLE Shell:</b>
>>> <b>print("Welcome to LPU Python Course")</b>
Welcome to LPU Python Course
>>> <b>2 + 5</b>
7
"""
    col2_code = [
        Paragraph(terminal_code.strip().replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style)
    ]
    
    t6 = Table([[col1_verification, "", col2_code]], colWidths=[380, 20, 360])
    t6.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t6)
    
    # Build Document
    doc.build(story, onFirstPage=draw_cover_background, onLaterPages=draw_slide_background)
    print(f"Presentation PDF generated successfully at: {output_filename}")


if __name__ == "__main__":
    logo_file = "lpu_logo.png"
    pdf_file = "Python_Introduction_and_Installation_LPU.pdf"
    
    # 1. Draw and save logo
    draw_lpu_logo(logo_file)
    
    # 2. Generate PDF using logo
    create_presentation_pdf(pdf_file)
    
    # 3. Clean up logo file from workspace if needed (we keep it so user can see it too)
    print("All tasks completed.")
