#!/usr/bin/env python3
"""Generate SitGuru booth / kiosk print materials (letter PDF)."""

from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
    PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect


OUTPUT_DIR = Path(__file__).resolve().parent
PDF_FILENAME = OUTPUT_DIR / "SitGuru_Booth_Print_Materials.pdf"

# Brand green from SitGuru design system
PRIMARY_HEX = "#0D5C3A"
DARK_NEUTRAL_HEX = "#2C3E50"
SOFT_GREEN_BG = "#F4F9F6"
GRID_LINE = "#D1D5DB"


def draw_mock_qr(color):
    """Draw a crisp geometric mock QR code using basic flowable shapes."""
    d = Drawing(120, 120)
    d.add(
        Rect(
            0,
            0,
            120,
            120,
            fillColor=colors.white,
            strokeColor=colors.lightgrey,
            strokeWidth=1,
        )
    )
    # Three large outer finder patterns
    d.add(Rect(10, 80, 30, 30, fillColor=color, strokeColor=None))
    d.add(Rect(15, 85, 20, 20, fillColor=colors.white, strokeColor=None))
    d.add(Rect(20, 90, 10, 10, fillColor=color, strokeColor=None))

    d.add(Rect(80, 80, 30, 30, fillColor=color, strokeColor=None))
    d.add(Rect(85, 85, 20, 20, fillColor=colors.white, strokeColor=None))
    d.add(Rect(90, 90, 10, 10, fillColor=color, strokeColor=None))

    d.add(Rect(10, 10, 30, 30, fillColor=color, strokeColor=None))
    d.add(Rect(15, 15, 20, 20, fillColor=colors.white, strokeColor=None))
    d.add(Rect(20, 20, 10, 10, fillColor=color, strokeColor=None))

    # Small alignment pattern
    d.add(Rect(85, 25, 10, 10, fillColor=color, strokeColor=None))
    d.add(Rect(88, 28, 4, 4, fillColor=colors.white, strokeColor=None))

    # Simulated data pixels
    for x, y in [
        (50, 90),
        (60, 100),
        (50, 110),
        (70, 95),
        (10, 60),
        (25, 50),
        (30, 65),
        (55, 55),
        (65, 45),
        (50, 20),
        (60, 10),
        (90, 60),
        (100, 50),
        (110, 65),
    ]:
        d.add(Rect(x, y, 5, 5, fillColor=color, strokeColor=None))
    return d


def make_pocket_card(primary_color, dark_neutral):
    """Fresh flowables per cell (ReportLab cannot reuse the same flowable twice)."""
    return [
        Paragraph(
            "<b>SITGURU</b>",
            ParagraphStyle(
                "CT",
                fontName="Helvetica-Bold",
                fontSize=12,
                textColor=primary_color,
                alignment=1,
            ),
        ),
        Spacer(1, 4),
        Paragraph(
            "Trusted Pet Care. Simplified.",
            ParagraphStyle("CS", fontName="Helvetica", fontSize=8, alignment=1),
        ),
        Spacer(1, 6),
        Paragraph(
            "<b>FREE FIRST BOOKING</b><br/>Up to a $25 maximum value.",
            ParagraphStyle(
                "CD",
                fontName="Helvetica-Bold",
                fontSize=9,
                leading=11,
                alignment=1,
                textColor=dark_neutral,
            ),
        ),
        Spacer(1, 6),
        Paragraph(
            "Use Promo Code: <b>BOOTH25</b>",
            ParagraphStyle("CC", fontName="Helvetica", fontSize=8, alignment=1),
        ),
        Spacer(1, 4),
        Paragraph(
            "Scan QR sign at booth to unlock tracking bonus.",
            ParagraphStyle(
                "CF",
                fontName="Helvetica-Oblique",
                fontSize=7,
                alignment=1,
                textColor=colors.gray,
            ),
        ),
    ]


