def suggest_product_price(market_price: float, condition: str, age_months: int) -> dict:
    """
    Suggests selling prices based on the original market value,
    item condition (new, gently_used, heavily_used), and age in months.
    """
    # 1. Base rates based on condition
    cond = condition.lower().strip()
    if cond == "new":
        min_factor, max_factor = 0.70, 0.85
        rec_factor = 0.80
    elif cond == "gently_used":
        min_factor, max_factor = 0.50, 0.70
        rec_factor = 0.60
    elif cond == "heavily_used":
        min_factor, max_factor = 0.30, 0.50
        rec_factor = 0.40
    else:
        min_factor, max_factor, rec_factor = 0.40, 0.60, 0.50

    # 2. Age depreciation: reduce value by 2% per month (max 80% total discount)
    depreciation = min(0.80, age_months * 0.02)
    age_multiplier = 1.0 - depreciation

    # 3. Calculate suggested pricing bounds
    suggested_min = round(market_price * min_factor * age_multiplier, 2)
    suggested_max = round(market_price * max_factor * age_multiplier, 2)
    recommended = round(market_price * rec_factor * age_multiplier, 2)

    # 4. Human-readable explanation text
    explanation = (
        f"A component in '{condition}' condition typically sells for "
        f"{int(min_factor*100)}%-{int(max_factor*100)}% of the market value. "
        f"Additionally, {age_months} months of use introduces a depreciation "
        f"adjustment of -{int(depreciation*100)}%."
    )

    return {
        "suggested_price_min": max(10.0, suggested_min),  # Minimum floor price of ₹10
        "suggested_price_max": max(10.0, suggested_max),
        "recommended_price": max(10.0, recommended),
        "explanation": explanation
    }