def create_sitguru_kit(output_path: Path | None = None):
    pdf_path = Path(output_path) if output_path else PDF_FILENAME
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
        title="SitGuru Print Materials Kit",
    )

    styles = getSampleStyleSheet()
    primary_color = colors.HexColor(PRIMARY_HEX)
    dark_neutral = colors.HexColor(DARK_NEUTRAL_HEX)

    style_h1 = ParagraphStyle(
        "H1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=32,
        leading=38,
        textColor=primary_color,
        alignment=1,
    )
    style_h2 = ParagraphStyle(
        "H2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=dark_neutral,
        alignment=1,
    )
    style_body_center = ParagraphStyle(
        "BodyCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=14,
        leading=18,
        textColor=dark_neutral,
        alignment=1,
    )
    style_body = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=dark_neutral,
    )
    style_bullet = ParagraphStyle(
        "Bullet",
        parent=style_body,
        leftIndent=15,
        bulletIndent=5,
    )
    style_footer = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        textColor=colors.gray,
        alignment=1,
    )

    story = []

    # ---------------- PAGE 1: SIGNUP SIGN (PET OWNERS) ----------------
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>SitGuru</b>", style_h1))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Trusted Pet Care. Simplified.", style_body_center))
    story.append(Spacer(1, 60))
    story.append(Paragraph("FIND YOUR PERFECT SITTER", style_h2))
    story.append(Spacer(1, 20))
    story.append(
        Paragraph(
            "Scan the code below to browse local, fully-vetted dog walkers, "
            "house sitters, and drop-in pet hosts in your neighborhood.",
            style_body_center,
        )
    )
    story.append(Spacer(1, 40))
    story.append(draw_mock_qr(primary_color))
    story.append(Spacer(1, 40))
    story.append(
        Paragraph(
            "<b>First Booking Free up to $25!</b> Use Code: <b>BOOTH25</b>",
            style_body_center,
        )
    )
    story.append(Spacer(1, 120))
    story.append(
        Paragraph(
            "SitGuru Table Display Sign — Sitter Lookup Component",
            style_footer,
        )
    )
    story.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=colors.lightgrey,
            spaceBefore=5,
        )
    )
    story.append(PageBreak())

    # ---------------- PAGE 2: SIGNUP SIGN (SITTER RECRUITMENT) ----------------
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>SitGuru</b>", style_h1))
    story.append(Spacer(1, 10))
    story.append(
        Paragraph("Earn Money Doing What You Love.", style_body_center)
    )
    story.append(Spacer(1, 60))
    story.append(Paragraph("BECOME A TRUSTED SITTER", style_h2))
    story.append(Spacer(1, 20))
    story.append(
        Paragraph(
            "Scan to download our app, set your own flexible hours, select your "
            "preferred pet sizes, and start earning today.",
            style_body_center,
        )
    )
    story.append(Spacer(1, 40))
    story.append(draw_mock_qr(dark_neutral))
    story.append(Spacer(1, 40))
    story.append(
        Paragraph(
            "Premium insurance coverage and 24/7 support included standard on "
            "every booking.",
            style_body_center,
        )
    )
    story.append(Spacer(1, 120))
    story.append(
        Paragraph(
            "SitGuru Table Display Sign — Recruitment Component",
            style_footer,
        )
    )
    story.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=colors.lightgrey,
            spaceBefore=5,
        )
    )
    story.append(PageBreak())

    # ---------------- PAGE 3: KIOSK PRIVACY NOTICES (2 per page) ----------------
    def get_privacy_block():
        return [
            Paragraph(
                "<b>SitGuru Kiosk Privacy Notice</b>",
                ParagraphStyle(
                    "NoticeH",
                    parent=style_body,
                    fontName="Helvetica-Bold",
                    fontSize=12,
                    textColor=primary_color,
                ),
            ),
            Spacer(1, 6),
            Paragraph(
                "<b>Your Data Security:</b> This registration kiosk operates over "
                "fully encrypted, bank-grade Secure Socket Layer (SSL) channels. "
                "Your personal verification documents and passwords are never "
                "cached locally on this vendor terminal hardware.",
                style_body,
            ),
            Spacer(1, 6),
            Paragraph(
                "<b>Collection Details:</b> We strictly process registration data "
                "to initialize your secure account framework and verify local "
                "service availability. SitGuru maintains a zero-spam policy: your "
                "email address and phone records will never be rented, traded, or "
                "distributed to outside retail brokers.",
                style_body,
            ),
        ]

    p_table = Table(
        [[get_privacy_block()], [Spacer(1, 25)], [get_privacy_block()]],
        colWidths=[500],
    )
    p_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (0, 0), 1, primary_color),
                ("PADDING", (0, 0), (0, 0), 15),
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor(SOFT_GREEN_BG)),
                ("BOX", (0, 2), (0, 2), 1, primary_color),
                ("PADDING", (0, 2), (0, 2), 15),
                ("BACKGROUND", (0, 2), (0, 2), colors.HexColor(SOFT_GREEN_BG)),
            ]
        )
    )

    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>Regulatory Table Display Cards</b>", style_h2))
    story.append(Spacer(1, 10))
    story.append(
        Paragraph(
            "Cut along center space line to divide into two stand-alone kiosk cards.",
            style_body_center,
        )
    )
    story.append(Spacer(1, 30))
    story.append(p_table)
    story.append(Spacer(1, 160))
    story.append(
        Paragraph(
            "SitGuru Kiosk Document Component — Sized for standard 8.5x11 "
            "vertical acrylic frames",
            style_footer,
        )
    )
    story.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=colors.lightgrey,
            spaceBefore=5,
        )
    )
    story.append(PageBreak())

    # ---------------- PAGE 4: DETACHABLE CARD GRID (8 pocket cards) ----------------
    card_data = [
        [
            make_pocket_card(primary_color, dark_neutral),
            make_pocket_card(primary_color, dark_neutral),
        ]
        for _ in range(4)
    ]
    grid_table = Table(
        card_data,
        colWidths=[260, 260],
        rowHeights=[140, 140, 140, 140],
    )
    grid_table.setStyle(
        TableStyle(
            [
                ("INNERGRID", (0, 0), (-1, -1), 1, colors.HexColor(GRID_LINE)),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor(GRID_LINE)),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )

    story.append(Paragraph("<b>Handout Handbills & Referral Tokens</b>", style_h2))
    story.append(Spacer(1, 5))
    story.append(
        Paragraph(
            "Sized for rapid cutting tool separation. Distributed to visitors "
            "bypassing long lines.",
            style_body_center,
        )
    )
    story.append(Spacer(1, 15))
    story.append(grid_table)
    story.append(Spacer(1, 15))
    story.append(
        Paragraph(
            "SitGuru Pocket Handout Sheet — 8 Count Per Page Grid",
            style_footer,
        )
    )
    story.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=colors.lightgrey,
            spaceBefore=5,
        )
    )
    story.append(PageBreak())

    # ---------------- PAGE 5: CORE SERVICES SINGLE FLYER ----------------
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>SitGuru Service Summary Flyer</b>", style_h2))
    story.append(Spacer(1, 20))

    flyer_heading = ParagraphStyle(
        "FH",
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=primary_color,
    )
    flyer_sub = ParagraphStyle(
        "FS",
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=dark_neutral,
        spaceAfter=4,
    )

    flyer_text_left = [
        Paragraph("<b>Our Core Offerings:</b>", flyer_heading),
        Spacer(1, 8),
        Paragraph(
            "&bull; <b>Overnight Pet Sitting:</b> Dedicated, "
            "insured providers remain in your primary residence to ensure "
            "routines are completely uninterrupted.",
            style_bullet,
        ),
        Spacer(1, 8),
        Paragraph(
            "&bull; <b>Dog Walking:</b> Scheduled neighborhood "
            "walks with GPS tracking so you always know when your pup is out "
            "and moving.",
            style_bullet,
        ),
        Spacer(1, 8),
        Paragraph(
            "&bull; <b>Drop-In Visits:</b> Midday feeding, "
            "playtime, litter checks, and medication support without a full "
            "overnight stay.",
            style_bullet,
        ),
        Spacer(1, 8),
        Paragraph(
            "&bull; <b>Boarding &amp; Day Care:</b> Trusted "
            "local Guru homes and facilities when travel or long days away "
            "require extra coverage.",
            style_bullet,
        ),
        Spacer(1, 8),
        Paragraph(
            "&bull; <b>Training &amp; Grooming Support:</b> "
            "Connect with experienced providers for everyday care add-ons "
            "alongside sitting and walks.",
            style_bullet,
        ),
    ]

    flyer_text_right = [
        Paragraph("<b>Why Pet Parents Choose SitGuru</b>", flyer_heading),
        Spacer(1, 8),
        Paragraph("<b>Fully vetted local Gurus</b>", flyer_sub),
        Paragraph(
            "Background-checked caregivers matched to your pet’s size, "
            "temperament, and neighborhood.",
            style_body,
        ),
        Spacer(1, 8),
        Paragraph("<b>Booking stays on SitGuru</b>", flyer_sub),
        Paragraph(
            "Secure scheduling, messaging, and payment in one place — with "
            "community matching that helps you find your favorite Guru.",
            style_body,
        ),
        Spacer(1, 8),
        Paragraph("<b>Support that travels with you</b>", flyer_sub),
        Paragraph(
            "Insurance coverage and 24/7 help on every booking so you can "
            "travel or work with peace of mind.",
            style_body,
        ),
        Spacer(1, 16),
        Paragraph("<b>Scan to get started</b>", flyer_sub),
        Spacer(1, 6),
        draw_mock_qr(primary_color),
        Spacer(1, 8),
        Paragraph(
            "Promo at the booth: <b>BOOTH25</b> — first booking free up to $25.",
            ParagraphStyle(
                "FlyerPromo",
                parent=style_body,
                fontSize=10,
                leading=13,
                alignment=1,
            ),
        ),
    ]

    flyer_table = Table(
        [[flyer_text_left, flyer_text_right]],
        colWidths=[270, 230],
    )
    flyer_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, 0), 8),
                ("RIGHTPADDING", (0, 0), (0, 0), 16),
                ("LEFTPADDING", (1, 0), (1, 0), 16),
                ("RIGHTPADDING", (1, 0), (1, 0), 8),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor(SOFT_GREEN_BG)),
                ("BOX", (1, 0), (1, 0), 1, primary_color),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )

    story.append(KeepTogether([flyer_table]))
    story.append(Spacer(1, 40))
    story.append(
        Paragraph(
            "Follow <b>@SitGuruOfficial</b> on Instagram, Facebook, TikTok, X, "
            "and YouTube for events and pack highlights.",
            style_body_center,
        )
    )
    story.append(Spacer(1, 60))
    story.append(
        Paragraph(
            "SitGuru Core Services Flyer — Single-sheet booth handout",
            style_footer,
        )
    )
    story.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=colors.lightgrey,
            spaceBefore=5,
        )
    )

    doc.build(story)
    return pdf_path


if __name__ == "__main__":
    path = create_sitguru_kit()
    print(f"Wrote {path}")
